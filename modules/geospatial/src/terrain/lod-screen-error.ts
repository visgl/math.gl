// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Cartesian bounds and a Euclidean bound on displacement from any point in those bounds. */
export type TerrainLodErrorBounds = {
  /** Lower corner in the input frame of the clip transform. */
  min: readonly [number, number, number];
  /** Upper corner in the input frame of the clip transform. */
  max: readonly [number, number, number];
  /** Maximum Euclidean displacement in input units. */
  geometricError: number;
};

/** Projection parameters for a pixel-error certificate. */
export type TerrainLodProjection = {
  /** Column-major Cartesian-to-clip matrix. Use a common local frame for matrix and bounds. */
  matrix: ArrayLike<number>;
  /** Viewport width in pixels. */
  width: number;
  /** Viewport height in pixels. */
  height: number;
  /** Clip Z convention. Defaults to minus-one-to-one. */
  depthRange?: 'minus-one-to-one' | 'zero-to-one';
};

/** Pad outward enough to enclose each binary64 operation, including subnormal results. */
function slack(value: number): number {
  return Math.abs(value) * (2 * Number.EPSILON) + Number.MIN_VALUE;
}

/** Lower enclosure of a rounded operation. */
function down(value: number): number {
  return value - slack(value);
}

/** Upper enclosure of a rounded operation. */
function up(value: number): number {
  return value + slack(value);
}

/** Bound 2D Euclidean pixel displacement under homogeneous projection.
 * Returns Infinity when potentially visible geometry reaches the near plane or W=0,
 * or when arithmetic cannot establish a finite bound. Fully near-clipped pairs
 * and exact zero displacement contribute zero. Side and far clipping are ignored.
 */
export function boundTerrainLodScreenError(
  bounds: TerrainLodErrorBounds,
  projection: TerrainLodProjection
): number {
  if (
    bounds.min.length !== 3 ||
    bounds.max.length !== 3 ||
    !bounds.min.every((value, i) => Number.isFinite(value) && value <= bounds.max[i]) ||
    !bounds.max.every(Number.isFinite) ||
    !Number.isFinite(bounds.geometricError) ||
    bounds.geometricError < 0
  )
    throw new RangeError('Invalid terrain LOD screen-error bounds');
  return prepareTerrainLodScreenError(projection)(bounds);
}

/** @internal Validate and snapshot the camera once per resident cut selection. */
export function prepareTerrainLodScreenError(projection: TerrainLodProjection) {
  const {width, height, depthRange = 'minus-one-to-one'} = projection;
  if (projection.matrix.length !== 16) throw new RangeError('Invalid terrain LOD clip matrix');
  const matrix = Array.from(projection.matrix);
  if (
    !matrix.every(Number.isFinite) ||
    !Number.isFinite(width) ||
    width <= 0 ||
    !Number.isFinite(height) ||
    height <= 0 ||
    (depthRange !== 'minus-one-to-one' && depthRange !== 'zero-to-one')
  )
    throw new RangeError('Invalid terrain LOD projection');
  return ({min, max, geometricError: error}: TerrainLodErrorBounds) => {
    if (error === 0) return 0;

    /** Enclose each clip row over the AABB and bound the row change for a displacement. */
    function row(index: number) {
      let lower = matrix[12 + index];
      let upper = lower;
      let change = 0;
      for (let axis = 0; axis < 3; axis++) {
        const coefficient = matrix[4 * axis + index];
        const a = coefficient * min[axis];
        const b = coefficient * max[axis];
        lower = down(lower + down(Math.min(a, b)));
        upper = up(upper + up(Math.max(a, b)));
        change = up(change + up(Math.abs(coefficient) * error));
      }
      return {lower, upper, change};
    }

    const w = row(3);
    const z = row(2);
    const nearLow = depthRange === 'zero-to-one' ? z.lower : down(z.lower + w.lower);
    const nearHigh = depthRange === 'zero-to-one' ? z.upper : up(z.upper + w.upper);
    const nearChange = depthRange === 'zero-to-one' ? z.change : up(z.change + w.change);
    if (up(nearHigh + nearChange) < 0) return 0;
    const denominator = down(w.lower - w.change);
    if (!(down(nearLow - nearChange) > 0 && denominator > 0)) return Infinity;

    /** Bound (dX - (X/W)dW) / (W+dW), in pixels. */
    function pixelAxis(index: number, extent: number) {
      const coordinate = row(index);
      const magnitude = Math.max(Math.abs(coordinate.lower), Math.abs(coordinate.upper));
      const ndc = up(magnitude / denominator);
      const coupling = up(ndc * w.change);
      const numerator = up(coordinate.change + coupling);
      return up(up(numerator / denominator) * up(extent / 2));
    }
    // The L1 norm bounds the Euclidean norm without assuming the axis maxima coincide.
    const pixels = pixelAxis(0, width) + pixelAxis(1, height);
    return Number.isFinite(pixels) ? up(pixels) : Infinity;
  };
}
