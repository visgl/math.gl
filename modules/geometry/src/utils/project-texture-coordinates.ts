// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Projects packed source vertices into an explicitly located image rectangle. */
export type ProjectTextureCoordinatesOptions = {
  /** Prepared synchronous source-to-image transform. Receives a fresh source array.
   * Null or nonfinite XY rejects the operation; exceptions propagate unchanged.
   */
  transform: (position: readonly number[]) => ArrayLike<number> | null;
  /** Image rectangle [left, bottom, right, top], in the transform's output coordinates. */
  bounds: readonly [number, number, number, number];
  /** Number of packed source components per vertex. Default 3. */
  size?: 2 | 3;
  /** Texture origin. Default 'top-left'; bottom-left makes V increase with image Y. */
  origin?: 'top-left' | 'bottom-left';
};

/** Generates detached float64 UVs without changing positions, indices or vertex order.
 * Outside-image coordinates remain outside [0, 1]. This performs no subdivision,
 * seam inference, domain clipping, GPU readback, or asynchronous preparation.
 */
export function projectTextureCoordinates(
  positions: ArrayLike<number>,
  options: ProjectTextureCoordinatesOptions
): Float64Array {
  const {transform, bounds, size = 3, origin = 'top-left'} = options;
  if (size !== 2 && size !== 3) throw new RangeError('Source size must be 2 or 3');
  if (!Number.isSafeInteger(positions.length) || positions.length < 0 || positions.length % size) {
    throw new RangeError('Positions must contain complete packed vertices');
  }
  if (origin !== 'top-left' && origin !== 'bottom-left') {
    throw new RangeError('Invalid texture origin');
  }
  if (bounds.length !== 4 || !bounds.every(Number.isFinite)) {
    throw new RangeError('Image bounds must contain four finite values');
  }
  const [left, bottom, right, top] = bounds;
  const width = right - left;
  const height = top - bottom;
  if (!(width > 0) || !(height > 0) || !Number.isFinite(width) || !Number.isFinite(height)) {
    throw new RangeError('Image bounds must have finite positive extents');
  }
  const count = positions.length / size;
  const result = new Float64Array(count * 2);
  for (let index = 0; index < count; index++) {
    const source = Array.from({length: size}, (_, axis) => positions[index * size + axis]);
    if (!source.every(Number.isFinite)) throw new RangeError(`Invalid source vertex ${index}`);
    const projected = transform(source);
    if (
      !projected ||
      projected.length < 2 ||
      !Number.isFinite(projected[0]) ||
      !Number.isFinite(projected[1])
    ) {
      throw new RangeError(`Invalid projected vertex ${index}`);
    }
    const u = (projected[0] - left) / width;
    const v =
      origin === 'top-left' ? (top - projected[1]) / height : (projected[1] - bottom) / height;
    if (!Number.isFinite(u) || !Number.isFinite(v))
      throw new RangeError(`Invalid UV at vertex ${index}`);
    result[index * 2] = u;
    result[index * 2 + 1] = v;
  }
  return result;
}
