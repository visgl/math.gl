// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/**
 * Float64 to float32 helpers for large-coordinate rendering.
 *
 * Applications keep positions in float64 (JavaScript numbers). The GPU gets float32 values,
 * either as a high/low pair or relative to an origin that follows the viewer. Each function
 * rounds with `Math.fround` (IEEE 754 round to nearest, ties to even).
 */
import type {NumericArray} from './types';

/** Exponent of the smallest positive normal float32 value, 2^-126. */
const FLOAT32_MIN_EXPONENT = -126;
/** Scratch view to read the bits of a float64 value. It is created on first use. */
let float64View: DataView | undefined;

/**
 * Rounds a number to float32.
 * @param value - The number to round.
 * @param name - The name of the value in the error message.
 * @returns `Math.fround(value)`.
 * @throws RangeError if `value` is not finite, or if it rounds to an infinite float32.
 */
function roundToFloat32(value: number, name: string): number {
  const rounded = Math.fround(value);
  if (!Number.isFinite(rounded)) {
    throw new RangeError(`${name} must be a finite number in float32 range, got ${value}`);
  }
  return rounded;
}

/**
 * Checks that every value of an array is finite.
 * @param values - The values to check.
 * @param name - The name of the array in the error message.
 * @throws RangeError if a value is not finite.
 */
function checkFinite(values: ArrayLike<number>, name: string): void {
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) {
      throw new RangeError(`${name}[${i}] must be a finite number, got ${values[i]}`);
    }
  }
}

/**
 * Returns the spacing of the float32 values at the magnitude of `value`: the distance from
 * `|value|` to the next larger float32 value when `|value|` is a float32 value.
 *
 * For `2^e <= |value| < 2^(e+1)` the spacing is `2^(e-23)`. Below `2^-126` it is `2^-149`.
 * Rounding to float32 moves a value by at most half the spacing.
 *
 * @param value - Any number that rounds to a finite float32 value.
 * @returns The spacing, a power of two.
 * @throws RangeError if `value` is not finite or is outside the float32 range.
 */
export function getFloat32Spacing(value: number): number {
  roundToFloat32(value, 'value');
  // Read the exponent from the float64 bits: Math.log2 is not exact next to a power of two.
  float64View ??= new DataView(new ArrayBuffer(8));
  float64View.setFloat64(0, value);
  const exponent = ((float64View.getUint16(0) >> 4) & 0x7ff) - 1023;
  // Below 2^-126 (float32 subnormal values, and zero) the spacing stays 2^-149.
  return 2 ** (Math.max(exponent, FLOAT32_MIN_EXPONENT) - 23);
}

/**
 * Splits a float64 value into a float32 pair, `high = fround(value)` and
 * `low = fround(value - high)`. This is the "fp64" split of the luma.gl and deck.gl shaders
 * (`fp64ify`, the `positions64Low` attribute).
 *
 * The subtraction `value - high` is exact. For `|value| >= 2^-101`, `high + low` differs from
 * `value` by at most `getFloat32Spacing(value) / 2^26`, a relative error of at most 2^-49.
 * Below `2^-101`, the error is at most 2^-150.
 *
 * @param value - A number that rounds to a finite float32 value.
 * @returns `[high, low]`, two float32 values.
 * @throws RangeError if `value` is not finite or is outside the float32 range.
 */
export function splitFloat64(value: number): [high: number, low: number] {
  const high = roundToFloat32(value, 'value');
  return [high, Math.fround(value - high)];
}

/**
 * Splits each value of an array with {@link splitFloat64}. The high parts go into `high`, the
 * low parts into `low`, at the same index. These are the two attribute buffers that deck.gl
 * reads for a 64-bit position (`positions` and `positions64Low`).
 *
 * @param values - Numbers that round to finite float32 values.
 * @param high - Optional storage for the high parts, at least `values.length` long.
 * @param low - Optional storage for the low parts, at least `values.length` long.
 * @returns The `high` and `low` arrays.
 * @throws RangeError if a value is not finite or is outside the float32 range, or if a
 *   storage array is too short. A thrown error can leave the earlier values written.
 */
export function splitFloat64Array(
  values: ArrayLike<number>,
  high: Float32Array = new Float32Array(values.length),
  low: Float32Array = new Float32Array(values.length)
): {high: Float32Array; low: Float32Array} {
  if (high.length < values.length || low.length < values.length) {
    throw new RangeError(`high and low must have at least ${values.length} elements`);
  }
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const highPart = roundToFloat32(value, `values[${i}]`);
    high[i] = highPart;
    low[i] = value - highPart;
  }
  return {high, low};
}

/** Options of {@link subtractOrigin}. */
export type SubtractOriginOptions = {
  /**
   * Number of array elements from one position to the next. The default is the length of the
   * origin. Elements after the first `origin.length` of each position are not read.
   */
  stride?: number;
  /**
   * Storage for the result, at least `count * origin.length` long, where `count` is
   * `positions.length / stride`. The default is a new `Float32Array`.
   */
  target?: Float32Array;
};

/**
 * Subtracts an origin from each position in float64, then rounds the result to float32.
 *
 * Each result component has an error of at most half of `getFloat32Spacing(position - origin)`,
 * plus one float64 rounding. Rounding the position and the origin to float32 first (the naive
 * way) gives an error of up to half of `getFloat32Spacing(position)` per value. The gain is about
 * `|position| / |position - origin|`.
 *
 * @param positions - Positions, `stride` elements per position. The length must be a multiple
 *   of `stride`.
 * @param origin - The origin, 1 to 4 finite components, for example `[x, y, z]`.
 * @param options - The stride and the storage for the result.
 * @returns `count * origin.length` float32 values, packed with no gaps.
 * @throws RangeError if the origin is not finite or has a length outside 1 to 4, if the stride
 *   is not an integer of at least `origin.length`, if the length of `positions` is not a
 *   multiple of the stride, if `target` is too short, or if a position is not finite or its
 *   difference from the origin is outside the float32 range. A thrown error can leave the
 *   earlier values written.
 */
export function subtractOrigin(
  positions: ArrayLike<number>,
  origin: ArrayLike<number>,
  options: SubtractOriginOptions = {}
): Float32Array {
  const size = origin.length;
  if (size < 1 || size > 4) {
    throw new RangeError(`origin must have 1 to 4 components, got ${size}`);
  }
  checkFinite(origin, 'origin');
  const stride = options.stride ?? size;
  if (!Number.isInteger(stride) || stride < size) {
    throw new RangeError(`stride must be an integer of at least ${size}, got ${stride}`);
  }
  if (positions.length % stride !== 0) {
    throw new RangeError(
      `positions.length (${positions.length}) must be a multiple of the stride (${stride})`
    );
  }
  const count = positions.length / stride;
  const target = options.target ?? new Float32Array(count * size);
  if (target.length < count * size) {
    throw new RangeError(`target must have at least ${count * size} elements`);
  }
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < size; j++) {
      const index = i * stride + j;
      target[i * size + j] = roundToFloat32(positions[index] - origin[j], `positions[${index}]`);
    }
  }
  return target;
}

/**
 * Moves a column-major 4x4 matrix into a frame whose origin is at `origin`:
 * `out = translation(-origin) * matrix`, in float64.
 *
 * For an affine matrix (last row `0, 0, 0, 1`), such as a model matrix, the rotation and scale
 * part does not change and the translation becomes `translation - origin`, with one float64
 * rounding. Round `out` to float32 after this call, not before. For a view matrix, which goes
 * from world to eye, use `mat4.translate(out, view, origin)` instead.
 *
 * @param out - The result. It can be the same array as `matrix`.
 * @param matrix - A column-major 4x4 matrix of finite values.
 * @param origin - The new origin `[x, y, z]`, finite, in the frame of the matrix result.
 * @returns `out`.
 * @throws RangeError if `matrix` does not have 16 finite values or `origin` does not have 3
 *   finite values.
 */
export function subtractOriginFromMatrix4<T extends NumericArray>(
  out: T,
  matrix: ArrayLike<number>,
  origin: ArrayLike<number>
): T {
  if (matrix.length !== 16) {
    throw new RangeError(`matrix must have 16 elements, got ${matrix.length}`);
  }
  if (origin.length !== 3) {
    throw new RangeError(`origin must have 3 components, got ${origin.length}`);
  }
  checkFinite(matrix, 'matrix');
  checkFinite(origin, 'origin');
  for (let column = 0; column < 4; column++) {
    const w = matrix[column * 4 + 3];
    for (let row = 0; row < 3; row++) {
      out[column * 4 + row] = matrix[column * 4 + row] - origin[row] * w;
    }
    out[column * 4 + 3] = w;
  }
  return out;
}
