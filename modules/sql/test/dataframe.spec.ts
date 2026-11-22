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

test('GeoDataFrame filters across batches and retains active geometry, metadata, and row order', () => {
  const table = makeTable();
  const frame = GeoDataFrame.fromArrow(table, {geometry: 'end'});
  const filtered = frame.filter('id <> :excluded', {parameters: {excluded: 2}});
  expect(filtered.geometry.field.name).toBe('end');
  expect(filtered.geometry.totalBounds()).toEqual([3, 4, 7, 8]);
  expect([...filtered.toArrow().getChild('id')!]).toEqual([1, 3]);
  expect(filtered.toArrow().schema).toBe(table.schema);
  expect(filtered.toArrow().getChild('end')!.data[1]).toBe(table.getChild('end')!.data[1]);
  expect(frame.filter('id < 0').geometry.totalBounds()).toBeNull();
});

test('withColumns evaluates simultaneous expressions and shares unchanged geometry chunks', () => {
  const table = makeTable();
  const frame = GeoDataFrame.fromArrow(table, {geometry: 'start'});
  const output = frame.withColumns(
    {id: 'id + :step', doubled: 'id * 2'},
    {
      parameters: {step: 10}
    }
  );
  expect(output.geometry.field).toBe(frame.geometry.field);
  expect(output.toArrow().schema.metadata).toBe(table.schema.metadata);
  expect(output.toArrow().schema.fields.map(field => field.name)).toEqual([
    'id',
    'start',
    'end',
    'doubled'
  ]);
  expect([...output.toArrow().getChild('id')!]).toEqual([11, 12, 13]);
  expect([...output.toArrow().getChild('doubled')!]).toEqual([2, 4, 6]);
  output.geometry.vector.data.forEach((chunk, index) => {
    expect(chunk).toBe(frame.geometry.vector.data[index]);
  });
  expect(frame.withColumns({})).toBe(frame);
  expect(() => frame.withColumns({start: 'id'})).toThrow('active geometry');
});

test('contiguous filtering keeps the binary point view aligned with row IDs', () => {
  const table = makeTable();
  const frame = GeoDataFrame.fromArrow(table, {geometry: 'end'});
  const filtered = frame.filter('id = 2');
  const coordinates = filtered.geometry.vector.data[0].children[0];
  const positions = coordinates.values.subarray(0, 2);
  expect(coordinates.offset).toBeGreaterThan(0);
  expect(positions.buffer).toBe(frame.geometry.vector.data[0].children[0].values.buffer);
  expect([...positions]).toEqual([5, 6]);
  expect(filtered.toArrow().getChild('id')!.get(0)).toBe(2);
});
