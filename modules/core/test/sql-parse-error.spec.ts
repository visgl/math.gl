// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {MemoryLog} from 'probe.gl/log';
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
  [parseSQLQuery, 'SHOW TABLES FROM ""', '"', 1, 18],
  [parseSQLQuery, 'SHOW TABLES FROM "bad', '"', 1, 18],
  [parseSQLQuery, "SELECT x WHERE x = 'bad", "'", 1, 20],
  [parseSQLQuery, 'SELECT x LIMIT 9007199254740992', '9007199254740992', 1, 16],
  [parseSQLQuery, 'SELECT x\nWHERE x > @', '@', 2, 11],
  [parseSQLQuery, 'SELECT x\nWHERE x > y + @', '@', 2, 15],
  [parseSQLPredicate, 'x >\n  @', '@', 2, 3],
  [parseSQLPredicate, 'x = :missing AND y = 2', ':missing', 1, 5],
  [parseSQLPredicate, 'x = :missing', ':missing', 1, 5],
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

test('SQL query parsing reports the original diagnostic to a supplied Probe.gl logger', () => {
  const log = new MemoryLog();
  expect(() => parseSQLQuery('SHOW TABLES FROM 123', {log})).toThrow(SQLParseError);
  expect(log.messages).toHaveLength(1);
  expect(log.messages[0].args[0]).toBeInstanceOf(SQLParseError);
});
