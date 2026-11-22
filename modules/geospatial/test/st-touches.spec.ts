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
import {queryArrowSQL, queryArrowTableInBatches} from '@math.gl/sql/query';
import {Binary, Field, Schema, Table, vectorFromArray, type Vector} from 'apache-arrow';
import {expect, test} from 'vitest';

/** Square with an interior square hole. */
const frame = 'POLYGON((0 0,10 0,10 10,0 10,0 0),(4 4,4 6,6 6,6 4,4 4))';
/** Square without holes. */
const square = 'POLYGON((0 0,10 0,10 10,0 10,0 0))';
/** Registers the standard planar spatial SQL operations. */
const functions = [POSTGIS_SPATIAL_FUNCTIONS];

/** Serializes nullable geometry fixtures. */
function wkb(rows: readonly (string | null)[]): Vector {
  return vectorFromArray(
    rows.map(row => (row === null ? null : writeWKB(parseWKT(row)))),
    new Binary()
  );
}

/** Constructs a geometry table using the given encodings. */
function pairTable(
  a: Vector,
  b: Vector,
  aEncoding = 'geoarrow.wkb',
  bEncoding = 'geoarrow.wkb'
): Table {
  const schema = new Schema([
    new Field('a', a.type, true, new Map([['ARROW:extension:name', aEncoding]])),
    new Field('b', b.type, true, new Map([['ARROW:extension:name', bEncoding]]))
  ]);
  return new Table(schema, {a, b});
}

/** Checks both argument orders against the expected truth values. */
function touchesRows(rows: readonly (readonly [string, string, boolean])[]): void {
  const table = pairTable(wkb(rows.map(row => row[0])), wkb(rows.map(row => row[1])));
  const result = queryArrowSQL(
    'SELECT ST_Touches(a,b) AS ab, ST_Touches(b,a) AS ba FROM features',
    new Map([['features', table]]),
    {functions}
  );
  const expected = rows.map(row => row[2]);
  expect(Array.from(result.getChild('ab')!)).toEqual(expected);
  expect(Array.from(result.getChild('ba')!)).toEqual(expected);
}

test('streams point-to-polygon contact at shell and hole boundaries', async () => {
  const points = wkb(['POINT(0 3)', 'POINT(4 5)', 'POINT(5 5)', 'POINT(2 2)', 'POINT EMPTY', null]);
  const polygons = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(Array(6).fill(parseWKT(frame)), {encoding: 'geoarrow.polygon'})
  );
  const table = pairTable(points, polygons, 'geoarrow.wkb', 'geoarrow.polygon');
  const values = [];
  for await (const batch of queryArrowTableInBatches(
    [...table.slice(0, 3).batches, ...table.slice(3).batches],
    table.schema,
    {select: [{expression: 'ST_Touches(a,b)', as: 'touches'}], functions}
  ))
    values.push(...batch.getChild('touches')!);
  expect(values).toEqual([true, true, false, false, false, null]);
});

test('points and multipoints must avoid the other geometry’s interior', () => {
  touchesRows([
    ['POINT(0 0)', 'POINT(0 0)', false],
    ['MULTIPOINT((0 1),(12 12))', square, true],
    ['MULTIPOINT((0 1),(2 2))', square, false],
    ['POINT(0 0)', 'LINESTRING(0 0,3 0)', true],
    ['POINT(1 0)', 'LINESTRING(0 0,1 0,3 0)', false],
    ['POINT(0 0)', 'LINESTRING(0 0,3 0,3 3,0 0)', false],
    ['POINT(0 0)', 'MULTILINESTRING((-1 0,0 0),(0 0,1 0))', false]
  ]);
});

test('linear touches distinguish endpoints, crossings and collinear overlap', () => {
  touchesRows([
    ['LINESTRING(0 0,3 0)', 'LINESTRING(3 0,5 0)', true],
    ['LINESTRING(0 0,3 0)', 'LINESTRING(1 0,1 2)', true],
    ['LINESTRING(0 0,3 0)', 'LINESTRING(1 -1,1 2)', false],
    ['LINESTRING(0 0,3 0)', 'LINESTRING(1 0,5 0)', false],
    ['MULTILINESTRING((-1 0,0 0),(0 0,2 0))', 'LINESTRING(0 -1,0 2)', false],
    ['MULTILINESTRING((0 0,10 0),(5 0,7 4))', 'LINESTRING(5 -1,5 1)', true]
  ]);
});

test('lines crossing through boundary vertices differ from lines that follow a boundary', () => {
  touchesRows([
    ['LINESTRING(-1 -1,0 0)', square, true],
    ['LINESTRING(-2 10,12 10)', square, true],
    ['LINESTRING(-1 -1,11 11)', square, false],
    ['LINESTRING(0 5,10 5)', square, false],
    ['LINESTRING(4 5,6 5)', frame, true],
    ['LINESTRING(4.5 5,5.5 5)', frame, false],
    ['LINESTRING(0 0,3 1)', 'POLYGON((0 0,6 2,0 4,0 0))', true],
    ['MULTILINESTRING((-1 -1,0 0),(2 2,3 3))', square, false]
  ]);
});

test('areal touches requires contact and no common area, including around holes', () => {
  touchesRows([
    [square, 'POLYGON((10 2,13 2,13 5,10 5,10 2))', true],
    [square, 'POLYGON((10 10,13 10,13 13,10 13,10 10))', true],
    [square, 'POLYGON((9 2,13 2,13 5,9 5,9 2))', false],
    [square, square, false],
    [frame, 'POLYGON((4 4,6 4,6 6,4 6,4 4))', true],
    [frame, 'POLYGON((4.1 4.1,5 4.1,5 5,4.1 5,4.1 4.1))', false],
    [square, 'MULTIPOLYGON(((10 10,13 10,13 13,10 13,10 10)),((2 2,3 2,3 3,2 3,2 2)))', false]
  ]);
});
