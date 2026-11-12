// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {Float32, Float64, Int32, Table, vectorFromArray} from 'apache-arrow';
import {parseSQLQuery} from '@math.gl/expressions/sql';
import {compileArrowArray} from '../src/arrow';
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
