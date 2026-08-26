// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** One ordered parameter or flag in a PROJ string. */
export type PROJParameter = {
  readonly type: 'parameter';
  readonly name: string;
  /** Decoded parameter value. Omitted for flags such as `+no_defs`. */
  readonly value?: string;
  /** Original value lexeme, including quotes, retained for value-preserving encoding. */
  readonly rawValue?: string;
};

/** Syntax tree for one PROJ string. */
export type PROJStringAst = {
  readonly type: 'proj-string';
  readonly parameters: readonly PROJParameter[];
};

/** Options for encoding a PROJ syntax tree. */
export type EncodePROJStringOptions = {
  /** Compact output uses spaces; multiline output emits one parameter per line. */
  format?: 'compact' | 'multiline';
};

/** Syntax error containing a source offset and one-based line and column. */
export class PROJStringSyntaxError extends SyntaxError {
  readonly offset: number;
  readonly line: number;
  readonly column: number;

  /** Create a PROJ string syntax error at a source location. */
  constructor(message: string, source: string, offset: number) {
    const location = getSourceLocation(source, offset);
    super(`${message} at ${location.line}:${location.column}`);
    this.name = 'PROJStringSyntaxError';
    this.offset = offset;
    this.line = location.line;
    this.column = location.column;
  }
}

/** Parse an ordered PROJ definition or pipeline without interpreting parameter semantics. */
export function parsePROJString(text: string): PROJStringAst {
  const tokens = tokenizePROJString(text);
  if (tokens.length === 0) {
    throw new PROJStringSyntaxError('PROJ string is empty', text, 0);
  }

  const parameters = tokens.map(token => parseParameter(token.raw, token.offset, text));
  return {type: 'proj-string', parameters};
}

/** Encode an ordered PROJ definition using canonical leading plus signs. */
export function encodePROJString(ast: PROJStringAst, options?: EncodePROJStringOptions): string {
  if (!ast || ast.type !== 'proj-string' || !Array.isArray(ast.parameters)) {
    throw new TypeError('encodePROJString expects a PROJStringAst');
  }
  const separator = options?.format === 'multiline' ? '\n' : ' ';
  return ast.parameters
    .map(parameter => {
      if (!parameter.name || /[\s+=]/.test(parameter.name)) {
        throw new TypeError(`Invalid PROJ parameter name: ${parameter.name}`);
      }
      if (parameter.rawValue !== undefined) {
        return `+${parameter.name}=${parameter.rawValue}`;
      }
      if (parameter.value !== undefined) {
        return `+${parameter.name}=${encodeParameterValue(parameter.value)}`;
      }
      return `+${parameter.name}`;
    })
    .join(separator);
}

function parseParameter(rawToken: string, offset: number, source: string): PROJParameter {
  const token = rawToken.startsWith('+') ? rawToken.slice(1) : rawToken;
  if (!token) {
    throw new PROJStringSyntaxError("Expected a parameter after '+'", source, offset);
  }
  const equalsIndex = token.indexOf('=');
  const name = equalsIndex < 0 ? token : token.slice(0, equalsIndex);
  if (!name || /[\s+=]/.test(name)) {
    throw new PROJStringSyntaxError(`Invalid PROJ parameter name '${name}'`, source, offset);
  }
  if (equalsIndex < 0) {
    return {type: 'parameter', name};
  }

  const rawValue = token.slice(equalsIndex + 1);
  const value = decodeParameterValue(rawValue, source, offset + equalsIndex + 1);
  return {type: 'parameter', name, value, rawValue};
}

function tokenizePROJString(source: string): {raw: string; offset: number}[] {
  const tokens: {raw: string; offset: number}[] = [];
  let offset = 0;
  while (offset < source.length) {
    while (offset < source.length && /\s/.test(source[offset])) {
      offset++;
    }
    if (offset >= source.length) {
      break;
    }
    const start = offset;
    let quote: '"' | "'" | null = null;
    let escaped = false;
    while (offset < source.length) {
      const character = source[offset];
      if (escaped) {
        escaped = false;
        offset++;
        continue;
      }
      if (character === '\\' && quote) {
        escaped = true;
        offset++;
        continue;
      }
      if (quote) {
        if (character === quote) {
          quote = null;
        }
        offset++;
        continue;
      }
      if (character === '"' || character === "'") {
        quote = character;
        offset++;
        continue;
      }
      if (/\s/.test(character)) {
        break;
      }
      offset++;
    }
    if (quote) {
      throw new PROJStringSyntaxError('Unterminated quoted PROJ value', source, start);
    }
    tokens.push({raw: source.slice(start, offset), offset: start});
  }
  return tokens;
}

function decodeParameterValue(rawValue: string, source: string, offset: number): string {
  if (!rawValue) {
    return '';
  }
  const first = rawValue[0];
  if (first !== '"' && first !== "'") {
    if (rawValue.includes('"') || rawValue.includes("'")) {
      throw new PROJStringSyntaxError('Quote must begin a PROJ parameter value', source, offset);
    }
    return rawValue;
  }
  if (rawValue[rawValue.length - 1] !== first) {
    throw new PROJStringSyntaxError('Unterminated quoted PROJ value', source, offset);
  }
  let value = '';
  for (let index = 1; index < rawValue.length - 1; index++) {
    const character = rawValue[index];
    if (character === '\\' && index + 1 < rawValue.length - 1) {
      value += rawValue[++index];
    } else {
      value += character;
    }
  }
  return value;
}

function encodeParameterValue(value: string): string {
  if (value && !/\s/.test(value) && !/["']/.test(value)) {
    return value;
  }
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function getSourceLocation(source: string, offset: number): {line: number; column: number} {
  let line = 1;
  let column = 1;
  for (let index = 0; index < offset && index < source.length; index++) {
    if (source[index] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return {line, column};
}
