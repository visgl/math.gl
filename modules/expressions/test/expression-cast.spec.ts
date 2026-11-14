// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  Binary,
  Bool,
  DataType,
  FixedSizeBinary,
  Float64,
  Int32,
  Table,
  Utf8,
  vectorFromArray
} from 'apache-arrow';
import {parseSQLExpression, parseSQLPredicate, parseSQLQuery} from '@math.gl/expressions/sql';
import {compileArrowExpression, compileArrowPredicate} from '../src/arrow';

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
  const computed = parseSQLQuery('SELECT x WHERE CAST(x AS INTEGER) + 0 >= 0');
  for (const result of [query, computed]) {
    if (!('where' in result) || !result.where) throw new Error('Expected WHERE');
    const predicate =
      'expression' in result.where
        ? compileArrowExpression(result.where.expression, {inputSchema: table.schema})
        : compileArrowPredicate(result.where, {inputSchema: table.schema});
    expect([...predicate.evaluateTable(table)]).toEqual([true, null, false, true]);
  }
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

test('integer width casts retain bigint precision and reject out-of-range values', () => {
  const table = new Table({
    value: vectorFromArray(
      ['18446744073709551615', '18446744073709551616', '-1', '255', '256', null],
      new Utf8()
    )
  });
  expect(evaluate('CAST(value AS UINT64)', table.slice(0, 1)).get(0)).toBe(18446744073709551615n);
  expect(() => evaluate('CAST(value AS UINT64)', table.slice(1, 2))).toThrow(/overflow/i);
  expect(() => evaluate('CAST(value AS UINT64)', table.slice(2, 3))).toThrow(/overflow/i);
  expect(evaluate('CAST(value AS UINT8)', table.slice(3, 4)).get(0)).toBe(255);
  expect(() => evaluate('CAST(value AS UINT8)', table.slice(4, 5))).toThrow(/overflow/i);
  expect(evaluate('CAST(value AS INT8)', table.slice(2, 3)).get(0)).toBe(-1);
  expect(evaluate('CAST(value AS INT8)', table.slice(5)).get(0)).toBeNull();
});

test('UTF8 and dictionary casts preserve string values, nulls, and empty output types', () => {
  const table = new Table({category: vectorFromArray(['red', null, 'blue', 'red'], new Utf8())});
  const plain = evaluate('CAST(category AS UTF8)', table);
  expect(plain.type).toEqual(new Utf8());
  const dictionary = evaluate('CAST(category AS DICTIONARY(UTF8, INT32))', table);
  expect(DataType.isDictionary(dictionary.type)).toBe(true);
  expect(String(dictionary.type)).toBe('Dictionary<Int32, Utf8>');
  expect([...dictionary]).toEqual([...plain]);
  expect([...dictionary.data[0]!.dictionary!]).toEqual(['red', 'blue']);
  expect(dictionary.data[0]!.values[0]).toBe(dictionary.data[0]!.values[3]);
  expect([
    ...evaluate('CAST(category AS DICTIONARY(UTF8, INT32))', table, new Uint8Array([0, 1, 1, 0]))
  ]).toEqual([null, null, 'blue', null]);
  expect(
    String(evaluate('CAST(category AS DICTIONARY(UTF8, INT32))', table.slice(0, 0)).type)
  ).toBe(String(dictionary.type));
  expect(() => parseSQLExpression('CAST(category AS DICTIONARY(UTF8, INT8))')).toThrow(/INT32/);
});

test('binary CAST aliases choose the Arrow layout and enforce widths in bytes', () => {
  const table = new Table({
    x: vectorFromArray(['skip', 'é', 'a', '', null, 'abc'], new Utf8())
  }).slice(1);
  expect(parseSQLQuery('SELECT CAST(x AS VARBINARY(2)) AS payload')).toMatchObject({
    select: [{as: 'payload', expression: parseSQLExpression('x::VARBINARY(2)')}]
  });
  const expected = [Uint8Array.of(195, 169), Uint8Array.of(97), new Uint8Array(), null];
  for (const target of ['BINARY', 'VARBINARY', 'BLOB', 'VARBINARY(2)']) {
    const result = evaluate(`CAST(x AS ${target})`, table.slice(0, 4));
    expect(result.type).toEqual(new Binary());
    expect([...result]).toEqual(expected);
  }
  for (const target of ['BINARY(2)', 'FIXEDSIZEBINARY(2)', 'VARBINARY(2)']) {
    expect(() => evaluate(`CAST(x AS ${target})`, table)).toThrow('exceeds 2 bytes');
    const result = evaluate(`CAST(x AS ${target})`, table, Uint8Array.of(1, 1, 1, 1, 0));
    if (target !== 'VARBINARY(2)') {
      expect(result.type).toEqual(new FixedSizeBinary(2));
      expect([...result]).toEqual([
        expected[0],
        Uint8Array.of(97, 0),
        Uint8Array.of(0, 0),
        null,
        null
      ]);
    }
  }
  expect(() => evaluate('x::VARBINARY(1)', table.slice(0, 1))).toThrow('exceeds 1 bytes');
  for (const target of [
    'VARBINARY(0)',
    'BINARY(-1)',
    'BINARY(1.5)',
    'BINARY(2147483648)',
    'FIXEDSIZEBINARY',
    'BLOB(2)'
  ]) {
    expect(() => parseSQLExpression(`CAST(x AS ${target})`)).toThrow();
  }
});

test('binary CAST reads binary columns and preserves fixed-width bytes through chained casts', () => {
  const binary = new Table({
    x: vectorFromArray([Uint8Array.of(99), Uint8Array.of(255), null], new Binary())
  }).slice(1);
  const fixed = evaluate('x::FIXEDSIZEBINARY(2)', binary);
  expect([...fixed]).toEqual([Uint8Array.of(255, 0), null]);
  const table = new Table({x: fixed}).slice(1);
  expect([...evaluate('x::BLOB', table)]).toEqual([null]);
  const valid = new Table({
    x: vectorFromArray([Uint8Array.of(0, 0), Uint8Array.of(255, 0)], new FixedSizeBinary(2))
  }).slice(1);
  expect([...evaluate('x::BLOB', valid)]).toEqual([Uint8Array.of(255, 0)]);
  expect([...evaluate("CAST('a' AS BINARY) = CAST('a' AS VARBINARY(1))", valid)]).toEqual([true]);
});
