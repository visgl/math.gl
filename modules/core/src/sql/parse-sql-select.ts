// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {SQLParseError} from './sql-parse-error';
import type {Expression} from '../expressions/index';
import {SQLExpressionReader, SQL_RESERVED_WORDS} from './parse-sql-expression';
import type {ColumnarPredicate} from '../expressions/columnar-predicate';
import type {TableQuery, TableSelection, TableReference} from './query-types';

const MAXIMUM_SQL_LENGTH = 65536;
const MAXIMUM_SELECT_TOKENS = 4096;

/** Optional WHERE support for the independently tree-shakeable structural parser. */
export type SQLSelectParserOptions = Readonly<{
  /** Converts a WHERE expression to the portable predicate vocabulary. Omission rejects WHERE. */
  parseWhere?: (expression: string) => ColumnarPredicate | Readonly<{expression: Expression}>;
}>;

/** Parses SELECT columns/AS aliases, optional FROM, and LIMIT; WHERE requires a supplied parser. */
export function parseSQLSelect(sql: string, options: SQLSelectParserOptions = {}): TableQuery {
  const reader = new SQLQueryReader(sql);
  reader.expectKeyword('SELECT');
  let select: TableSelection[] | undefined;
  if (!reader.takeSymbol('*')) {
    select = [];
    do {
      const expression = reader.selectionExpression() as any;
      const alias = reader.takeKeyword('AS') ? reader.identifier() : undefined;
      if (expression.type === 'Identifier')
        select.push(alias ? {column: expression.name, as: alias} : expression.name);
      else if (
        expression.type === 'CallExpression' &&
        /^array(?:_(?:float(?:16|32|64)|uint8))?$/.test(expression.callee.name) &&
        expression.arguments.every((argument: any) => argument.type === 'Identifier')
      ) {
        if (!alias) throw reader.error('SQL ARRAY requires AS');
        const type = expression.callee.name.slice(6);
        select.push({
          array: expression.arguments.map((argument: any) => argument.name),
          as: alias,
          ...(type ? {type} : {})
        });
      } else select.push({expression, ...(alias ? {as: alias} : {})});
    } while (reader.takeSymbol(','));
  }
  let from: TableReference | undefined;
  if (reader.takeKeyword('FROM')) {
    const source = reader.identifier();
    from = reader.takeSymbol('.') ? {source, table: reader.identifier()} : source;
    if (!source.trim() || (typeof from === 'object' && !from.table.trim()))
      throw reader.error('SQL FROM requires non-empty names.');
  }
  let where: ColumnarPredicate | Readonly<{expression: Expression}> | undefined;
  if (reader.takeKeyword('WHERE')) {
    if (typeof options.parseWhere !== 'function')
      throw reader.error(
        'parseSQLSelect requires parseWhere for WHERE; use parseSQLQuery for built-in predicate support.'
      );
    where = reader.parseWhere(options.parseWhere);
    if (!where || typeof where !== 'object' || Array.isArray(where))
      throw reader.error('SQL WHERE parser must return a predicate.');
  }
  let limit: number | undefined;
  if (reader.takeKeyword('LIMIT')) limit = reader.limit();
  reader.end();
  return {
    ...(select ? {select} : {}),
    ...(from === undefined ? {} : {from}),
    ...(where ? {where} : {}),
    ...(limit === undefined ? {} : {limit})
  };
}

/** Small bounded scanner shared by structural and predicate-enabled SELECT parsing. */
export class SQLQueryReader {
  /** Original SQL, retained for exact WHERE substring extraction. */
  private readonly sql: string;
  /** Current character offset. */
  private position = 0;
  /** Number of consumed structural tokens. */
  private tokens = 0;

  /** Rejects empty or oversized statements before scanning. */
  constructor(sql: string) {
    if (typeof sql !== 'string' || !sql.trim() || sql.length > MAXIMUM_SQL_LENGTH)
      throw new SQLParseError(
        'SQL query requires a non-empty statement of at most 65536 characters.',
        '',
        0
      );
    this.sql = sql;
  }

  /** Consumes punctuation in a bounded ARRAY constructor. */
  arraySymbol(symbol: string): void {
    if (!this.takeSymbol(symbol)) throw this.error(`SQL ARRAY expected ${symbol}`);
  }

  /** Reads a bounded scalar or fixed-array projection. */
  selectionExpression(): Expression {
    this.skipWhitespace();
    this.countToken();
    const reader = new SQLExpressionReader(this.sql, this.position);
    const expression = reader.expression();
    this.position = reader.position;
    return expression;
  }

  /** Consumes one mandatory keyword. */
  expectKeyword(keyword: string): void {
    if (!this.takeKeyword(keyword)) throw this.error(`SQL query expected ${keyword}.`);
  }

  /** Consumes an unquoted keyword without folding identifier names. */
  takeKeyword(keyword: string): boolean {
    this.skipWhitespace();
    const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.sql.slice(this.position));
    if (match?.[0].toUpperCase() !== keyword) return false;
    this.position += match[0].length;
    this.countToken();
    return true;
  }

  /** Consumes a punctuation token. */
  takeSymbol(symbol: string): boolean {
    this.skipWhitespace();
    if (this.sql[this.position] !== symbol) return false;
    this.position++;
    this.countToken();
    return true;
  }

  /** Reads one literal identifier, including doubled double-quote escapes. */
  identifier(): string {
    this.skipWhitespace();
    this.countToken();
    if (this.sql[this.position] === '"') {
      this.position++;
      let value = '';
      while (this.position < this.sql.length) {
        const character = this.sql[this.position++];
        if (character !== '"') value += character;
        else if (this.sql[this.position] === '"') {
          value += '"';
          this.position++;
        } else {
          if (!value.length) throw this.error('SQL identifiers must not be empty.');
          return value;
        }
      }
      throw this.error('SQL query contains an unterminated quoted identifier.');
    }
    const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.sql.slice(this.position));
    if (!match || SQL_RESERVED_WORDS.has(match[0].toUpperCase()))
      throw this.error('SQL query expected a column, alias, source, or table identifier.');
    this.position += match[0].length;
    return match[0];
  }

  /** Parses a WHERE fragment and translates its cursor back to the full statement. */
  parseWhere(parse: NonNullable<SQLSelectParserOptions['parseWhere']>): ReturnType<typeof parse> {
    this.skipWhitespace();
    const start = this.position;
    const source = this.whereExpression();
    try {
      return parse(source);
    } catch (error) {
      if (error instanceof SQLParseError)
        throw new SQLParseError(error.reason, this.sql, start + error.offset);
      throw error;
    }
  }

  /** Creates an error at the current statement cursor. */
  error(message: string): SQLParseError {
    return new SQLParseError(message, this.sql, this.position);
  }

  /** Finds a top-level LIMIT/terminator without interpreting quoted predicate contents. */
  whereExpression(): string {
    this.skipWhitespace();
    const start = this.position;
    let quote = '';
    let depth = 0;
    let groupingDepth = 0;
    const membershipParens: boolean[] = [];
    while (this.position < this.sql.length) {
      const character = this.sql[this.position];
      if (quote) {
        if (character === quote) {
          if (this.sql[this.position + 1] === quote) {
            this.position += 2;
            continue;
          }
          quote = '';
        }
      } else if (character === '"' || character === "'") quote = character;
      else if (this.sql.startsWith('--', this.position) || this.sql.startsWith('/*', this.position))
        throw this.error('SQL comments are not supported.');
      else if (character === '(') {
        // IN list delimiters do not add a predicate grouping level.
        const membership = /\bIN\s*$/i.test(this.sql.slice(start, this.position));
        membershipParens.push(membership);
        depth++;
        if (!membership && ++groupingDepth > 64)
          throw this.error('SQL query exceeds its predicate nesting limit.');
      } else if (character === ')') {
        if (--depth < 0) throw this.error('SQL query contains unbalanced parentheses.');
        if (!membershipParens.pop()) groupingDepth--;
      } else if (
        depth === 0 &&
        (character === ';' ||
          (this.sql.slice(this.position, this.position + 5).toUpperCase() === 'LIMIT' &&
            !/[A-Za-z0-9_.:]/.test(this.sql[this.position - 1] || '') &&
            !/[A-Za-z0-9_.:]/.test(this.sql[this.position + 5] || '')))
      )
        break;
      this.position++;
    }
    if (quote || depth) throw this.error('SQL query contains an unterminated predicate.');
    const expression = this.sql.slice(start, this.position).trim();
    if (!expression) throw this.error('SQL WHERE requires a predicate.');
    return expression;
  }

  /** Reads a non-negative safe integer row limit. */
  limit(): number {
    this.skipWhitespace();
    const match = /^\d+/.exec(this.sql.slice(this.position));
    if (!match) throw this.error('SQL LIMIT requires a non-negative safe integer.');
    this.position += match[0].length;
    const value = Number(match[0]);
    if (!Number.isSafeInteger(value))
      throw this.error('SQL LIMIT requires a non-negative safe integer.');
    return value;
  }

  /** Requires one complete statement with at most one trailing semicolon. */
  end(): void {
    this.takeSymbol(';');
    this.skipWhitespace();
    if (this.position !== this.sql.length) throw this.error('Unsupported SQL query syntax.');
  }

  /** Skips whitespace without altering quoted identifiers. */
  private skipWhitespace(): void {
    while (this.position < this.sql.length && /\s/.test(this.sql[this.position])) this.position++;
  }

  /** Bounds large projection lists independently of predicate parsing. */
  private countToken(): void {
    if (++this.tokens > MAXIMUM_SELECT_TOKENS)
      throw this.error('SQL query exceeds its structural token limit.');
  }
}
