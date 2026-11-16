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
import type {ArrowExpression} from '../arrow/types';
import {compileResolvedScale} from './compile-scale';
import {arrowScaleValue, resolveArrowDomains, resolveArrowQuantiles} from './arrow-domains';
import type {ParsedSQLScale} from './parse-sql-scale';
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

/** Compile a shared domain + range and bind its per-row Arrow expression once. */
export function compileArrowScale(
  table: Table,
  parsed: ParsedSQLScale,
  resolvedDomain?: readonly ScaleValue[]
): CompiledArrowScale {
  /** Class count used by the palette for quantile classification. */
  const classCount = parsed.scale.range.type === 'palette' ? parsed.scale.range.count : undefined;
  if (parsed.scale.type === 'quantile' && (!classCount || parsed.scale.domain.type === 'fixed')) {
    throw new Error('Quantile scale requires a class count and a source column');
  }
  /** Resolved inputs shared with the schema-only binder. */
  const resolution: ArrowScaleResolution = {
    domain: resolvedDomain ?? resolveArrowDomains(table, [parsed.scale.domain])[0]!,
    ...(parsed.scale.type === 'quantile' && parsed.scale.domain.type !== 'fixed'
      ? {quantileBreaks: resolveArrowQuantiles(table, parsed.scale.domain.column, classCount!)}
      : {})
  };
  return bindArrowScale(table.schema, parsed, resolution);
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
  {domain, quantileBreaks}: ArrowScaleResolution
): CompiledArrowScale {
  /** Break points used by classified scales. */
  let thresholds: readonly number[] | undefined;
  /** Scale transform and classification family. */
  const kind = parsed.scale.type;
  /** Number of discrete classes declared by the palette, if any. */
  const classCount = parsed.scale.range.type === 'palette' ? parsed.scale.range.count : undefined;
  if (kind === 'quantile') {
    if (!classCount || quantileBreaks?.length !== classCount - 1) {
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
  const compiled = compileArrowExpression(parsed.value as ArrowExpression, {inputSchema});
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
  expressions: Readonly<Record<K, ParsedSQLScale>>
): Record<K, CompiledArrowScale> {
  const entries = Object.entries(expressions) as [K, ParsedSQLScale][];
  const domains = resolveArrowDomains(
    table,
    entries.map(([, parsed]) => parsed.scale.domain)
  );
  return Object.fromEntries(
    entries.map(([key, parsed], index) => [key, compileArrowScale(table, parsed, domains[index])])
  ) as Record<K, CompiledArrowScale>;
}

export {createStreamingDomainAccumulator} from './streaming-domains';
export type {StreamingDomainOptions} from './streaming-domains';
