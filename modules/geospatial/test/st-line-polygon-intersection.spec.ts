// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  makeGeoArrowColumnFromArrowVector,
  materializeGeoArrowRows,
  parseWKT,
  writeWKB
} from '@math.gl/core/arrow';
import {ST_LENGTH} from '@math.gl/geospatial/st-functions';
import {ST_INTERSECTION} from '@math.gl/geospatial/st-overlay-functions';
import {queryArrowTableInBatches} from '@math.gl/sql/query';
import {Binary, Field, Schema, Table, vectorFromArray} from 'apache-arrow';
import {expect, test} from 'vitest';

test('streams polygon clipping with holes, boundary lines, isolated contacts and nulls', async () => {
  const fixtures = [
    [
      'MULTILINESTRING((-1 5,11 5),(-1 -1,0 0))',
      'GEOMETRYCOLLECTION(MULTILINESTRING((0 5,4 5),(6 5,10 5)),POINT(0 0))'
    ],
    ['MULTILINESTRING((-1 0,11 0))', 'LINESTRING(0 0,10 0)'],
    ['MULTILINESTRING((-1 -1,0 0))', 'POINT(0 0)'],
    ['MULTILINESTRING((2 2,3 3,4 3))', 'LINESTRING(2 2,3 3,4 3)'],
    ['MULTILINESTRING((4.5 5,5.5 5))', 'GEOMETRYCOLLECTION EMPTY'],
    ['MULTILINESTRING((2 5,3 5,2 5))', 'LINESTRING(2 5,3 5,2 5)'],
    [null, null]
  ] as const;
  const route = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(
      fixtures.map(([line]) => line && parseWKT(line)),
      {encoding: 'geoarrow.multilinestring'}
    )
  );
  const zone = vectorFromArray(
    fixtures.map(() =>
      writeWKB(parseWKT('POLYGON((0 0,10 0,10 10,0 10,0 0),(4 4,4 6,6 6,6 4,4 4))'))
    ),
    new Binary()
  );
  const schema = new Schema([
    new Field(
      'route',
      route.type,
      true,
      new Map([['ARROW:extension:name', 'geoarrow.multilinestring']])
    ),
    new Field('zone', zone.type, true, new Map([['ARROW:extension:name', 'geoarrow.wkb']]))
  ]);
  const table = new Table(schema, {route, zone});
  const batches = [...table.slice(0, 3).batches, ...table.slice(3).batches];
  const actual = [];
  const lengths = [];
  let physicalType: string | undefined;
  for await (const batch of queryArrowTableInBatches(batches, schema, {
    select: [
      {expression: 'ST_Intersection(route,zone)', as: 'forward'},
      {expression: 'ST_Intersection(zone,route)', as: 'backward'},
      {expression: 'ST_Length(ST_Intersection(route,zone))', as: 'length'}
    ],
    functions: [ST_INTERSECTION, ST_LENGTH]
  })) {
    const field = batch.schema.fields[0]!;
    expect(field.metadata.get('ARROW:extension:name')).toBe('geoarrow.geometry');
    physicalType ??= field.type.toString();
    expect(field.type.toString()).toBe(physicalType);
    const forward = materializeGeoArrowRows(
      makeGeoArrowColumnFromArrowVector(batch.getChild('forward')!, {field})
    );
    expect(forward).toEqual(
      materializeGeoArrowRows(
        makeGeoArrowColumnFromArrowVector(batch.getChild('backward')!, {field})
      )
    );
    actual.push(...forward);
    lengths.push(...batch.getChild('length')!);
  }
  expect(actual).toEqual(fixtures.map(([, value]) => value && parseWKT(value)));
  expect(lengths).toEqual([8, 10, 0, 1 + Math.SQRT2, 0, 2, null]);
});
