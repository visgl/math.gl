// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  parseWKT,
  writeWKB
} from '@math.gl/core/arrow';
import {ST_ISVALID, ST_ISVALIDREASON} from '@math.gl/geospatial/st-functions';
import {queryArrowSQL, queryArrowTableInBatches} from '@math.gl/sql/query';
import {Binary, Field, Schema, Table, vectorFromArray, type Vector} from 'apache-arrow';
import {expect, test} from 'vitest';

/** Binds just the two validation operations. */
const functions = [ST_ISVALID, ST_ISVALIDREASON];

/** Creates a GeoArrow geometry field for the input vector. */
function schemaFor(vector: Vector, encoding = 'geoarrow.wkb'): Schema {
  return new Schema([
    new Field('g', vector.type, true, new Map([['ARROW:extension:name', encoding]]))
  ]);
}

test('streams XY polygon diagnostics across batches and propagates nulls', async () => {
  const fixtures = [
    'POLYGON((0 0,8 0,8 8,0 8,0 0),(2 2,3 2,3 3,2 3,2 2))',
    'POLYGON((0 0,6 6,0 6,6 0,0 0))',
    'POLYGON((0 0,0 0,8 0,8 8,0 8,0 0))',
    'POLYGON((0 0,8 0,8 8,0 8))',
    'POLYGON((0 0,8 0,8 0,0 0))',
    'POLYGON((0 0,8 0,8 8,0 8,0 0),(9 9,10 9,10 10,9 10,9 9))',
    'POLYGON((0 0,8 0,8 8,0 8,0 0),(1 1,5 1,5 5,1 5,1 1),(2 2,3 2,3 3,2 3,2 2))',
    'POLYGON EMPTY'
  ];
  const g = vectorFromArray([...fixtures.map(wkt => writeWKB(parseWKT(wkt))), null], new Binary());
  const schema = schemaFor(g);
  const table = new Table(schema, {g});
  const batches = [...table.slice(0, 3).batches, ...table.slice(3).batches];
  const result = [];
  for await (const batch of queryArrowTableInBatches(batches, schema, {
    select: [
      {expression: 'ST_IsValid(g)', as: 'valid'},
      {expression: 'ST_IsValidReason(g)', as: 'reason'}
    ],
    functions
  })) {
    result.push(batch);
  }
  expect(result.map(batch => batch.numRows)).toEqual([3, 6]);
  expect(result.flatMap(batch => [...batch.getChild('valid')!])).toEqual([
    true,
    false,
    true,
    false,
    false,
    false,
    false,
    true,
    null
  ]);
  expect(result.flatMap(batch => [...batch.getChild('reason')!])).toEqual([
    'Valid Geometry',
    'Ring self-intersection',
    'Valid Geometry',
    'Ring is not closed[0 0]',
    'Too few points in geometry component',
    'Hole lies outside shell',
    'Holes overlap or are nested',
    'Valid Geometry',
    null
  ]);
});

test('allows isolated ring contacts and rejects contact cycles in native polygons', () => {
  const encoding = 'geoarrow.polygon';
  const fixtures = [
    'POLYGON((0 0,10 0,10 10,0 10,0 0),(0 5,2 4,2 6,0 5))',
    'POLYGON((0 0,10 0,10 10,0 10,0 0),(5 0,6 4,5 10,4 4,5 0))',
    'POLYGON((0 0,10 0,10 10,0 10,0 0),(2 2,4 3,4 4,2 2),(4 4,6 4,6 6,4 4))',
    'POLYGON((0 0,10 0,10 10,0 10,0 0),(5 0,6 2,5 5,4 2,5 0),(5 5,6 8,5 10,4 8,5 5))',
    'POLYGON((0 0,10 0,10 10,0 10,0 0),(5 5,8 4,8 6,5 5),(5 5,3 8,2 7,5 5),(5 5,2 3,3 2,5 5))',
    'POLYGON((0 0,10 0,10 10,0 10,0 0),(5 0,6 4,4 4,5 0),(4 4,6 4,5 10,4 4))'
  ];
  const g = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(
      fixtures.map(wkt => parseWKT(wkt)),
      {encoding}
    )
  );
  const result = queryArrowSQL(
    'SELECT ST_IsValidReason(g) AS reason FROM features',
    new Map([['features', new Table(schemaFor(g, encoding), {g})]]),
    {functions}
  );
  expect([...result.getChild('reason')!]).toEqual([
    'Valid Geometry',
    'Interior is disconnected',
    'Valid Geometry',
    'Interior is disconnected',
    'Valid Geometry',
    expect.stringMatching(/Overlapping ring edges/)
  ]);
});

test('distinguishes nested multipolygon interiors, islands in holes, and point contacts', () => {
  const fixtures = [
    'MULTIPOLYGON(((0 0,10 0,10 10,0 10,0 0),(2 2,8 2,8 8,2 8,2 2)),((3 3,4 3,4 4,3 4,3 3)))',
    'MULTIPOLYGON(((0 0,4 0,4 4,0 4,0 0)),((4 4,6 4,6 6,4 6,4 4)))',
    'MULTIPOLYGON(((0 0,6 0,6 6,0 6,0 0)),((2 2,4 2,4 4,2 4,2 2)))',
    'MULTIPOLYGON(((0 0,4 0,4 4,0 4,0 0)),((4 0,6 0,6 4,4 4,4 0)))',
    'MULTIPOLYGON(((0 0,4 0,4 4,0 4,0 0)),((0 2,2 4,4 2,2 0,0 2)))',
    'MULTIPOLYGON EMPTY'
  ];
  const encoding = 'geoarrow.multipolygon';
  const g = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(
      fixtures.map(wkt => parseWKT(wkt)),
      {encoding}
    )
  );
  const result = queryArrowSQL(
    'SELECT ST_IsValid(g) AS valid, ST_IsValidReason(g) AS reason FROM features',
    new Map([['features', new Table(schemaFor(g, encoding), {g})]]),
    {functions}
  );
  expect([...result.getChild('valid')!]).toEqual([true, true, false, false, false, true]);
  expect(result.getChild('reason')!.get(2)).toBe('Polygon components overlap or are nested');
});

test('validates only XY and diagnoses invalid XY coordinates in native dimensional data', () => {
  const encoding = 'geoarrow.polygon';
  const g = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(
      [
        parseWKT('POLYGON Z((0 0 8,3 0 8,3 3 8,0 3 8,0 0 7))'),
        {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0, 8],
              [3, 0, 8],
              [Infinity, 3, 8],
              [0, 0, 8]
            ]
          ]
        }
      ],
      {encoding, dimension: 'xyz'}
    )
  );
  const result = queryArrowSQL(
    'SELECT ST_IsValidReason(g) AS reason FROM features',
    new Map([['features', new Table(schemaFor(g, encoding), {g})]]),
    {functions}
  );
  expect([...result.getChild('reason')!]).toEqual([
    'Valid Geometry',
    'Invalid coordinate[Infinity 3]'
  ]);
});
