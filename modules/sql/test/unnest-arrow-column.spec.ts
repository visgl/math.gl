// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expandArrowColumn, unnestArrowColumn} from '../src/arrow/unnest-arrow-column';
import {expect, test} from 'vitest';
import {
  Field,
  Float64,
  FixedSizeList,
  Int32,
  List,
  Map_,
  Struct,
  Table,
  Utf8,
  tableFromArrays,
  vectorFromArray
} from 'apache-arrow';
import {queryArrowSQL} from '../src';

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

test('SQL UNNEST filters, aggregates and preserves empty parents with ordinality', () => {
  const input = new Table({
    id: vectorFromArray([1, 2, 3], new Int32()),
    items: vectorFromArray([[10, 20], [], null], new List(new Field('item', new Int32(), true)))
  });
  const tables = new Map([['parents', input]]);
  const cross = queryArrowSQL(
    'SELECT p.id, u.value, u.position FROM parents p CROSS JOIN UNNEST(p.items) WITH ORDINALITY AS u(value, position) WHERE u.value > 10',
    tables
  );
  expect(cross.toArray().map(row => row.toJSON())).toEqual([
    {id: 1, 'u.value': 20, 'u.position': 2}
  ]);
  const outer = queryArrowSQL(
    'SELECT p.id, u.value FROM parents p LEFT JOIN UNNEST(p.items) AS u(value) ON TRUE',
    tables
  );
  expect(outer.numRows).toBe(4);
  expect(outer.getChild('u.value')!.get(3)).toBeNull();
  const aggregate = queryArrowSQL(
    'SELECT SUM(u.value) AS total FROM parents p CROSS JOIN UNNEST(p.items) AS u(value)',
    tables
  );
  expect(aggregate.getChild('total')!.get(0)).toBe(30n);
});

test('SQL map UNNEST retains keys and ordinality and rejects unsupported syntax', () => {
  const type = new Map_(
    new Field(
      'entries',
      new Struct([new Field('key', new Utf8(), false), new Field('value', new Int32(), true)]),
      false
    )
  );
  const input = new Table({
    items: vectorFromArray(
      [
        new Map([
          ['A', 5],
          ['B', 8]
        ]),
        null
      ],
      type
    )
  });
  const tables = new Map([['parents', input]]);
  const result = queryArrowSQL(
    'SELECT u.key, u.value, u.position FROM parents p LEFT JOIN UNNEST(p.items) WITH ORDINALITY AS u(key, value, position) ON TRUE',
    tables
  );
  expect(result.toArray().map(row => row.toJSON())).toEqual([
    {'u.key': 'A', 'u.value': 5, 'u.position': 1},
    {'u.key': 'B', 'u.value': 8, 'u.position': 2},
    {'u.key': null, 'u.value': null, 'u.position': null}
  ]);
  for (const sql of [
    'SELECT * FROM parents p CROSS JOIN UNNEST(p.items) AS u(value)',
    'SELECT * FROM parents p LEFT JOIN UNNEST(p.items) AS u(key, value) ON FALSE',
    'SELECT * FROM parents p INNER JOIN UNNEST(p.items) AS u(key, value)',
    'SELECT * FROM parents p CROSS JOIN UNNEST(other.items) AS u(key, value)',
    'SELECT * FROM parents p CROSS JOIN UNNEST(p.items) AS p(key, value)'
  ])
    expect(() => queryArrowSQL(sql, tables)).toThrow();
});

test('SQL UNNEST retains nested values and physical timestamp precision', async () => {
  const {TimestampMicrosecond} = await import('apache-arrow');
  const timestamps = vectorFromArray(
    [[new Date(1700000000000)]],
    new List(new Field('item', new TimestampMicrosecond()))
  );
  const physical = timestamps.data[0]!.children[0]!.values as BigInt64Array;
  physical[0] = 1700000000000001n;
  const input = new Table({items: timestamps});
  const result = queryArrowSQL(
    'SELECT u.value FROM source s CROSS JOIN UNNEST(s.items) AS u(value)',
    new Map([['source', input]])
  );
  expect(result.getChild('u.value')!.data[0]!.values[0]).toBe(1700000000000001n);
  const nested = new Table({
    items: vectorFromArray(
      [[[1, 2], [3]]],
      new List(new Field('item', new List(new Field('n', new Int32()))))
    )
  });
  const expanded = queryArrowSQL(
    'SELECT u.value FROM source s CROSS JOIN UNNEST(s.items) AS u(value)',
    new Map([['source', nested]])
  );
  expect(Array.from(expanded.getChild('u.value')!.get(0))).toEqual([1, 2]);
  const structs = new Table({
    items: vectorFromArray(
      [[{count: 4}]],
      new List(new Field('item', new Struct([new Field('count', new Int32())])))
    )
  });
  const fields = queryArrowSQL(
    'SELECT u.item.count AS count FROM source s CROSS JOIN UNNEST(s.items) AS u(item)',
    new Map([['source', structs]])
  );
  expect(fields.getChild('count')!.get(0)).toBe(4);
});

test('UNNEST orders qualified child outputs and retains sliced internal struct values', () => {
  const input = new Table({
    items: vectorFromArray([[3, 1]], new List(new Field('item', new Int32())))
  });
  const ordered = queryArrowSQL(
    'SELECT u.value FROM source s CROSS JOIN UNNEST(s.items) AS u(value) ORDER BY u.value',
    new Map([['source', input]])
  );
  expect(Array.from(ordered.getChild('u.value')!)).toEqual([1, 3]);
  const structs = new Table({
    items: vectorFromArray([{a: 1}, {a: 9}], new Struct([new Field('a', new Int32())]))
  }).slice(1);
  const result = unnestArrowColumn(structs, 'items', {valueColumn: 'value'});
  expect(Array.from(result.getChild('value')!)).toEqual([9]);
});

test('expands contiguous list children with one data run per input batch', () => {
  const rows = Array.from({length: 128}, (_, row) => [row, null, row + 1]);
  const batch = new Table({items: vectorFromArray(rows, new List(new Field('item', new Int32())))});
  const input = batch.slice(1).concat(batch.slice(0, 2));
  const result = expandArrowColumn(input, 'items', {
    valueColumn: 'value',
    keyColumn: 'key',
    ordinalColumn: 'ordinal'
  });
  expect(result.table.batches).toHaveLength(2);
  expect([...result.table.getChild('value')!.slice(0, 6)]).toEqual([1, null, 2, 2, null, 3]);
  expect([...result.table.getChild('key')!.slice(0, 6)]).toEqual([1, 2, 3, 1, 2, 3]);
  expect([...result.table.getChild('ordinal')!]).toEqual([...result.table.getChild('key')!]);
  expect([...result.parentRows.slice(0, 6)]).toEqual([0, 0, 0, 1, 1, 1]);
});

test('expands the child ranges of sliced fixed-size lists and skips null parents', () => {
  const items = vectorFromArray(
    [[8, 9], null, [2, 3], [4, 5]],
    new FixedSizeList(2, new Field('item', new Int32()))
  );
  const table = new Table({items}).slice(1);
  for (const outer of [false, true]) {
    const result = expandArrowColumn(table, 'items', {valueColumn: 'value', outer});
    expect([...result.table.getChild('value')!]).toEqual(outer ? [null, 2, 3, 4, 5] : [2, 3, 4, 5]);
    expect([...result.parentRows]).toEqual(outer ? [0, 1, 1, 2, 2] : [1, 1, 2, 2]);
  }
});

test('SQL UNNEST joins expanded keys to a lookup table', () => {
  const parents = tableFromArrays({
    items: vectorFromArray([[2, 1, 3], [], null], new List(new Field('item', new Int32(), true)))
  });
  const lookup = tableFromArrays({id: Int32Array.of(1, 2), label: ['one', 'two']});
  const tables = new Map([
    ['parents', parents],
    ['lookup', lookup]
  ]);
  const sql = (join: string) => `SELECT u.id AS id, l.label AS label
    FROM parents p CROSS JOIN UNNEST(p.items) AS u(id)
    ${join} lookup l ON u.id = l.id`;
  expect(
    queryArrowSQL(sql('JOIN'), tables)
      .toArray()
      .map(row => row.toJSON())
  ).toEqual([
    {id: 2, label: 'two'},
    {id: 1, label: 'one'}
  ]);
  expect(
    queryArrowSQL(sql('LEFT JOIN'), tables)
      .toArray()
      .map(row => row.toJSON())
  ).toEqual([
    {id: 2, label: 'two'},
    {id: 1, label: 'one'},
    {id: 3, label: null}
  ]);
});
