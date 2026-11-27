// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ScaleColor} from './scale-types';

/** Two inputs and a rectangular palette. Grid rows run from low to high y. */
export type BivariateColorScaleSpec = Readonly<{
  /** Ordered x input extent. */
  xDomain: readonly [number, number];
  /** Ordered y input extent. */
  yDomain: readonly [number, number];
  /** Each row runs from low to high x. */
  colors: readonly (readonly ScaleColor[])[];
  /** Equal-sized classes by default, or continuous bilinear interpolation in sRGB. */
  interpolation?: 'discrete' | 'bilinear';
  /** Color for a pair with a missing or nonfinite input. */
  nullColor?: ScaleColor;
}>;

/** The palette and the actual axis boundaries a legend should use. */
export type BivariateColorScaleDescriptor = BivariateColorScaleSpec &
  Readonly<{
    /** Actual sampling method on the color grid. */
    interpolation: 'discrete' | 'bilinear';
    /** Internal equal-interval class boundaries for discrete scales. */
    xBreaks?: readonly number[];
    /** Internal equal-interval y-axis class boundaries for discrete scales. */
    yBreaks?: readonly number[];
  }>;

/** A bivariate scale and its transportable legend description. */
export type ResolvedBivariateColorScale = Readonly<{
  /** Two-axis domains, class boundaries, and palette used to draw the legend. */
  descriptor: BivariateColorScaleDescriptor;
  /** Samples a clamped pair. Missing or nonfinite values use the null color. */
  sample(x: number | null, y: number | null): ScaleColor | null;
}>;

/** Checks one increasing axis with a finite span. */
function validateDomain(domain: readonly [number, number], axis: string): void {
  const [min, max] = domain;
  if (!Number.isFinite(min) || !Number.isFinite(max) || !(min < max) || !Number.isFinite(max - min))
    throw new Error(
      `Bivariate ${axis} domain requires two increasing endpoints with a finite span`
    );
}

/** Copies a finite sRGB color so later changes to the caller's palette cannot affect sampling. */
function copyColor(color: ScaleColor): ScaleColor {
  if (color.length !== 4 || color.some(channel => !Number.isFinite(channel)))
    throw new Error('Bivariate color stops require four finite channels');
  return Object.freeze([...color]) as ScaleColor;
}

/** Resolves equal intervals on one axis, with ties assigned to the upper class. */
function equalBreaks(domain: readonly [number, number], count: number): readonly number[] {
  const [min, max] = domain;
  const breaks = Array.from({length: count - 1}, (_, i) => min + ((i + 1) / count) * (max - min));
  if (breaks.some((value, index) => value <= (breaks[index - 1] ?? min) || value >= max))
    throw new Error('Bivariate class breaks cannot be represented at this precision');
  return Object.freeze(breaks);
}

/** Looks up a discrete class with inclusive lower boundaries. */
function classify(value: number, breaks: readonly number[]): number {
  const firstHigherBreak = breaks.findIndex(boundary => value < boundary);
  return firstHigherBreak < 0 ? breaks.length : firstHigherBreak;
}

/** Maps a value to a clamped coordinate in a palette grid. */
function position(value: number, domain: readonly [number, number], count: number): number {
  return Math.max(0, Math.min(1, (value - domain[0]) / (domain[1] - domain[0]))) * (count - 1);
}

/** Compiles a rectangular sRGB palette against two independent numeric extents. */
export function compileBivariateColorScale(
  spec: BivariateColorScaleSpec
): ResolvedBivariateColorScale {
  validateDomain(spec.xDomain, 'x');
  validateDomain(spec.yDomain, 'y');

  const height = spec.colors.length;
  const width = spec.colors[0]?.length ?? 0;
  if (width < 2 || height < 2 || spec.colors.some(row => row.length !== width))
    throw new Error('Bivariate palettes require a rectangular grid of at least 2 × 2 colors');
  const interpolation = spec.interpolation ?? 'discrete';
  if (interpolation !== 'discrete' && interpolation !== 'bilinear')
    throw new Error('Unknown bivariate interpolation');
  const colors = Object.freeze(spec.colors.map(row => Object.freeze(row.map(copyColor))));
  const xDomain = Object.freeze([...spec.xDomain] as [number, number]);
  const yDomain = Object.freeze([...spec.yDomain] as [number, number]);
  const nullColor = spec.nullColor ? copyColor(spec.nullColor) : undefined;
  const xBreaks = interpolation === 'discrete' ? equalBreaks(xDomain, width) : undefined;
  const yBreaks = interpolation === 'discrete' ? equalBreaks(yDomain, height) : undefined;
  const descriptor = Object.freeze({
    xDomain,
    yDomain,
    colors,
    interpolation,
    ...(nullColor && {nullColor}),
    ...(xBreaks && {xBreaks, yBreaks})
  });
  return {
    descriptor,
    sample(x, y) {
      if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y))
        return nullColor ?? null;
      if (xBreaks && yBreaks) return colors[classify(y, yBreaks)]![classify(x, xBreaks)]!;
      const px = position(x, xDomain, width);
      const py = position(y, yDomain, height);
      const ix = Math.min(width - 2, Math.floor(px));
      const iy = Math.min(height - 2, Math.floor(py));
      const tx = px - ix;
      const ty = py - iy;
      const a = colors[iy]![ix]!;
      const b = colors[iy]![ix + 1]!;
      const c = colors[iy + 1]![ix]!;
      const d = colors[iy + 1]![ix + 1]!;
      /** Interpolates one normalized channel between the four surrounding stops. */
      const mix = (channel: 0 | 1 | 2 | 3) => {
        const lower = a[channel] + tx * (b[channel] - a[channel]);
        const upper = c[channel] + tx * (d[channel] - c[channel]);
        return lower + ty * (upper - lower);
      };
      return [mix(0), mix(1), mix(2), mix(3)];
    }
  };
}
