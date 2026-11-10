// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Expression} from '../expressions/index';
import type {ColumnarScalarType} from '../expressions/scalar-type';

/** Supported standard SQL type spellings. Precision/length modifiers are not yet supported. */
export function sqlCastType(name: string): ColumnarScalarType {
  switch (name.toUpperCase().replace(/\s+/g, ' ').trim()) {
    case 'SMALLINT':
      return 'int16';
    case 'INT':
    case 'INTEGER':
      return 'int32';
    case 'BIGINT':
      return 'int64';
    case 'REAL':
      return 'float32';
    case 'DOUBLE PRECISION':
      return 'float64';
    case 'BOOLEAN':
      return 'bool';
    case 'VARCHAR':
    case 'CHARACTER VARYING':
      return 'utf8';
    default:
      throw new Error(`Unsupported SQL CAST type: ${name}`);
  }
}

/** Parses a column, scalar literal or nested standard CAST into the shared expression AST. */
export function parseSQLExpression(source: string): Expression {
  const reader = new SQLExpressionReader(source);
  const expression = reader.expression();
  reader.space();
  if (reader.position !== source.length) throw new Error('Unexpected token after SQL expression');
  return expression;
}

/** Bounded expression reader; exported internally for SELECT projection parsing. */
export class SQLExpressionReader {
  position = 0;
  private tokens = 0;
  constructor(readonly source: string) {
    if (typeof source !== 'string' || !source.trim() || source.length > 65536)
      throw new Error('SQL expression requires non-empty input of at most 65536 characters');
  }
  space(): void {
    while (/\s/.test(this.source[this.position] || '') && this.position < this.source.length)
      this.position++;
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
  symbol(symbol: string): void {
    this.space();
    if (this.source[this.position] !== symbol) throw new Error(`SQL expression expected ${symbol}`);
    this.position++;
    this.token();
  }
  expression(depth = 0): Expression {
    let expression = this.primary(depth);
    this.space();
    let count = depth;
    while (this.source.startsWith('::', this.position)) {
      if (++count > 64) throw new Error('SQL expression exceeds nesting limit');
      this.position += 2;
      this.token();
      this.space();
      const match = /^[A-Za-z]+(?:\s+(?:PRECISION|VARYING)\b)?/i.exec(
        this.source.slice(this.position)
      );
      if (!match) throw new Error('SQL cast requires a target type');
      this.position += match[0].length;
      const target = sqlCastType(match[0]);
      expression = {
        type: 'CallExpression',
        callee: {type: 'Identifier', name: 'cast'},
        arguments: [expression, {type: 'Literal', value: target, raw: JSON.stringify(target)}]
      } as Expression;
      this.space();
    }
    return expression;
  }
  private primary(depth: number): Expression {
    if (depth > 64) throw new Error('SQL expression exceeds nesting limit');
    this.space();
    this.token();
    if (this.word('CAST')) {
      this.symbol('(');
      const argument = this.expression(depth + 1);
      if (!this.word('AS')) throw new Error('SQL CAST requires AS');
      this.space();
      const match = /^[A-Za-z]+(?:\s+(?:PRECISION|VARYING)\b)?/i.exec(
        this.source.slice(this.position)
      );
      if (!match) throw new Error('SQL CAST requires a target type');
      this.position += match[0].length;
      const target = sqlCastType(match[0]);
      this.symbol(')');
      return {
        type: 'CallExpression',
        callee: {type: 'Identifier', name: 'cast'},
        arguments: [argument, {type: 'Literal', value: target, raw: JSON.stringify(target)}]
      } as Expression;
    }
    const quote = this.source[this.position];
    if (quote === '"' || quote === "'") {
      this.position++;
      let value = '';
      while (this.position < this.source.length) {
        const character = this.source[this.position++]!;
        if (character !== quote) value += character;
        else if (this.source[this.position] === quote) {
          value += quote;
          this.position++;
        } else {
          if (quote === '"' && !value) throw new Error('SQL identifiers must not be empty');
          return quote === '"'
            ? ({type: 'Identifier', name: value} as Expression)
            : ({type: 'Literal', value, raw: JSON.stringify(value)} as Expression);
        }
      }
      throw new Error('Unterminated SQL expression quote');
    }
    const number = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(
      this.source.slice(this.position)
    );
    if (number) {
      this.position += number[0].length;
      const value = Number(number[0]);
      if (!Number.isFinite(value) || (/^[+-]?\d+$/.test(number[0]) && !Number.isSafeInteger(value)))
        throw new Error(
          'SQL numeric literal must be finite and exactly representable; use a quoted BIGINT value'
        );
      return {type: 'Literal', value, raw: number[0]} as Expression;
    }
    for (const [keyword, value] of [
      ['NULL', null],
      ['TRUE', true],
      ['FALSE', false]
    ] as const)
      if (this.word(keyword))
        return {type: 'Literal', value, raw: keyword.toLowerCase()} as Expression;
    const identifier = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.source.slice(this.position));
    if (!identifier || /^(AS|SELECT|FROM|WHERE|LIMIT)$/i.test(identifier[0]))
      throw new Error('SQL expression requires a column, literal or CAST');
    this.position += identifier[0].length;
    return {type: 'Identifier', name: identifier[0]} as Expression;
  }
  private token(): void {
    if (++this.tokens > 4096) throw new Error('SQL expression exceeds token limit');
  }
}
