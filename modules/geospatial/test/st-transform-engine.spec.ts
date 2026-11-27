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
import {projectionEngine} from '@math.gl/geospatial/projection';
import {createSTTransform} from '@math.gl/geospatial/st-functions';
import {queryArrowSQL, queryArrowTableInBatches} from '@math.gl/sql/query';
import {Binary, Field, Schema, Table, vectorFromArray, type Vector} from 'apache-arrow';
import {expect, test} from 'vitest';

/** Registers the engine-backed transform without also registering the built-in overload. */
const functions = [createSTTransform(projectionEngine)];

/** Marks the input coordinates as WGS84 in GeoArrow XY order. */
function features(vector: Vector, encoding: string): Table {
  return new Table(
    new Schema([
      new Field(
        'geometry',
        vector.type,
        true,
        new Map([
          ['ARROW:extension:name', encoding],
          ['ARROW:extension:metadata', '{"crs":"EPSG:4326"}']
        ])
      )
    ]),
    {geometry: vector}
  );
}

test('streams native XYZ points into UTM while preserving Z, empties and nulls', async () => {
  const encoding = 'geoarrow.point';
  const vector = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build([parseWKT('POINT Z(3 0 120)'), parseWKT('POINT Z EMPTY'), null], {
      encoding,
      dimension: 'xyz'
    })
  );
  const table = features(vector, encoding);
  const rows = [];
  for await (const batch of queryArrowTableInBatches(
    [...table.slice(0, 1).batches, ...table.slice(1).batches],
    table.schema,
    {select: [{expression: 'ST_Transform(geometry,32631)', as: 'utm'}], functions}
  )) {
    const field = batch.schema.fields[0]!;
    expect(field.type.toString()).toBe(vector.type.toString());
    expect(field.metadata.get('ARROW:extension:name')).toBe(encoding);
    expect(JSON.parse(field.metadata.get('ARROW:extension:metadata')!)).toEqual({
      crs: 'EPSG:32631',
      crs_type: 'authority_code'
    });
    rows.push(...Array.from(batch.getChild('utm')!, row => row && Array.from(row)));
  }
  expect(rows).toEqual([[500000, 0, 120], [NaN, NaN, NaN], null]);
});

test('reprojects WKB and requires a bind-time target CRS', () => {
  const table = features(
    vectorFromArray([writeWKB(parseWKT('POINT(3 0)'))], new Binary()),
    'geoarrow.wkb'
  );
  const tables = new Map([['features', table]]);
  const result = queryArrowSQL('SELECT ST_Transform(geometry,32631) AS utm FROM features', tables, {
    functions
  });
  expect(parseWKB(result.getChild('utm')!.get(0)).geometry).toEqual(parseWKT('POINT(500000 0)'));
  expect(() =>
    queryArrowSQL('SELECT ST_Transform(geometry,32630+1) FROM features', tables, {functions})
  ).toThrow(/constant positive integer EPSG code/);
});
