// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  parseWKT,
  writeWKB
} from '@math.gl/core/arrow';
import {GEODESIC_SPATIAL_FUNCTIONS} from '@math.gl/geospatial/st-functions';
import {queryArrowSQL, queryArrowTableInBatches} from '@math.gl/sql/query';
import {Binary, Field, Schema, Table, vectorFromArray, type Vector} from 'apache-arrow';
import {expect, test} from 'vitest';

/** Selects the opt-in ellipsoidal operations. */
const functions = [GEODESIC_SPATIAL_FUNCTIONS];

/** Marks a vector as geographic longitude–latitude, using either WGS84 alias. */
function field(name: string, vector: Vector, encoding: string, crs = 'OGC:CRS84'): Field {
  return new Field(
    name,
    vector.type,
    true,
    new Map([
      ['ARROW:extension:name', encoding],
      ['ARROW:extension:metadata', JSON.stringify({crs, edges: 'spherical'})]
    ])
  );
}

/** Serializes geodesic fixtures. */
function wkb(rows: readonly string[]): Vector {
  return vectorFromArray(
    rows.map(row => writeWKB(parseWKT(row))),
    new Binary()
  );
}

test('streams antimeridian distances and inclusive meter thresholds with empty and null points', async () => {
  const encoding = 'geoarrow.point';
  const left = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(
      [
        parseWKT('POINT Z(179 0 10)'),
        parseWKT('POINT Z EMPTY'),
        null,
        parseWKT('POINT Z(0 89 42)')
      ],
      {encoding, dimension: 'xyz'}
    )
  );
  const right = wkb(['POINT(-179 0)', 'POINT(1 0)', 'POINT(1 0)', 'POINT(180 89)']);
  const schema = new Schema([
    field('a', left, encoding),
    field('b', right, 'geoarrow.wkb', 'EPSG:4326')
  ]);
  const table = new Table(schema, {a: left, b: right});
  const batches = [...table.slice(0, 2).batches, ...table.slice(2).batches];
  const distances = [];
  const near = [];
  for await (const batch of queryArrowTableInBatches(batches, schema, {
    select: [
      {expression: 'ST_GeodesicDistance(a,b)', as: 'meters'},
      {expression: 'ST_GeodesicDWithin(a,b,222639)', as: 'near'}
    ],
    functions
  })) {
    distances.push(...batch.getChild('meters')!);
    near.push(...batch.getChild('near')!);
  }
  expect(distances[0]).toBeCloseTo(222638.9815865, 5);
  expect(distances.slice(1, 3)).toEqual([null, null]);
  expect(distances[3]).toBeCloseTo(223387.7298, 3);
  expect(near).toEqual([true, false, null, false]);
  const tables = new Map([['features', table]]);
  const exact = queryArrowSQL(
    'SELECT ST_GeodesicDWithin(a,b,ST_GeodesicDistance(a,b)) AS exact FROM features',
    tables,
    {functions}
  );
  expect([...exact.getChild('exact')!]).toEqual([true, null, null, true]);
  expect(() =>
    queryArrowSQL('SELECT ST_GeodesicDWithin(a,b,-1) FROM features', tables, {functions})
  ).toThrow(/finite nonnegative radius/);
});

test('sums native multiline segments without counting gaps, and rejects projected metadata', () => {
  const encoding = 'geoarrow.multilinestring';
  const vector = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(
      [
        parseWKT('MULTILINESTRING((179 0,-179 0),(40 0,41 0))'),
        parseWKT('MULTILINESTRING EMPTY'),
        null
      ],
      {encoding}
    )
  );
  const schema = new Schema([field('route', vector, encoding)]);
  const result = queryArrowSQL(
    'SELECT ST_GeodesicLength(route) AS meters FROM routes',
    new Map([['routes', new Table(schema, {route: vector})]]),
    {functions}
  );
  expect(result.getChild('meters')!.get(0)).toBeCloseTo(333958.4723798, 5);
  expect([...result.getChild('meters')!].slice(1)).toEqual([0, null]);
  const projected = new Schema([field('route', vector, encoding, 'EPSG:3857')]);
  expect(() =>
    queryArrowSQL(
      'SELECT ST_GeodesicLength(route) FROM routes',
      new Map([['routes', new Table(projected, [])]]),
      {functions}
    )
  ).toThrow(/requires WGS84 CRS metadata/);
});
