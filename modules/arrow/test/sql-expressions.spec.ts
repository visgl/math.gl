// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {Float32, Float64, Int32, Table, vectorFromArray} from 'apache-arrow';
import {parseSQLExpression, parseSQLQuery} from '@math.gl/core/sql';
import {compileArrowExpression} from '../src/expressions';
import {SIN, POWER, MOD} from '../src/math';
const table = new Table({
  x: vectorFromArray([1, null, 3], new Float64()),
  angle: vectorFromArray([0, 1, 2], new Float32()),
  i: vectorFromArray([1, 2, 3], new Int32())
});
const options = {inputSchema: table.schema, functions: [SIN, POWER, MOD]};
function evaluate(sql: string) {
  return compileArrowExpression(parseSQLExpression(sql), options).evaluateTable(table);
}
test('SQL arithmetic, comparison and Boolean precedence use Arrow null semantics', () => {
  expect([...evaluate('x + 2 * 3')]).toEqual([7, null, 9]);
  expect([...evaluate('NOT x = 1 AND i > 1 OR x IS NULL')]).toEqual([false, true, true]);
  expect([...evaluate('x <> 1')]).toEqual([false, null, true]);
  expect([...evaluate('x IS NOT NULL')]).toEqual([true, false, true]);
  expect([...evaluate('-(x + 1)')]).toEqual([-2, null, -4]);
});
test('SQL CASE and Boolean short circuit prevent inactive function calls', () => {
  expect([
    ...evaluate('CASE WHEN x IS NULL THEN 9 WHEN x = 1 THEN POWER(x, 2) ELSE 0 END')
  ]).toEqual([1, 9, 0]);
  expect([...evaluate('CASE WHEN TRUE THEN x ELSE MOD(x, 0) END')]).toEqual([1, null, 3]);
  expect([...evaluate('FALSE AND MOD(x, 0) > 0')]).toEqual([false, false, false]);
  expect([...evaluate('CASE WHEN x > 1 THEN 1 END')]).toEqual([null, null, 1]);
});
test('SQL calls fold unquoted function names while preserving column and quoted function names', () => {
  expect([...evaluate('sIn(angle)')]).toEqual([
    0,
    Math.fround(Math.sin(1)),
    Math.fround(Math.sin(2))
  ]);
  expect(() => evaluate('SIN(ANGLE)')).toThrow('Unknown');
  expect(() => evaluate('"sin"(angle)')).toThrow('Unknown');
  expect([...evaluate('"SIN"(angle)')]).toEqual([...evaluate('sin(angle)')]);
  const duplicate = {...SIN, name: 'sin'};
  expect(() =>
    compileArrowExpression(parseSQLExpression('SIN(angle)'), {
      ...options,
      functions: [SIN, duplicate]
    })
  ).toThrow('Ambiguous SQL');
});
test('computed fixed arrays infer width and precision, preserve null tuple padding, and cast explicitly', () => {
  const result = evaluate('ARRAY[x + 1, SIN(angle), 0]');
  expect(Array.from(result, value => (value === null ? null : Array.from(value)))).toEqual([
    [2, 0, 0],
    null,
    [4, Math.fround(Math.sin(2)), 0]
  ]);
  expect(result.type.children[0]!.type).toEqual(new Float64());
  expect(Array.from(result.data[0]!.children[0]!.values).slice(3, 6)).toEqual([0, 0, 0]);
  const integers = evaluate('ARRAY[i, i]');
  expect(integers.type.children[0]!.type).toEqual(new Float64());
  expect(evaluate('ARRAY[x, 1]::REAL[2]').type.children[0]!.type).toEqual(new Float32());
  expect(() => evaluate('ARRAY[1e39]::REAL[1]')).toThrow('overflow');
  expect(() => evaluate('ARRAY[x, TRUE]')).toThrow('numeric');
});
test('query parsing preserves portable predicates and exposes computed SELECT and WHERE expressions', () => {
  expect(parseSQLQuery('SELECT x WHERE x > 1')).toEqual({
    select: ['x'],
    where: {op: '>', args: [{property: 'x'}, 1]}
  });
  const query = parseSQLQuery('SELECT x + 1 AS next WHERE SIN(angle) > 0') as any;
  expect(query.select[0]).toEqual({expression: parseSQLExpression('x + 1'), as: 'next'});
  expect(query.where).toEqual({expression: parseSQLExpression('SIN(angle) > 0')});
  expect([...compileArrowExpression(query.where.expression, options).evaluateTable(table)]).toEqual(
    [false, true, true]
  );
});

test('SQL builtin function names fold case while quoted calls remain exact', () => {
  for (const expression of ['TOFLOAT64(i)', 'tofloat64(i)', 'ToFlOaT64(i)'])
    expect([...evaluate(expression)]).toEqual([1, 2, 3]);
  expect([...evaluate('ISNULL(x)')]).toEqual([false, true, false]);
  expect(() => evaluate('"TOFLOAT64"(i)')).toThrow('Unknown');
});
