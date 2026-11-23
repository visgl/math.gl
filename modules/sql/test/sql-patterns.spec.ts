// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {parseSQLExpression} from '@math.gl/sql/parser';
import {queryArrowSQL} from '@math.gl/sql/query';
import {compileArrowExpression} from '@math.gl/sql/arrow';

/** Evaluates SQL against nullable UTF-8 columns. */
function evaluate(sql: string, values = ['airport', 'AIRPORT', 'é😀', 'a%b', '', null]) {
  const table = tableFromArrays({name: values});
  return Array.from(
    compileArrowExpression(parseSQLExpression(sql), {inputSchema: table.schema}).evaluateTable(
      table
    )
  );
}

test('LIKE matches full UTF-8 values and wildcard code points', () => {
  expect(evaluate("name LIKE 'a%'")).toEqual([true, false, false, true, false, null]);
  expect(evaluate("name ILIKE 'AIR%'")).toEqual([true, true, false, false, false, null]);
  expect(evaluate("name LIKE '__'")).toEqual([false, false, true, false, false, null]);
  expect(evaluate("name NOT LIKE '%'")).toEqual([false, false, false, false, false, null]);
  expect(evaluate("name LIKE 'a$%b' ESCAPE '$'")).toEqual([false, false, false, true, false, null]);
  expect(evaluate("name LIKE ''")).toEqual([false, false, false, false, true, null]);
  expect(evaluate("name ILIKE 'É_'")).toEqual([false, false, true, false, false, null]);
});

test('LIKE handles dynamic patterns and wildcard retries', () => {
  expect(evaluate('name LIKE name')).toEqual([true, true, true, true, true, null]);
  expect(evaluate("name LIKE '%a_b%'", ['aaab', 'acb', 'a😀b', 'ab', 'xaabz'])).toEqual([
    true,
    true,
    true,
    false,
    true
  ]);
  expect(() => evaluate("name LIKE 'a$' ESCAPE '$'")).toThrow();
  expect(() => evaluate("name LIKE 'a' ESCAPE 'xx'")).toThrow();
});

test('SQL concatenation has explicit null semantics', () => {
  expect(evaluate("name || '!'", ['a', '', null])).toEqual(['a!', '!', null]);
  expect(evaluate("CONCAT(name, '!')", ['a', '', null])).toEqual(['a!', '!', '!']);
  expect(evaluate("name || 'x' LIKE 'ax'", ['a', '', null])).toEqual([true, false, null]);
  expect(evaluate("CONCAT(NULL, 'é', name)", ['😀', '', null])).toEqual(['é😀', 'é', 'é']);
});

test('case functions preserve nulls and capitalize only the first code point', () => {
  expect(evaluate('UPPER(name)', ['école', 'ß', '', null])).toEqual(['ÉCOLE', 'SS', '', null]);
  expect(evaluate('LOWER(name)', ['ÉCOLE', 'AIRPORT', '', null])).toEqual([
    'école',
    'airport',
    '',
    null
  ]);
  expect(evaluate('CAPITALIZE(name)', ['éCOLE', 'hello WORLD', '😀hello', '', null])).toEqual([
    'ÉCOLE',
    'Hello WORLD',
    '😀hello',
    '',
    null
  ]);
});

test('pattern predicates run through SELECT and preserve sliced dictionary columns', () => {
  const table = tableFromArrays({name: ['skip', 'Airport', 'École', null]}).slice(1);
  const result = queryArrowSQL(
    "SELECT UPPER(name) AS label FROM data WHERE name ILIKE 'air%'",
    new Map([['data', table]])
  );
  expect(Array.from(result.getChild('label')!)).toEqual(['AIRPORT']);
  expect(evaluate('name LIKE NULL')).toEqual([null, null, null, null, null, null]);
  expect(evaluate("name ILIKE 'k'", ['K', 'K', 'k'])).toEqual([true, true, true]);
});
