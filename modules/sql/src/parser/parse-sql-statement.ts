// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SQLParameterOptions} from './sql-parameters';
import type {Expression} from '../expressions';
import {SQLExpressionReader, SQL_RESERVED_WORDS} from './parse-sql-expression';
import {SQLQueryReader} from './parse-sql-select';

/** A named input or a function of one named table in a relational SELECT. */
export type SQLTableBinding = Readonly<{
  /** Catalog table or registered function name. */
  name: string;
  /** Optional qualifier for columns supplied by the binding. */
  alias?: string;
  /** Catalog table passed to the function when this binding is a call. */
  inputTable?: string;
}>;

/** A join whose condition is interpreted by the query planner. */
export type SQLJoin = Readonly<{
  type: 'inner' | 'left' | 'semi' | 'anti' | 'cross';
  /** Experimental lateral collection expansion. */
  unnest?: Readonly<{expression: Expression; columns: readonly string[]; ordinality: boolean}>;
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
export type SQLSelectStatementOptions = SQLParameterOptions;

/** Parses a SELECT with a required FROM, without assuming an execution engine. */
export function parseSQLSelectStatement(
  sql: string,
  options: SQLSelectStatementOptions = {}
): SQLSelectStatement {
  const reader = new RelationalQueryReader(sql, options);
  const statement = {...readSelect(reader), ...readTail(reader)};
  reader.end();
  return statement;
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
    if (reader.takeKeyword('UNNEST')) {
      reader.expectSymbol('(');
      const expression = reader.selectionExpression();
      reader.expectSymbol(')');
      const ordinality = reader.takeKeyword('WITH');
      if (ordinality) reader.expectKeyword('ORDINALITY');
      reader.expectKeyword('AS');
      const alias = reader.identifier();
      reader.expectSymbol('(');
      const columns = readList(reader, () => reader.identifier());
      reader.expectSymbol(')');
      if (type === 'left') {
        reader.expectKeyword('ON');
        reader.expectKeyword('TRUE');
      } else if (type !== 'cross') throw reader.error('UNNEST requires CROSS JOIN or LEFT JOIN');
      joins.push({
        type,
        table: {name: alias, alias},
        on: {type: 'Literal', value: true},
        unnest: {expression, columns, ordinality}
      });
      continue;
    }
    if (type === 'cross') throw reader.error('CROSS JOIN requires UNNEST');
    const table = readTable(reader);
    reader.expectKeyword('ON');
    joins.push({type, table, on: reader.selectionExpression()});
  }
  const where = reader.takeKeyword('WHERE') ? reader.selectionExpression() : undefined;
  const groupBy = readBy(reader, 'GROUP', () => reader.selectionExpression());
  return {
    from,
    joins,
    ...(select ? {select} : {}),
    ...(where ? {where} : {}),
    ...(groupBy ? {groupBy} : {})
  };
}

function readTail(reader: RelationalQueryReader) {
  const orderBy = readBy(reader, 'ORDER', () => readSort(reader));
  return {...(orderBy ? {orderBy} : {}), ...reader.pagination()};
}

function readBy<T>(reader: RelationalQueryReader, clause: string, read: () => T): T[] | undefined {
  if (!reader.takeKeyword(clause)) return undefined;
  reader.expectKeyword('BY');
  return readList(reader, read);
}

function readTable(reader: RelationalQueryReader): SQLTableBinding {
  const name = reader.tableName();
  let inputTable: string | undefined;
  if (reader.takeSymbol('(')) {
    inputTable = reader.tableName();
    reader.expectSymbol(')');
  }
  const alias = reader.takeKeyword('AS') ? reader.identifier() : reader.optionalAlias();
  return {
    name,
    ...(alias === undefined ? {} : {alias}),
    ...(inputTable === undefined ? {} : {inputTable})
  };
}

function readJoinType(reader: SQLQueryReader): SQLJoin['type'] | undefined {
  if (reader.takeKeyword('CROSS')) {
    reader.expectKeyword('JOIN');
    return 'cross';
  }
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
  /** Requires punctuation with a positioned diagnostic. */
  expectSymbol(symbol: string): void {
    if (!this.takeSymbol(symbol)) throw this.error(`Expected ${symbol}`);
  }

  constructor(
    sql: string,
    private readonly options: SQLSelectStatementOptions
  ) {
    super(sql, options);
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
  constructor(source: string, position: number, options: SQLSelectStatementOptions) {
    super(source, position, options);
  }

  override space(): void {
    this.position = skipLineComments(this.source, this.position);
    super.space();
  }

  /** Preserves dot access until the planner can resolve table aliases. */
  protected override memberAccess(object: Expression, name: string): Expression {
    const property = this.node({type: 'Identifier', name});
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
