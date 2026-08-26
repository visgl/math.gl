// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** WKT-CRS standards and common compatibility dialects understood by the validator. */
export type WKTCRSProfile = 'wkt1' | 'wkt2:2015' | 'wkt2:2019' | 'gdal' | 'esri';

/** Delimiter used by a WKT node. */
export type WKTCRSDelimiter = 'bracket' | 'parenthesis';

/** A quoted WKT string literal. */
export type WKTCRSString = {
  readonly type: 'string';
  readonly value: string;
};

/** A WKT number with its source lexeme retained to preserve precision. */
export type WKTCRSNumber = {
  readonly type: 'number';
  readonly value: number;
  readonly raw: string;
};

/** An unquoted WKT enumeration or identifier. */
export type WKTCRSEnumeration = {
  readonly type: 'enumeration';
  readonly value: string;
};

/** A keyword and its ordered WKT values. */
export type WKTCRSNode = {
  readonly type: 'node';
  readonly keyword: string;
  readonly delimiter: WKTCRSDelimiter;
  readonly values: readonly WKTCRSValue[];
};

/** Values accepted inside a WKT node. */
export type WKTCRSValue = WKTCRSNode | WKTCRSString | WKTCRSNumber | WKTCRSEnumeration;

/** Syntax tree for one WKT coordinate reference system or coordinate operation. */
export type WKTCRSAst = {
  readonly type: 'wkt-crs';
  readonly root: WKTCRSNode;
};

/** Options for parsing WKT coordinate reference systems. */
export type ParseWKTCRSOptions = {
  /** Validation profile. `auto` distinguishes WKT1 from WKT2 by root keyword. */
  profile?: WKTCRSProfile | 'auto';
  /** Validate known keywords and delimiter consistency after parsing. */
  strict?: boolean;
};

/** Options for encoding a WKT syntax tree. */
export type EncodeWKTCRSOptions = {
  /** Compact output is the canonical serialization. */
  format?: 'compact' | 'pretty';
  /** Number of spaces used for each pretty-print indentation level. */
  indent?: number;
};

/** Options for validating a WKT syntax tree. */
export type ValidateWKTCRSOptions = {
  /** Validation profile. `auto` distinguishes WKT1 from WKT2 by root keyword. */
  profile?: WKTCRSProfile | 'auto';
  /** Permit unrecognized extension keywords. Defaults to `false`. */
  allowExtensions?: boolean;
};

/** Stable validation issue codes returned by {@link validateWKTCRS}. */
export type WKTCRSValidationIssueCode =
  | 'invalid-root'
  | 'unknown-keyword'
  | 'mixed-delimiters'
  | 'empty-node';

/** One profile validation issue in a WKT syntax tree. */
export type WKTCRSValidationIssue = {
  readonly code: WKTCRSValidationIssueCode;
  readonly message: string;
  /** Zero-based value indices from the root node to the offending node. */
  readonly path: readonly number[];
  readonly keyword: string;
};

/** Syntax error containing a source offset and one-based line and column. */
export class WKTCRSSyntaxError extends SyntaxError {
  readonly offset: number;
  readonly line: number;
  readonly column: number;

  /** Create a WKT syntax error at a source location. */
  constructor(message: string, source: string, offset: number) {
    const location = getSourceLocation(source, offset);
    super(`${message} at ${location.line}:${location.column}`);
    this.name = 'WKTCRSSyntaxError';
    this.offset = offset;
    this.line = location.line;
    this.column = location.column;
  }
}

/** Error thrown when strict WKT profile validation fails. */
export class WKTCRSValidationError extends Error {
  readonly issues: readonly WKTCRSValidationIssue[];

  /** Create an error from one or more validation issues. */
  constructor(issues: readonly WKTCRSValidationIssue[]) {
    super(issues[0]?.message || 'WKT validation failed');
    this.name = 'WKTCRSValidationError';
    this.issues = issues;
  }
}

const NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?/;
const KEYWORD_PATTERN = /^[A-Za-z][A-Za-z0-9_]*/;

const WKT1_ROOT_KEYWORDS = new Set([
  'COMPD_CS',
  'FITTED_CS',
  'GEOCCS',
  'GEOGCS',
  'LOCAL_CS',
  'PROJCS',
  'VERT_CS'
]);

const WKT1_KEYWORDS = new Set([
  ...WKT1_ROOT_KEYWORDS,
  'AUTHORITY',
  'AXIS',
  'CONCAT_MT',
  'DATUM',
  'INVERSE_MT',
  'LOCAL_DATUM',
  'PARAMETER',
  'PARAM_MT',
  'PASSTHROUGH_MT',
  'PRIMEM',
  'PROJECTION',
  'SPHEROID',
  'TOWGS84',
  'UNIT',
  'VERT_DATUM'
]);

const WKT2_ROOT_KEYWORDS = new Set([
  'BOUNDCRS',
  'COMPOUNDCRS',
  'CONCATENATEDOPERATION',
  'COORDINATEMETADATA',
  'COORDINATEOPERATION',
  'DERIVEDPROJCRS',
  'ENGCRS',
  'ENGINEERINGCRS',
  'GEODCRS',
  'GEODETICCRS',
  'GEOGCRS',
  'GEOGRAPHICCRS',
  'PARAMETRICCRS',
  'POINTMOTIONOPERATION',
  'PROJCRS',
  'PROJECTEDCRS',
  'TEMPORALCRS',
  'TIMECRS',
  'VERTCRS',
  'VERTICALCRS'
]);

// WKT is intentionally represented as a generic syntax tree. This set supports strict profile
// checking without restricting tolerant parsing of vendor extensions.
const WKT2_KEYWORDS = new Set([
  ...WKT2_ROOT_KEYWORDS,
  'ABRIDGEDTRANSFORMATION',
  'ANCHOR',
  'ANGLEUNIT',
  'AREA',
  'AXIS',
  'BASEENGCRS',
  'BASEGEODCRS',
  'BASEGEOGCRS',
  'BASEPARAMCRS',
  'BASEPROJCRS',
  'BASETIMECRS',
  'BASEVERTCRS',
  'BBOX',
  'BEARING',
  'CALENDAR',
  'CITATION',
  'CONVERSION',
  'COORDEPOCH',
  'CS',
  'DATUM',
  'DERIVINGCONVERSION',
  'DYNAMIC',
  'EDATUM',
  'ELLIPSOID',
  'ENGINEERINGDATUM',
  'ENSEMBLE',
  'ENSEMBLEACCURACY',
  'EPOCH',
  'FRAMEEPOCH',
  'GEODETICDATUM',
  'GEOIDMODEL',
  'ID',
  'INTERPOLATIONCRS',
  'LENGTHUNIT',
  'MEMBER',
  'MERIDIAN',
  'METHOD',
  'MODEL',
  'OPERATIONACCURACY',
  'ORDER',
  'PARAMETER',
  'PARAMETERFILE',
  'PARAMETRICDATUM',
  'PARAMETRICUNIT',
  'PDATUM',
  'PRIMEM',
  'REMARK',
  'SCALEUNIT',
  'SCOPE',
  'SOURCECRS',
  'STEP',
  'TARGETCRS',
  'TCRS',
  'TDATUM',
  'TEMPORALDATUM',
  'TIMEEXTENT',
  'TIMEORIGIN',
  'TIMEUNIT',
  'TRF',
  'URI',
  'USAGE',
  'VDATUM',
  'VERSION',
  'VERTICALDATUM',
  'VRF'
]);

/** Parse WKT1, WKT2, or a compatible vendor WKT serialization. */
export function parseWKTCRS(text: string, options?: ParseWKTCRSOptions): WKTCRSAst {
  const parser = new WKTParser(text);
  const ast: WKTCRSAst = {type: 'wkt-crs', root: parser.parse()};

  if (options?.strict) {
    const issues = validateWKTCRS(ast, {
      profile: options.profile,
      allowExtensions: false
    });
    if (issues.length > 0) {
      throw new WKTCRSValidationError(issues);
    }
  }

  return ast;
}

/** Encode a WKT syntax tree without changing value lexemes or keyword spelling. */
export function encodeWKTCRS(ast: WKTCRSAst, options?: EncodeWKTCRSOptions): string {
  if (!ast || ast.type !== 'wkt-crs' || ast.root?.type !== 'node') {
    throw new TypeError('encodeWKTCRS expects a WKTCRSAst');
  }
  const format = options?.format || 'compact';
  const indent = options?.indent ?? 2;
  if (!Number.isInteger(indent) || indent < 0) {
    throw new RangeError('WKT indentation must be a non-negative integer');
  }
  return encodeNode(ast.root, format, indent, 0);
}

/** Validate root keywords, known profile keywords, and delimiter consistency. */
export function validateWKTCRS(
  ast: WKTCRSAst,
  options?: ValidateWKTCRSOptions
): WKTCRSValidationIssue[] {
  if (!ast || ast.type !== 'wkt-crs' || ast.root?.type !== 'node') {
    throw new TypeError('validateWKTCRS expects a WKTCRSAst');
  }

  const profile = resolveProfile(ast.root.keyword, options?.profile || 'auto');
  const rootKeywords =
    profile === 'wkt1' || profile === 'gdal' || profile === 'esri'
      ? WKT1_ROOT_KEYWORDS
      : WKT2_ROOT_KEYWORDS;
  const knownKeywords =
    profile === 'wkt1' || profile === 'gdal' || profile === 'esri' ? WKT1_KEYWORDS : WKT2_KEYWORDS;
  const issues: WKTCRSValidationIssue[] = [];
  const rootKeyword = ast.root.keyword.toUpperCase();

  if (!rootKeywords.has(rootKeyword)) {
    issues.push({
      code: 'invalid-root',
      message: `${ast.root.keyword} is not a ${profile} root keyword`,
      path: [],
      keyword: ast.root.keyword
    });
  }

  visitNode(ast.root, [], ast.root.delimiter, node => {
    const keyword = node.node.keyword.toUpperCase();
    if (!options?.allowExtensions && !knownKeywords.has(keyword)) {
      issues.push({
        code: 'unknown-keyword',
        message: `${node.node.keyword} is not defined by the ${profile} profile`,
        path: node.path,
        keyword: node.node.keyword
      });
    }
    if (node.node.delimiter !== ast.root.delimiter) {
      issues.push({
        code: 'mixed-delimiters',
        message: `${node.node.keyword} uses a different delimiter from the WKT root`,
        path: node.path,
        keyword: node.node.keyword
      });
    }
    if (node.node.values.length === 0) {
      issues.push({
        code: 'empty-node',
        message: `${node.node.keyword} must contain at least one value`,
        path: node.path,
        keyword: node.node.keyword
      });
    }
  });

  return issues;
}

class WKTParser {
  private readonly source: string;
  private offset = 0;

  constructor(source: string) {
    this.source = source;
  }

  parse(): WKTCRSNode {
    this.skipWhitespace();
    const root = this.parseNode();
    this.skipWhitespace();
    if (this.offset !== this.source.length) {
      this.fail('Unexpected content after WKT root');
    }
    return root;
  }

  private parseNode(): WKTCRSNode {
    const keyword = this.parseKeyword();
    return this.parseNodeAfterKeyword(keyword);
  }

  private parseNodeAfterKeyword(keyword: string): WKTCRSNode {
    this.skipWhitespace();
    const opening = this.source[this.offset];
    if (opening !== '[' && opening !== '(') {
      this.fail(`Expected '[' or '(' after ${keyword}`);
    }
    this.offset++;
    const delimiter: WKTCRSDelimiter = opening === '[' ? 'bracket' : 'parenthesis';
    const closing = opening === '[' ? ']' : ')';
    const values: WKTCRSValue[] = [];
    this.skipWhitespace();

    if (this.source[this.offset] === closing) {
      this.offset++;
      return {type: 'node', keyword, delimiter, values};
    }

    while (this.offset < this.source.length) {
      values.push(this.parseValue());
      this.skipWhitespace();
      const character = this.source[this.offset];
      if (character === ',') {
        this.offset++;
        this.skipWhitespace();
        if (this.source[this.offset] === closing) {
          this.fail('Expected a WKT value after comma');
        }
        continue;
      }
      if (character === closing) {
        this.offset++;
        return {type: 'node', keyword, delimiter, values};
      }
      if (character === ']' || character === ')') {
        this.fail(`Expected '${closing}' to close ${keyword}`);
      }
      this.fail(`Expected ',' or '${closing}' in ${keyword}`);
    }

    this.fail(`Unterminated ${keyword} node`);
  }

  private parseValue(): WKTCRSValue {
    this.skipWhitespace();
    const character = this.source[this.offset];
    if (character === '"') {
      return this.parseString();
    }

    const numberMatch = this.source.slice(this.offset).match(NUMBER_PATTERN);
    if (numberMatch) {
      const raw = numberMatch[0];
      this.offset += raw.length;
      return {type: 'number', value: Number(raw), raw};
    }

    const keywordMatch = this.source.slice(this.offset).match(KEYWORD_PATTERN);
    if (!keywordMatch) {
      this.fail('Expected a WKT value');
    }
    const value = keywordMatch[0];
    this.offset += value.length;
    this.skipWhitespace();
    if (this.source[this.offset] === '[' || this.source[this.offset] === '(') {
      return this.parseNodeAfterKeyword(value);
    }
    return {type: 'enumeration', value};
  }

  private parseKeyword(): string {
    const match = this.source.slice(this.offset).match(KEYWORD_PATTERN);
    if (!match) {
      this.fail('Expected a WKT keyword');
    }
    this.offset += match[0].length;
    return match[0];
  }

  private parseString(): WKTCRSString {
    this.offset++;
    let value = '';
    while (this.offset < this.source.length) {
      const character = this.source[this.offset++];
      if (character === '"') {
        if (this.source[this.offset] === '"') {
          value += '"';
          this.offset++;
          continue;
        }
        return {type: 'string', value};
      }
      if (character === '\\' && this.source[this.offset] === '"') {
        value += '"';
        this.offset++;
        continue;
      }
      value += character;
    }
    this.fail('Unterminated WKT string');
  }

  private skipWhitespace(): void {
    while (this.offset < this.source.length && /\s/.test(this.source[this.offset])) {
      this.offset++;
    }
  }

  private fail(message: string): never {
    throw new WKTCRSSyntaxError(message, this.source, this.offset);
  }
}

function encodeNode(
  node: WKTCRSNode,
  format: 'compact' | 'pretty',
  indent: number,
  depth: number
): string {
  const opening = node.delimiter === 'bracket' ? '[' : '(';
  const closing = node.delimiter === 'bracket' ? ']' : ')';
  if (node.values.length === 0) {
    return `${node.keyword}${opening}${closing}`;
  }
  if (format === 'compact') {
    return `${node.keyword}${opening}${node.values
      .map(value => encodeValue(value, format, indent, depth + 1))
      .join(',')}${closing}`;
  }
  const indentation = ' '.repeat(indent * (depth + 1));
  const closingIndentation = ' '.repeat(indent * depth);
  const values = node.values
    .map(value => `${indentation}${encodeValue(value, format, indent, depth + 1)}`)
    .join(',\n');
  return `${node.keyword}${opening}\n${values}\n${closingIndentation}${closing}`;
}

function encodeValue(
  value: WKTCRSValue,
  format: 'compact' | 'pretty',
  indent: number,
  depth: number
): string {
  switch (value.type) {
    case 'node':
      return encodeNode(value, format, indent, depth);
    case 'string':
      return `"${value.value.replace(/"/g, '""')}"`;
    case 'number':
      return value.raw;
    case 'enumeration':
      return value.value;
  }
}

function resolveProfile(rootKeyword: string, profile: WKTCRSProfile | 'auto'): WKTCRSProfile {
  if (profile !== 'auto') {
    return profile;
  }
  return WKT1_ROOT_KEYWORDS.has(rootKeyword.toUpperCase()) ? 'wkt1' : 'wkt2:2019';
}

function visitNode(
  node: WKTCRSNode,
  path: number[],
  rootDelimiter: WKTCRSDelimiter,
  visitor: (entry: {node: WKTCRSNode; path: number[]; rootDelimiter: WKTCRSDelimiter}) => void
): void {
  visitor({node, path, rootDelimiter});
  for (let index = 0; index < node.values.length; index++) {
    const value = node.values[index];
    if (value.type === 'node') {
      visitNode(value, [...path, index], rootDelimiter, visitor);
    }
  }
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
