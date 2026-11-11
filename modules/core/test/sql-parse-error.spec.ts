// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  parseSQLExpression,
  parseSQLPredicate,
  parseSQLQuery,
  parseSQLSelect,
  SQLParseError
} from '@math.gl/core/sql';

test.each([
  [parseSQLSelect, 'SELECT x,\r\n  FROM source', 'FROM', 2, 3],
  [parseSQLQuery, 'SHOW TABLES FROM\n  123', '123', 2, 3],
  [parseSQLQuery, 'SELECT x\nWHERE x > @', '@', 2, 11],
  [parseSQLQuery, 'SELECT x\nWHERE x > y + @', '@', 2, 15],
  [parseSQLPredicate, 'x >\n  @', '@', 2, 3],
  [parseSQLExpression, 'x +\n  @', '@', 2, 3],
  [parseSQLExpression, 'x::imaginary', 'imaginary', 1, 4]
] as const)(
  'SQL syntax errors report a cursor in the original input',
  (parse, sql, token, line, column) => {
    expect.assertions(2);
    try {
      parse(sql);
    } catch (error) {
      expect(error).toBeInstanceOf(SQLParseError);
      expect(error).toMatchObject({offset: sql.indexOf(token), token, line, column});
    }
  }
);

test('injected WHERE parsers preserve their own exceptions', () => {
  const failure = new Error('application error');
  expect(() =>
    parseSQLSelect('SELECT * WHERE x > 1', {
      parseWhere: () => {
        throw failure;
      }
    })
  ).toThrow(failure);
  expect(() => parseSQLQuery('SELECT x FROM')).toThrow(expect.objectContaining({token: null}));
});
