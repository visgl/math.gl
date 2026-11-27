// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  makeGeoArrowColumnFromArrowVector,
  materializeGeoArrowRows,
  parseWKB,
  parseWKT,
  writeWKB
} from '@math.gl/core/arrow';
import {POSTGIS_SPATIAL_FUNCTIONS} from '@math.gl/geospatial/st-functions';
import {queryArrowSQL, queryArrowTableInBatches} from '@math.gl/sql/query';
import {Binary, Field, Schema, Table, vectorFromArray, type Vector} from 'apache-arrow';
import {expect, test} from 'vitest';

/** Registers the built-in spatial SQL package. */
const functions = [POSTGIS_SPATIAL_FUNCTIONS];
/** Geometry with redundant boundary vertices and a hole containing an island. */
const shellAndHole = '(0 0,5 0,10 0,10 5,10 10,0 10,0 0),(2 2,2 4,2 8,8 8,8 2,2 2)';
/** Small polygon component within the first component's hole. */
const island = '(3 3,4 3,5 3,5 5,3 5,3 3)';

/** Marks a geometry column with projected coordinate metadata. */
function geometryTable(vector: Vector, encoding: string): Table {
  const metadata = new Map([
    ['ARROW:extension:name', encoding],
    ['ARROW:extension:metadata', '{"crs":"EPSG:3857"}']
  ]);
  return new Table(new Schema([new Field('geometry', vector.type, true, metadata)]), {
    geometry: vector
  });
}

/** Runs one simplification projection. */
function simplify(table: Table, tolerance = 0.2): Table {
  return queryArrowSQL(
    `SELECT ST_SimplifyPreserveTopology(geometry,${tolerance}) AS simplified FROM features`,
    new Map([['features', table]]),
    {functions}
  );
}

test('streams native polygons, preserving hole winding, CRS, empty geometries, and nulls', async () => {
  const encoding = 'geoarrow.polygon';
  const vector = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build([parseWKT(`POLYGON(${shellAndHole})`), parseWKT('POLYGON EMPTY'), null], {
      encoding
    })
  );
  const table = geometryTable(vector, encoding);
  const output = [];
  for await (const batch of queryArrowTableInBatches(
    [0, 1, 2].map(row => table.slice(row, row + 1).batches[0]!),
    table.schema,
    {
      select: [
        {expression: 'ST_SimplifyPreserveTopology(geometry,0.2)', as: 'simplified'},
        {expression: 'ST_Area(ST_SimplifyPreserveTopology(geometry,0.2))', as: 'area'}
      ],
      functions
    }
  )) {
    expect(batch.schema.fields[0]!.metadata).toEqual(table.schema.fields[0]!.metadata);
    output.push(batch);
  }

  const [polygon, empty, missing] = output.map(batch => {
    const column = makeGeoArrowColumnFromArrowVector(batch.getChild('simplified')!, {
      field: batch.schema.fields[0]!
    });
    return materializeGeoArrowRows(column)[0];
  });
  expect(polygon).toEqual(parseWKT('POLYGON((0 0,10 0,10 10,0 10,0 0),(2 2,2 8,8 8,8 2,2 2))'));
  expect(output[0]!.getChild('area')!.get(0)).toBe(64);
  expect(empty).toEqual(parseWKT('POLYGON EMPTY'));
  expect(missing).toBeNull();
});

test('retains multipolygon components and islands in holes, including native result storage', () => {
  const encoding = 'geoarrow.multipolygon';
  const expected = parseWKT(
    'MULTIPOLYGON(((0 0,10 0,10 10,0 10,0 0),(2 2,2 8,8 8,8 2,2 2)),((3 3,5 3,5 5,3 5,3 3)))'
  );
  const input = parseWKT(`MULTIPOLYGON((${shellAndHole}),(${island}))`);
  const result = simplify(
    geometryTable(
      makeArrowVectorFromGeoArrowColumn(GeoArrowBuilder.build([input], {encoding})),
      encoding
    )
  );
  const field = result.schema.fields[0]!;
  expect(field.metadata.get('ARROW:extension:name')).toBe(encoding);
  expect(
    materializeGeoArrowRows(
      makeGeoArrowColumnFromArrowVector(result.getChild('simplified')!, {field})
    )
  ).toEqual([expected]);
});

test('keeps touching components and retains small holes while simplifying their shells', () => {
  const touching = parseWKT(
    'MULTIPOLYGON(((0 0,8 0,8 8,6 8,0 8,0 0)),((8 8,10 8,10 10,8 10,8 8)))'
  );
  const withHole = parseWKT('POLYGON((0 0,5 0,10 0,10 10,0 10,0 0),(2 2,2 2.5,2.5 2.5,2.5 2,2 2))');
  const table = geometryTable(
    vectorFromArray([writeWKB(touching), writeWKB(withHole)], new Binary()),
    'geoarrow.wkb'
  );
  const result = simplify(table, 1);
  const wkb = result.getChild('simplified')!;
  expect(parseWKB(wkb.get(0)).geometry).toEqual(touching);
  expect(parseWKB(wkb.get(1)).geometry).toEqual(
    parseWKT('POLYGON((0 0,10 0,10 10,0 10,0 0),(2 2,2 2.5,2.5 2.5,2.5 2,2 2))')
  );
  expect(() => simplify(table, -1)).toThrow(/finite nonnegative tolerance/);
});

test('rejects a simplified hole boundary that would cross an island', () => {
  const input = parseWKT(
    'MULTIPOLYGON(((0 0,22 0,22 22,0 22,0 0),(2 2,18 2,18 18,15 18,14 19,6 19,5 18,2 18,2 2)),((7 12,13 12,13 18.6,7 18.6,7 12)))'
  );
  const table = geometryTable(vectorFromArray([writeWKB(input)], new Binary()), 'geoarrow.wkb');
  const result = simplify(table, 1.1);
  expect(parseWKB(result.getChild('simplified')!.get(0)).geometry).toEqual(input);
});
