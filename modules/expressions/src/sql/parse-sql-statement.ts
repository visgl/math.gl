// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Expression} from '../expressions/index';
import {SQLExpressionReader, SQL_RESERVED_WORDS} from './parse-sql-expression';
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
  offset?: number;
}>;

/** Options for interpreting named parameters in a relational SELECT. */
export type SQLSelectStatementOptions = Readonly<{
  /** Supplies the AST for a named parameter such as :minimum. */
  parseParameter?: (name: string) => Expression;
}>;

/** Parses a SELECT with a required FROM, without assuming an execution engine. */
export function parseSQLSelectStatement(
  sql: string,
  options: SQLSelectStatementOptions = {}
): SQLSelectStatement {
  const reader = new RelationalQueryReader(sql, options);
  const statement = readSelect(reader);
  const tail = readTail(reader);
  reader.end();
  return {...statement, ...tail};
}

/** SELECT inputs followed by ordering and pagination for the combined result. */
export type SQLSelectCompound = {
  inputs: readonly SQLSelectStatement[];
  orderBy?: readonly SQLSort[];
  limit?: number;
  offset?: number;
};

/** Parses SELECT or a sequence of UNION ALL inputs. */
export function parseSQLSelectCompound(
  sql: string,
  options: SQLSelectStatementOptions = {}
): SQLSelectCompound {
  const reader = new RelationalQueryReader(sql, options);
  const inputs = [readSelect(reader)];
  while (reader.takeKeyword('UNION')) {
    reader.expectKeyword('ALL');
    inputs.push(readSelect(reader));
  }
  const tail = readTail(reader);
  reader.end();
  return {inputs, ...tail};
}

function readSelect(reader: RelationalQueryReader): SQLSelectStatement {
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
  return {
    from,
    joins,
    ...(select ? {select} : {}),
    ...(where ? {where} : {}),
    ...(groupBy ? {groupBy} : {})
  };
}

function readTail(reader: RelationalQueryReader) {
  let orderBy: SQLSort[] | undefined;
  if (reader.takeKeyword('ORDER')) {
    reader.expectKeyword('BY');
    orderBy = readList(reader, () => readSort(reader));
  }
  const pagination = reader.pagination();
  return {...(orderBy ? {orderBy} : {}), ...pagination};
}

function readTable(reader: RelationalQueryReader): SQLTableBinding {
  const name = reader.tableName();
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

class RelationalQueryReader extends SQLQueryReader {
  constructor(
    sql: string,
    private readonly options: SQLSelectStatementOptions
  ) {
    super(sql);
  }

  tableName(): string {
    this.skipWhitespace();
    if (/^LATERAL(?![A-Za-z0-9_])/i.test(this.sql.slice(this.position))) {
      throw this.error('SQL LATERAL table expressions are not supported.');
    }
    return this.identifier();
  }

  /** Reads an implicit alias unless the next token starts a clause. */
  optionalAlias(): string | undefined {
    this.skipWhitespace();
    if (this.sql[this.position] === '"') return this.identifier();
    const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.sql.slice(this.position))?.[0];
    if (
      name &&
      !SQL_RESERVED_WORDS.has(name.toUpperCase()) &&
      !/^(INNER|LEFT|RIGHT|FULL|CROSS|OUTER|SEMI|ANTI|NATURAL|LATERAL|ON)$/i.test(name)
    )
      return this.identifier();
    return undefined;
  }

  protected override expressionReader(): SQLExpressionReader {
    return new RelationalExpressionReader(this.sql, this.position, this.options);
  }

  protected override skipWhitespace(): void {
    this.position = skipLineComments(this.sql, this.position);
  }
}

class RelationalExpressionReader extends SQLExpressionReader {
  constructor(
    source: string,
    position: number,
    private readonly options: SQLSelectStatementOptions
  ) {
    super(source, position);
  }

  override space(): void {
    this.position = skipLineComments(this.source, this.position);
    super.space();
  }

  protected override extendedPrimary(): Expression | undefined {
    if (this.source[this.position] !== ':') return undefined;
    const parameter = /^:([A-Za-z_][A-Za-z0-9_]*)/.exec(this.source.slice(this.position));
    if (!parameter || !this.options.parseParameter) {
      throw this.error('SQL named parameters require a name and parseParameter callback');
    }
    this.position += parameter[0].length;
    this.token();
    return this.node(this.options.parseParameter(parameter[1]!));
  }

  protected override qualifiedIdentifier(name: string): Expression | undefined {
    if (!this.take('.')) return undefined;
    this.space();
    const column = /^(?:"((?:[^"]|"")+)"|([A-Za-z_][A-Za-z0-9_]*))/.exec(
      this.source.slice(this.position)
    );
    if (!column) throw this.error('SQL qualified column requires a column identifier');
    this.position += column[0].length;
    this.token();
    const property = this.node({
      type: 'Identifier',
      name: column[1]?.replace(/""/g, '"') ?? column[2]
    });
    const object = this.node({type: 'Identifier', name});
    return this.node({type: 'MemberExpression', computed: false, object, property}, [
      object,
      property
    ]);
  }

  protected override wildcardArgument(name: string): Expression | undefined {
    if (name.toUpperCase() !== 'COUNT' || !this.take('*')) return undefined;
    return this.node({type: 'Identifier', name: '*', sqlWildcard: true});
  }
}

function skipLineComments(source: string, position: number): number {
  while (position < source.length) {
    if (/\s/.test(source[position]!)) position++;
    else if (source.startsWith('--', position)) {
      while (position < source.length && !/[\r\n]/.test(source[position]!)) position++;
    } else break;
  }
  return position;
}
