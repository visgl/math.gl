// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  parseWKT,
  writeWKB
} from '@math.gl/core/arrow';
import {POSTGIS_SPATIAL_FUNCTIONS} from '@math.gl/geospatial/st-functions';
import {
  ST_UNION,
  ST_UNION_AGGREGATE,
  ST_UNARYUNION
} from '@math.gl/geospatial/st-overlay-functions';
import {queryArrowSQL} from '@math.gl/sql/query';
import {Binary, Field, Int32, Schema, Table, vectorFromArray, type Vector} from 'apache-arrow';
import {expect, test} from 'vitest';

/** Registers both arities of ST_Union together with the row-wise dissolve. */
const functions = [POSTGIS_SPATIAL_FUNCTIONS, ST_UNION, ST_UNION_AGGREGATE, ST_UNARYUNION];

/** Builds a planar unit-height rectangle of the given width. */
function rectangle(x: number, width: number) {
  return parseWKT(`POLYGON((${x} 0,${x + width} 0,${x + width} 1,${x} 1,${x} 0))`);
}

/** Creates a geometry column with group IDs and CRS metadata. */
function features(geometry: Vector, encoding: string, groups: number[]): Table {
  const field = new Field(
    'geometry',
    geometry.type,
    true,
    new Map([
      ['ARROW:extension:name', encoding],
      ['ARROW:extension:metadata', '{"crs":"EPSG:3857"}']
    ])
  );
  const region = vectorFromArray(groups, new Int32());
  return new Table(new Schema([field, new Field('region', region.type, false)]), {
    geometry,
    region
  });
}

/** Runs a query with the polygon dissolve package registered. */
function query(table: Table, sql: string): Table {
  return queryArrowSQL(sql, new Map([['features', table]]), {functions});
}

test('one-argument ST_Union dissolves native rows across batches and chains as a native result', () => {
  const geometry = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(
      [rectangle(0, 3), parseWKT('POLYGON EMPTY'), null, rectangle(2, 3), rectangle(10, 2)],
      {encoding: 'geoarrow.polygon'}
    )
  );
  const input = features(geometry, 'geoarrow.polygon', [1, 2, 3, 1, 1]);
  const table = new Table(input.schema, [
    input.slice(0, 3).batches[0]!,
    input.slice(3).batches[0]!
  ]);
  const result = query(
    table,
    `SELECT region, ST_Union(geometry) AS dissolved,
    ST_Area(ST_UnaryUnion(ST_Union(geometry))) AS area FROM features GROUP BY region ORDER BY region`
  );
  expect([...result.getChild('area')!]).toEqual([7, 0, null]);
  expect(result.schema.fields[1]!.metadata).toEqual(
    new Map([
      ['ARROW:extension:name', 'geoarrow.multipolygon'],
      ['ARROW:extension:metadata', '{"crs":"EPSG:3857"}']
    ])
  );
  expect(result.getChild('dissolved')!.get(0).length).toBe(2);
  expect(result.getChild('dissolved')!.get(1).length).toBe(0);
  expect(result.getChild('dissolved')!.isValid(2)).toBe(false);

  const empty = query(
    table,
    'SELECT ST_Union(geometry) AS dissolved FROM features WHERE region = 9'
  );
  expect(empty.numRows).toBe(1);
  expect(empty.getChild('dissolved')!.isValid(0)).toBe(false);
});

test('compacts a group larger than one fanout and accepts WKB polygon inputs', () => {
  const bytes = vectorFromArray(
    Array.from({length: 130}, (_, row) => writeWKB(rectangle(row, 2))),
    new Binary()
  );
  const result = query(
    features(bytes, 'geoarrow.wkb', Array(130).fill(1)),
    'SELECT ST_Area(ST_Union(geometry)) AS area FROM features GROUP BY region'
  );
  expect(result.getChild('area')!.get(0)).toBe(131);
});

test('binary ST_Union remains row-wise and ST_UnaryUnion dissolves overlapping multipolygon parts', () => {
  const input = parseWKT('MULTIPOLYGON(((0 0,3 0,3 2,0 2,0 0)),((2 0,5 0,5 2,2 2,2 0)))');
  const vector = vectorFromArray([writeWKB(input), writeWKB(rectangle(0, 2))], new Binary());
  const result = query(
    features(vector, 'geoarrow.wkb', [1, 1]),
    'SELECT ST_Area(ST_Union(geometry,geometry)) AS binary_area, ST_Area(ST_UnaryUnion(geometry)) AS unary_area FROM features'
  );
  expect([...result.getChild('binary_area')!]).toEqual([10, 2]);
  expect([...result.getChild('unary_area')!]).toEqual([10, 2]);
  const nested = query(
    features(vector, 'geoarrow.wkb', [1, 1]),
    'SELECT ST_Area(ST_Union(ST_Union(geometry,geometry))) AS area FROM features'
  );
  expect(nested.getChild('area')!.get(0)).toBe(10);
});
