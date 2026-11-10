// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Bool, Float64, Int32, Table, Utf8, vectorFromArray} from 'apache-arrow';
import {parseSQLExpression, parseSQLPredicate, parseSQLQuery} from '@math.gl/core/sql';
import {compileArrowExpression, compileArrowPredicate} from '../src/expressions';

function evaluate(sql: string, table: Table, activeRows?: Uint8Array) {
  return compileArrowExpression(parseSQLExpression(sql), {inputSchema: table.schema}).evaluateTable(
    table,
    {activeRows}
  );
}

test('CAST evaluates parsed SELECT projections and WHERE predicates across sliced chunks', () => {
  const table = new Table({x: vectorFromArray(['skip', '12', null, '-4'], new Utf8())})
    .slice(1)
    .concat(new Table({x: vectorFromArray(['9'], new Utf8())}));
  const query = parseSQLQuery('SELECT CAST(x AS INTEGER) AS n WHERE CAST(x AS INTEGER) >= 0');
  if (!('select' in query)) throw new Error('Expected selection');
  const selection = query.select![0]!;
  if (typeof selection !== 'object' || !('expression' in selection))
    throw new Error('Expected expression');
  const compiled = compileArrowExpression(selection.expression, {inputSchema: table.schema});
  expect([...compiled.evaluateTable(table)]).toEqual([12, null, -4, 9]);
  expect(compiled.outputField.type).toEqual(new Int32());
  expect([
    ...compileArrowPredicate(query.where!, {inputSchema: table.schema}).evaluateTable(table)
  ]).toEqual([true, null, false, true]);
});

test('explicit numeric casts truncate toward zero, check bounds, round Float32 and preserve bigint', () => {
  const table = new Table({x: vectorFromArray([1.9, -1.9, null], new Float64())});
  expect([...evaluate('CAST(x AS INTEGER)', table)]).toEqual([1, -1, null]);
  expect([...evaluate('CAST(x AS BIGINT)', table)]).toEqual([1n, -1n, null]);
  expect([...evaluate('CAST(x AS REAL)', table)]).toEqual([
    Math.fround(1.9),
    Math.fround(-1.9),
    null
  ]);
  expect([...evaluate('CAST(CAST(x AS INTEGER) AS VARCHAR)', table)]).toEqual(['1', '-1', null]);
  const ints = new Table({
    x: vectorFromArray(['9223372036854775807', '-9223372036854775808'], new Utf8())
  });
  expect([...evaluate('CAST(x AS BIGINT)', ints)]).toEqual([
    9223372036854775807n,
    -9223372036854775808n
  ]);
  expect([...evaluate('CAST(NULL AS INTEGER)', table)]).toEqual([null, null, null]);
  expect([...evaluate("CAST('true' AS BOOLEAN)", table)]).toEqual([true, true, true]);
});

test('Boolean and text casts use explicit semantics and dictionaries resolve before conversion', () => {
  const table = new Table({x: vectorFromArray([' TRUE ', 'false', null])});
  expect([...evaluate('CAST(x AS BOOLEAN)', table)]).toEqual([true, false, null]);
  const booleans = new Table({x: vectorFromArray([true, false, null], new Bool())});
  expect([...evaluate('CAST(x AS VARCHAR)', booleans)]).toEqual(['TRUE', 'FALSE', null]);
  expect(() => evaluate('CAST(x AS INTEGER)', booleans)).toThrow('Boolean');
  const numeric = new Table({x: vectorFromArray([1], new Int32())});
  expect(() => evaluate('CAST(x AS BOOLEAN)', numeric)).toThrow('Boolean');
});

test.each([
  ['INTEGER', '2147483648'],
  ['SMALLINT', '32768'],
  ['BIGINT', '9223372036854775808'],
  ['INTEGER', '1.5'],
  ['INTEGER', 'bad'],
  ['BOOLEAN', 'perhaps'],
  ['REAL', '1e100'],
  ['DOUBLE PRECISION', '1e999']
])('CAST rejects invalid active data for %s', (target, text) => {
  const table = new Table({x: vectorFromArray([text], new Utf8())});
  expect(() => evaluate(`CAST(x AS ${target})`, table)).toThrow();
  expect([...evaluate(`CAST(x AS ${target})`, table, new Uint8Array([0]))]).toEqual([null]);
});

test('casts honor conditional short circuit, nullability and empty tables', () => {
  const table = new Table({
    x: vectorFromArray(['bad', '12'], new Utf8()),
    enabled: vectorFromArray([false, true], new Bool())
  });
  const ast = {
    type: 'ConditionalExpression',
    test: {type: 'Identifier', name: 'enabled'},
    consequent: parseSQLExpression('CAST(x AS INTEGER)'),
    alternate: {type: 'Literal', value: 0}
  } as any;
  const compiled = compileArrowExpression(ast, {inputSchema: table.schema});
  expect([...compiled.evaluateTable(table)]).toEqual([0, 12]);
  const empty = compileArrowExpression(parseSQLExpression('CAST(x AS INTEGER)'), {
    inputSchema: table.schema
  }).evaluateTable(new Table(table.schema, []));
  expect(empty.length).toBe(0);
  expect(empty.type).toEqual(new Int32());
  const raw = compileArrowExpression('cast(x, "int32")', {inputSchema: table.schema});
  expect(() => raw.evaluateTable(table)).toThrow();
  expect(() => compileArrowExpression('cast(x, enabled)', {inputSchema: table.schema})).toThrow(
    'literal'
  );
  expect(() => compileArrowExpression('cast(x, "date")', {inputSchema: table.schema})).toThrow(
    'target'
  );
});

test('BIGINT cast predicates contextually bind safe integer comparison and membership values', () => {
  const table = new Table({x: vectorFromArray(['5', '6', null], new Utf8())});
  for (const sql of ['CAST(x AS BIGINT) = 5', 'x::BIGINT IN (5, 7)'])
    expect([
      ...compileArrowPredicate(parseSQLPredicate(sql), {inputSchema: table.schema}).evaluateTable(
        table
      )
    ]).toEqual([true, false, null]);
});
