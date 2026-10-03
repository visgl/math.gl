// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original reader for the NOAA GTX format documented by GDAL and PROJ.
// No upstream implementation is copied. Independent tests use PROJ 9.5.1.
import {createVerticalGrid} from './vertical';
import type {VerticalGrid} from './types';

/** Read a big-endian GTX grid (float32 metre offsets) into an owned snapshot.
 * The conventional -88.8888 float32 sentinel and offsets outside ±1000 metres are nodata, matching PROJ GTX semantics.
 * Fetching/decompression remain caller-owned; the prepared grid is synchronous.
 */
export function parseGTXGrid(buffer: ArrayBuffer): VerticalGrid {
  const data = new DataView(buffer);
  if (data.byteLength < 40) throw new Error('Truncated GTX header');
  const height = data.getInt32(32),
    width = data.getInt32(36);
  if (width < 2 || height < 2 || data.byteLength !== 40 + width * height * 4)
    throw new Error('Invalid GTX dimensions or data length');
  const offsets = new Float32Array(width * height);
  for (let i = 0; i < offsets.length; i++) {
    const value = data.getFloat32(40 + i * 4);
    offsets[i] = Math.abs(value) > 1000 ? NaN : value;
  }
  return createVerticalGrid({
    origin: [data.getFloat64(8), data.getFloat64(0)],
    step: [data.getFloat64(24), data.getFloat64(16)],
    size: [width, height],
    offsets,
    noData: Math.fround(-88.8888)
  });
}
