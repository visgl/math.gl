// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Finds the nearest decimal step, using geometric midpoints between candidates. */
function niceStep(target: number): number {
  const power = 10 ** Math.floor(Math.log10(target));
  const mantissa = target / power;
  const step = [1, 2, 2.5, 5, 10].find(
    (candidate, index, candidates) =>
      index === candidates.length - 1 || mantissa < Math.sqrt(candidate * candidates[index + 1]!)
  )!;
  return step * power;
}

/** Rounds an extent outward and optionally snaps its quantile breaks. */
export function niceScale(
  domain: readonly [number, number],
  thresholds?: readonly number[]
): {domain: readonly [number, number]; thresholds?: readonly number[]} {
  const [lower, upper] = domain;
  const span = upper - lower;
  if (!(span > 0) || !Number.isFinite(span)) {
    return {domain, thresholds};
  }
  const step = niceStep(span / (thresholds ? 1.5 * (thresholds.length + 1) : 6));
  const endpointStep = thresholds ? niceStep(step / 2) : step;
  if (!(endpointStep > 0) || !Number.isFinite(endpointStep)) {
    return {domain, thresholds};
  }

  /** Quantizes in decimal space to avoid visible binary floating-point artifacts. */
  const snap = (value: number, unit: number, round: (x: number) => number): number =>
    Number((round(value / unit) * unit).toPrecision(15));

  const min = Math.min(lower, snap(lower, endpointStep, Math.floor));
  const max = Math.max(upper, snap(upper, endpointStep, Math.ceil));
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return {domain, thresholds};
  }

  let rounded = thresholds;
  if (thresholds?.length) {
    const original = [lower, ...thresholds, upper];
    for (let unit = step; unit > 0; ) {
      const candidate = thresholds.map(value => snap(value, unit, Math.round));
      const boundaries = [min, ...candidate, max];
      if (
        boundaries.every(
          (value, i) =>
            Number.isFinite(value) &&
            (i === 0 ||
              (original[i] === original[i - 1]
                ? value >= boundaries[i - 1]!
                : value > boundaries[i - 1]!))
        )
      ) {
        rounded = candidate;
        break;
      }
      const next = niceStep(unit * 0.49);
      if (next >= unit || unit <= span * Number.EPSILON) {
        break;
      }
      unit = next;
    }
  }
  return {domain: [min, max], thresholds: rounded};
}
