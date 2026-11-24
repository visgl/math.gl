// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Binary,
  DateDay,
  DateMillisecond,
  Dictionary,
  Field,
  FixedSizeBinary,
  Float16,
  Float64,
  Int32,
  Int64,
  LargeBinary,
  LargeUtf8,
  RecordBatch,
  Schema,
  Table,
  TimestampNanosecond,
  Utf8,
  makeData,
  makeVector,
  tableFromArrays,
  tableFromIPC,
  tableToIPC,
  vectorFromArray
} from 'apache-arrow';
import {expect, test} from 'vitest';
import {queryArrowTable, queryArrowTableInBatches, queryArrowSQL} from '@math.gl/sql/query';
import {parseSQLQuery} from '@math.gl/sql/parser';
import {groupArrowTable} from '../src/arrow/relational-query';

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

test.each(['explicit', 'inferred'])(
  'streaming query with %s schema matches the table plan and closes input at its global limit',
  async schemaMode => {
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
    const output =
      schemaMode === 'explicit'
        ? queryArrowTableInBatches(batches(), source.schema, query)
        : queryArrowTableInBatches(batches(), query);
    const result = await Array.fromAsync(output);
    expect(result.flatMap(batch => Array.from(batch.getChild('value')!))).toEqual(
      Array.from(queryArrowTable(source, query).getChild('value')!)
    );
    expect(pulls).toBe(2);
    expect(closed).toBe(true);
  }
);

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

test('inferred streaming queries handle empty inputs and avoid opening a canceled input', async () => {
  const source = new Table({x: vectorFromArray([1], new Int32())});
  let opened = false;
  function* batches() {
    opened = true;
    yield* source.batches;
  }
  expect(await Array.fromAsync(queryArrowTableInBatches([]))).toEqual([]);
  expect(await Array.fromAsync(queryArrowTableInBatches(batches(), {limit: 0}))).toEqual([]);
  const controller = new AbortController();
  controller.abort();
  await expect(
    Array.fromAsync(queryArrowTableInBatches(batches(), {signal: controller.signal}))
  ).rejects.toHaveProperty('name', 'AbortError');
  expect(opened).toBe(false);
});

test('inferred streaming queries validate later schemas and close input on query errors', async () => {
  const first = new Table({x: vectorFromArray([1], new Int32())});
  const second = new Table({y: vectorFromArray([2], new Int32())});
  let closed = false;
  function* batches() {
    try {
      yield* first.batches;
      yield* second.batches;
    } finally {
      closed = true;
    }
  }
  await expect(Array.fromAsync(queryArrowTableInBatches(batches()))).rejects.toThrow(
    /input schema/
  );
  expect(closed).toBe(true);
  closed = false;
  await expect(
    Array.fromAsync(queryArrowTableInBatches(batches(), {select: ['missing']}))
  ).rejects.toThrow(/Arrow query column not found/);
  expect(closed).toBe(true);
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
test('sorts across sliced chunks and preserves stable ties through pagination', () => {
  const chunks = Array.from({length: 32}, (_, index) => {
    const table = new Table({
      key: vectorFromArray([99, index % 3, null], new Int32()),
      id: vectorFromArray([-1, index, index + 32], new Int32())
    });
    return table.slice(1);
  });
  const input = chunks[0]!.concat(...chunks.slice(1));
  const result = queryArrowTable(input, {
    select: ['id'],
    orderBy: [{column: 'key', direction: 'desc', nulls: 'last'}],
    offset: 8,
    limit: 5
  });
  expect([...result.getChild('id')!]).toEqual([26, 29, 1, 4, 7]);
});
test('groups binary keys by contents across chunks and distinguishes empty keys from nulls', () => {
  for (const type of [new Binary(), new FixedSizeBinary(2)]) {
    const secondKey = type instanceof FixedSizeBinary ? Uint8Array.of(254, 0) : new Uint8Array();
    const batch = (bytes: (Uint8Array | null)[]) => new Table({key: vectorFromArray(bytes, type)});
    const input = batch([Uint8Array.of(255, 0), secondKey, null]).concat(
      batch([Uint8Array.of(255, 0), Uint8Array.from(secondKey), null])
    );
    const result = queryArrowTable(input, {
      groupBy: ['key'],
      aggregates: {count: {operation: 'COUNT'}}
    });
    expect(result.getChild('key')!.type.toString()).toBe(type.toString());
    expect([...result.getChild('key')!]).toEqual([Uint8Array.of(255, 0), secondKey, null]);
    expect([...result.getChild('count')!]).toEqual([2n, 2n, 2n]);
  }
});
test('orders and groups Arrow dates without decoding their payloads', () => {
  for (const type of [new DateDay(), new DateMillisecond()]) {
    const first = new Date(0);
    const second = new Date(2 ** 32);
    const table = new Table({
      day: vectorFromArray([second, null, first, first], type),
      id: vectorFromArray([1, 2, 3, 4], new Int32())
    });
    const result = queryArrowTable(table, {
      orderBy: [{column: 'day', nulls: 'first'}],
      select: ['id']
    });
    expect([...result.getChild('id')!]).toEqual([2, 3, 4, 1]);

    const grouped = queryArrowTable(table, {
      groupBy: ['day'],
      orderBy: [{column: 'day', nulls: 'last'}],
      aggregates: {count: {operation: 'COUNT'}}
    });
    expect(grouped.getChild('day')!.type.toString()).toBe(type.toString());
    const secondDate = type instanceof DateDay ? 49 * 86_400_000 : 2 ** 32;
    expect([...grouped.getChild('day')!]).toEqual([0, secondDate, null]);
    expect([...grouped.getChild('count')!]).toEqual([2n, 1n, 1n]);
  }
});
test('orders and groups timestamp keys at full nanosecond precision', () => {
  const type = new TimestampNanosecond('UTC');
  const first = 1_700_000_000_000_000_000n;
  const second = first + 1n;
  const table = new Table({
    instant: makeVector(
      makeData({
        type,
        data: BigInt64Array.of(second, 0n, first, first),
        nullBitmap: Uint8Array.of(0b1101),
        nullCount: 1
      })
    ),
    id: vectorFromArray([1, 2, 3, 4], new Int32())
  });
  const ordered = queryArrowTable(table, {
    orderBy: [{column: 'instant', nulls: 'first'}],
    select: ['id']
  });
  expect([...ordered.getChild('id')!]).toEqual([2, 3, 4, 1]);

  const grouped = queryArrowTable(table, {
    groupBy: ['instant'],
    orderBy: [{column: 'instant', nulls: 'last'}],
    aggregates: {count: {operation: 'COUNT'}}
  });
  expect(grouped.getChild('instant')!.type.toString()).toBe(type.toString());
  expect([...grouped.getChild('count')!]).toEqual([2n, 1n, 1n]);

  const custom = groupArrowTable(
    table,
    ['instant'],
    {},
    {inputSchema: table.schema},
    new Map([
      [
        'rows',
        {
          outputField: new Field('rows', new Int32(), false),
          evaluate: group => group.numRows
        }
      ]
    ])
  );
  expect([...custom.getChild('rows')!]).toEqual([1, 1, 2]);
});

test('LEFT OUTER JOIN retains unmatched and null keys and preserves matched duplicates', () => {
  const roads = new Table({id: vectorFromArray([2, null, 1, 3], new Int32())});
  const incidents = new Table({
    id: vectorFromArray([2, null, 2], new Int32()),
    count: vectorFromArray([10, 20, 30], new Int32()),
    label: vectorFromArray(['a', 'b', 'c'], new Dictionary(new Utf8(), new Int32(), 11))
  });
  const sql =
    'SELECT r.id, i.count AS incidents, i.label AS label FROM roads r LEFT OUTER JOIN incidents i ON r.id = i.id';
  for (const [right, expected] of [
    [incidents, [10, 30, null, null, null]],
    [incidents.slice(0, 0), [null, null, null, null]]
  ] as const) {
    const result = queryArrowSQL(
      sql,
      new Map<string, Table>([
        ['roads', roads],
        ['incidents', right]
      ])
    );
    expect([...result.getChild('incidents')!]).toEqual(expected);
    expect(result.schema.fields[1]?.nullable).toBe(true);
    expect(String(result.schema.fields[1]?.type)).toBe('Int32');
    const labels = right.numRows ? ['a', 'c', null, null, null] : [null, null, null, null];
    expect([...result.getChild('label')!]).toEqual(labels);
    expect(result.getChild('label')!.type).toStrictEqual(incidents.getChild('label')!.type);
    expect([...tableFromIPC(tableToIPC(result)).getChild('label')!]).toEqual(labels);
  }
});

test('structured LEFT JOIN gathers alternating matches in one batch', () => {
  const left = tableFromArrays({id: Int32Array.from({length: 4000}, (_, index) => index + 1)});
  const keys = Int32Array.from({length: 2000}, (_, index) => (index + 1) * 2);
  const right = tableFromArrays({key: keys});
  const schema = new Schema([new Field('key', new Int32(), false)]);
  const requiredRight = new Table(
    schema,
    right.batches.map(batch => new RecordBatch(schema, batch.data))
  );
  expect(requiredRight.schema.fields[0]?.nullable).toBe(false);

  const result = queryArrowTable(left, {
    join: {type: 'left', table: requiredRight, left: 'id', right: 'key', rightPrefix: 'right.'}
  });
  expect(result.batches).toHaveLength(1);
  expect(result.schema.fields[1]?.nullable).toBe(true);
  expect(result.getChild('right.key')!.nullCount).toBe(2000);
  expect([...result.getChild('right.key')!.slice(0, 4)]).toEqual([null, 2, null, 4]);
});

test('structured LEFT JOIN rejects incompatible key types even on an empty lookup', () => {
  const left = tableFromArrays({id: Int32Array.of(1)});
  const right = new Table({id: vectorFromArray([], new Utf8())});
  expect(() =>
    queryArrowTable(left, {
      join: {type: 'left', table: right, left: 'id', right: 'id', rightPrefix: 'right.'}
    })
  ).toThrow(/Incompatible Arrow JOIN key types/);
});

test('equijoin gathers alternating real lookup chunks without fragmenting output', () => {
  const count = 4000;
  const left = tableFromArrays({id: Int32Array.from({length: count}, (_, id) => id)});
  const half = (parity: number) =>
    tableFromArrays({
      key: Int32Array.from({length: count / 2}, (_, i) => i * 2 + parity),
      value: Float32Array.from({length: count / 2}, (_, i) => (i * 2 + parity) * 3 + 1)
    });
  const right = half(0).concat(half(1));
  expect(right.batches).toHaveLength(2);
  const result = queryArrowTable(left, {
    join: {table: right, left: 'id', right: 'key', rightPrefix: 'right.'}
  });
  expect(result.numRows).toBe(count);
  expect([...result.getChild('id')!]).toEqual(Array.from({length: count}, (_, i) => i));
  expect([...result.getChild('right.key')!]).toEqual(Array.from({length: count}, (_, i) => i));
  expect([...result.getChild('right.value')!]).toEqual(
    Array.from({length: count}, (_, i) => i * 3 + 1)
  );
  expect(String(result.getChild('right.key')!.type)).toBe('Int32');
  expect(String(result.getChild('right.value')!.type)).toBe('Float32');
  expect(result.batches.length).toBeLessThanOrEqual(2);
});

test('LEFT JOIN gathers two real chunks together with missing lookup rows', () => {
  const left = tableFromArrays({id: Int32Array.of(-1, 0, 1, 2, 3, 4)});
  const right = tableFromArrays({key: Int32Array.of(0, 2), value: Int16Array.of(10, 12)}).concat(
    tableFromArrays({key: Int32Array.of(1, 3), value: Int16Array.of(11, 13)})
  );
  const result = queryArrowTable(left, {
    join: {type: 'left', table: right, left: 'id', right: 'key', rightPrefix: 'right.'}
  });
  expect(result.batches).toHaveLength(1);
  expect([...result.getChild('id')!]).toEqual([-1, 0, 1, 2, 3, 4]);
  expect([...result.getChild('right.value')!]).toEqual([null, 10, 11, 12, 13, null]);
  expect(String(result.getChild('right.value')!.type)).toBe('Int16');
  expect(result.schema.fields[2]!.nullable).toBe(true);
});

test('portable predicates read Float16 storage, including sliced chunks', () => {
  const values = makeVector(
    makeData({type: new Float16(), length: 4, data: Uint16Array.of(0, 0x3c00, 0xc000, 0x4000)})
  );
  const table = new Table({value: values, id: vectorFromArray([0, 1, 2, 3], new Int32())}).slice(1);
  const result = queryArrowTable(table, {
    where: {op: '>', args: [{property: 'value'}, 1]},
    select: ['id']
  });
  expect([...result.getChild('id')!]).toEqual([3]);
});

test('portable predicates compare strings and bytes with wide offsets', () => {
  const table = new Table({
    text: vectorFromArray(['skip', 'ést', null, 'test'], new LargeUtf8()),
    bytes: vectorFromArray(
      [Uint8Array.of(0), Uint8Array.of(2), null, Uint8Array.of(3)],
      new LargeBinary()
    ),
    id: vectorFromArray([0, 1, 2, 3], new Int32())
  }).slice(1);
  const result = queryArrowTable(table, {
    where: {
      op: 'and',
      args: [
        {op: '=', args: [{property: 'text'}, 'ést']},
        {op: 'in', args: [{property: 'bytes'}, [Uint8Array.of(2)]]}
      ]
    },
    select: ['id']
  });
  expect([...result.getChild('id')!]).toEqual([1]);
});

test('portable predicates compare fixed-size binary values with literals of any width', () => {
  const table = new Table({
    bytes: vectorFromArray(
      [Uint8Array.of(1, 2), Uint8Array.of(2, 1), null],
      new FixedSizeBinary(2)
    ),
    id: vectorFromArray([0, 1, 2], new Int32())
  });
  const result = queryArrowTable(table, {
    where: {
      op: 'and',
      args: [
        {op: '<>', args: [{property: 'bytes'}, Uint8Array.of(1)]},
        {op: 'in', args: [{property: 'bytes'}, [Uint8Array.of(1), Uint8Array.of(2, 1)]]}
      ]
    },
    select: ['id']
  });
  expect([...result.getChild('id')!]).toEqual([1]);
});
