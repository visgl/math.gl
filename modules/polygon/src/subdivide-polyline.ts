// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Configuration for sampling straight source edges through a nonlinear transform. */
export type SubdividePolylineOptions = {
  /** Maps a source position to target coordinates; null or nonfinite output rejects the geometry.
   * Must be deterministic. A fresh array is passed on every invocation.
   */
  transform: (position: readonly number[]) => ArrayLike<number> | null;
  /** Positive error tolerance in target-coordinate units, measured across all output components. */
  tolerance: number;
  /** Number of source components per vertex. Default 2. */
  size?: 2 | 3;
  /** Number of target components per vertex. Defaults to size. */
  targetSize?: 2 | 3;
  /** Optional positive maximum Euclidean edge length in source-coordinate units. */
  maxSegmentLength?: number;
  /** Maximum bisection depth per input edge. Default 16; maximum 30. */
  maxDepth?: number;
  /** Maximum output vertex count for the entire polyline. Default 65536. */
  maxVertices?: number;
};

/** Subdivided source and target coordinates with attribution for interpolating other data. */
export type SubdividedPolyline = {
  /** Flat source positions, including inserted vertices. Input storage is never modified. */
  sourcePositions: Float64Array;
  /** Flat transformed positions, in the transform's target units. */
  positions: Float64Array;
  /** Input edge index for each output vertex. Edge i connects input vertices i and i + 1.
   * Shared endpoints belong to the preceding edge; a lone input vertex uses index 0.
   */
  segmentIndices: Uint32Array;
  /** Fraction along the attributed input edge. The first vertex uses 0; endpoints use 1. */
  segmentFractions: Float64Array;
};

type Sample = {source: number[]; target: number[]; fraction: number};

/** Adaptively subdivides a flat polyline by sampling a supplied coordinate transform.
 * Each leaf edge checks its quarter, midpoint and three-quarter positions against linear
 * interpolation of its target endpoints. This is a sampled criterion, not a guaranteed
 * bound for arbitrary transforms. Source edges and extra source components interpolate linearly.
 * Explicitly closed rings stay closed. Split seams and clip invalid domains before calling.
 * @throws RangeError For invalid options/coordinates, rejected transform samples, or exhausted limits.
 * Exceptions thrown by the transform itself propagate unchanged.
 */
export function subdividePolyline(
  input: ArrayLike<number>,
  options: SubdividePolylineOptions
): SubdividedPolyline {
  const {
    transform,
    tolerance,
    size = 2,
    targetSize = size,
    maxSegmentLength = Infinity,
    maxDepth = 16,
    maxVertices = 65536
  } = options;
  if (
    typeof transform !== 'function' ||
    !Number.isFinite(tolerance) ||
    tolerance <= 0 ||
    (size !== 2 && size !== 3) ||
    (targetSize !== 2 && targetSize !== 3) ||
    !(maxSegmentLength > 0) ||
    (!Number.isFinite(maxSegmentLength) && maxSegmentLength !== Infinity) ||
    !Number.isInteger(maxDepth) ||
    maxDepth < 0 ||
    maxDepth > 30 ||
    !Number.isSafeInteger(maxVertices) ||
    maxVertices < 1 ||
    maxVertices > 0xffffffff ||
    !Number.isSafeInteger(input.length) ||
    input.length < 0 ||
    input.length % size !== 0
  ) {
    throw new RangeError('Invalid polyline subdivision options or input length');
  }
  const vertexCount = input.length / size;
  if (vertexCount > maxVertices) throw new RangeError('Polyline exceeds maxVertices');
  const sources: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const value = input[i];
    if (!Number.isFinite(value)) throw new RangeError('Source positions must be finite');
    sources.push(value);
  }
  const sourcePositions: number[] = [];
  const positions: number[] = [];
  const segmentIndices: number[] = [];
  const segmentFractions: number[] = [];

  function sample(source: number[], fraction: number): Sample {
    const projected = transform(source.slice());
    if (!projected || projected.length !== targetSize) {
      throw new RangeError('Transform must return a position with targetSize components');
    }
    const target = Array.from(projected);
    if (!target.every(Number.isFinite))
      throw new RangeError('Transform returned nonfinite coordinates');
    return {source, target, fraction};
  }

  function append(point: Sample, segment: number): void {
    if (segmentIndices.length >= maxVertices) {
      throw new RangeError('Polyline subdivision exceeded maxVertices');
    }
    for (const value of point.source) sourcePositions.push(value);
    for (const value of point.target) positions.push(value);
    segmentIndices.push(segment);
    segmentFractions.push(point.fraction);
  }

  function interpolate(a: Sample, b: Sample, fraction: number): Sample {
    // Weighted sum avoids overflow from subtracting opposite large finite values.
    const source = a.source.map((value, i) => value * (1 - fraction) + b.source[i] * fraction);
    return sample(source, a.fraction * (1 - fraction) + b.fraction * fraction);
  }

  function subdivide(a: Sample, b: Sample, segment: number, depth: number): void {
    let error = 0;
    let midpoint: Sample;
    for (const fraction of [0.25, 0.5, 0.75]) {
      const point = interpolate(a, b, fraction);
      if (fraction === 0.5) midpoint = point;
      const delta = point.target.map(
        (value, i) => value - (a.target[i] * (1 - fraction) + b.target[i] * fraction)
      );
      error = Math.max(error, Math.hypot(...delta));
    }
    const sourceLength = Math.hypot(...a.source.map((value, i) => value - b.source[i]));
    if (error <= tolerance && sourceLength <= maxSegmentLength) {
      append(b, segment);
      return;
    }
    if (depth >= maxDepth) {
      throw new RangeError(`Polyline subdivision exceeded maxDepth on input edge ${segment}`);
    }
    subdivide(a, midpoint!, segment, depth + 1);
    subdivide(midpoint!, b, segment, depth + 1);
  }

  if (vertexCount) {
    let previous = sample(sources.slice(0, size), 0);
    append(previous, 0);
    for (let i = 1; i < vertexCount; i++) {
      const next = sample(sources.slice(i * size, (i + 1) * size), 1);
      subdivide({...previous, fraction: 0}, next, i - 1, 0);
      previous = next;
    }
  }
  return {
    sourcePositions: new Float64Array(sourcePositions),
    positions: new Float64Array(positions),
    segmentIndices: new Uint32Array(segmentIndices),
    segmentFractions: new Float64Array(segmentFractions)
  };
}
