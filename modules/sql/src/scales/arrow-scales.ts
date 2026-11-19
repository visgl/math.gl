// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Field,
  FixedSizeList,
  Float16,
  Float32,
  Float64,
  Uint8,
  Uint16,
  vectorFromArray,
  type RecordBatch,
  type Schema,
  type Table,
  type Vector
} from 'apache-arrow';
import {compileArrowExpression} from '../arrow/compiler';
import {nullTupleVector} from '../arrow/list-values';
import type {ArrowExpression, ArrowTableFunction} from '../arrow/types';
import {compileResolvedScale} from './compile-scale';
import {
  arrowScaleValue,
  resolveArrowDomains,
  resolveArrowExpressionStatistics,
  resolveArrowQuantiles
} from './arrow-domains';
import {parseSQLScaleAST, type ParsedSQLScale} from './parse-sql-scale';
import {parseSQLExpression} from '../parser/parse-sql-expression';
import type {Expression} from '../expressions';
import type {CompiledArrowExpression} from '../arrow/types';
import type {ResolvedScale, ScaleColor, ScaleSpec, ScaleValue} from './scale-types';

export type CompiledArrowScale = Readonly<{
  /** Authoritative sampler and resolved legend metadata. */
  scale: ResolvedScale;
  /** Evaluates the same scale against the parsed value expression, preserving row count. */
  evaluate(table: Table): Vector;
  evaluateBatch(batch: RecordBatch): Vector;
}>;

function asColor(value: number | ScaleColor | null): ScaleColor | null {
  if (value === null) return null;
  if (typeof value === 'number') throw new Error('Expected a color-valued scale');
  return value;
}

function toVector(rows: (number | ScaleColor | null)[], spec: ScaleSpec): Vector {
  const numeric = spec.range.type === 'numeric';
  if (numeric) {
    return vectorFromArray(rows as (number | null)[], new Float64());
  }
  const format = spec.encoding?.format ?? 'rgba8unorm';
  const type =
    format === 'rgba8unorm'
      ? new Uint8()
      : format === 'rgba16unorm'
        ? new Uint16()
        : format === 'rgba16float'
          ? new Float16()
          : new Float32();
  const factor = format === 'rgba8unorm' ? 255 : format === 'rgba16unorm' ? 65535 : undefined;
  const vector = nullTupleVector(new FixedSizeList(4, new Field('item', type, false)), rows.length);
  const channels = vector.getChildAt(0)!;
  for (let row = 0; row < rows.length; row++) {
    const color = asColor(rows[row]!);
    if (!color) continue;
    for (let component = 0; component < 4; component++) {
      const channel = color[component]!;
      if (
        !Number.isFinite(channel) ||
        (format === 'rgba16float' && Math.abs(channel) >= 65520) ||
        (format === 'rgba32float' && !Number.isFinite(Math.fround(channel)))
      )
        throw new Error('Scale color cannot be represented in the requested format');
      channels.set(
        row * 4 + component,
        factor === undefined ? channel : Math.round(Math.max(0, Math.min(1, channel)) * factor)
      );
    }
    vector.data[0]!.setValid(row, true);
  }
  return vector;
}

/** Determines the number of classes declared by the range. */
function getClassCount(spec: ScaleSpec): number | undefined {
  if (spec.range.type === 'palette') return spec.range.count;
  return spec.type === 'quantile' && spec.range.type === 'colors'
    ? spec.range.values.length
    : undefined;
}

/** Compile a shared domain + range and bind its per-row Arrow expression once. */
export function compileArrowScale(
  table: Table,
  parsed: ParsedSQLScale,
  resolvedDomain?: readonly ScaleValue[],
  functions?: readonly ArrowTableFunction[]
): CompiledArrowScale {
  /** Class count used by the palette for quantile classification. */
  const classCount = getClassCount(parsed.scale);
  if (parsed.scale.type === 'quantile' && (!classCount || parsed.scale.domain.type === 'fixed')) {
    throw new Error('Quantile scale requires a class count and a data-derived domain');
  }
  if (parsed.scale.domain.type === 'expression-extent') {
    const resolution = resolveArrowExpressionStatistics(
      table,
      parsed.scale.domain.expression as Expression,
      parsed.scale.type === 'quantile' ? classCount : undefined,
      functions
    );
    return bindArrowScale(
      table.schema,
      parsed,
      {...resolution, domain: resolvedDomain ?? resolution.domain},
      functions
    );
  }
  /** Resolved inputs shared with the schema-only binder. */
  const resolution: ArrowScaleResolution = {
    domain: resolvedDomain ?? resolveArrowDomains(table, [parsed.scale.domain])[0]!,
    ...(parsed.scale.type === 'quantile' && parsed.scale.domain.type !== 'fixed'
      ? {quantileBreaks: resolveArrowQuantiles(table, parsed.scale.domain.column, classCount!)}
      : {})
  };
  return bindArrowScale(table.schema, parsed, resolution, functions);
}

/** Statistics needed to bind a scale without retaining its source table. */
export type ArrowScaleResolution = Readonly<{
  /** Resolved extent, categories, or explicit domain stops. */
  domain: readonly ScaleValue[];
  /** Required for quantile classification. Supply one break per class boundary. */
  quantileBreaks?: readonly number[];
}>;

/** Binds a resolved scale to an Arrow schema without reading any rows. */
export function bindArrowScale(
  inputSchema: Schema,
  parsed: ParsedSQLScale,
  {domain, quantileBreaks}: ArrowScaleResolution,
  functions?: readonly ArrowTableFunction[]
): CompiledArrowScale {
  /** Break points used by classified scales. */
  let thresholds: readonly number[] | undefined;
  /** Scale transform and classification family. */
  const kind = parsed.scale.type;
  /** Number of discrete classes declared by the palette, if any. */
  const classCount = getClassCount(parsed.scale);
  if (kind === 'quantile') {
    if (
      classCount === undefined ||
      !Number.isSafeInteger(classCount) ||
      classCount < 2 ||
      quantileBreaks?.length !== classCount - 1
    ) {
      throw new Error('Quantile scale requires one resolved break per class boundary');
    }
    if (
      quantileBreaks.some(
        (value, index) =>
          !Number.isFinite(value) || (index > 0 && value < quantileBreaks[index - 1]!)
      )
    ) {
      throw new Error('Quantile scale breaks must be finite and nondecreasing');
    }
    thresholds = quantileBreaks;
  } else if (kind === 'quantize') {
    if (
      !classCount ||
      domain.length !== 2 ||
      typeof domain[0] !== 'number' ||
      typeof domain[1] !== 'number'
    ) {
      throw new Error('Quantize scale requires a numeric extent and a class count');
    }
    thresholds = Array.from(
      {length: classCount - 1},
      (_, i) =>
        (domain[0] as number) +
        (((domain[1] as number) - (domain[0] as number)) * (i + 1)) / classCount
    );
  } else if (kind === 'threshold') {
    if (domain.some(value => typeof value !== 'number')) {
      throw new Error('Thresholds require numeric domain values');
    }
    thresholds = domain as readonly number[];
  }
  /** Evaluator shared by Arrow output and descriptor consumers. */
  const scale = compileResolvedScale(parsed.scale, domain, thresholds);
  /** Input expression bound once to the source schema. */
  const compiled = compileArrowExpression(parsed.value as ArrowExpression, {
    inputSchema,
    functions
  });
  /** Maps one vector to the selected scalar or color encoding. */
  const evaluateVector = (input: Vector): Vector => {
    const result: (number | ScaleColor | null)[] = Array.from({length: input.length}, (_, i) => {
      const value = arrowScaleValue(input.get(i));
      if (value === null || value === undefined) return scale.sample(null);
      if (typeof value !== 'number' && typeof value !== 'string') {
        throw new Error('Scale expression must produce scalar numeric or categorical values');
      }
      return scale.sample(value) as number | ScaleColor | null;
    });
    return toVector(result, parsed.scale);
  };
  return {
    scale,
    evaluate: input => evaluateVector(compiled.evaluateTable(input)),
    evaluateBatch: batch => evaluateVector(compiled.evaluate(batch))
  };
}

/**
 * Compile several scales, sharing one Arrow domain scan for repeated columns.
 * Returns independent samplers, vectors and authoritative descriptors.
 */
export function compileArrowScales<K extends string>(
  table: Table,
  expressions: Readonly<Record<K, ParsedSQLScale>>,
  functions?: readonly ArrowTableFunction[]
): Record<K, CompiledArrowScale> {
  const entries = Object.entries(expressions) as [K, ParsedSQLScale][];
  const columnEntries = entries.filter(
    ([, parsed]) => parsed.scale.domain.type !== 'expression-extent'
  );
  const domains = resolveArrowDomains(
    table,
    columnEntries.map(([, parsed]) => parsed.scale.domain)
  );
  const domainsByKey = new Map(columnEntries.map(([key], index) => [key, domains[index]!]));
  return Object.fromEntries(
    entries.map(([key, parsed]) => [
      key,
      compileArrowScale(table, parsed, domainsByKey.get(key), functions)
    ])
  ) as Record<K, CompiledArrowScale>;
}

export {createStreamingDomainAccumulator} from './streaming-domains';
export type {StreamingDomainOptions} from './streaming-domains';

/** A composed expression with one authoritative descriptor per scale call, in traversal order. */
export type CompiledArrowScaleExpression = CompiledArrowExpression & {
  /** Domains resolve against the complete input table, independently of CASE branch selection. */
  readonly scales: readonly ResolvedScale[];
};

/**
 * Compiles SQL containing scales inside CASE, COALESCE, or other expressions.
 * Domains resolve once over the complete table. Per-row scale inputs obey the
 * expression compiler's active-row masks, so unselected CASE branches are not evaluated.
 * Recompile after changing the source data to refresh data-derived domains.
 */
export function compileArrowScaleExpression(
  table: Table,
  expression: string | Expression,
  functions: readonly ArrowTableFunction[] = []
): CompiledArrowScaleExpression {
  /** Parsed caller expression; rewriting never mutates it. */
  const ast = typeof expression === 'string' ? parseSQLExpression(expression) : expression;
  /** Reserved caller identifiers and generated function names. */
  const names = new Set(functions.map(fn => fn.name.toUpperCase()));
  /** Resolved descriptors in outer-before-inner traversal order. */
  const scales: ResolvedScale[] = [];
  /** Caller functions followed by generated scale functions. */
  const declarations = [...functions];
  /** Reserves user identifiers before allocating internal function names. */
  function reserve(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if ('type' in node && node.type === 'Identifier' && 'name' in node)
      names.add(String(node.name).toUpperCase());
    for (const value of Object.values(node)) reserve(value);
  }
  reserve(ast);
  /** Monotonic suffix for collision-free internal names. */
  let nextName = 0;
  /** Replaces each scale call with a typed vector function bound to its resolved domain. */
  function visit(node: any): any {
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node)) return node.map(visit);
    if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'Identifier' &&
      /^SCALE_(LINEAR|SQRT|LOG|POWER|SYMLOG|COLOR|DIVERGING|ORDINAL|QUANTILE|QUANTIZE|THRESHOLD)$/i.test(
        node.callee.name
      )
    ) {
      /** Reserve descriptor order before recursively resolving nested scale inputs. */
      const scaleIndex = scales.length;
      scales.length++;
      /** Rewrite the value before parsing so computed domains reference generated functions too. */
      const valueExpression = visit(node.arguments[0]);
      /** Validated outer scale with nested inputs already bound. */
      const parsed = parseSQLScaleAST({
        ...node,
        arguments: [valueExpression, ...node.arguments.slice(1)]
      });
      /** Whole-table domain and sampler, using all nested function declarations. */
      const {scale} = compileArrowScale(table, parsed, undefined, declarations);
      scales[scaleIndex] = scale;
      /** Input type for the generated vector function overload. */
      const input = compileArrowExpression(parsed.value as ArrowExpression, {
        inputSchema: table.schema,
        functions: declarations
      });
      /** Private function identifier that cannot shadow a caller name. */
      let name: string;
      do {
        name = '__scale_' + nextName++;
      } while (names.has(name.toUpperCase()));
      names.add(name.toUpperCase());
      declarations.push({
        name,
        prototypes: [
          {
            arguments: [input.outputField],
            result: new Field(name, toVector([], parsed.scale).type, true),
            nullHandling: 'call',
            evaluate: ([values], {activeRows, length}) =>
              toVector(
                Array.from({length}, (_, row) => {
                  if (!activeRows[row]) return null;
                  /** Active scalar input with Arrow integer normalization. */
                  const value = arrowScaleValue(values!.get(row));
                  if (
                    value !== null &&
                    value !== undefined &&
                    typeof value !== 'number' &&
                    typeof value !== 'string'
                  ) {
                    throw new Error('Scale input must be numeric or categorical');
                  }
                  return scale.sample((value ?? null) as ScaleValue | null) as
                    | number
                    | ScaleColor
                    | null;
                }),
                parsed.scale
              )
          }
        ]
      });
      return {
        type: 'CallExpression',
        callee: {type: 'Identifier', name},
        arguments: [parsed.value]
      };
    }
    return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, visit(value)]));
  }
  /** Ordinary Arrow expression after removing every supported scale call. */
  const rewritten = visit(ast);
  /** Final evaluator with caller and generated declarations. */
  const compiled = compileArrowExpression(rewritten, {
    inputSchema: table.schema,
    functions: declarations
  });
  return {...compiled, scales};
}
