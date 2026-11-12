// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A syntax error with a position in the original SQL input. */
export class SQLParseError extends SyntaxError {
  /** Zero-based UTF-16 offset. */
  readonly offset: number;
  /** One-based line and column, with CRLF counted as one newline. */
  readonly line: number;
  readonly column: number;
  /** Bounded source preview at the cursor, or null at end of input. */
  readonly token: string | null;

  constructor(
    readonly reason: string,
    source: string,
    offset: number
  ) {
    const lines = source.slice(0, offset).split(/\r\n|\r|\n/);
    const line = lines.length;
    const column = lines[line - 1]!.length + 1;
    const token = source.slice(offset, offset + 32).match(/^:?\w+|^\S/u)?.[0] ?? null;
    super(
      `${reason} (line ${line}, column ${column}${token ? `, near ${JSON.stringify(token)}` : ''})`
    );
    this.name = 'SQLParseError';
    this.offset = offset;
    this.line = line;
    this.column = column;
    this.token = token;
  }
}
