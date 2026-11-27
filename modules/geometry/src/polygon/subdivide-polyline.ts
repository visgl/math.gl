// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A constant-speed source edge, sampled at fractions of its declared length.
 * Endpoints must match the factory inputs exactly. Samples are copied before use.
 */
export type PolylineEdgeSampler = {
  readonly length: number;
  sample: (fraction: number) => ArrayLike<number>;
};

/** Configuration for sampling source edges through a nonlinear transform. */
export type SubdividePolylineOptions = {
  /** Maps a source position to target coordinates; null or nonfinite output rejects the geometry.
   * Must be deterministic. A fresh array is passed on every invocation.
   */
  transform: (position: readonly number[]) => ArrayLike<number> | null;
  /** Positive error tolerance in target-coordinate units, measured across all output components. */
  tolerance: number;
  /** Optional factory, called once per original edge with independent endpoint copies.
   * Without it, source coordinates interpolate linearly. Must be deterministic.
   */
  createEdgeSampler?: (
    start: readonly number[],
    end: readonly number[],
    segmentIndex: number
  ) => PolylineEdgeSampler;
  /** Number of source components per vertex. Default 2. */
  size?: 2 | 3;
  /** Number of target components per vertex. Defaults to size. */
  targetSize?: 2 | 3;
  /** Positive maximum leaf length: Euclidean source distance by default, or the
   * custom sampler's declared length multiplied by its fraction interval.
   */
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
 * bound for arbitrary transforms. Source components interpolate linearly unless a custom
 * constant-speed source-edge sampler is supplied.
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
    createEdgeSampler,
    size = 2,
    targetSize = size,
    maxSegmentLength = Infinity,
    maxDepth = 16,
    maxVertices = 65536
  } = options;
  if (
    typeof transform !== 'function' ||
    (createEdgeSampler !== undefined && typeof createEdgeSampler !== 'function') ||
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

  function sampledSource(sampler: PolylineEdgeSampler, fraction: number): number[] {
    const value = sampler.sample(fraction);
    if (!value || value.length !== size) throw new RangeError('Invalid source-edge sample size');
    const source = Array.from(value);
    if (!source.every(Number.isFinite)) throw new RangeError('Nonfinite source-edge sample');
    return source;
  }

  function interpolate(
    a: Sample,
    b: Sample,
    fraction: number,
    sampler?: PolylineEdgeSampler
  ): Sample {
    const originalFraction = a.fraction * (1 - fraction) + b.fraction * fraction;
    // Always sample the original edge, never a new curve fitted to recursive endpoints.
    const source = sampler
      ? sampledSource(sampler, originalFraction)
      : a.source.map((value, i) => value * (1 - fraction) + b.source[i] * fraction);
    return sample(source, originalFraction);
  }

  function subdivide(
    a: Sample,
    b: Sample,
    segment: number,
    depth: number,
    sampler?: PolylineEdgeSampler
  ): void {
    let error = 0;
    let midpoint: Sample;
    for (const fraction of [0.25, 0.5, 0.75]) {
      const point = interpolate(a, b, fraction, sampler);
      if (fraction === 0.5) midpoint = point;
      const delta = point.target.map(
        (value, i) => value - (a.target[i] * (1 - fraction) + b.target[i] * fraction)
      );
      error = Math.max(error, Math.hypot(...delta));
    }
    const sourceLength = sampler
      ? sampler.length * (b.fraction - a.fraction)
      : Math.hypot(...a.source.map((value, i) => value - b.source[i]));
    if (error <= tolerance && sourceLength <= maxSegmentLength) {
      append(b, segment);
      return;
    }
    if (depth >= maxDepth) {
      throw new RangeError(`Polyline subdivision exceeded maxDepth on input edge ${segment}`);
    }
    subdivide(a, midpoint!, segment, depth + 1, sampler);
    subdivide(midpoint!, b, segment, depth + 1, sampler);
  }

  if (vertexCount) {
    let previous = sample(sources.slice(0, size), 0);
    append(previous, 0);
    for (let i = 1; i < vertexCount; i++) {
      const next = sample(sources.slice(i * size, (i + 1) * size), 1);
      const start = {...previous, fraction: 0};
      const sampler = createEdgeSampler?.(start.source.slice(), next.source.slice(), i - 1);
      if (createEdgeSampler) {
        if (
          !sampler ||
          typeof sampler.sample !== 'function' ||
          !Number.isFinite(sampler.length) ||
          sampler.length < 0
        ) {
          throw new RangeError('Invalid source-edge sampler');
        }
        for (const endpoint of [start, next]) {
          const sampled = sampledSource(sampler, endpoint.fraction);
          if (sampled.some((value, component) => value !== endpoint.source[component])) {
            throw new RangeError('Source-edge sampler endpoints must match input');
          }
        }
      }
      subdivide(start, next, i - 1, 0, sampler);
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
