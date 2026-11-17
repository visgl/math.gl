// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  Field,
  Float64,
  Int32,
  List,
  Map_,
  Struct,
  Table,
  Utf8,
  tableFromArrays,
  vectorFromArray
} from 'apache-arrow';
import {unnestArrowColumn, queryArrowSQL} from '../src';

test('unnest lists preserves sliced parents, null elements, ordinality and empty schema', () => {
  const input = new Table({
    id: vectorFromArray([0, 1, 2, 3]),
    items: vectorFromArray([[9], [2, null, 4], [], null], new List(new Field('item', new Int32())))
  }).slice(1);
  const result = unnestArrowColumn(input, 'items', {valueColumn: 'value', keyColumn: 'position'});
  expect(Array.from(result.getChild('id')!)).toEqual([1, 1, 1]);
  expect(Array.from(result.getChild('value')!)).toEqual([2, null, 4]);
  expect(Array.from(result.getChild('position')!)).toEqual([1, 2, 3]);
  expect(unnestArrowColumn(input, 'items', {valueColumn: 'value', outer: true}).numRows).toBe(5);
  const empty = unnestArrowColumn(input.slice(1), 'items', {valueColumn: 'value'});
  expect(empty.numRows).toBe(0);
  expect(String(empty.getChild('value')!.type)).toBe('Int32');
});

test('unnest flows feeds a relational filter and join without JS row transforms', () => {
  const type = new Map_(
    new Field(
      'entries',
      new Struct([new Field('key', new Utf8(), false), new Field('value', new Float64())]),
      false
    )
  );
  const source = new Table({
    county: vectorFromArray(['A', 'B']),
    flows: vectorFromArray(
      [
        new Map([
          ['B', 60],
          ['C', -4]
        ]),
        null
      ],
      type
    )
  });
  const flows = unnestArrowColumn(source, 'flows', {valueColumn: 'flow', keyColumn: 'destination'});
  const counties = tableFromArrays({id: ['B', 'C'], longitude: [2, 3]});
  const selected = queryArrowSQL(
    'SELECT flows.county, flows.flow, counties.longitude AS longitude FROM flows INNER JOIN counties ON flows.destination = counties.id WHERE flow >= 50',
    new Map([
      ['flows', flows],
      ['counties', counties]
    ])
  );
  expect(selected.numRows).toBe(1);
  expect(selected.getChild('longitude')!.get(0)).toBe(2);
});

test('homogeneous struct expansion, collisions, unsupported columns and cancellation', () => {
  const flows = vectorFromArray(
    [{B: 10, C: null}],
    new Struct([new Field('B', new Int32()), new Field('C', new Int32())])
  );
  const input = new Table({flows});
  const expanded = unnestArrowColumn(input, 'flows', {
    valueColumn: 'flow',
    keyColumn: 'destination'
  });
  expect(Array.from(expanded.getChild('destination')!)).toEqual(['B', 'C']);
  expect(Array.from(expanded.getChild('flow')!)).toEqual([10, null]);
  expect(() => unnestArrowColumn(input, 'flows', {valueColumn: 'flows'})).toThrow('Duplicate');
  expect(() => unnestArrowColumn(input, 'missing', {valueColumn: 'v'})).toThrow('Unknown');
  expect(() => unnestArrowColumn(tableFromArrays({x: [1]}), 'x', {valueColumn: 'v'})).toThrow(
    'requires'
  );
  const controller = new AbortController();
  controller.abort();
  expect(() =>
    unnestArrowColumn(input, 'flows', {valueColumn: 'v', signal: controller.signal})
  ).toThrow();
});
