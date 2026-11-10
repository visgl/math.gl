// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parseSQLQuery, parseSQLSelect} from '@math.gl/core/sql';
import type {TableQuery} from '@math.gl/core/sql';
import {parseSQLPredicate} from '@math.gl/core/sql';

test('SELECT parser handles ordered aliases, qualified FROM, exact names, wildcard and limits', () => {
  expect(
    parseSQLQuery('select name, population AS people FROM warehouse.cities LIMIT 20;')
  ).toEqual({
    select: ['name', {column: 'population', as: 'people'}],
    from: {source: 'warehouse', table: 'cities'},
    limit: 20
  });
  expect(parseSQLSelect('SELECT * FROM cities LIMIT 0')).toEqual({
    from: 'cities',
    limit: 0
  });
  expect(parseSQLSelect('SELECT "a.b" AS "display name" FROM "warehouse.v2"."cities.v3"')).toEqual({
    select: [{column: 'a.b', as: 'display name'}],
    from: {source: 'warehouse.v2', table: 'cities.v3'}
  });
  expect(parseSQLSelect('SELECT "a""b" FROM "FROM"')).toEqual({
    select: ['a"b'],
    from: 'FROM'
  });
  expect(parseSQLSelect('SELECT value')).toEqual({select: ['value']});
});

test('WHERE extraction respects strings, quoted keywords, parentheses, escaping and LIMIT', () => {
  expect(
    parseSQLQuery(`SELECT name WHERE (name = 'LIMIT 2; O''Reilly' OR "not" IS NULL) LIMIT 3;`)
  ).toEqual({
    select: ['name'],
    where: {
      op: 'or',
      args: [
        {op: '=', args: [{property: 'name'}, "LIMIT 2; O'Reilly"]},
        {op: 'isNull', args: [{property: 'not', quoted: true}]}
      ]
    },
    limit: 3
  });
  expect(
    (parseSQLQuery('SELECT value WHERE value > 9007199254740993') as TableQuery).where
  ).toEqual({
    op: '>',
    args: [{property: 'value'}, 9007199254740993n]
  });
});

test('structural parser rejects WHERE unless explicitly supplied, preserving a small entry point', () => {
  expect(() => parseSQLSelect('SELECT value WHERE value > 1')).toThrow('parseWhere');
  expect(
    parseSQLSelect('SELECT value WHERE value > 1', {
      parseWhere: parseSQLPredicate
    })
  ).toEqual(parseSQLQuery('SELECT value WHERE value > 1'));
  expect(() =>
    parseSQLSelect('SELECT value WHERE value > 1', {
      parseWhere: () => undefined as never
    })
  ).toThrow('must return a predicate');
});

test.each([
  '',
  'DELETE FROM cities',
  'SELECT',
  'SELECT DISTINCT name',
  'SELECT NULL',
  'SELECT 1',
  'SELECT count(value)',
  'SELECT a + b',
  'SELECT a b',
  'SELECT a FROM cities c',
  'SELECT a FROM a.b.c',
  'SELECT *, a',
  'SELECT a, *',
  'SELECT a ORDER BY a',
  'SELECT a GROUP BY a',
  'SELECT a OFFSET 1',
  'SELECT a FROM a JOIN b',
  'SELECT a UNION SELECT a',
  'SELECT a LIMIT -1',
  'SELECT a LIMIT 1.2',
  'SELECT a LIMIT 9007199254740992',
  'SELECT a LIMIT 1e2',
  'SELECT a LIMIT 1; SELECT b',
  'SELECT a WHERE',
  'SELECT a WHERE (a = 1',
  'SELECT a WHERE a = 1)',
  'SELECT a WHERE a = 1 -- comment',
  'SELECT a WHERE a = 1 /* comment */',
  'SELECT "unterminated',
  `SELECT a WHERE a = 'unterminated`,
  'SELECT a WHERE a = "TRUE"',
  'SELECT a WHERE a IS "NULL"',
  'SELECT a WHERE table.a = 1'
])('unsupported or malformed SELECT is rejected: %s', sql => {
  expect(() => parseSQLQuery(sql)).toThrow();
});

test('parser bounds input, projection tokens and nesting before execution', () => {
  expect(() => parseSQLSelect('SELECT ' + 'a'.repeat(65536))).toThrow('65536');
  expect(() =>
    parseSQLSelect('SELECT ' + Array.from({length: 3000}, (_, index) => `column${index}`).join(','))
  ).toThrow('token limit');
  expect(() =>
    parseSQLQuery('SELECT a WHERE ' + '('.repeat(65) + 'a = 1' + ')'.repeat(65))
  ).toThrow('nesting limit');
});

test.each([
  ['SHOW SOURCES;', {command: 'showSources'}],
  ['show tables', {command: 'showTables'}],
  ['SHOW TABLES FROM warehouse;', {command: 'showTables', from: 'warehouse'}],
  ['DESCRIBE cities;', {command: 'describe', from: 'cities'}],
  [
    'DESCRIBE warehouse.cities;',
    {command: 'describe', from: {source: 'warehouse', table: 'cities'}}
  ],
  [
    'DESCRIBE "warehouse.v2"."city""names";',
    {
      command: 'describe',
      from: {source: 'warehouse.v2', table: 'city"names'}
    }
  ]
])('parses catalog command %s', (sql, expected) => {
  expect(parseSQLQuery(sql)).toEqual(expected);
  expect(() => parseSQLSelect(sql)).toThrow();
});

test.each([
  'SHOW DATABASES',
  'SHOW SOURCES FROM warehouse',
  'SHOW TABLES FROM',
  'DESCRIBE',
  'DESCRIBE a.b.c',
  'DESCRIBE a WHERE id = 1',
  'SHOW SOURCES; SELECT *',
  'SHOW TABLES -- comment'
])('rejects unsupported catalog syntax %s', sql => {
  expect(() => parseSQLQuery(sql)).toThrow();
});
