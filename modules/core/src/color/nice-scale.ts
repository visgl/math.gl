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
  if (lower > upper && !thresholds) {
    const {
      domain: [min, max]
    } = niceScale([upper, lower]);
    return {domain: [max, min]};
  }
  const span = upper - lower;
  if (!(span > 0) || !Number.isFinite(span)) {
    return {domain, thresholds};
  }
  const step = niceStep(span / (thresholds ? 1.5 * (thresholds.length + 1) : 6));
  const endpointStep = thresholds ? niceStep(step / 2) : step;
  if (!(endpointStep > 0) || !Number.isFinite(endpointStep)) {
    return {domain, thresholds};
  }

  /** Reconstructs a decimal grid point without the multiplication's binary artifacts. */
  const gridPoint = (index: number, unit: number): number => Number((index * unit).toPrecision(15));

  /** Compares against the reconstructed grid point before moving outward. */
  const endpoint = (value: number, upper: boolean): number => {
    const index = Math.round(value / endpointStep);
    const nearest = gridPoint(index, endpointStep);
    // An exact decimal value can divide to just below or above an integer.
    // The reconstructed grid point distinguishes it from a value actually off the grid.
    if (upper ? nearest >= value : nearest <= value) return nearest;
    return gridPoint(index + (upper ? 1 : -1), endpointStep);
  };

  const min = Math.min(lower, endpoint(lower, false));
  const max = Math.max(upper, endpoint(upper, true));
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return {domain, thresholds};
  }

  let rounded = thresholds;
  if (thresholds?.length) {
    const original = [lower, ...thresholds, upper];
    for (let unit = step; unit > 0; ) {
      const candidate = thresholds.map(value => gridPoint(Math.round(value / unit), unit));
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
