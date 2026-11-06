// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Curve} from './curve';

export type AdaptiveCurveOptions = {
  tolerance: number;
  maxDepth?: number;
  maxPoints?: number;
};
export type AdaptiveCurveSamples = {
  parameters: Float64Array;
  positions: Float64Array;
  /** False means a work limit prevented meeting the sampled chord-error criterion. */
  converged: boolean;
  maxSampledError: number;
};

/** Quarter/midpoint chord-error sampling. This is not a certified bound for arbitrary curves. */
export function sampleCurveAdaptive(
  curve: Curve,
  options: AdaptiveCurveOptions
): AdaptiveCurveSamples {
  const {tolerance, maxDepth = 16, maxPoints = 65536} = options;
  if (
    !Number.isFinite(tolerance) ||
    tolerance <= 0 ||
    !Number.isInteger(maxDepth) ||
    maxDepth < 0 ||
    maxDepth > 30 ||
    !Number.isSafeInteger(maxPoints) ||
    maxPoints < 2
  )
    throw new RangeError('Invalid adaptive sampling budget');
  const parameters = [0],
    positions = [...curve.getPoint(0)];
  let converged = true,
    maxSampledError = 0;
  const stack = [{t0: 0, t1: 1, a: curve.getPoint(0), b: curve.getPoint(1), depth: 0}];
  while (stack.length) {
    const segment = stack.pop()!;
    const {t0, t1, a, b, depth} = segment;
    const localEdge = b.map((x, i) => x - a[i]);
    const samples = [0.25, 0.5, 0.75].map(f => curve.getPoint(t0 + (t1 - t0) * f));
    const localSamples = samples.map(point => point.map((x, i) => x - a[i]));
    const local = [...localEdge, ...localSamples.flat()].every(Number.isFinite);
    const scale = local
      ? Math.max(...localEdge.map(Math.abs), ...localSamples.flat().map(Math.abs), Number.MIN_VALUE)
      : Math.max(...a.map(Math.abs), ...b.map(Math.abs), ...samples.flat().map(Math.abs));
    const edge = local ? localEdge.map(x => x / scale) : b.map((x, i) => x / scale - a[i] / scale);
    const squared = edge.reduce((sum, x) => sum + x * x, 0);
    const measuredError = Math.max(
      ...samples.map((p, sampleIndex) => {
        const offset = local
          ? localSamples[sampleIndex].map(x => x / scale)
          : p.map((x, i) => x / scale - a[i] / scale);
        const t = squared
          ? Math.max(0, Math.min(1, edge.reduce((sum, x, i) => sum + x * offset[i], 0) / squared))
          : 0;
        return Math.hypot(...offset.map((x, i) => x - t * edge[i])) * scale;
      })
    );
    const error = Number.isFinite(measuredError) ? measuredError : Infinity;
    if (
      error > tolerance &&
      depth < maxDepth &&
      parameters.length + stack.length + 2 <= maxPoints
    ) {
      const mid = (t0 + t1) / 2;
      stack.push({t0: mid, t1, a: samples[1], b, depth: depth + 1});
      stack.push({t0, t1: mid, a, b: samples[1], depth: depth + 1});
    } else {
      if (error > tolerance) converged = false;
      maxSampledError = Math.max(maxSampledError, error);
      parameters.push(t1);
      positions.push(...b);
    }
  }
  return {
    parameters: new Float64Array(parameters),
    positions: new Float64Array(positions),
    converged,
    maxSampledError
  };
}
