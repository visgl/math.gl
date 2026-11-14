// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  Binary,
  Bool,
  DataType,
  DateDay,
  FixedSizeBinary,
  Float64,
  Int32,
  Table,
  TimestampMicrosecond,
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
  expect(() => compileArrowExpression('cast(x, "interval")', {inputSchema: table.schema})).toThrow(
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

test('DATE casts preserve calendar days and nulls', () => {
  const table = new Table({
    x: vectorFromArray(['skip', '1969-12-31', '1970-01-01', '2000-02-29', null], new Utf8())
  }).slice(1);
  const dates = evaluate('CAST(x AS DATE)', table);
  expect(dates.type).toEqual(new DateDay());
  expect([...dates.data[0]!.values.slice(0, 4)]).toEqual([-1, 0, 11016, 0]);
  expect(dates.isValid(3)).toBe(false);
  expect([...evaluate('x::DATE', new Table({x: dates}).slice(1))]).toEqual([...dates].slice(1));
  expect(() => evaluate("CAST('1900-02-29' AS DATE)", table)).toThrow(/temporal CAST/);
  expect(() => evaluate("CAST('2024-13-01' AS DATE)", table)).toThrow(/temporal CAST/);
});

test('timestamp casts use exact microseconds and explicit time zone semantics', () => {
  const table = new Table({
    x: vectorFromArray(
      ['1969-12-31 23:59:59.999999', '1970-01-01T00:00:00.123456', null],
      new Utf8()
    )
  });
  for (const target of ['TIMESTAMP', 'TIMESTAMP WITHOUT TIME ZONE']) {
    const values = evaluate(`x::${target}`, table);
    expect(values.type).toEqual(new TimestampMicrosecond());
    expect([...values.data[0]!.values.slice(0, 3)]).toEqual([-1n, 123456n, 0n]);
    expect(values.isValid(2)).toBe(false);
  }
  const offsets = new Table({
    x: vectorFromArray(
      ['1970-01-01T00:30:00.000001+01:00', '1969-12-31T23:30:00.000001Z'],
      new Utf8()
    )
  });
  const zoned = evaluate('CAST(x AS TIMESTAMP WITH TIME ZONE)', offsets);
  expect(zoned.type).toEqual(new TimestampMicrosecond('UTC'));
  expect([...zoned.data[0]!.values.slice(0, 2)]).toEqual([-1799999999n, -1799999999n]);
  const query = parseSQLQuery('SELECT CAST(x AS TIMESTAMP WITH TIME ZONE) AS instant');
  expect(query).toMatchObject({
    select: [{as: 'instant', expression: parseSQLExpression('x::TIMESTAMP WITH TIME ZONE')}]
  });
  const filtered = parseSQLQuery(
    "SELECT x WHERE CAST(x AS TIMESTAMP) > CAST('1970-01-01T00:00:00' AS TIMESTAMP)"
  );
  if (!('where' in filtered) || !filtered.where || !('expression' in filtered.where))
    throw new Error('Expected temporal predicate expression');
  expect([
    ...compileArrowExpression(filtered.where.expression, {inputSchema: table.schema}).evaluateTable(
      table
    )
  ]).toEqual([false, true, null]);
  for (const sql of [
    "CAST('1970-01-01T00:00:00Z' AS TIMESTAMP)",
    "CAST('1970-01-01T00:00:00' AS TIMESTAMP WITH TIME ZONE)",
    "CAST('1970-01-01T00:00:00+00:60' AS TIMESTAMP WITH TIME ZONE)",
    "CAST('1970-01-01T00:00:00.0000001' AS TIMESTAMP)",
    "CAST('1970-01-01T24:00:00' AS TIMESTAMP)"
  ])
    expect(() => evaluate(sql, table)).toThrow(/temporal CAST/);
});

test('GEOMETRY casts label opaque WKB bytes and retain field metadata', () => {
  const x = vectorFromArray([Uint8Array.of(1, 2, 3), null], new Binary());
  const table = new Table({x});
  const source = table.schema.fields[0]!;
  const compiled = compileArrowExpression(parseSQLExpression('CAST(x AS GEOMETRY)'), {
    inputSchema: table.schema
  });
  expect(source.metadata.has('ARROW:extension:name')).toBe(false);
  expect(compiled.outputField.metadata.get('ARROW:extension:name')).toBe('geoarrow.wkb');
  expect([...compiled.evaluateTable(table)]).toEqual([...x]);
  source.metadata.set('ARROW:extension:name', 'geoarrow.wkb');
  source.metadata.set('ARROW:extension:metadata', '{"crs":"EPSG:4326"}');
  const existing = compileArrowExpression(parseSQLExpression('x::GEOMETRY'), {
    inputSchema: table.schema
  });
  expect(existing.outputField.metadata).toEqual(source.metadata);
  expect(() => evaluate("CAST('POINT (0 0)' AS GEOMETRY)", table)).toThrow(/Binary WKB/);
});
