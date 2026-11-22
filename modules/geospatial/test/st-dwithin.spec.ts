// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  parseWKT,
  writeWKB
} from '@math.gl/core/arrow';
import {ST_DWITHIN} from '@math.gl/geospatial/st-functions';
import {queryArrowSQL, queryArrowTableInBatches} from '@math.gl/sql/query';
import {Binary, Field, Float64, Schema, Table, vectorFromArray, type Vector} from 'apache-arrow';
import {expect, test} from 'vitest';

/** Builds a geometry input field with planar CRS metadata. */
function field(name: string, vector: Vector, encoding: string): Field {
  return new Field(
    name,
    vector.type,
    true,
    new Map([
      ['ARROW:extension:name', encoding],
      ['ARROW:extension:metadata', '{"crs":"EPSG:3857"}']
    ])
  );
}

/** Serializes a nullable list of WKT fixtures to Arrow Binary. */
function wkb(values: (string | null)[]) {
  return vectorFromArray(
    values.map(value => (value === null ? null : writeWKB(parseWKT(value)))),
    new Binary()
  );
}

/** Pairs geometry fixtures with row-specific distances. */
function features(a: Vector, aEncoding: string, b: Vector, bEncoding: string, radii: number[]) {
  const radius = vectorFromArray(radii, new Float64());
  return new Table(
    new Schema([
      field('a', a, aEncoding),
      field('b', b, bEncoding),
      new Field('radius', radius.type, false)
    ]),
    {a, b, radius}
  );
}

test('point-to-polygon covers interiors, holes, boundaries, multipolygon parts and nulls in both orders', async () => {
  const polygon = 'POLYGON((0 0,10 0,10 10,0 10,0 0),(4 4,4 6,6 6,6 4,4 4))';
  const points = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(
      [
        'POINT(2 2)',
        'POINT(5 5)',
        'POINT(5 5)',
        'POINT(4 5)',
        'POINT(-2 5)',
        'POINT(13 1)',
        'POINT(2 2)',
        null
      ].map(value => (value === null ? null : parseWKT(value))),
      {encoding: 'geoarrow.point'}
    )
  );
  const shapes = wkb([
    polygon,
    polygon,
    polygon,
    polygon,
    polygon,
    'MULTIPOLYGON(((0 0,1 0,1 1,0 1,0 0)),((12 0,14 0,14 2,12 2,12 0)))',
    'POLYGON EMPTY',
    polygon
  ]);
  const table = features(
    points,
    'geoarrow.point',
    shapes,
    'geoarrow.wkb',
    [0, 0.99, 1, 0, 2, 0, 9, 0]
  );
  const input = [...table.slice(0, 4).batches, ...table.slice(4).batches];
  const actual = [];
  for await (const batch of queryArrowTableInBatches(input, table.schema, {
    select: [
      {expression: 'ST_DWithin(a,b,radius)', as: 'forward'},
      {expression: 'ST_DWithin(b,a,radius)', as: 'backward'}
    ],
    functions: [ST_DWITHIN]
  })) {
    expect(Array.from(batch.getChild('forward')!)).toEqual(Array.from(batch.getChild('backward')!));
    actual.push(...batch.getChild('forward')!);
  }
  expect(actual).toEqual([true, false, true, true, true, true, false, null]);
});

test('line pairs handle crossings, parallel gaps, repeated vertices and disconnected components', () => {
  const lines = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(
      [
        parseWKT('LINESTRING(0 0,10 0)'),
        parseWKT('LINESTRING(0 0,10 0)'),
        parseWKT('LINESTRING(0 0,10 0)'),
        parseWKT('LINESTRING(0 0,0 0)'),
        parseWKT('LINESTRING(5 -1,5 1)'),
        parseWKT('LINESTRING(5 -1,5 1)'),
        parseWKT('LINESTRING EMPTY')
      ],
      {encoding: 'geoarrow.linestring'}
    )
  );
  const disconnected = 'MULTILINESTRING((0 0,1 0),(9 0,10 0))';
  const other = wkb([
    'LINESTRING(5 -2,5 2)',
    'LINESTRING(3 2,8 2)',
    'LINESTRING(3 2,8 2)',
    'LINESTRING(0 2,0 3)',
    disconnected,
    disconnected,
    'LINESTRING(5 0,7 0)'
  ]);
  const table = features(
    lines,
    'geoarrow.linestring',
    other,
    'geoarrow.wkb',
    [0, 2, 1.99, 2, 3.99, 4, 9]
  );
  const result = queryArrowSQL(
    'SELECT ST_DWithin(a,b,radius) AS near FROM features',
    new Map([['features', table]]),
    {functions: [ST_DWITHIN]}
  );
  expect(Array.from(result.getChild('near')!)).toEqual([
    true,
    true,
    false,
    true,
    false,
    true,
    false
  ]);
});

test('the segment index refines candidates for long diagonal routes', () => {
  /** Creates a 40-segment diagonal route shifted along Y. */
  const diagonal = (shift: number) =>
    `LINESTRING(${Array.from({length: 41}, (_, i) => `${i} ${i + shift}`).join(',')})`;
  const a = wkb([diagonal(0), diagonal(0)]);
  const b = wkb([diagonal(1), diagonal(1)]);
  const table = features(a, 'geoarrow.wkb', b, 'geoarrow.wkb', [0.25, 1]);
  const result = queryArrowSQL(
    'SELECT ST_DWithin(a,b,radius) AS near FROM features',
    new Map([['features', table]]),
    {functions: [ST_DWITHIN]}
  );
  expect(Array.from(result.getChild('near')!)).toEqual([false, true]);
});

test('binds native polygon distance and rejects unsupported native pairs before reading rows', () => {
  const polygon = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build([parseWKT('POLYGON((0 0,4 0,4 4,0 4,0 0))')], {
      encoding: 'geoarrow.polygon'
    })
  );
  const point = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build([parseWKT('POINT(5 2)')], {encoding: 'geoarrow.point'})
  );
  const line = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build([parseWKT('LINESTRING(5 2,5 3)')], {encoding: 'geoarrow.linestring'})
  );
  const sql = 'SELECT ST_DWithin(a,b,radius) AS nearby FROM features';
  const options = {functions: [ST_DWITHIN]};
  const valid = features(point, 'geoarrow.point', polygon, 'geoarrow.polygon', [1]);
  expect(
    queryArrowSQL(sql, new Map([['features', valid]]), options)
      .getChild('nearby')!
      .get(0)
  ).toBe(true);
  const invalid = features(line, 'geoarrow.linestring', polygon, 'geoarrow.polygon', [1]);
  const empty = new Table(invalid.schema, []);
  expect(() => queryArrowSQL(sql, new Map([['features', empty]]), options)).toThrow(
    /does not support/
  );
});
