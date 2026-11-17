// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Expression} from '../expressions/index';

/**
 * Portable, JSON-safe vocabulary for data-driven visualization scales.
 * A specification describes an unresolved scale. It never contains an evaluator,
 * so it can be serialized, transferred to workers, or used by other renderers.
 */
export type ScaleColor = readonly [number, number, number, number];
/** Numeric or categorical value accepted by a scale. */
export type ScaleValue = number | string;

/** Fixed values or a request to derive the domain from a column. */
export type ScaleDomain =
  | {readonly type: 'fixed'; readonly values: readonly ScaleValue[]}
  | {
      readonly type: 'expression-extent';
      /** Row expression whose evaluated values define the extent. */
      readonly expression: Expression;
    }
  | {readonly type: 'extent'; readonly column: string; readonly includeZero?: boolean}
  | {readonly type: 'symmetric'; readonly column: string; readonly pivot: number}
  | {
      readonly type: 'percentile';
      readonly column: string;
      readonly lower: number;
      readonly upper: number;
    }
  | {
      readonly type: 'categories';
      readonly column: string;
      readonly order?: 'sorted' | 'first-seen';
    };

/** Numeric output, explicit colors, or a named palette to resolve. */
export type ScaleRange =
  | {readonly type: 'numeric'; readonly values: readonly number[]}
  | {
      readonly type: 'colors';
      /** Color values remain in the declared encoding, without implicit clipping. */
      readonly values: readonly ScaleColor[];
    }
  | {readonly type: 'palette'; readonly name: string; readonly count?: number};

/** A scale's storage type is distinct from its primaries, transfer and interpolation. */
export type ScaleColorEncoding = {
  readonly primaries: 'srgb' | 'display-p3' | 'rec2020';
  readonly transfer: 'srgb' | 'linear' | 'pq' | 'hlg';
  readonly format: 'rgba8unorm' | 'rgba16unorm' | 'rgba16float' | 'rgba32float';
  /** Scene-linear reference white, when known. */
  readonly referenceWhiteNits?: number;
};

/** Serializable scale inputs and optional presentation metadata. */
export type ScaleSpec = {
  readonly id?: string;
  readonly type:
    | 'linear'
    | 'sqrt'
    | 'log'
    | 'symlog'
    | 'sequential'
    | 'diverging'
    | 'ordinal'
    | 'quantize'
    | 'quantile'
    | 'threshold'
    | 'piecewise';
  readonly domain: ScaleDomain;
  readonly range: ScaleRange;
  readonly clamp?: boolean;
  readonly pivot?: number;
  readonly interpolation?: 'srgb' | 'linear-srgb' | 'oklab' | 'jzazbz';
  readonly encoding?: ScaleColorEncoding;
  readonly nullColor?: ScaleColor;
  readonly underColor?: ScaleColor;
  readonly overColor?: ScaleColor;
  readonly label?: string;
  readonly units?: string;
};

/**
 * The resolved descriptor records *actual* domain and class breaks, not an
 * inferred palette. Consumers can generate faithful ticks and legend labels.
 */
export type ResolvedScaleDescriptor = Omit<ScaleSpec, 'domain' | 'range'> & {
  readonly domain: readonly ScaleValue[];
  readonly range: Exclude<ScaleRange, {readonly type: 'palette'}>;
  readonly thresholds?: readonly number[];
  readonly palette?: string;
};

/** Runtime evaluator is intentionally separate from the JSON-safe descriptor. */
export type ResolvedScale = {
  readonly descriptor: ResolvedScaleDescriptor;
  sample(value: ScaleValue | null): number | ScaleColor | null;
};

function assertFinite(value: number, description: string): void {
  if (!Number.isFinite(value)) throw new Error(`${description} must be finite`);
}

function checkColor(color: ScaleColor, label: string): void {
  if (!Array.isArray(color) || color.length !== 4) {
    throw new Error(`${label} must contain four channels`);
  }
  color.forEach((channel, index) => assertFinite(channel, `${label}[${index}]`));
}

/** Validates the serializable contract without resolving data-dependent domains. */
export function validateScaleSpec(spec: ScaleSpec): ScaleSpec {
  if (!spec || typeof spec !== 'object') throw new Error('Scale specification is required');
  const kinds = [
    'linear',
    'sqrt',
    'log',
    'symlog',
    'sequential',
    'diverging',
    'ordinal',
    'quantize',
    'quantile',
    'threshold',
    'piecewise'
  ];
  if (!kinds.includes(spec.type)) throw new Error(`Unsupported scale type: ${spec.type}`);
  const minimumStops = spec.type === 'ordinal' ? 1 : 2;
  const minimumDomainStops = spec.type === 'threshold' ? 1 : minimumStops;
  const domain = spec.domain;
  if (!domain || typeof domain !== 'object') throw new Error('Scale domain is required');
  switch (domain.type) {
    case 'fixed':
      if (
        !Array.isArray(domain.values) ||
        domain.values.length < minimumDomainStops ||
        domain.values.some(
          value =>
            typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))
        )
      )
        throw new Error(
          `Fixed scale domain requires at least ${minimumDomainStops} finite or string values`
        );
      break;
    case 'expression-extent':
      if (typeof domain.expression?.type !== 'string') {
        throw new Error('Scale domain requires a row expression');
      }
      break;
    case 'extent':
    case 'categories':
      if (typeof domain.column !== 'string' || !domain.column) {
        throw new Error('Scale domain requires a column');
      }
      break;
    case 'symmetric':
      if (!domain.column) throw new Error('Symmetric domain requires a column');
      assertFinite(domain.pivot, 'Scale pivot');
      break;
    case 'percentile':
      if (
        !domain.column ||
        !Number.isFinite(domain.lower) ||
        !Number.isFinite(domain.upper) ||
        domain.lower < 0 ||
        domain.upper > 1 ||
        domain.lower >= domain.upper
      ) {
        throw new Error('Percentile domain requires 0 <= lower < upper <= 1');
      }
      break;
    default:
      throw new Error('Unsupported scale domain');
  }
  if (!spec.range) throw new Error('Scale range is required');
  switch (spec.range.type) {
    case 'numeric':
      if (spec.range.values.length < minimumStops)
        throw new Error(`Numeric range requires at least ${minimumStops} values`);
      spec.range.values.forEach(value => assertFinite(value, 'Numeric range'));
      break;
    case 'colors':
      if (spec.range.values.length < minimumStops)
        throw new Error(`Color range requires at least ${minimumStops} colors`);
      spec.range.values.forEach((value, index) => checkColor(value, `Color stop ${index}`));
      break;
    case 'palette':
      if (
        !spec.range.name ||
        (spec.range.count !== undefined &&
          (!Number.isSafeInteger(spec.range.count) || spec.range.count < 2))
      ) {
        throw new Error('Palette requires a name and optional positive count >= 2');
      }
      break;
    default:
      throw new Error('Unsupported scale range');
  }
  if (spec.pivot !== undefined) assertFinite(spec.pivot, 'Scale pivot');
  if (
    spec.encoding?.referenceWhiteNits !== undefined &&
    (!Number.isFinite(spec.encoding.referenceWhiteNits) || spec.encoding.referenceWhiteNits <= 0)
  ) {
    throw new Error('referenceWhiteNits must be a positive finite number');
  }
  for (const key of ['nullColor', 'underColor', 'overColor'] as const) {
    if (spec[key]) checkColor(spec[key], key);
  }
  return spec;
}

/**
 * Binds an already resolved domain/range to the same evaluator that produces
 * layer colors. No independent legend interpolation is performed here.
 */
export function createResolvedScale(
  descriptor: ResolvedScaleDescriptor,
  sample: ResolvedScale['sample']
): ResolvedScale {
  validateScaleSpec({
    ...descriptor,
    domain: {type: 'fixed', values: descriptor.domain}
  });
  if (descriptor.thresholds) {
    if (
      descriptor.thresholds.some(
        (value, i) => !Number.isFinite(value) || (i > 0 && value <= descriptor.thresholds![i - 1]!)
      )
    ) {
      throw new Error('Thresholds must be finite and strictly ordered');
    }
  }
  return Object.freeze({descriptor, sample});
}
