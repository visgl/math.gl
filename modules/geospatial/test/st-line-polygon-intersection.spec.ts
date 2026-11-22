// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  parseWKB,
  parseWKT,
  writeWKB
} from '@math.gl/core/arrow';
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
  for await (const batch of queryArrowTableInBatches(batches, schema, {
    select: [
      {expression: 'ST_Intersection(route,zone)', as: 'forward'},
      {expression: 'ST_Intersection(zone,route)', as: 'backward'}
    ],
    functions: [ST_INTERSECTION]
  })) {
    expect(batch.schema.fields[0]!.metadata.get('ARROW:extension:name')).toBe('geoarrow.wkb');
    expect([...batch.getChild('forward')!]).toEqual([...batch.getChild('backward')!]);
    actual.push(
      ...Array.from(batch.getChild('forward')!, value => value && parseWKB(value).geometry)
    );
  }
  expect(actual).toEqual(fixtures.map(([, value]) => value && parseWKT(value)));
});
