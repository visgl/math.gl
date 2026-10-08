// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A rectangle in a shared two-dimensional Euclidean coordinate space. */
export type OrientedBox2D = {
  /** Two finite center coordinates; arrays, typed arrays and core vectors are accepted. */
  readonly center: Readonly<ArrayLike<number>>;
  /** Nonnegative half-width and half-height, in the center's coordinate units. */
  readonly halfSize: Readonly<ArrayLike<number>>;
  /** Nonzero finite width-axis direction. Its magnitude does not change the size. */
  readonly direction: Readonly<ArrayLike<number>>;
};

/** Test closed rectangles using their four separating axes, without allocating query objects.
 * Directions are normalized locally; the height axis is the perpendicular of the width axis.
 * Points and line segments (zero half-sizes) are supported. Inputs are never modified.
 * Subtracting centers before projection avoids projecting large translated corner coordinates.
 * @param first First rectangle in the shared coordinate space.
 * @param second Second rectangle in the shared coordinate space.
 * @param epsilon Nonnegative finite separation allowance in coordinate units; default zero.
 * Touching edges/vertices intersect. A gap no larger than epsilon on every tested axis also
 * intersects; this is a SAT allowance, not a Euclidean-distance query.
 * @throws RangeError For invalid vectors, sizes, directions or epsilon.
 */
export function intersectOrientedBoxes2D(
  first: OrientedBox2D,
  second: OrientedBox2D,
  epsilon = 0
): boolean {
  validateBox(first);
  validateBox(second);
  if (!Number.isFinite(epsilon) || epsilon < 0) {
    throw new RangeError('Box separation allowance must be finite and nonnegative');
  }

  // Scale before normalizing so both huge and subnormal directions remain usable.
  const firstDirectionScale = Math.max(Math.abs(first.direction[0]), Math.abs(first.direction[1]));
  const secondDirectionScale = Math.max(
    Math.abs(second.direction[0]),
    Math.abs(second.direction[1])
  );
  const firstWidthX = first.direction[0] / firstDirectionScale;
  const firstWidthY = first.direction[1] / firstDirectionScale;
  const secondWidthX = second.direction[0] / secondDirectionScale;
  const secondWidthY = second.direction[1] / secondDirectionScale;
  const firstLength = Math.hypot(firstWidthX, firstWidthY);
  const secondLength = Math.hypot(secondWidthX, secondWidthY);
  const firstX = firstWidthX / firstLength;
  const firstY = firstWidthY / firstLength;
  const secondX = secondWidthX / secondLength;
  const secondY = secondWidthY / secondLength;

  let displacementX = second.center[0] - first.center[0];
  let displacementY = second.center[1] - first.center[1];
  let scale = Math.max(
    first.halfSize[0],
    first.halfSize[1],
    second.halfSize[0],
    second.halfSize[1],
    epsilon
  );
  if (Number.isFinite(displacementX) && Number.isFinite(displacementY)) {
    scale = Math.max(scale, Math.abs(displacementX), Math.abs(displacementY)) || 1;
    displacementX /= scale;
    displacementY /= scale;
  } else {
    // Opposite-sign finite centers can overflow subtraction. Normalize before subtracting.
    scale = Math.max(
      scale,
      Math.abs(first.center[0]),
      Math.abs(first.center[1]),
      Math.abs(second.center[0]),
      Math.abs(second.center[1])
    );
    displacementX = second.center[0] / scale - first.center[0] / scale;
    displacementY = second.center[1] / scale - first.center[1] / scale;
  }
  const firstWidth = first.halfSize[0] / scale;
  const firstHeight = first.halfSize[1] / scale;
  const secondWidth = second.halfSize[0] / scale;
  const secondHeight = second.halfSize[1] / scale;
  const allowance = epsilon / scale;
  const cosine = Math.abs(firstX * secondX + firstY * secondY);
  const sine = Math.abs(firstX * secondY - firstY * secondX);

  if (
    Math.abs(displacementX * firstX + displacementY * firstY) >
    firstWidth + secondWidth * cosine + secondHeight * sine + allowance
  )
    return false;
  if (
    Math.abs(-displacementX * firstY + displacementY * firstX) >
    firstHeight + secondWidth * sine + secondHeight * cosine + allowance
  )
    return false;
  if (
    Math.abs(displacementX * secondX + displacementY * secondY) >
    secondWidth + firstWidth * cosine + firstHeight * sine + allowance
  )
    return false;
  return (
    Math.abs(-displacementX * secondY + displacementY * secondX) <=
    secondHeight + firstWidth * sine + firstHeight * cosine + allowance
  );
}

/** Validate structural boxes before entering the scalar query kernel. */
function validateBox(box: OrientedBox2D): void {
  validateVector(box.center);
  validateVector(box.halfSize);
  validateVector(box.direction);
  if (box.halfSize[0] < 0 || box.halfSize[1] < 0) {
    throw new RangeError('Box half-sizes must be nonnegative');
  }
  if (box.direction[0] === 0 && box.direction[1] === 0) {
    throw new RangeError('Box direction must be nonzero');
  }
}

/** Require exactly two finite components, without copying the vector. */
function validateVector(vector: Readonly<ArrayLike<number>>): void {
  if (vector.length !== 2 || !Number.isFinite(vector[0]) || !Number.isFinite(vector[1])) {
    throw new RangeError('Box vectors must have exactly two finite components');
  }
}
