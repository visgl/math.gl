// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Field, FixedSizeList, Float64, Int32, Schema, Table, vectorFromArray} from 'apache-arrow';
import {DataFrame, GeoDataFrame} from '@math.gl/sql/dataframe';

/** Two batches with two geometry fields and a non-geometry attribute. */
function makeTable(): Table {
  const point = new FixedSizeList(2, new Field('xy', new Float64()));
  const metadata = new Map([
    ['ARROW:extension:name', 'geoarrow.point'],
    ['ARROW:extension:metadata', '{"edges":"planar"}']
  ]);
  const schema = new Schema(
    [
      new Field('id', new Int32()),
      ...['start', 'end'].map(name => new Field(name, point, true, metadata))
    ],
    new Map([['source', 'test']])
  );
  return new Table(schema, {
    id: vectorFromArray([1, 2], new Int32()),
    start: vectorFromArray([[1, 2], null], point),
    end: vectorFromArray(
      [
        [3, 4],
        [5, 6]
      ],
      point
    )
  }).concat(
    new Table(schema, {
      id: vectorFromArray([3], new Int32()),
      start: vectorFromArray([[-1, 8]], point),
      end: vectorFromArray([[7, 8]], point)
    })
  );
}

test('GeoDataFrame validates and switches active geometry without copying the table', () => {
  const table = makeTable();
  expect(() => GeoDataFrame.fromArrow(table)).toThrow('exactly one');
  expect(() => GeoDataFrame.fromArrow(table, {geometry: 'id'})).toThrow('named "id"');
  const frame = GeoDataFrame.fromArrow(table, {geometry: 'start'});
  const switched = frame.setGeometry('end');
  expect(frame.toArrow()).toBe(table);
  expect(switched.toArrow()).toBe(table);
  expect(frame.geometry.field.name).toBe('start');
  expect(frame.geometry.totalBounds()).toEqual([-1, 2, 1, 8]);
  expect(frame.geometry.vector.data[0]).toBe(table.getChild('start')!.data[0]);
  expect(switched.geometry.totalBounds()).toEqual([3, 4, 7, 8]);
  expect(
    GeoDataFrame.fromArrow(table.slice(0, 0), {geometry: 'start'}).geometry.totalBounds()
  ).toBeNull();
});

test('DataFrame selects fields in order and shares geometry and attribute buffers across batches', () => {
  const table = makeTable();
  const selected = GeoDataFrame.fromArrow(table, {geometry: 'start'}).select('end', 'id');
  const output = selected.toArrow();
  expect(selected).toBeInstanceOf(DataFrame);
  expect(selected).not.toBeInstanceOf(GeoDataFrame);
  expect(output.schema.fields.map(field => field.name)).toEqual(['end', 'id']);
  expect(output.schema.fields[0].metadata).toEqual(table.schema.fields[2].metadata);
  expect(output.schema.metadata).toEqual(table.schema.metadata);
  expect(output.batches).toHaveLength(2);
  for (const name of ['end', 'id']) {
    output.getChild(name)!.data.forEach((chunk, index) => {
      expect(chunk).toBe(table.getChild(name)!.data[index]);
    });
  }
  expect(GeoDataFrame.fromArrow(output).geometry.field.name).toBe('end');
  expect(() => DataFrame.fromArrow(table).select('missing')).toThrow('Unknown column');
});
