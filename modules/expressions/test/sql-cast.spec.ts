// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  parseSQLExpression,
  parseSQLQuery,
  parseSQLPredicate,
  bindSQLPredicate,
  validateSQLPredicate,
  SQL_PREDICATE_JSON_SCHEMA
} from '@math.gl/expressions/sql';
import {copyColumnarPredicate, getColumnarPredicateColumns} from '@math.gl/expressions';

const cast = (argument: unknown, target: string) => ({
  type: 'CallExpression',
  callee: {type: 'Identifier', name: 'cast'},
  arguments: [argument, {type: 'Literal', value: target, raw: JSON.stringify(target)}]
});
test.each([
  ['INT8', 'int8'],
  ['INT16', 'int16'],
  ['INT32', 'int32'],
  ['INT64', 'int64'],
  ['UINT8', 'uint8'],
  ['UINT16', 'uint16'],
  ['UINT32', 'uint32'],
  ['UINT64', 'uint64'],
  ['FLOAT16', 'float16'],
  ['FLOAT32', 'float32'],
  ['FLOAT64', 'float64'],
  ['SMALLINT', 'int16'],
  ['INT', 'int32'],
  ['INTEGER', 'int32'],
  ['BIGINT', 'int64'],
  ['REAL', 'float32'],
  ['DOUBLE PRECISION', 'float64'],
  ['BOOLEAN', 'bool'],
  ['VARCHAR', 'utf8'],
  ['CHARACTER VARYING', 'utf8']
])('SQL CAST maps %s to %s without Arrow dependencies', (sql, target) => {
  const expression = cast({type: 'Identifier', name: 'population'}, target);
  expect(parseSQLExpression(`CAST(population AS ${sql})`)).toEqual(expression);
  expect(
    parseSQLQuery(`SELECT name, CAST(population AS ${sql}) AS value FROM cities LIMIT 2`)
  ).toEqual({select: ['name', {expression, as: 'value'}], from: 'cities', limit: 2});
  expect(
    parseSQLPredicate(`CAST(population AS ${sql}) = :value`, {preserveParameters: true})
  ).toEqual({op: '=', args: [{property: 'population', casts: [target]}, {parameter: 'value'}]});
});

test('nested casts, quoted names, string escapes and typed nulls retain their meaning', () => {
  expect(parseSQLExpression('cast(cast("a b" as real) as double precision)')).toEqual(
    cast(cast({type: 'Identifier', name: 'a b'}, 'float32'), 'float64')
  );
  expect(parseSQLExpression("CAST('it''s' AS VARCHAR)")).toEqual(
    cast({type: 'Literal', value: "it's", raw: JSON.stringify("it's")}, 'utf8')
  );
  expect(parseSQLExpression('CAST(NULL AS INTEGER)')).toEqual(
    cast({type: 'Literal', value: null, raw: 'null'}, 'int32')
  );
  expect(parseSQLExpression('CAST(-2.5 AS REAL)')).toEqual(
    cast({type: 'Literal', value: -2.5, raw: '-2.5'}, 'float32')
  );
  expect(parseSQLQuery('SELECT "CAST" AS "AS"')).toEqual({select: [{column: 'CAST', as: 'AS'}]});
});

test('WHERE casts survive binding, copying, null predicates and column discovery', () => {
  const predicate = parseSQLPredicate(
    'CAST(CAST("value" AS INTEGER) AS BIGINT) IN (:first, :second)',
    {preserveParameters: true}
  );
  const bound = bindSQLPredicate(predicate, {first: 1n, second: 2n});
  expect(bound).toEqual({
    op: 'in',
    args: [{property: 'value', quoted: true, casts: ['int32', 'int64']}, [1n, 2n]]
  });
  expect(getColumnarPredicateColumns(bound)).toEqual(['value']);
  const copied = copyColumnarPredicate(bound);
  expect(copied.args[0]).toEqual({property: ['value'], quoted: true, casts: ['int32', 'int64']});
  expect((copied.args[0] as any).casts).not.toBe((bound.args[0] as any).casts);
  expect(parseSQLPredicate('CAST(value AS INTEGER) IS NULL')).toEqual({
    op: 'isNull',
    args: [{property: 'value', casts: ['int32']}]
  });
  expect(SQL_PREDICATE_JSON_SCHEMA.$defs.property.properties.casts.items.enum).toContain('int32');
});

test.each([
  'CAST(x INTEGER)',
  'CAST(x AS)',
  'CAST(x AS DATE)',
  'CAST(x AS DECIMAL(8,2))',
  'CAST(x AS VARCHAR(2))',
  'CAST(x AS DOUBLE)',
  'CAST(x AS "INTEGER")',
  'CAST(x AS INTEGER',
  'CAST(x AS INTEGER); SELECT x',
  "CAST('unfinished AS VARCHAR)"
])('rejects unsupported or malformed SQL CAST: %s', sql => {
  expect(() => parseSQLExpression(sql)).toThrow();
  expect(() => parseSQLQuery(`SELECT ${sql}`)).toThrow();
});

test('CAST parsing and deserialized predicates enforce bounds and targets', () => {
  const nested = (count: number) => 'CAST('.repeat(count) + 'x' + ' AS INTEGER)'.repeat(count);
  expect(() => parseSQLExpression(nested(64))).not.toThrow();
  expect(() => parseSQLExpression(nested(65))).toThrow('nesting');
  expect(() => parseSQLPredicate(nested(64) + ' = 1')).not.toThrow();
  expect(() => parseSQLPredicate(nested(65) + ' = 1')).toThrow();
  expect(() => parseSQLExpression('x'.repeat(65537))).toThrow('65536');
  for (const casts of [[], Array(1), ['bad'], new Array(65).fill('int32'), 'int32'])
    expect(() => validateSQLPredicate({op: '=', args: [{property: 'x', casts}, 1]})).toThrow(
      'casts'
    );
});

test('postfix casts match CAST syntax in projections and predicates', () => {
  expect(parseSQLPredicate('CAST(x::INTEGER AS BIGINT) = 1')).toEqual(
    parseSQLPredicate('CAST(CAST(x AS INTEGER) AS BIGINT) = 1')
  );
  expect(parseSQLExpression('x::INTEGER::BIGINT')).toEqual(
    parseSQLExpression('CAST(CAST(x AS INTEGER) AS BIGINT)')
  );
  expect(parseSQLQuery('SELECT x::INTEGER AS n')).toEqual(
    parseSQLQuery('SELECT CAST(x AS INTEGER) AS n')
  );
  expect(parseSQLPredicate('x::INTEGER >= :minimum', {preserveParameters: true})).toEqual(
    parseSQLPredicate('CAST(x AS INTEGER) >= :minimum', {preserveParameters: true})
  );
});

test.each(["'12'", '12', '-12.5', 'TRUE', 'NULL', '"a b"'])(
  'postfix SELECT accepts the same scalar operands as CAST: %s',
  value => {
    expect(parseSQLQuery(`SELECT ${value}::INTEGER AS n`)).toEqual(
      parseSQLQuery(`SELECT CAST(${value} AS INTEGER) AS n`)
    );
  }
);
