// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original caller-owned scalar output validation and commit helpers.
import type {ProjectionPoint} from './types';

export type ProjectionCoordinate = readonly number[] | Float32Array | Float64Array;
export type ProjectionOutput = number[] | Float32Array | Float64Array;
const FLOAT32_MAX = 3.4028234663852886e38;

/** Validate storage before executing user hooks; no views or coordinate copies are created. */
export function validateScalarOutput(
  coordinate: ProjectionCoordinate,
  output: ProjectionOutput,
  length: number
): void {
  if (
    !(
      Array.isArray(coordinate) ||
      coordinate instanceof Float32Array ||
      coordinate instanceof Float64Array
    )
  )
    throw new Error('Scalar input requires a number array, Float32Array or Float64Array');
  if (
    !(Array.isArray(output) || output instanceof Float32Array || output instanceof Float64Array) ||
    output.length < length
  )
    throw new Error(
      'Scalar output requires a preallocated number array, Float32Array or Float64Array with sufficient capacity'
    );
  if (coordinate === output || Array.isArray(coordinate) || Array.isArray(output)) return;
  const input = coordinate as Float32Array | Float64Array;
  const result = output as Float32Array | Float64Array;
  const shared =
    typeof SharedArrayBuffer !== 'undefined' &&
    input.buffer instanceof SharedArrayBuffer &&
    result.buffer instanceof SharedArrayBuffer;
  // Cloned SharedArrayBuffer wrappers can refer to the same storage without === identity.
  if (
    (input.buffer === result.buffer || shared) &&
    input.byteOffset < result.byteOffset + length * result.BYTES_PER_ELEMENT &&
    result.byteOffset < input.byteOffset + input.byteLength
  )
    throw new Error('Scalar input/output views overlap; use the same view for in-place projection');
}

/** Numerical/storage overflow errors happen before committing any output ordinate. */
export function writeScalarOutput<T extends ProjectionOutput>(
  coordinate: ProjectionCoordinate,
  output: T,
  point: ProjectionPoint,
  length: number
): T {
  if (output instanceof Float32Array) {
    if (
      Math.abs(point.x) > FLOAT32_MAX ||
      Math.abs(point.y) > FLOAT32_MAX ||
      (length >= 3 && Math.abs(point.z) > FLOAT32_MAX)
    )
      throw new Error('Projected coordinate exceeds Float32 range');
    for (let i = 3; i < coordinate.length; i++) {
      const value = coordinate[i];
      if (Number.isFinite(value) && Math.abs(value) > FLOAT32_MAX)
        throw new Error('Trailing ordinate exceeds Float32 range');
    }
  }
  // XYZ have already been read into private scratch, so exact input/output identity is safe.
  for (let i = 3; i < coordinate.length; i++) output[i] = coordinate[i];
  output[0] = point.x;
  output[1] = point.y;
  if (length >= 3) output[2] = point.z;
  return output;
}
