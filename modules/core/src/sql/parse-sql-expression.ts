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
    case 'FLOAT16':
      return 'float16';
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

/** Parses bounded SQL expressions into the shared expression AST. */
export function parseSQLExpression(source: string): Expression {
  const reader = new SQLExpressionReader(source);
  const expression = reader.expression();
  reader.space();
  if (reader.position !== source.length) throw new Error('Unexpected token after SQL expression');
  return expression;
}

/** Bounded expression reader shared by SELECT and standalone expressions. */
export class SQLExpressionReader {
  position = 0;
  private tokens = 0;
  private readonly depths = new WeakMap<object, number>();
  constructor(readonly source: string) {
    if (typeof source !== 'string' || !source.trim() || source.length > 65536)
      throw new Error('SQL expression requires non-empty input of at most 65536 characters');
  }
  space(): void {
    while (this.position < this.source.length && /\s/.test(this.source[this.position]!))
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
  private take(symbol: string): boolean {
    this.space();
    if (!this.source.startsWith(symbol, this.position)) return false;
    this.position += symbol.length;
    this.token();
    return true;
  }
  symbol(symbol: string): void {
    if (!this.take(symbol)) throw new Error(`SQL expression expected ${symbol}`);
  }
  private node(value: object, children: Expression[] = []): Expression {
    const depth = children.length
      ? 1 + Math.max(...children.map(child => this.depths.get(child) || 0))
      : 0;
    if (depth > 64) throw new Error('SQL expression exceeds nesting limit');
    this.depths.set(value, depth);
    return value as Expression;
  }
  expression(depth = 0, minimum = 0): Expression {
    if (depth > 64) throw new Error('SQL expression exceeds nesting limit');
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
        if (!this.word('NULL')) throw new Error('SQL IS requires NULL or NOT NULL');
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
    const match = /^[A-Za-z][A-Za-z0-9]*(?:\s+(?:PRECISION|VARYING)\b)?/i.exec(
      this.source.slice(this.position)
    );
    if (!match) throw new Error('SQL cast requires a target type');
    this.position += match[0].length;
    this.token();
    if (this.take('[')) {
      const width = /^\d+/.exec(this.source.slice(this.position));
      if (!width) throw new Error('SQL ARRAY cast requires a fixed length');
      this.position += width[0].length;
      this.token();
      this.symbol(']');
      const array = argument as any;
      if (
        array.type !== 'CallExpression' ||
        !/^array(?:_float(?:16|32|64))?$/.test(array.callee.name) ||
        Number(width[0]) !== array.arguments.length
      )
        throw new Error('ARRAY cast length must match the number of components');
      const name = match[0].toUpperCase();
      const type =
        name === 'FLOAT32' ? 'float32' : name === 'FLOAT64' ? 'float64' : sqlCastType(name);
      if (!['float16', 'float32', 'float64'].includes(type))
        throw new Error('Unsupported ARRAY cast type');
      return this.call(`array_${type}`, array.arguments);
    }
    const target = sqlCastType(match[0]);
    return this.call('cast', [
      argument,
      this.node({type: 'Literal', value: target, raw: JSON.stringify(target)})
    ]);
  }
  private primary(depth: number): Expression {
    if (depth > 64) throw new Error('SQL expression exceeds nesting limit');
    if (this.take('(')) {
      const value = this.expression(depth + 1);
      this.symbol(')');
      return value;
    }
    if (this.word('CAST')) {
      this.symbol('(');
      const argument = this.expression(depth + 1);
      if (!this.word('AS')) throw new Error('SQL CAST requires AS');
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
        if (!this.word('THEN')) throw new Error('SQL CASE requires THEN');
        clauses.push({test, consequent: this.expression(depth + 1)});
      }
      if (!clauses.length) throw new Error('SQL CASE requires WHEN');
      let alternate = this.word('ELSE')
        ? this.expression(depth + 1)
        : this.node({type: 'Literal', value: null, raw: 'null'});
      if (!this.word('END')) throw new Error('SQL CASE requires END');
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
          if (quote === '"' && !value) throw new Error('SQL identifiers must not be empty');
          if (quote === '"') return this.identifier(value, depth, false);
          return this.node({type: 'Literal', value, raw: JSON.stringify(value)});
        }
      }
      throw new Error('Unterminated SQL expression quote');
    }
    const number = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(
      this.source.slice(this.position)
    );
    if (number) {
      this.position += number[0].length;
      this.token();
      const value = Number(number[0]);
      if (!Number.isFinite(value) || (/^[+-]?\d+$/.test(number[0]) && !Number.isSafeInteger(value)))
        throw new Error(
          'SQL numeric literal must be finite and exactly representable; use a quoted BIGINT value'
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
      /^(AS|SELECT|FROM|WHERE|LIMIT|WHEN|THEN|ELSE|END|AND|OR|IS|IN)$/i.test(identifier[0])
    )
      throw new Error('SQL expression requires a column, literal or function');
    this.position += identifier[0].length;
    this.token();
    return this.identifier(identifier[0], depth, true);
  }
  private identifier(name: string, depth: number, fold: boolean): Expression {
    if (!this.take('(')) return this.node({type: 'Identifier', name});
    const args: Expression[] = [];
    if (!this.take(')')) {
      do {
        args.push(this.expression(depth + 1));
      } while (this.take(','));
      this.symbol(')');
    }
    return this.call(name, args, fold);
  }
  private token(): void {
    if (++this.tokens > 4096) throw new Error('SQL expression exceeds token limit');
  }
}
