// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {SQLParseError, parseSQLSelect, parseSQLSelectStatement} from '@math.gl/core/sql';
import {expect, test} from 'vitest';

test('relational SELECT preserves qualified names, COUNT(*), joins, and sort options', () => {
  const statement = parseSQLSelectStatement(
    `-- trips by region
    SELECT t."home.region" AS region, COUNT(*) AS trips, SUM(t.fare) AS total
    FROM trips t LEFT OUTER JOIN regions AS r ON t.region = r.id
    WHERE t.fare >= :minimum
    GROUP BY t."home.region", r.name
    ORDER BY total DESC NULLS LAST, region ASC OFFSET 2 ROWS LIMIT 10;`,
    {parseParameter: name => ({type: 'Identifier', name: `:${name}`})}
  );
  const region = {
    type: 'MemberExpression',
    computed: false,
    object: {type: 'Identifier', name: 't'},
    property: {type: 'Identifier', name: 'home.region'}
  };
  expect(statement).toMatchObject({
    select: [
      {expression: region, alias: 'region'},
      {
        expression: {
          type: 'CallExpression',
          callee: {name: 'COUNT'},
          arguments: [{type: 'Identifier', name: '*', sqlWildcard: true}]
        },
        alias: 'trips'
      },
      {expression: {type: 'CallExpression', callee: {name: 'SUM'}}, alias: 'total'}
    ],
    from: {name: 'trips', alias: 't'},
    joins: [
      {
        type: 'left',
        table: {name: 'regions', alias: 'r'},
        on: {type: 'BinaryExpression', operator: '=='}
      }
    ],
    where: {type: 'BinaryExpression', right: {type: 'Identifier', name: ':minimum'}},
    groupBy: [region, {type: 'MemberExpression'}],
    orderBy: [
      {expression: {name: 'total'}, direction: 'desc', nulls: 'last'},
      {expression: {name: 'region'}, direction: 'asc'}
    ],
    offset: 2,
    limit: 10
  });
});

test('relational SELECT supports inner, semi, and anti joins with explicit conditions', () => {
  const {joins, select, limit} = parseSQLSelectStatement(
    'SELECT * FROM a JOIN b ON a.id = b.id SEMI JOIN c ON a.id = c.id ANTI JOIN d ON a.id = d.id LIMIT 0'
  );
  expect(joins.map(join => join.type)).toEqual(['inner', 'semi', 'anti']);
  expect(select).toBeUndefined();
  expect(limit).toBe(0);
});

test('relational SELECT rejects incomplete clauses, unbound parameters, and multiple statements', () => {
  for (const sql of [
    'SELECT * FROM a LEFT b',
    'SELECT * FROM a JOIN b',
    'SELECT * FROM a WHERE :id = id',
    'SELECT * FROM a GROUP BY id,',
    'SELECT * FROM a ORDER BY id NULLS',
    'SELECT * FROM a; SELECT * FROM b'
  ]) {
    expect(() => parseSQLSelectStatement(sql)).toThrow();
  }
  expect(() => parseSQLSelect('SELECT * FROM a ORDER BY id')).toThrow();
});

test('relational SELECT distinguishes wildcard arguments and reports statement offsets', () => {
  const {select} = parseSQLSelectStatement('SELECT COUNT(*), COUNT("*") FROM a');
  expect(select?.map(item => item.expression)).toMatchObject([
    {arguments: [{name: '*', sqlWildcard: true}]},
    {arguments: [{name: '*'}]}
  ]);
  const quotedArgument = select?.[1]?.expression;
  if (quotedArgument?.type !== 'CallExpression') throw new Error('Expected COUNT call');
  expect(quotedArgument.arguments[0]).not.toHaveProperty('sqlWildcard');

  const sql = 'SELECT * FROM a\nWHERE id = :missing';
  expect(() => parseSQLSelectStatement(sql)).toThrow(SQLParseError);
  try {
    parseSQLSelectStatement(sql);
  } catch (error) {
    expect(error).toMatchObject({offset: sql.indexOf(':missing')});
  }
});
