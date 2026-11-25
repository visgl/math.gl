// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  Field,
  FixedSizeList,
  Float32,
  Float64,
  Int32,
  Int64,
  List,
  Table,
  vectorFromArray
} from 'apache-arrow';
import {parseSQLQuery} from '@math.gl/sql/parser';
import {compileArrowArray} from '../src/arrow';
import {queryArrowSQL} from '../src';
const decode = (vector: ReturnType<ReturnType<typeof compileArrowArray>['evaluateTable']>) =>
  Array.from(vector, row => (row === null ? null : Array.from(row)));
test.each([
  ['', undefined],
  ['::FLOAT32[2]', 'float32'],
  ['::REAL[2]', 'float32'],
  ['::FLOAT64[2]', 'float64'],
  ['::DOUBLE PRECISION[2]', 'float64']
] as const)('ARRAY parses and executes %s', (cast, type) => {
  const query = parseSQLQuery(`SELECT x, ARRAY[x, "y"]${cast} AS position`);
  expect(query).toEqual({
    select: ['x', {array: ['x', 'y'], as: 'position', ...(type ? {type} : {})}]
  });
  const table = new Table({
    x: vectorFromArray([9, 1, null, 3], new Float32()),
    y: vectorFromArray([9, 2, 4, 5], new Float64())
  }).slice(1);
  const compiled = compileArrowArray(['x', 'y'], {inputSchema: table.schema, type});
  const result = compiled.evaluateTable(table);
  expect(decode(result)).toEqual([[1, 2], null, [3, 5]]);
  expect(result.type.children[0]!.type).toEqual(type === 'float32' ? new Float32() : new Float64());
  expect(Array.from(result.data[0]!.children[0]!.values)).toEqual([1, 2, 0, 0, 3, 5]);
  expect(compiled.evaluateTable(new Table(table.schema, [])).length).toBe(0);
  expect(decode(compiled.evaluateTable(table, {activeRows: new Uint8Array([1, 1, 0])}))).toEqual([
    [1, 2],
    null,
    null
  ]);
});
test('ARRAY preserves Float32 inference and ordered batch chunks', () => {
  const table = new Table({x: vectorFromArray([1, 2], new Float32())}).concat(
    new Table({x: vectorFromArray([3], new Float32())})
  );
  const compiled = compileArrowArray(['x', 'x'], {inputSchema: table.schema});
  const result = compiled.evaluateTable(table);
  expect(result.type.children[0]!.type).toEqual(new Float32());
  expect(decode(result)).toEqual([
    [1, 1],
    [2, 2],
    [3, 3]
  ]);
  expect(result.data.map(data => data.length)).toEqual([2, 1]);
});
test.each([
  'SELECT ARRAY[] AS p',
  'SELECT ARRAY[x,] AS p',
  'SELECT ARRAY[x]',
  'SELECT ARRAY[x]::FLOAT32[2] AS p',
  'SELECT ARRAY[x]::INTEGER[1] AS p'
])('invalid ARRAY syntax fails: %s', sql => expect(() => parseSQLQuery(sql)).toThrow());
test('ARRAY binding infers Float64 for integers and rejects invalid width', () => {
  const table = new Table({x: vectorFromArray([1], new Int32())});
  expect(
    compileArrowArray(['x'], {inputSchema: table.schema}).outputField.type.children[0]!.type
  ).toEqual(new Float64());
  expect(() => compileArrowArray([], {inputSchema: table.schema})).toThrow('1 to 4096');
  expect(() => compileArrowArray(['missing'], {inputSchema: table.schema})).toThrow('Unknown');
});

test('list casts preserve component precision, sliced offsets, nulls and chunks', () => {
  const input = new List(new Field('coordinate', new Float32(), true));
  const table = new Table({
    origin: vectorFromArray([[9, 9], [1.25, 2.5], null], input)
  })
    .slice(1)
    .concat(
      new Table({
        origin: vectorFromArray(
          [
            [3, null],
            [4, 5]
          ],
          input
        )
      })
    );
  const catalog = new Map([['source', table]]);
  const output = queryArrowSQL(
    'SELECT origin::ARRAY[2] AS preserved, CAST(origin AS FLOAT64[2]) AS widened FROM source',
    catalog
  );
  const values = [[1.25, 2.5], null, null, [4, 5]];
  for (const [name, component] of [
    ['preserved', new Float32()],
    ['widened', new Float64()]
  ] as const) {
    const vector = output.getChild(name)!;
    expect(vector.type).toEqual(new FixedSizeList(2, new Field('coordinate', component, false)));
    expect(decode(vector)).toEqual(values);
    expect(vector.data.map(chunk => chunk.length)).toEqual([2, 2]);
  }
});

test('array casts reject mismatched widths and retain exact wide integers', () => {
  const value = 9007199254740993n;
  const input = new List(new Field('item', new Int64(), false));
  const source = new Table({items: vectorFromArray([[value], [1n, 2n]], input)});
  const catalogs = new Map([['source', source]]);
  expect(() => queryArrowSQL('SELECT items::ARRAY[1] AS tuple FROM source', catalogs)).toThrow(
    'ARRAY cast length does not match list width'
  );
  const result = queryArrowSQL('SELECT TRY(items::ARRAY[1]) AS tuple FROM source', catalogs);
  expect(decode(result.getChild('tuple')!)).toEqual([[value], null]);
});

test('a null component takes precedence over overflow regardless of position', () => {
  const items = vectorFromArray(
    [
      [1e100, null],
      [null, 1e100]
    ],
    new List(new Field('item', new Float64(), true))
  );
  const source = new Table({items});
  const result = queryArrowSQL(
    'SELECT items::FLOAT32[2] AS tuple FROM source',
    new Map([['source', source]])
  );
  expect(decode(result.getChild('tuple')!)).toEqual([null, null]);
});
