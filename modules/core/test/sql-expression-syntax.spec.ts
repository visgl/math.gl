// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {parseSQLExpression, parseSQLQuery, parseSQLSelect} from '../src/sql';
test.each([
  'x ** 2',
  'x ^ 2',
  'x % 2',
  'CASE x WHEN 1 THEN 2 END',
  'CASE WHEN TRUE 1 END',
  'CASE WHEN TRUE THEN 1',
  'ARRAY[]',
  'ARRAY[1,]',
  'f(1,)',
  'x IS TRUE',
  'x IN (1)',
  'x.y',
  'x +',
  'f() x',
  '1; SELECT 2',
  'ARRAY[1]::REAL[2]'
])('malformed or deferred syntax fails: %s', value =>
  expect(() => parseSQLExpression(value)).toThrow()
);
test('expression parser enforces nesting, token and input bounds', () => {
  expect(() => parseSQLExpression('('.repeat(65) + 'x' + ')'.repeat(65))).toThrow('nesting');
  expect(() => parseSQLExpression('1+'.repeat(65) + '1')).toThrow('nesting');
  expect(() => parseSQLExpression('ARRAY[' + '1,'.repeat(2100) + '1]')).toThrow('token');
  expect(() => parseSQLExpression('x'.repeat(65537))).toThrow('65536');
});
test('partial SELECT parser supports injected expression WHERE without importing built-in predicates', () => {
  const query = parseSQLSelect('SELECT SIN(x) AS y WHERE x + 1 > 0', {
    parseWhere: value => ({expression: parseSQLExpression(value)})
  });
  expect(query.where).toEqual({expression: parseSQLExpression('x + 1 > 0')});
  expect(parseSQLQuery('SELECT "x y", ARRAY[1, 2] AS p LIMIT 0')).toEqual({
    select: ['x y', {expression: parseSQLExpression('ARRAY[1, 2]'), as: 'p'}],
    limit: 0
  });
});
