// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SQLParameterOptions} from '../parser/sql-parameters';
import type {Expression} from '../expressions';
import {parseSQLExpression} from '../parser/parse-sql-expression';
import {
  validateScaleSpec,
  type ScaleColor,
  type ScaleDomain,
  type ScaleRange,
  type ScaleSpec
} from './scale-types';

/** SQL call shape with arguments produced by the SQL expression parser. */
type Call = {
  type: 'CallExpression';
  callee: {type: 'Identifier'; name: string};
  arguments: Expression[];
};

/** A row expression and its validated, unresolved visualization scale. */
export type ParsedSQLScale = Readonly<{
  /** Row-preserving value expression, evaluated by an Arrow/GPU backend. */
  value: Expression;
  /** Serializable specification, with unresolved domain dependencies. */
  scale: ScaleSpec;
}>;

function call(node: Expression, expected?: string): Call {
  const candidate = node as unknown as Call;
  if (candidate.type !== 'CallExpression' || candidate.callee?.type !== 'Identifier') {
    throw new Error(expected ? `${expected} expects a function call` : 'Expected a scale function');
  }
  if (expected && candidate.callee.name.toUpperCase() !== expected) {
    throw new Error(`Expected ${expected}`);
  }
  return candidate;
}

function name(node: Expression): string {
  const candidate = node as {type: string; name?: string};
  if (candidate.type !== 'Identifier' || !candidate.name) {
    throw new Error('Data-derived scale domain requires one column identifier');
  }
  return candidate.name;
}

/** Uses an existing column directly or records a computed numeric domain. */
function quantileDomain(value: Expression): ScaleDomain {
  return value.type === 'Identifier'
    ? {type: 'extent', column: name(value)}
    : {type: 'expression-extent', expression: value};
}

function literal(node: Expression): string | number {
  const value = node as {type: string; value?: unknown};
  if (
    value.type !== 'Literal' ||
    (typeof value.value !== 'string' && typeof value.value !== 'number') ||
    (typeof value.value === 'number' && !Number.isFinite(value.value))
  ) {
    throw new Error('Scale argument requires a literal number or quoted string');
  }
  return value.value;
}

function number(node: Expression): number {
  // SQL negative numbers are sometimes represented as unary nodes.
  const unary = node as {type: string; operator?: string; argument?: Expression};
  if (
    unary.type === 'UnaryExpression' &&
    (unary.operator === '-' || unary.operator === '+') &&
    unary.argument
  ) {
    const n = number(unary.argument);
    return unary.operator === '-' ? -n : n;
  }
  const value = literal(node);
  if (typeof value !== 'number') throw new Error('Expected numeric scale argument');
  return value;
}

function color(hex: string): ScaleColor {
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) {
    throw new Error('Explicit SQL color stops require #RRGGBB or #RRGGBBAA');
  }
  const bytes = hex.slice(1).match(/../g)!;
  return [0, 1, 2, 3].map(
    index => parseInt(bytes[index] ?? 'ff', 16) / 255
  ) as unknown as ScaleColor;
}

function parseDomain(node: Expression): ScaleDomain {
  const fn = call(node);
  const functionName = fn.callee.name.toUpperCase();
  const args = arrayArguments(fn.arguments);
  switch (functionName) {
    case 'DOMAIN':
      if (args.length === 1 && args[0]!.type === 'Identifier')
        return {type: 'extent', column: name(args[0]!)};
      if (args.length >= 2) return {type: 'fixed', values: args.map(number)};
      break;
    case 'DOMAIN_ZERO':
      if (args.length === 1) return {type: 'extent', column: name(args[0]!), includeZero: true};
      break;
    case 'DOMAIN_SYMMETRIC':
      if (args.length === 2)
        return {type: 'symmetric', column: name(args[0]!), pivot: number(args[1]!)};
      break;
    case 'DOMAIN_QUANTILE':
      if (args.length === 3) {
        return {
          type: 'percentile',
          column: name(args[0]!),
          lower: number(args[1]!),
          upper: number(args[2]!)
        };
      }
      break;
  }
  throw new Error(`Invalid ${functionName} domain arguments`);
}

/** Parses an ordered list of unique fixed category keys. */
function parseCategories(node: Expression): ScaleDomain {
  const values = arrayArguments(call(node, 'CATEGORIES').arguments).map(argument =>
    argument.type === 'Literal' ? literal(argument) : number(argument)
  );
  if (!values.length || new Set(values).size !== values.length) {
    throw new Error('CATEGORIES requires at least one category and no duplicates');
  }
  return {type: 'fixed', values};
}

/** Accepts a single bound list wherever a scale expects an explicit list of stops. */
function arrayArguments(args: Expression[]): Expression[] {
  return args.length === 1 && args[0]!.type === 'ArrayExpression'
    ? (args[0]!.elements as Expression[])
    : args;
}

/** Converts explicit hex colors or normalized numeric RGB/RGBA tuples. */
function colorStop(node: Expression): ScaleColor {
  if (node.type !== 'ArrayExpression') {
    const value = literal(node);
    if (typeof value !== 'string')
      throw new Error('Palette colors require hex strings or RGB/RGBA tuples');
    return color(value);
  }
  if (node.elements.length !== 3 && node.elements.length !== 4) {
    throw new Error('Palette colors require RGB or RGBA tuples');
  }
  const components = (node.elements as Expression[]).map(number);
  return [components[0]!, components[1]!, components[2]!, components[3] ?? 1];
}

function parseRange(node: Expression): ScaleRange {
  const fn = call(node);
  const args = arrayArguments(fn.arguments);
  if (
    fn.callee.name.toUpperCase() === 'PALETTE' &&
    fn.arguments.length === 1 &&
    fn.arguments[0]?.type === 'ArrayExpression'
  ) {
    return {type: 'colors', values: args.map(colorStop)};
  }
  switch (fn.callee.name.toUpperCase()) {
    case 'RANGE':
      if (args.length >= 2) return {type: 'numeric', values: args.map(number)};
      break;
    case 'PALETTE': {
      if (args.length === 1) {
        const stop = literal(args[0]!);
        if (typeof stop === 'string' && stop.startsWith('#')) {
          return {type: 'colors', values: [color(stop)]};
        }
      }
      if (
        args.length === 1 ||
        (args.length === 2 &&
          typeof literal(args[0]!) === 'string' &&
          typeof literal(args[1]!) === 'number')
      ) {
        const paletteName = literal(args[0]!);
        if (typeof paletteName !== 'string') throw new Error('Palette name must be a string');
        const count = args.length === 2 ? number(args[1]!) : undefined;
        return {type: 'palette', name: paletteName, ...(count === undefined ? {} : {count})};
      }
      if (args.length >= 2 && args.every(arg => typeof literal(arg) === 'string')) {
        return {type: 'colors', values: args.map(arg => color(literal(arg) as string))};
      }
      break;
    }
  }
  throw new Error('Expected RANGE(numbers...) or PALETTE(name[, count] | color stops...)');
}

/**
 * Parse one scale expression into a row-value AST and a JSON-safe scale spec.
 * This does not evaluate domain statistics, produce colors, or modify row count.
 */
export function parseSQLScaleExpression(
  sql: string,
  options: SQLParameterOptions = {}
): ParsedSQLScale {
  return parseSQLScaleAST(parseSQLExpression(sql, options));
}

/**
 * Extracts a scale from a parsed SQL expression without reparsing or evaluating it.
 *
 * Pass a scale call from `parseSQLExpression` or a SELECT projection. The returned
 * value retains the input row-expression identity; this function does not mutate
 * the AST, resolve domain statistics, or compile backend-specific code.
 * @param expression - A scale call in the public portable expression AST.
 * @returns The row-value expression and validated scale specification.
 * @throws If the root is not a supported scale call or its scale arguments are invalid.
 */
export function parseSQLScaleAST(expression: Expression): ParsedSQLScale {
  const root = call(expression);
  const trailing = root.arguments.length === 4 ? root.arguments[3] : undefined;
  if (
    trailing?.type !== 'CallExpression' ||
    trailing.callee.type !== 'Identifier' ||
    String(trailing.callee['name']).toUpperCase() !== 'NICE'
  )
    return parseScaleCall(root);

  const {value, scale} = parseScaleCall({...root, arguments: root.arguments.slice(0, 3)});
  if (
    (scale.type !== 'sequential' && scale.type !== 'quantile') ||
    trailing.arguments.length ||
    (scale.domain.type === 'fixed' && scale.domain.values.length !== 2)
  )
    throw new Error('NICE() requires a two-endpoint sequential or quantile scale');
  return {value, scale: validateScaleSpec({...scale, nice: true})};
}

/** Parses the underlying scale arguments before applying optional rounding. */
function parseScaleCall(root: Call): ParsedSQLScale {
  const fn = root.callee.name.toUpperCase();
  const args = root.arguments;
  const names: Record<string, ScaleSpec['type']> = {
    SCALE_LINEAR: 'linear',
    SCALE_SQRT: 'sqrt',
    SCALE_LOG: 'log',
    SCALE_POWER: 'linear',
    SCALE_SYMLOG: 'symlog',
    SCALE_COLOR: 'sequential',
    SCALE_CYCLIC: 'cyclic',
    SCALE_DIVERGING: 'diverging',
    SCALE_ORDINAL: 'ordinal',
    SCALE_QUANTILE: 'quantile',
    SCALE_QUANTIZE: 'quantize',
    SCALE_THRESHOLD: 'threshold'
  };
  const type = names[fn];
  if (!type) throw new Error(`Unsupported SQL scale function: ${fn}`);
  const inferredOrdinal = fn === 'SCALE_ORDINAL' && args.length === 2;
  const special = fn === 'SCALE_POWER' || fn === 'SCALE_SYMLOG';
  if (fn === 'SCALE_POWER' && args.length !== 4)
    throw new Error('SCALE_POWER requires four arguments');
  if (!inferredOrdinal && args.length !== 3 && !(special && args.length === 4)) {
    throw new Error(`${fn} expects ${fn === 'SCALE_ORDINAL' ? 'two or three' : 'three'} arguments`);
  }
  const value = args[0]!;
  const domainArg = args[1];
  const wrapped =
    domainArg?.type === 'CallExpression' &&
    domainArg.callee.type === 'Identifier' &&
    String(domainArg.callee['name']).toUpperCase() === 'TRANSFORM_DOMAIN'
      ? call(domainArg, 'TRANSFORM_DOMAIN').arguments
      : undefined;
  if (
    wrapped &&
    (wrapped.length !== 2 ||
      args.length !== 3 ||
      !['SCALE_LINEAR', 'SCALE_COLOR', 'SCALE_DIVERGING'].includes(fn))
  )
    throw new Error('TRANSFORM_DOMAIN requires a domain and a transform on a continuous scale');
  const modifier = wrapped && call(wrapped[1]!);
  const transformName = modifier?.callee.name.toUpperCase();
  if (
    modifier &&
    (modifier.arguments.length !== 1 || (transformName !== 'POWER' && transformName !== 'SYMLOG'))
  )
    throw new Error('Expected POWER(exponent) or SYMLOG(constant)');
  const transform =
    fn === 'SCALE_POWER' || transformName === 'POWER'
      ? {type: 'power' as const, exponent: number(args[3] ?? modifier!.arguments[0]!)}
      : (fn === 'SCALE_SYMLOG' && args[3]) || transformName === 'SYMLOG'
        ? {type: 'symlog' as const, constant: number(args[3] ?? modifier!.arguments[0]!)}
        : undefined;
  const domain = inferredOrdinal
    ? {type: 'categories' as const, column: name(value)}
    : fn === 'SCALE_ORDINAL'
      ? parseCategories(args[1]!)
      : fn === 'SCALE_QUANTILE'
        ? quantileDomain(value)
        : fn === 'SCALE_QUANTIZE'
          ? {type: 'extent' as const, column: name(value)}
          : fn === 'SCALE_THRESHOLD'
            ? {type: 'fixed' as const, values: call(args[1]!, 'ARRAY').arguments.map(number)}
            : parseDomain(wrapped?.[0] ?? args[1]!);
  let range = parseRange(args[inferredOrdinal ? 1 : 2]!);
  if (fn === 'SCALE_QUANTILE' || fn === 'SCALE_QUANTIZE') {
    const count = number(args[1]!);
    if (!Number.isSafeInteger(count) || count < 2) {
      throw new Error(`${fn} class count must be an integer >= 2`);
    }
    if (range.type === 'palette') {
      range = {...range, count};
    } else if (fn !== 'SCALE_QUANTILE' || range.type !== 'colors') {
      throw new Error(`${fn} requires a named palette`);
    } else if (range.values.length !== count) {
      throw new Error('SCALE_QUANTILE requires one color per class');
    }
  }
  const colors = [
    'cyclic',
    'sequential',
    'diverging',
    'ordinal',
    'quantile',
    'quantize',
    'threshold'
  ].includes(type);
  if (colors && range.type === 'numeric') throw new Error(`${fn} requires a color range`);
  if (!colors && range.type !== 'numeric') throw new Error(`${fn} requires a numeric RANGE`);
  if (type === 'threshold' && domain.type === 'fixed') {
    const breaks = domain.values as readonly number[];
    if (!breaks.length || breaks.some((value, index) => index > 0 && value <= breaks[index - 1]!)) {
      throw new Error('SCALE_THRESHOLD breaks must be nonempty and strictly increasing');
    }
    const count = breaks.length + 1;
    if (range.type === 'palette' && range.count === undefined) range = {...range, count};
    if (
      (range.type === 'colors' && range.values.length !== count) ||
      (range.type === 'palette' && range.count !== count)
    ) {
      throw new Error('SCALE_THRESHOLD requires one more color than breaks');
    }
  } else if (
    type !== 'cyclic' &&
    domain.type === 'fixed' &&
    range.type === 'colors' &&
    domain.values.length !== range.values.length
  ) {
    throw new Error('Explicit domain and color stops must have equal lengths');
  }
  const scale = validateScaleSpec({type, domain, range, ...(transform ? {transform} : {})});
  return {value, scale};
}
