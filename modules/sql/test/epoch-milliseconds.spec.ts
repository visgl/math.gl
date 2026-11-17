// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {compileArrowExpression} from '../src/arrow';
import {parseSQLExpression} from '../src/sql';

/** Evaluates the SQL time conversion against a small Arrow fixture. */
function evaluate(sql: string, text: (string | null)[]) {
  const data = tableFromArrays({text});
  return compileArrowExpression(parseSQLExpression(sql), {inputSchema: data.schema}).evaluateTable(
    data
  );
}

test('epoch milliseconds preserves timezone offsets, nulls and negative fractional values', () => {
  expect(
    Array.from(
      evaluate('EPOCH_MS(CAST(text AS TIMESTAMP WITH TIME ZONE))', [
        '1969-12-31T23:59:59.999999Z',
        '1970-01-01T00:00:00.123456Z',
        '1970-01-01T01:00:00+01:00',
        null
      ])
    )
  ).toEqual([-0.001, 123.456, 0, null]);
  expect(
    Array.from(evaluate('epoch_ms(CAST(text AS DATE))', ['1969-12-31', '2000-02-29']))
  ).toEqual([-86400000, Date.UTC(2000, 1, 29)]);
  expect(
    Array.from(evaluate('EPOCH_MS(CAST(text AS TIMESTAMP))', ['1970-01-01 00:00:01']))
  ).toEqual([1000]);
});

test('epoch milliseconds respects CASE and TRY, and rejects untyped input', () => {
  expect(
    Array.from(
      evaluate("CASE WHEN text = 'bad' THEN 0 ELSE EPOCH_MS(CAST(text AS DATE)) END", [
        'bad',
        '1970-01-02'
      ])
    )
  ).toEqual([0, 86400000]);
  expect(Array.from(evaluate('TRY(EPOCH_MS(CAST(text AS DATE)))', ['bad', null]))).toEqual([
    null,
    null
  ]);
  expect(() => evaluate('EPOCH_MS(text)', ['1970-01-01'])).toThrow('requires DATE');
  expect(() => evaluate('EPOCH_MS()', ['x'])).toThrow('one argument');
});
