// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A finite, continuous source box with ordered minimum and maximum coordinates. */
export type ProjectionSourceBounds = readonly [ArrayLike<number>, ArrayLike<number>];

/** Controls bounded sampling of a prepared synchronous coordinate transform. */
export type ProjectBoundsOptions = {
  /** Receives a fresh source array. Null/nonfinite output rejects the whole result.
   * Exceptions propagate unchanged; no projection engine is imported by this helper.
   */
  transform: (position: readonly number[]) => ArrayLike<number> | null;
  /** Output dimension, 2 or 3. Defaults to the source dimension. */
  targetSize?: 2 | 3;
  /** Equal subdivisions on each nonzero source axis. Positive integer; default 8. */
  subdivisions?: number;
  /** Maximum transform calls. Positive safe integer; default 262144. */
  maxSamples?: number;
  /** Optional caller-qualified global Lipschitz constant for EACH output component,
   * measured against Euclidean source distance over the ENTIRE source box.
   * Requires a finite continuous transform throughout the box, not merely at samples.
   * This contract cannot be inferred or verified from point samples.
   */
  lipschitz?: readonly number[];
};

/** Detached bounds plus an explicit qualification; invalid results never expose partial bounds. */
export type ProjectedBoundsResult =
  | {
      /** 'sampled' is for approximate fitting only; 'conservative' requires the supplied contract. */
      status: 'sampled' | 'conservative';
      /** Output minimum and maximum vectors; safe for culling only in conservative mode. */
      bounds: [number[], number[]];
      /** Number of transform calls. */
      sampleCount: number;
    }
  | {
      /** A null/nonfinite transform sample or unrepresentable enclosure was encountered. */
      status: 'invalid';
      /** No partial result is safe to use. */
      bounds: null;
      /** Number of transform calls, including an invalid sample if applicable. */
      sampleCount: number;
    };

/** Projects a lattice covering corners, edges, faces and the interior of a 2D/3D box.
 * Sampling alone cannot establish an enclosure for a nonlinear transform. When qualified
 * global Lipschitz constants are supplied, inflate by the lattice covering radius instead
 * of claiming corner/sample extrema are conservative. Split seams and domains beforehand.
 */
export function projectBounds(
  sourceBounds: ProjectionSourceBounds,
  options: ProjectBoundsOptions
): ProjectedBoundsResult {
  const [minimum, maximum] = sourceBounds;
  const size = minimum.length;
  const {transform, targetSize = size, subdivisions = 8, maxSamples = 262144, lipschitz} = options;
  if (
    (size !== 2 && size !== 3) ||
    maximum.length !== size ||
    (targetSize !== 2 && targetSize !== 3)
  ) {
    throw new RangeError('Bounds and target dimension must be 2 or 3');
  }
  if (
    !Number.isSafeInteger(subdivisions) ||
    subdivisions < 1 ||
    !Number.isSafeInteger(maxSamples) ||
    maxSamples < 1
  ) {
    throw new RangeError('Subdivision and sample budgets must be positive safe integers');
  }
  if (
    lipschitz &&
    (lipschitz.length !== targetSize ||
      !lipschitz.every(value => Number.isFinite(value) && value >= 0))
  ) {
    throw new RangeError('Lipschitz constants must be finite, nonnegative and match target size');
  }
  const widths: number[] = [];
  const counts: number[] = [];
  let count = 1;
  for (let axis = 0; axis < size; axis++) {
    const width = maximum[axis] - minimum[axis];
    if (
      !Number.isFinite(minimum[axis]) ||
      !Number.isFinite(maximum[axis]) ||
      !Number.isFinite(width) ||
      width < 0
    ) {
      throw new RangeError('Source bounds must have finite ordered coordinates and extents');
    }
    widths.push(width);
    counts.push(width === 0 ? 1 : subdivisions + 1);
    count *= counts[axis];
    if (!Number.isSafeInteger(count) || count > maxSamples) {
      throw new RangeError('Projected bounds exceed the sample budget');
    }
  }
  const lower = new Array<number>(targetSize).fill(Infinity);
  const upper = new Array<number>(targetSize).fill(-Infinity);
  for (let index = 0; index < count; index++) {
    let remaining = index;
    const source: number[] = [];
    for (let axis = 0; axis < size; axis++) {
      const step = remaining % counts[axis];
      remaining = Math.floor(remaining / counts[axis]);
      source.push(
        step === 0
          ? minimum[axis]
          : step === subdivisions
            ? maximum[axis]
            : minimum[axis] + widths[axis] * (step / subdivisions)
      );
    }
    const projected = transform(source);
    if (!projected || projected.length < targetSize) {
      return {status: 'invalid', bounds: null, sampleCount: index + 1};
    }
    for (let axis = 0; axis < targetSize; axis++) {
      if (!Number.isFinite(projected[axis]))
        return {status: 'invalid', bounds: null, sampleCount: index + 1};
      lower[axis] = Math.min(lower[axis], projected[axis]);
      upper[axis] = Math.max(upper[axis], projected[axis]);
    }
  }
  if (lipschitz) {
    const radius = Math.hypot(
      ...widths.map(
        (width, axis) =>
          width / subdivisions / 2 +
          4 * Number.EPSILON * Math.max(Math.abs(minimum[axis]), Math.abs(maximum[axis]))
      )
    );
    for (let axis = 0; axis < targetSize; axis++) {
      const displacement = lipschitz[axis] * radius;
      const roundoff =
        8 *
        Number.EPSILON *
        Math.max(1, Math.abs(lower[axis]), Math.abs(upper[axis]), displacement);
      lower[axis] -= displacement + roundoff;
      upper[axis] += displacement + roundoff;
      if (!Number.isFinite(lower[axis]) || !Number.isFinite(upper[axis])) {
        return {status: 'invalid', bounds: null, sampleCount: count};
      }
    }
  }
  return {
    status: lipschitz ? 'conservative' : 'sampled',
    bounds: [lower, upper],
    sampleCount: count
  };
}
