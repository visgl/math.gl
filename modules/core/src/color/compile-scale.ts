// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {niceScale} from './nice-scale';
import {
  createResolvedScale,
  type ResolvedScale,
  type ResolvedScaleDescriptor,
  type ScaleColor,
  type ScaleColorEncoding,
  type ScaleSpec,
  type ScaleValue
} from './scale-types';
import {resolvePalette} from './palettes';
import {convertScaleColor, decodeSRGB, encodeSRGB} from './hdr-colors';

/** Encoding of the built-in palette stops and the sRGB interpolation helpers. */
const SRGB: ScaleColorEncoding = {primaries: 'srgb', transfer: 'srgb', format: 'rgba32float'};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
function toOklab(color: ScaleColor): [number, number, number] {
  const [r, g, b] = color.slice(0, 3).map(decodeSRGB);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
}
function fromOklab([L, a, b]: number[]): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    encodeSRGB(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encodeSRGB(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encodeSRGB(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  ];
}
function interpolateColor(
  a: ScaleColor,
  b: ScaleColor,
  t: number,
  space: ScaleSpec['interpolation'] = 'srgb'
): ScaleColor {
  if (space === 'jzazbz') {
    throw new Error('Jzazbz interpolation is not implemented yet');
  }
  const mix = (x: number, y: number) => x + (y - x) * t;
  const alpha = mix(a[3], b[3]);
  if (space === 'oklab') {
    const lhs = toOklab(a),
      rhs = toOklab(b);
    const rgb = fromOklab(lhs.map((v, i) => mix(v, rhs[i]!)));
    return [rgb[0], rgb[1], rgb[2], alpha];
  }
  if (space === 'linear-srgb') {
    return [
      encodeSRGB(mix(decodeSRGB(a[0]), decodeSRGB(b[0]))),
      encodeSRGB(mix(decodeSRGB(a[1]), decodeSRGB(b[1]))),
      encodeSRGB(mix(decodeSRGB(a[2]), decodeSRGB(b[2]))),
      alpha
    ];
  }
  return [mix(a[0], b[0]), mix(a[1], b[1]), mix(a[2], b[2]), alpha];
}

function normalize(value: number, a: number, b: number, type: ScaleSpec['type']): number {
  if (a === b) return 0.5;
  if (type === 'log') {
    if (a <= 0 || b <= 0 || value <= 0) return NaN;
    return Math.log(value / a) / Math.log(b / a);
  }
  if (type === 'sqrt') {
    if (a < 0 || b < 0 || value < 0) return NaN;
    return (Math.sqrt(value) - Math.sqrt(a)) / (Math.sqrt(b) - Math.sqrt(a));
  }
  if (type === 'symlog') {
    const symlog = (v: number) => Math.sign(v) * Math.log1p(Math.abs(v));
    return (symlog(value) - symlog(a)) / (symlog(b) - symlog(a));
  }
  return (value - a) / (b - a);
}

function numericValues(domain: readonly ScaleValue[]): number[] {
  if (!domain.length || domain.some(v => typeof v !== 'number' || !Number.isFinite(v))) {
    throw new Error('Numeric scale requires a finite numeric domain');
  }
  return domain as number[];
}

/**
 * Compile one resolved scale. Domain, class breaks and palette stops are the
 * authoritative metadata consumed by renderers and legends alike.
 */
export function compileResolvedScale(
  spec: ScaleSpec,
  domain: readonly ScaleValue[],
  thresholds?: readonly number[]
): ResolvedScale {
  if (spec.nice) {
    const values = numericValues(domain);
    if ((spec.type !== 'sequential' && spec.type !== 'quantile') || values.length !== 2) {
      throw new Error('Nice scales require a two-endpoint sequential or quantile scale');
    }
    ({domain, thresholds} = niceScale([values[0]!, values[1]!], thresholds));
  }
  const colorType = [
    'sequential',
    'diverging',
    'ordinal',
    'quantize',
    'quantile',
    'threshold',
    'piecewise'
  ].includes(spec.type);
  if (colorType && spec.range.type === 'numeric') throw new Error('Color scale requires colors');
  if (!colorType && spec.range.type !== 'numeric')
    throw new Error('Numeric scale requires numeric range');
  const classes = spec.range.type === 'palette' ? spec.range.count : undefined;
  let palette = colorType ? resolvePalette(spec.range, classes) : undefined;
  if (thresholds?.length && thresholds.length + 1 !== (palette?.length ?? 0))
    throw new Error('Scale class count must match palette color count');
  if ((spec.type === 'quantile' || spec.type === 'quantize') && thresholds) {
    // Repeated breakpoints create empty classes. Keep the colors of the intervals that remain.
    /** Breaks before empty intervals are removed. */
    const original = thresholds;
    thresholds = original.filter((value, i) => i === 0 || value !== original[i - 1]);
    palette = palette!.filter(
      (_, i) => i === 0 || i === original.length || original[i - 1] !== original[i]
    );
  }
  const encoding = spec.encoding ?? SRGB;
  const paletteStops =
    palette && spec.range.type === 'palette' && spec.encoding
      ? palette.map(color => convertScaleColor(color, SRGB, encoding))
      : palette;
  const space = spec.interpolation ?? 'srgb';
  const workingStops =
    paletteStops && (space === 'linear-srgb' || space === 'oklab')
      ? paletteStops.map(color => convertScaleColor(color, encoding, SRGB))
      : paletteStops;
  if (spec.type === 'ordinal' && domain.length > (paletteStops?.length ?? 0)) {
    throw new Error('Ordinal palette must have at least one color per category');
  }
  const resolvedRange: ResolvedScaleDescriptor['range'] =
    spec.range.type === 'numeric' ? spec.range : {type: 'colors', values: paletteStops!};
  const descriptor: ResolvedScaleDescriptor = {
    ...spec,
    domain: [...domain],
    range: resolvedRange,
    ...(spec.range.type === 'palette' ? {palette: spec.range.name} : {}),
    ...(thresholds ? {thresholds: [...thresholds]} : {})
  };
  const isOrdinal = spec.type === 'ordinal';
  const values = isOrdinal ? domain : numericValues(domain);
  const numerical = isOrdinal ? [] : numericValues(domain);
  if (!isOrdinal && spec.type !== 'threshold' && numerical.length < 2) {
    throw new Error('Numeric domain requires two endpoints');
  }
  const pivot = spec.type === 'diverging' ? spec.pivot : undefined;
  if (pivot !== undefined && !(numerical[0]! < pivot && pivot < numerical[numerical.length - 1]!))
    throw new Error('Diverging scale pivot must be between the domain endpoints');
  const breaks = thresholds ?? [];
  if (['quantile', 'quantize', 'threshold'].includes(spec.type) && !thresholds) {
    throw new Error(`${spec.type} scale requires resolved class breaks`);
  }
  const sample = (value: ScaleValue | null): number | ScaleColor | null => {
    if (value === null) return spec.nullColor ?? null;
    if (isOrdinal) {
      const index = values.indexOf(value);
      return index === -1 ? (spec.nullColor ?? null) : paletteStops![index]!;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) return spec.nullColor ?? null;
    const min = numerical[0]!,
      max = numerical[numerical.length - 1]!;
    if (value < min && spec.underColor) return spec.underColor;
    if (value > max && spec.overColor) return spec.overColor;

    if (spec.type === 'quantile' || spec.type === 'quantize' || spec.type === 'threshold') {
      const index = breaks.findIndex(boundary => value < boundary);
      const colorIndex = index < 0 ? breaks.length : index;
      return paletteStops![Math.min(colorIndex, paletteStops!.length - 1)]!;
    }

    // Piecewise ranges use the resolved domain values as positioned stops.
    const stopCount = colorType
      ? paletteStops!.length
      : (resolvedRange as {values: readonly number[]}).values.length;
    if (numerical.length !== 2 && numerical.length !== stopCount) {
      throw new Error('Piecewise domain and range stops must have equal lengths');
    }
    let segment = 0;
    let t: number;
    if (numerical.length === 2) {
      t =
        pivot === undefined
          ? normalize(value, min, max, spec.type)
          : value <= pivot
            ? normalize(value, min, pivot, spec.type) / 2
            : 0.5 + normalize(value, pivot, max, spec.type) / 2;
      if (spec.clamp ?? colorType) t = clamp01(t);
      const position = t * (stopCount - 1);
      segment = Math.min(stopCount - 2, Math.max(0, Math.floor(position)));
      t = position - segment;
    } else {
      while (segment < numerical.length - 2 && value > numerical[segment + 1]!) segment++;
      t = normalize(value, numerical[segment]!, numerical[segment + 1]!, spec.type);
      if (spec.clamp ?? colorType) t = clamp01(t);
    }
    if (!Number.isFinite(t)) return spec.nullColor ?? null;
    if (colorType) {
      const color = interpolateColor(
        workingStops![segment]!,
        workingStops![segment + 1]!,
        t,
        space
      );
      return workingStops === paletteStops ? color : convertScaleColor(color, SRGB, encoding);
    }
    const numbers = (resolvedRange as {values: readonly number[]}).values;
    return numbers[segment]! + (numbers[segment + 1]! - numbers[segment]!) * t;
  };
  return createResolvedScale(descriptor, sample);
}
