// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {SQLParseError} from './sql-parse-error';
import type {Expression} from '../expressions/index';
import {isColumnarScalarType, type ColumnarScalarType} from '../expressions/scalar-type';

export const SQL_RESERVED_WORDS = new Set([
  'SELECT',
  'ARRAY',
  'FROM',
  'WHERE',
  'LIMIT',
  'OFFSET',
  'AS',
  'TRUE',
  'FALSE',
  'NULL',
  'ALL',
  'AND',
  'OR',
  'NOT',
  'IN',
  'IS',
  'DISTINCT',
  'ORDER',
  'GROUP',
  'HAVING',
  'OFFSET',
  'JOIN',
  'UNION'
]);

/** Standard SQL names for portable scalar cast targets. */
const SQL_CAST_ALIASES: Readonly<Record<string, ColumnarScalarType>> = {
  smallint: 'int16',
  int: 'int32',
  integer: 'int32',
  bigint: 'int64',
  real: 'float32',
  'double precision': 'float64',
  boolean: 'bool',
  varchar: 'utf8',
  'character varying': 'utf8'
};

/** Resolves SQL cast type names and explicit numeric widths. */
export function sqlCastType(name: string, source = name, offset = 0): ColumnarScalarType {
  const normalized = name.toLowerCase().replace(/\s+/g, ' ').trim();
  if (isColumnarScalarType(normalized) && normalized !== 'bool' && normalized !== 'utf8') {
    return normalized;
  }
  if (Object.hasOwn(SQL_CAST_ALIASES, normalized)) return SQL_CAST_ALIASES[normalized]!;
  throw new SQLParseError(`Unsupported SQL CAST type: ${name}`, source, offset);
}

/** Parses bounded SQL expressions into the shared expression AST. */
export function parseSQLExpression(source: string): Expression {
  const reader = new SQLExpressionReader(source);
  const expression = reader.expression();
  reader.space();
  if (reader.position !== source.length)
    throw reader.error('Unexpected token after SQL expression');
  return expression;
}

/** Bounded expression reader shared by SELECT and standalone expressions. */
export class SQLExpressionReader {
  position: number;
  private tokens = 0;
  private readonly depths = new WeakMap<object, number>();
  constructor(
    readonly source: string,
    start = 0
  ) {
    this.position = start;
    if (start === 0 && (typeof source !== 'string' || !source.trim() || source.length > 65536))
      throw new SQLParseError(
        'SQL expression requires non-empty input of at most 65536 characters',
        '',
        0
      );
  }
  /** Creates an error at the current expression cursor. */
  error(message: string, offset = this.position): SQLParseError {
    return new SQLParseError(message, this.source, offset);
  }
  space(): void {
    while (this.position < this.source.length && /\s/.test(this.source[this.position]!))
      this.position++;
    if (this.source.startsWith('--', this.position) || this.source.startsWith('/*', this.position))
      throw this.error('SQL comments are not supported.');
  }
  word(word: string): boolean {
    this.space();
    if (
      this.source.slice(this.position, this.position + word.length).toUpperCase() !== word ||
      /[A-Za-z0-9_]/.test(this.source[this.position + word.length] || '')
    )
      return false;
    this.position += word.length;
    this.token();
    return true;
  }
  protected take(symbol: string): boolean {
    this.space();
    if (!this.source.startsWith(symbol, this.position)) return false;
    this.position += symbol.length;
    this.token();
    return true;
  }
  symbol(symbol: string): void {
    if (!this.take(symbol)) throw this.error(`SQL expression expected ${symbol}`);
  }
  protected node(value: object, children: Expression[] = []): Expression {
    const depth = children.length
      ? 1 + Math.max(...children.map(child => this.depths.get(child) || 0))
      : 0;
    if (depth > 64) throw this.error('SQL expression exceeds nesting limit');
    this.depths.set(value, depth);
    return value as Expression;
  }
  expression(depth = 0, minimum = 0): Expression {
    if (depth > 64) throw this.error('SQL expression exceeds nesting limit');
    let left: Expression;
    if (this.word('NOT')) {
      const argument = this.expression(depth + 1, 3);
      left = this.node({type: 'UnaryExpression', operator: '!', argument}, [argument]);
    } else if (/^\s*[+-](?:\d|\.\d)/.test(this.source.slice(this.position))) {
      left = this.primary(depth);
    } else if (this.take('+') || this.take('-')) {
      const operator = this.source[this.position - 1]!;
      const argument = this.expression(depth + 1, 6);
      left = this.node({type: 'UnaryExpression', operator, argument}, [argument]);
    } else left = this.primary(depth);
    while (true) {
      const start = this.position;
      if (this.take('::')) {
        if (minimum > 7) {
          this.position = start;
          break;
        }
        left = this.cast(left);
        continue;
      }
      if (minimum <= 3 && this.word('IS')) {
        const negate = this.word('NOT');
        if (!this.word('NULL')) throw this.error('SQL IS requires NULL or NOT NULL');
        left = this.call(negate ? 'isNotNull' : 'isNull', [left]);
        continue;
      }
      this.space();
      const match = /^(OR\b|AND\b|<>|!=|<=|>=|=|<|>|\+|-|\*|\/)/i.exec(
        this.source.slice(this.position)
      );
      if (!match) break;
      const token = match[0].toUpperCase();
      const precedence =
        token === 'OR'
          ? 1
          : token === 'AND'
            ? 2
            : ['=', '<>', '!=', '<', '>', '<=', '>='].includes(token)
              ? 3
              : token === '+' || token === '-'
                ? 4
                : 5;
      if (precedence < minimum) break;
      this.position += match[0].length;
      this.token();
      const right = this.expression(depth + 1, precedence + 1);
      const operator =
        token === 'OR'
          ? '||'
          : token === 'AND'
            ? '&&'
            : token === '='
              ? '=='
              : token === '<>'
                ? '!='
                : token;
      left = this.node({type: 'BinaryExpression', operator, left, right}, [left, right]);
    }
    return left;
  }
  private call(name: string, args: Expression[], sqlFunction = false): Expression {
    return this.node(
      {
        type: 'CallExpression',
        callee: {type: 'Identifier', name},
        arguments: args,
        ...(sqlFunction ? {sqlFunction: true} : {})
      },
      args
    );
  }
  private cast(argument: Expression): Expression {
    this.space();
    const start = this.position;
    const match = /^[A-Za-z][A-Za-z0-9]*(?:\s+(?:PRECISION|VARYING)\b)?/i.exec(
      this.source.slice(this.position)
    );
    if (!match) throw this.error('SQL cast requires a target type');
    this.position += match[0].length;
    this.token();
    if (this.take('[')) {
      this.space();
      const width = /^\d+/.exec(this.source.slice(this.position));
      if (!width) throw this.error('SQL ARRAY cast requires a fixed length');
      this.position += width[0].length;
      this.token();
      this.symbol(']');
      const array = argument as any;
      if (
        array.type !== 'CallExpression' ||
        !/^array(?:_(?:float(?:16|32|64)|uint8))?$/.test(array.callee.name) ||
        Number(width[0]) !== array.arguments.length
      )
        throw this.error('ARRAY cast length must match the number of components');
      const name = match[0].toUpperCase();
      const type =
        name === 'UINT8'
          ? 'uint8'
          : name === 'FLOAT32'
            ? 'float32'
            : name === 'FLOAT64'
              ? 'float64'
              : sqlCastType(name, this.source, start);
      if (!['float16', 'float32', 'float64', 'uint8'].includes(type))
        throw this.error('Unsupported ARRAY cast type');
      if (
        array.callee.name !== 'array' &&
        (type === 'uint8' || array.callee.name === 'array_uint8')
      )
        throw this.error('Chained UINT8 array casts are not supported');
      return this.call(`array_${type}`, array.arguments);
    }
    const target = sqlCastType(match[0], this.source, start);
    return this.call('cast', [
      argument,
      this.node({type: 'Literal', value: target, raw: JSON.stringify(target)})
    ]);
  }
  private primary(depth: number): Expression {
    if (depth > 64) throw this.error('SQL expression exceeds nesting limit');
    if (this.take('(')) {
      const value = this.expression(depth + 1);
      this.symbol(')');
      return value;
    }
    if (this.word('CAST')) {
      this.symbol('(');
      const argument = this.expression(depth + 1);
      if (!this.word('AS')) throw this.error('SQL CAST requires AS');
      const result = this.cast(argument);
      this.symbol(')');
      return result;
    }
    if (this.word('ARRAY')) {
      this.symbol('[');
      const args: Expression[] = [];
      do {
        args.push(this.expression(depth + 1));
      } while (this.take(','));
      this.symbol(']');
      return this.call('array', args);
    }
    if (this.word('CASE')) {
      const clauses: {test: Expression; consequent: Expression}[] = [];
      while (this.word('WHEN')) {
        const test = this.expression(depth + 1);
        if (!this.word('THEN')) throw this.error('SQL CASE requires THEN');
        clauses.push({test, consequent: this.expression(depth + 1)});
      }
      if (!clauses.length) throw this.error('SQL CASE requires WHEN');
      let alternate = this.word('ELSE')
        ? this.expression(depth + 1)
        : this.node({type: 'Literal', value: null, raw: 'null'});
      if (!this.word('END')) throw this.error('SQL CASE requires END');
      for (let index = clauses.length - 1; index >= 0; index--) {
        const {test, consequent} = clauses[index]!;
        alternate = this.node({type: 'ConditionalExpression', test, consequent, alternate}, [
          test,
          consequent,
          alternate
        ]);
      }
      return alternate;
    }
    this.space();
    const start = this.position;
    const extended = this.extendedPrimary();
    if (extended) return extended;
    const quote = this.source[this.position];
    if (quote === '"' || quote === "'") {
      this.position++;
      this.token();
      let value = '';
      while (this.position < this.source.length) {
        const character = this.source[this.position++]!;
        if (character !== quote) value += character;
        else if (this.source[this.position] === quote) {
          value += quote;
          this.position++;
        } else {
          if (quote === '"' && !value) throw this.error('SQL identifiers must not be empty', start);
          if (quote === '"') return this.identifier(value, depth, false);
          return this.node({type: 'Literal', value, raw: JSON.stringify(value)});
        }
      }
      throw this.error('Unterminated SQL expression quote', start);
    }
    const number = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(
      this.source.slice(this.position)
    );
    if (number) {
      this.position += number[0].length;
      this.token();
      const value = Number(number[0]);
      if (!Number.isFinite(value) || (/^[+-]?\d+$/.test(number[0]) && !Number.isSafeInteger(value)))
        throw this.error(
          'SQL numeric literal must be finite and exactly representable; use a quoted BIGINT value',
          start
        );
      return this.node({type: 'Literal', value, raw: number[0]});
    }
    for (const [keyword, value] of [
      ['NULL', null],
      ['TRUE', true],
      ['FALSE', false]
    ] as const)
      if (this.word(keyword))
        return this.node({type: 'Literal', value, raw: keyword.toLowerCase()});
    const identifier = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.source.slice(this.position));
    if (
      !identifier ||
      SQL_RESERVED_WORDS.has(identifier[0].toUpperCase()) ||
      /^(WHEN|THEN|ELSE|END)$/i.test(identifier[0])
    )
      throw this.error('SQL expression requires a column, literal or function');
    this.position += identifier[0].length;
    this.token();
    return this.identifier(identifier[0], depth, true);
  }
  private identifier(name: string, depth: number, fold: boolean): Expression {
    const qualified = this.qualifiedIdentifier(name);
    if (qualified) return qualified;
    if (!this.take('(')) return this.node({type: 'Identifier', name});
    const args: Expression[] = [];
    const wildcard = fold && this.wildcardArgument(name);
    if (wildcard) {
      this.symbol(')');
      return this.call(name, [wildcard], true);
    }
    if (!this.take(')')) {
      do {
        args.push(this.expression(depth + 1));
      } while (this.take(','));
      this.symbol(')');
    }
    return this.call(name, args, fold);
  }
  protected extendedPrimary(): Expression | undefined {
    return undefined;
  }
  protected qualifiedIdentifier(_name: string): Expression | undefined {
    return undefined;
  }
  protected wildcardArgument(_name: string): Expression | undefined {
    return undefined;
  }
  protected token(): void {
    if (++this.tokens > 4096) throw this.error('SQL expression exceeds token limit');
  }
}
