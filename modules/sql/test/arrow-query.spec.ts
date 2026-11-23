// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Float64, Int32, Int64, Table, Utf8, vectorFromArray} from 'apache-arrow';
import {expect, test} from 'vitest';
import {queryArrowTable, queryArrowTableInBatches, queryArrowSQL} from '@math.gl/sql/query';
import {parseSQLQuery} from '@math.gl/sql/parser';

/** Parses the SELECT requests used by these tests. */
function select(sql: string) {
  const query = parseSQLQuery(sql);
  if ('command' in query) throw new Error('Expected SELECT');
  return query;
}

test('SELECT preserves column order and aliases and applies WHERE before computing and limiting', () => {
  const batch = new Table({
    x: vectorFromArray([null, 1, 2, 3], new Float64()),
    y: vectorFromArray([5, 6, null, 8], new Float64())
  });
  const source = batch.concat(batch);
  const result = queryArrowTable(
    source,
    select('SELECT x AS id, x + y AS sum, x AS original FROM input WHERE x >= 2 LIMIT 3')
  );
  expect(result.schema.fields.map(field => field.name)).toEqual(['id', 'sum', 'original']);
  expect(Array.from(result.getChild('id')!)).toEqual([2, 3, 2]);
  expect(Array.from(result.getChild('sum')!)).toEqual([null, 11, null]);
  expect(Array.from(result.getChild('original')!)).toEqual([2, 3, 2]);
});

test('projection shares source buffers and empty results retain their schema', () => {
  const source = new Table({x: vectorFromArray([1, 2], new Float64())});
  const projected = queryArrowTable(source, {select: [{column: 'x', as: 'value'}]});
  expect(projected.getChild('value')!.data[0]).toBe(source.getChild('x')!.data[0]);
  expect(queryArrowTable(source, {select: [], limit: 1}).numRows).toBe(1);
  const empty = queryArrowTable(source, select('SELECT x + 1 AS value WHERE x > 5'));
  expect(empty.numRows).toBe(0);
  expect(empty.schema.fields.map(field => field.name)).toEqual(['value']);
  expect(queryArrowTable(source, {limit: 0}).schema).toBe(source.schema);
  expect(() => queryArrowTable(source, {select: ['x', {column: 'x', as: 'x'}]})).toThrow(
    /duplicate/
  );
});

test('projection and sparse filtering preserve batch metadata through the runtime API', () => {
  const source = new Table({x: vectorFromArray([3, 0, 4], new Int32())});
  const metadata = new Map([['partition', 'first']]);
  const batch = source.batches[0]!;
  const nativeMetadata = Reflect.get(batch, 'metadata') as Map<string, string> | undefined;
  if (nativeMetadata) nativeMetadata.set('partition', 'first');
  else Object.assign(batch, {metadata});

  const result = queryArrowTable(source, select('SELECT x AS value WHERE x > 0'));
  expect(Array.from(result.getChild('value')!)).toEqual([3, 4]);
  expect(Reflect.get(result.batches[0], 'metadata')).toBe(nativeMetadata ?? metadata);
  expect(Object.hasOwn(result.batches[0]!, 'metadata')).toBe(!nativeMetadata);
  const paginated = queryArrowTable(source, {offset: 1, limit: 1});
  expect(Array.from(paginated.getChild('x')!)).toEqual([0]);
  expect(Reflect.get(paginated.batches[0], 'metadata')).toBe(nativeMetadata ?? metadata);
});

test('unaliased computed columns get distinct names without displacing explicit aliases', () => {
  const source = new Table({x: vectorFromArray([1], new Float64())});
  const result = queryArrowTable(source, select('SELECT x + 1, x - 1, x AS expression_1'));
  expect(result.schema.fields.map(field => field.name)).toEqual([
    'expression_1_',
    'expression_2',
    'expression_1'
  ]);
  expect(Array.from(result.getChildAt(0)!)).toEqual([2]);
  expect(Array.from(result.getChildAt(1)!)).toEqual([0]);
});

test('filters and groups UNION ALL inputs before stable ordering and pagination', () => {
  const source = new Table({
    id: vectorFromArray([1, 2, 3, null], new Float64()),
    group: vectorFromArray([2, 1, 2, null], new Float64())
  });
  const result = queryArrowTable(source, {
    union: [source.slice(1, 3)],
    where: select('SELECT * WHERE id >= 2').where,
    groupBy: ['group'],
    aggregates: {total: {operation: 'SUM', expression: 'id'}, count: {operation: 'COUNT'}},
    orderBy: [{column: 'total', direction: 'desc'}],
    select: ['group', 'total', 'count'],
    limit: 1
  });
  expect(Array.from(result.getChild('group')!)).toEqual([2]);
  expect(Array.from(result.getChild('total')!)).toEqual([6]);
  expect(Array.from(result.getChild('count')!)).toEqual([2n]);
  expect(() => queryArrowTable(source, {union: [source.select(['id'])]})).toThrow(/UNION ALL/);

  const empty = queryArrowTable(source.slice(0, 0), {
    aggregates: {count: {operation: 'COUNT'}, sum: {operation: 'SUM', expression: 'id'}}
  });
  expect(Array.from(empty.getChild('count')!)).toEqual([0n]);
  expect(Array.from(empty.getChild('sum')!)).toEqual([null]);
});

test('inner join preserves duplicate matches, excludes null keys, and exposes right columns', () => {
  const left = new Table({
    id: vectorFromArray([2, null, 1, 2], new Float64()),
    value: vectorFromArray([10, 20, 30, 40], new Float64())
  });
  const right = new Table({
    id: vectorFromArray([2, null, 2, 1], new Float64()),
    value: vectorFromArray([50, 60, 70, 80], new Float64())
  });
  const query = {
    join: {table: right, left: 'id', right: 'id', rightPrefix: 'right.'},
    select: ['value', {column: 'right.value', as: 'matched'}]
  };
  const result = queryArrowTable(left, query);
  expect(Array.from(result.getChild('value')!)).toEqual([10, 10, 30, 40, 40]);
  expect(Array.from(result.getChild('matched')!)).toEqual([50, 70, 80, 50, 70]);
  const empty = queryArrowTable(left, {...query, join: {...query.join, table: right.slice(0, 0)}});
  expect(empty.numRows).toBe(0);
  expect(empty.schema.fields.map(field => field.name)).toEqual(['value', 'matched']);
});

test('sorts by multiple keys with stable ties and explicit null placement', () => {
  const source = new Table({
    key: vectorFromArray([2, null, 1, 2, 2], new Float64()),
    tie: vectorFromArray([2, 2, 2, 1, 2], new Float64()),
    index: vectorFromArray([0, 1, 2, 3, 4], new Float64())
  });
  const result = queryArrowTable(source, {
    select: ['index'],
    orderBy: [{column: 'key', direction: 'desc', nulls: 'first'}, {column: 'tie'}],
    offset: 1,
    limit: 3
  });
  expect(Array.from(result.getChild('index')!)).toEqual([3, 0, 4]);
});

test('join compares narrow and wide integer keys without rounding the wide key', () => {
  const left = new Table({id: vectorFromArray([1, 2], new Int32())});
  const right = new Table({id: vectorFromArray([1n, 9007199254740993n], new Int64())});
  const join = {table: right, left: 'id', right: 'id', rightPrefix: 'right.'};
  expect(Array.from(queryArrowTable(left, {join}).getChild('right.id')!)).toEqual([1n]);
  const rounded = new Table({id: vectorFromArray([9007199254740992], new Float64())});
  expect(queryArrowTable(rounded, {join}).numRows).toBe(0);
});

test('sort orders supplementary characters by UTF-8, as WHERE does', () => {
  const source = new Table({key: vectorFromArray(['😀', null, '\uE000'], new Utf8())});
  const result = queryArrowTable(source, {orderBy: [{column: 'key'}]});
  expect(Array.from(result.getChild('key')!)).toEqual(['\uE000', '😀', null]);
});

test('plans a qualified join, grouped aggregates and ordering by output alias from SQL', () => {
  const orders = new Table({
    product: vectorFromArray([1, 1, 2], new Int32()),
    units: vectorFromArray([2, 3, 1], new Int32())
  });
  const products = new Table({
    id: vectorFromArray([1, 2], new Int32()),
    category: vectorFromArray(['a', 'b'], new Utf8())
  });
  const result = queryArrowSQL(
    'SELECT p.category AS category, SUM(o.units) AS units, COUNT(*) AS n FROM orders o ' +
      'JOIN products p ON p.id = o.product WHERE o.units > 0 GROUP BY p.category ORDER BY units DESC LIMIT 1',
    new Map<string, Table>([
      ['orders', orders],
      ['products', products]
    ])
  );
  expect(Array.from(result.getChild('category')!)).toEqual(['a']);
  expect(Array.from(result.getChild('units')!)).toEqual([5n]);
  expect(Array.from(result.getChild('n')!)).toEqual([2n]);
});

test('executes UNION ALL branches before applying global ordering and pagination', () => {
  const source = new Table({id: vectorFromArray([1, 2, 3], new Int32())});
  const result = queryArrowSQL(
    'SELECT id AS result FROM input WHERE id < 3 UNION ALL SELECT id AS other FROM input ' +
      'WHERE id > 1 ORDER BY result DESC LIMIT 2',
    new Map([['input', source]])
  );
  expect(Array.from(result.getChild('result')!)).toEqual([3, 2]);
});

test('streaming query matches the table plan and closes the input at its global limit', async () => {
  const first = new Table({x: vectorFromArray([0, 1, 2], new Int32())});
  const second = new Table({x: vectorFromArray([3, 0, 4, 5], new Int32())});
  const source = first.concat(second);
  const query = select('SELECT x AS value WHERE x > 0 LIMIT 3 OFFSET 1');
  let pulls = 0;
  let closed = false;
  async function* batches() {
    try {
      for (const batch of [...source.batches, ...source.batches]) {
        pulls++;
        yield batch;
      }
    } finally {
      closed = true;
    }
  }
  const result = await Array.fromAsync(queryArrowTableInBatches(batches(), source.schema, query));
  expect(result.flatMap(batch => Array.from(batch.getChild('value')!))).toEqual(
    Array.from(queryArrowTable(source, query).getChild('value')!)
  );
  expect(pulls).toBe(2);
  expect(closed).toBe(true);
});

test('streaming LIMIT 0 leaves input unopened and schema mismatches fail before output', async () => {
  const source = new Table({x: vectorFromArray([1], new Int32())});
  let opened = false;
  function* batches() {
    opened = true;
    yield* source.batches;
  }
  expect(
    await Array.fromAsync(queryArrowTableInBatches(batches(), source.schema, {limit: 0}))
  ).toEqual([]);
  expect(opened).toBe(false);
  const compatible = new Table({x: vectorFromArray([2], new Int32())});
  expect(compatible.schema).not.toBe(source.schema);
  const matching = await Array.fromAsync(
    queryArrowTableInBatches(compatible.batches, source.schema)
  );
  expect(matching[0]?.getChild('x')?.get(0)).toBe(2);
  const incompatible = new Table({y: vectorFromArray([2], new Int32())});
  await expect(
    Array.fromAsync(queryArrowTableInBatches(incompatible.batches, source.schema))
  ).rejects.toThrow(/input schema/);
});

test('contiguous filtered matches share source values', () => {
  const source = new Table({x: vectorFromArray([0, 1, 2, 0], new Int32())});
  const result = queryArrowTable(source, select('SELECT x WHERE x > 0'));
  expect(Array.from(result.getChild('x')!)).toEqual([1, 2]);
  expect(result.getChild('x')!.data[0]!.values.buffer).toBe(
    source.getChild('x')!.data[0]!.values.buffer
  );
});

test('streaming queries can emit projected empty batches with source batch metadata', async () => {
  const source = new Table({x: vectorFromArray([0, 2], new Int32())});
  const rejected = source.batches[0]!.slice(0, 1);
  const accepted = source.batches[0]!.slice(1);
  const metadata = Reflect.get(rejected, 'metadata') ?? new Map<string, string>();
  metadata.set('partition', 'rejected');
  if (!Reflect.get(rejected, 'metadata')) Object.assign(rejected, {metadata});
  const query = select('SELECT x AS value WHERE x > 0 LIMIT 1');
  const input = [rejected, accepted];
  const output = await Array.fromAsync(
    queryArrowTableInBatches(input, source.schema, {...query, emitEmptyBatches: true})
  );
  expect(output.map(batch => batch.numRows)).toEqual([0, 1]);
  expect(output[0]!.schema.fields.map(field => field.name)).toEqual(['value']);
  expect(Reflect.get(output[0]!, 'metadata')?.get('partition')).toBe('rejected');
  expect(output[1]!.getChild('value')?.get(0)).toBe(2);
  expect(await Array.fromAsync(queryArrowTableInBatches(input, source.schema, query))).toHaveLength(
    1
  );
});

test('reduces compound groups across chunks in first-seen order', () => {
  const chunk = (keys: (string | null)[], groups: number[], values: (number | null)[]) =>
    new Table({
      key: vectorFromArray(keys, new Utf8()),
      group: vectorFromArray(groups, new Int32()),
      amount: vectorFromArray(values, new Int32())
    });
  const input = chunk(['a', 'a', null], [2, 1, 1], [4, 1, null]).concat(
    chunk(['a', null, 'a'], [2, 1, 1], [6, 3, null])
  );
  const result = queryArrowTable(input, {
    groupBy: ['key', 'group'],
    aggregates: {
      count: {operation: 'COUNT'},
      sum: {operation: 'SUM', expression: 'amount'}
    }
  });
  expect([...result.getChild('key')!]).toEqual(['a', 'a', null]);
  expect([...result.getChild('group')!]).toEqual([2, 1, 1]);
  expect([...result.getChild('count')!]).toEqual([2n, 2n, 2n]);
  expect([...result.getChild('sum')!]).toEqual([10n, 1n, 3n]);
});
