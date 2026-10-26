// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {HeightField} from './height-field';

/** Experimental layout version; changes to shader-visible words require a new version. */
export const TERRAIN_BUFFER_VERSION = 1;

export type PackedTerrain = {
  /** u32[8]: version, width, height, registration (vertex=0/cell=1), diagonal (00-11=0/10-01=1), count, 0, 0. */
  header: Uint32Array;
  /** f32[8]: column XY, row XY, inverse matrix in row-major order. XY queries are relative to origin. */
  transform: Float32Array;
  /** Row-major f32 elevations relative to origin[2]. Invalid entries are zero. */
  heights: Float32Array;
  /** Row-major u32 mask, exactly 0 or 1. */
  validity: Uint32Array;
  /** Host-side double-precision origin; never implicitly rounded into a GPU uniform. */
  origin: readonly [number, number, number];
  heightReference: string;
  /** Maximum absolute source-to-reconstructed height difference, in meters. */
  maxHeightError: number;
};

export type PackTerrainOptions = {
  /** Local Z origin; choosing an elevation near the data reduces f32 quantization. */
  heightOrigin?: number;
  /** Hard allocation budget for the four upload buffers. Defaults to 64 MiB. */
  maxBytes?: number;
  /** Reject a payload exceeding this measured height error, in meters. Defaults to Infinity. */
  maxHeightError?: number;
};

/** Packs explicit f32/u32 upload buffers without creating device resources or changing the source. */
export function packTerrainHeightField(
  field: HeightField,
  options: PackTerrainOptions = {}
): PackedTerrain {
  const heightOrigin = options.heightOrigin ?? 0;
  const maxBytes = options.maxBytes ?? 64 * 1024 * 1024;
  const maxHeightError = options.maxHeightError ?? Infinity;
  const count = field.width * field.height;
  if (!Number.isFinite(heightOrigin)) throw new Error('Terrain height origin must be finite');
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0)
    throw new Error('Terrain byte budget must be a nonnegative safe integer');
  if (!(maxHeightError >= 0)) throw new Error('Terrain height error budget must be nonnegative');
  if (!Number.isSafeInteger(count) || count > 0xffffffff || count * 8 + 64 > maxBytes)
    throw new Error('Terrain upload exceeds the sample or byte budget');
  const transform = createTransform([...field.columnStep, ...field.rowStep]);
  const header = new Uint32Array([
    TERRAIN_BUFFER_VERSION,
    field.width,
    field.height,
    field.registration === 'cell' ? 1 : 0,
    field.diagonal === '10-01' ? 1 : 0,
    count,
    0,
    0
  ]);
  const heights = new Float32Array(count);
  const validity = new Uint32Array(count);
  let error = 0;
  for (let row = 0; row < field.height; row++)
    for (let column = 0; column < field.width; column++) {
      const value = field.getHeight(column, row);
      if (value === undefined) continue;
      const index = row * field.width + column;
      heights[index] = value - heightOrigin;
      const reconstructed = heights[index] + heightOrigin;
      if (!Number.isFinite(heights[index]) || !Number.isFinite(reconstructed))
        throw new Error('Terrain height is not representable in the packed frame');
      const difference = Math.abs(reconstructed - value);
      if (!Number.isFinite(difference) || difference > maxHeightError)
        throw new Error('Terrain upload exceeds the height error budget');
      error = Math.max(error, difference);
      validity[index] = 1;
    }
  return {
    header,
    transform,
    heights,
    validity,
    origin: Object.freeze([field.origin[0], field.origin[1], heightOrigin]),
    heightReference: field.heightReference,
    maxHeightError: error
  };
}

/** Validates a transferred payload and reconstructs its quantized CPU surface.
 * This is a layout reference, not an emulator of shader floating-point arithmetic.
 */
export function unpackTerrainHeightField(packed: PackedTerrain): HeightField {
  const {header, transform, heights, validity, origin} = packed;
  if (
    !(header instanceof Uint32Array) ||
    header.length !== 8 ||
    header[0] !== TERRAIN_BUFFER_VERSION ||
    header[1] < 2 ||
    header[2] < 2 ||
    header[3] > 1 ||
    header[4] > 1 ||
    header[5] !== header[1] * header[2] ||
    header[6] !== 0 ||
    header[7] !== 0
  )
    throw new Error('Invalid terrain buffer header');
  if (
    !(transform instanceof Float32Array) ||
    transform.length !== 8 ||
    !transform.every(Number.isFinite)
  )
    throw new Error('Invalid terrain buffer transform');
  const expected = createTransform(Array.from(transform.subarray(0, 4)));
  if (!transform.every((value, index) => value === expected[index]))
    throw new Error('Terrain inverse transform does not match its grid');
  if (
    !(heights instanceof Float32Array) ||
    heights.length !== header[5] ||
    !(validity instanceof Uint32Array) ||
    validity.length !== header[5]
  )
    throw new Error('Invalid terrain sample buffers');
  if (
    !origin ||
    origin.length !== 3 ||
    !Number.isFinite(origin[0]) ||
    !Number.isFinite(origin[1]) ||
    !Number.isFinite(origin[2]) ||
    typeof packed.heightReference !== 'string' ||
    !Number.isFinite(packed.maxHeightError) ||
    packed.maxHeightError < 0
  )
    throw new Error('Invalid terrain host metadata');
  const values = new Float64Array(heights.length);
  const mask = new Uint8Array(heights.length);
  for (let i = 0; i < heights.length; i++) {
    if (!Number.isFinite(heights[i]) || validity[i] > 1 || (!validity[i] && heights[i] !== 0))
      throw new Error('Invalid terrain height or validity value');
    if (validity[i]) {
      values[i] = heights[i] + origin[2];
      if (!Number.isFinite(values[i])) throw new Error('Terrain height reconstruction overflow');
      mask[i] = 1;
    }
  }
  return new HeightField({
    width: header[1],
    height: header[2],
    heights: values,
    validity: mask,
    origin: [origin[0], origin[1]],
    columnStep: [transform[0], transform[1]],
    rowStep: [transform[2], transform[3]],
    registration: header[3] ? 'cell' : 'vertex',
    diagonal: header[4] ? '10-01' : '00-11',
    heightReference: packed.heightReference
  });
}

function createTransform(steps: number[]): Float32Array {
  const transform = new Float32Array(8);
  transform.set(steps);
  const [a, c, b, d] = transform;
  const determinant = a * d - b * c;
  const scale = Math.hypot(a, c) * Math.hypot(b, d);
  if (!Number.isFinite(determinant) || Math.abs(determinant) <= Number.EPSILON * scale)
    throw new Error('Terrain grid is singular after float32 conversion');
  transform.set([d / determinant, -b / determinant, -c / determinant, a / determinant], 4);
  if (!transform.every(Number.isFinite))
    throw new Error('Terrain transform is not representable in float32');
  return transform;
}
