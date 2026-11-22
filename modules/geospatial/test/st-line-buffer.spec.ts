// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  materializeGeoArrowRows,
  makeGeoArrowColumnFromArrowVector,
  parseWKT
} from '@math.gl/core/arrow';
import {ST_BUFFER, ST_INTERSECTION} from '@math.gl/geospatial/st-overlay-functions';
import {POSTGIS_SPATIAL_FUNCTIONS} from '@math.gl/geospatial/st-functions';
import {queryArrowSQL, queryArrowTableInBatches} from '@math.gl/sql/query';
import {createGeoArrowConversionFunctions} from '@math.gl/sql/geoarrow-functions';
import {parseSQLQuery} from '@math.gl/sql/parser';
import {Field, Schema, Table} from 'apache-arrow';
import {expect, test} from 'vitest';

/** Creates a native route column in a projected CRS. */
function routes(
  encoding: 'geoarrow.linestring' | 'geoarrow.multilinestring',
  ...rows: (string | null)[]
) {
  const route = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(
      rows.map(row => (row === null ? null : parseWKT(row))),
      {encoding}
    )
  );
  const field = new Field(
    'route',
    route.type,
    true,
    new Map([
      ['ARROW:extension:name', encoding],
      ['ARROW:extension:metadata', '{"crs":"EPSG:3857"}']
    ])
  );
  return new Table(new Schema([field]), {route});
}

/** Functions used to exercise native chaining. */
const functions = [POSTGIS_SPATIAL_FUNCTIONS, ST_BUFFER, ST_INTERSECTION];

test('streams a route corridor with round caps directly into an areal overlay', async () => {
  const table = routes('geoarrow.linestring', 'LINESTRING(0 0,0 0,10 0)', 'LINESTRING EMPTY', null);
  const plan = parseSQLQuery(
    `SELECT ST_Buffer(route,2) AS corridor, ST_Area(ST_Buffer(route,2)) AS area,
            ST_Area(ST_Intersection(ST_Buffer(route,2),ST_MakeEnvelope(0,-2,10,2))) AS clipped
      FROM routes`
  );
  if ('command' in plan) throw new Error('Expected a SELECT');
  let reads = 0;
  /** Supplies routes only when the stream advances. */
  function* source() {
    for (let row = 0; row < table.numRows; row++) {
      reads++;
      yield table.slice(row, row + 1).batches[0]!;
    }
  }
  const output = [];
  for await (const batch of queryArrowTableInBatches(source(), table.schema, {
    ...plan,
    functions
  })) {
    expect(reads).toBe(output.length + 1);
    const field = batch.schema.fields[0]!;
    expect(field.metadata.get('ARROW:extension:name')).toBe('geoarrow.multipolygon');
    expect(field.metadata.get('ARROW:extension:metadata')).toBe('{"crs":"EPSG:3857"}');
    output.push(batch);
  }
  expect(output[0]!.getChild('area')!.get(0)).toBeCloseTo(40 + 64 * Math.sin(Math.PI / 16));
  expect(output[0]!.getChild('clipped')!.get(0)).toBeCloseTo(40);
  expect(output[1]!.getChild('corridor')!.get(0).length).toBe(0);
  expect(output[2]!.getChild('corridor')!.isValid(0)).toBe(false);
});

test('merges connected joins and retains detached lines and the hole inside a closed route', () => {
  const table = routes(
    'geoarrow.multilinestring',
    'MULTILINESTRING((0 0,10 0,10 10,0 10,0 0),(30 0,40 0),(40 0,50 0))',
    `MULTILINESTRING(${Array.from({length: 35}, (_, index) => `(${index * 10} 0,${index * 10 + 1} 0)`).join(',')})`
  );
  const result = queryArrowSQL(
    'SELECT ST_Buffer(route,1) AS corridor, ST_Buffer(route,0) AS empty FROM routes',
    new Map([['routes', table]]),
    {functions}
  );
  const column = makeGeoArrowColumnFromArrowVector(result.getChild('corridor')!, {
    field: result.schema.fields[0]!
  });
  const [closed, many] = materializeGeoArrowRows(column);
  expect(closed?.type).toBe('MultiPolygon');
  if (closed?.type !== 'MultiPolygon' || many?.type !== 'MultiPolygon')
    throw new Error('Expected multipolygons');
  expect(closed.coordinates.map(polygon => polygon.length).sort()).toEqual([1, 2]);
  expect(many.coordinates).toHaveLength(35);
  expect(result.getChild('empty')!.get(0).length).toBe(0);
});

test('a WKB route can be converted to native storage before buffering', () => {
  const table = routes('geoarrow.linestring', 'LINESTRING(0 0,10 0)');
  const result = queryArrowSQL(
    `SELECT ST_Area(ST_Buffer(route,1)) AS direct,
      ST_Area(ST_Buffer(GEOARROW_TO_LINESTRING(GEOARROW_TO_WKB(route)),1)) AS decoded
      FROM routes`,
    new Map([['routes', table]]),
    {functions: [...functions, createGeoArrowConversionFunctions()]}
  );
  expect(result.getChild('direct')!.get(0)).toBe(result.getChild('decoded')!.get(0));
});
