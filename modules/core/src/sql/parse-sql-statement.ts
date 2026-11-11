// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Expression} from '../expressions/index';
import type {SQLExpressionParserOptions} from './parse-sql-expression';
import {SQLQueryReader} from './parse-sql-select';

/** A named input with an optional alias in a relational SELECT. */
export type SQLTableBinding = Readonly<{name: string; alias?: string}>;

/** A join whose condition is interpreted by the query planner. */
export type SQLJoin = Readonly<{
  type: 'inner' | 'left' | 'semi' | 'anti';
  table: SQLTableBinding;
  on: Expression;
}>;

/** A sort expression and its explicitly requested null placement, if supplied. */
export type SQLSort = Readonly<{
  expression: Expression;
  direction: 'asc' | 'desc';
  nulls?: 'first' | 'last';
}>;

/** Relational SELECT syntax for callers that implement their own query planner. */
export type SQLSelectStatement = Readonly<{
  /** Omission represents SELECT *. */
  select?: readonly Readonly<{expression: Expression; alias?: string}>[];
  from: SQLTableBinding;
  joins: readonly SQLJoin[];
  where?: Expression;
  groupBy?: readonly Expression[];
  orderBy?: readonly SQLSort[];
  limit?: number;
}>;

/** Parses a SELECT with a required FROM, without assuming an execution engine. */
export function parseSQLSelectStatement(
  sql: string,
  options: Pick<SQLExpressionParserOptions, 'parseParameter'> = {}
): SQLSelectStatement {
  const reader = new SQLQueryReader(sql, {
    parseParameter: options.parseParameter,
    qualifiedColumns: true,
    countWildcard: true,
    lineComments: true
  });
  reader.expectKeyword('SELECT');
  const select = reader.takeSymbol('*')
    ? undefined
    : readList(reader, () => {
        const expression = reader.selectionExpression();
        const alias = reader.takeKeyword('AS') ? reader.identifier() : undefined;
        return {expression, ...(alias === undefined ? {} : {alias})};
      });
  reader.expectKeyword('FROM');
  const from = readTable(reader);
  const joins: SQLJoin[] = [];
  for (let type = readJoinType(reader); type; type = readJoinType(reader)) {
    const table = readTable(reader);
    reader.expectKeyword('ON');
    joins.push({type, table, on: reader.selectionExpression()});
  }
  const where = reader.takeKeyword('WHERE') ? reader.selectionExpression() : undefined;
  let groupBy: Expression[] | undefined;
  if (reader.takeKeyword('GROUP')) {
    reader.expectKeyword('BY');
    groupBy = readList(reader, () => reader.selectionExpression());
  }
  let orderBy: SQLSort[] | undefined;
  if (reader.takeKeyword('ORDER')) {
    reader.expectKeyword('BY');
    orderBy = readList(reader, () => readSort(reader));
  }
  const limit = reader.takeKeyword('LIMIT') ? reader.limit() : undefined;
  reader.end();
  return {
    ...(select ? {select} : {}),
    from,
    joins,
    ...(where ? {where} : {}),
    ...(groupBy ? {groupBy} : {}),
    ...(orderBy ? {orderBy} : {}),
    ...(limit === undefined ? {} : {limit})
  };
}

function readTable(reader: SQLQueryReader): SQLTableBinding {
  const name = reader.identifier();
  const alias = reader.takeKeyword('AS') ? reader.identifier() : reader.optionalAlias();
  return {name, ...(alias === undefined ? {} : {alias})};
}

function readJoinType(reader: SQLQueryReader): SQLJoin['type'] | undefined {
  if (reader.takeKeyword('JOIN')) return 'inner';
  let type: SQLJoin['type'];
  if (reader.takeKeyword('INNER')) type = 'inner';
  else if (reader.takeKeyword('LEFT')) {
    reader.takeKeyword('OUTER');
    type = 'left';
  } else if (reader.takeKeyword('SEMI')) type = 'semi';
  else if (reader.takeKeyword('ANTI')) type = 'anti';
  else return undefined;
  reader.expectKeyword('JOIN');
  return type;
}

function readSort(reader: SQLQueryReader): SQLSort {
  const expression = reader.selectionExpression();
  const direction = reader.takeKeyword('DESC') ? 'desc' : 'asc';
  if (direction === 'asc') reader.takeKeyword('ASC');
  if (!reader.takeKeyword('NULLS')) return {expression, direction};
  if (reader.takeKeyword('FIRST')) return {expression, direction, nulls: 'first'};
  reader.expectKeyword('LAST');
  return {expression, direction, nulls: 'last'};
}

function readList<T>(reader: SQLQueryReader, readItem: () => T): T[] {
  const items = [readItem()];
  while (reader.takeSymbol(',')) items.push(readItem());
  return items;
}
