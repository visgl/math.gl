// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainGradientGrid, TerrainGradientMethod} from './derivatives';
import {TerrainSampleStatus} from './types';

export type TerrainGradientPyramidLevel = {
  width: number;
  height: number;
  /** Maximum side length, in source samples, of each block. Outer blocks may be smaller. */
  blockSize: number;
  /** Packed mean world-frame dz/dx and dz/dy; zero where validCounts is zero. */
  gradients: Float64Array;
  validCounts: Uint32Array;
  sampleCounts: Uint32Array;
};

export type TerrainGradientPyramid = {
  levels: TerrainGradientPyramidLevel[];
  method: TerrainGradientMethod;
  origin: readonly [number, number];
  columnStep: readonly [number, number];
  rowStep: readonly [number, number];
  registration: TerrainGradientGrid['registration'];
  heightReference: string;
};

/** Average valid world-frame gradient vectors over aligned source-sample blocks.
 * Counts include missing samples and preserve exact source weights at odd edges.
 * Slope of a mean gradient is not mean slope, nor the gradient of filtered heights.
 * A level's blocks refer to the source grid; partial edge blocks have smaller extents.
 */
export function createTerrainGradientPyramid(
  grid: TerrainGradientGrid,
  options: {maxSamples?: number} = {}
): TerrainGradientPyramid {
  const {width, height, gradients, statuses} = grid;
  const count = width * height,
    limit = options.maxSamples ?? 4_000_000;
  if (
    !Number.isSafeInteger(width) ||
    width < 1 ||
    !Number.isSafeInteger(height) ||
    height < 1 ||
    !Number.isSafeInteger(count) ||
    count > 0xffffffff ||
    !Number.isSafeInteger(limit) ||
    limit < count ||
    !(gradients instanceof Float64Array) ||
    gradients.length !== 2 * count ||
    !(statuses instanceof Uint8Array) ||
    statuses.length !== count ||
    (grid.method !== 'horn' && grid.method !== 'zevenbergen-thorne') ||
    (grid.registration !== 'cell' && grid.registration !== 'vertex') ||
    typeof grid.heightReference !== 'string' ||
    ![grid.origin, grid.columnStep, grid.rowStep].every(
      v => v.length === 2 && v.every(Number.isFinite)
    )
  )
    throw new Error('Invalid terrain gradient pyramid input or capacity');
  const base: TerrainGradientPyramidLevel = {
    width,
    height,
    blockSize: 1,
    gradients: new Float64Array(2 * count),
    validCounts: new Uint32Array(count),
    sampleCounts: new Uint32Array(count).fill(1)
  };
  for (let i = 0; i < count; i++) {
    if (statuses[i] > TerrainSampleStatus.NOT_RESIDENT)
      throw new Error('Invalid terrain gradient status');
    if (statuses[i] === TerrainSampleStatus.VALID) {
      if (!Number.isFinite(gradients[2 * i]) || !Number.isFinite(gradients[2 * i + 1]))
        throw new Error('Invalid terrain gradient value');
      base.gradients[2 * i] = gradients[2 * i];
      base.gradients[2 * i + 1] = gradients[2 * i + 1];
      base.validCounts[i] = 1;
    }
  }
  const levels = [base];
  let source = base;
  while (source.width > 1 || source.height > 1) {
    const w = Math.ceil(source.width / 2),
      h = Math.ceil(source.height / 2);
    const next: TerrainGradientPyramidLevel = {
      width: w,
      height: h,
      blockSize: source.blockSize * 2,
      gradients: new Float64Array(2 * w * h),
      validCounts: new Uint32Array(w * h),
      sampleCounts: new Uint32Array(w * h)
    };
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const out = y * w + x;
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            const sx = 2 * x + dx,
              sy = 2 * y + dy;
            if (sx >= source.width || sy >= source.height) continue;
            const index = sy * source.width + sx,
              n = source.validCounts[index],
              old = next.validCounts[out];
            next.sampleCounts[out] += source.sampleCounts[index];
            if (n) {
              const total = old + n;
              for (let axis = 0; axis < 2; axis++) {
                const a = next.gradients[2 * out + axis],
                  b = source.gradients[2 * index + axis];
                next.gradients[2 * out + axis] = old ? a * (old / total) + b * (n / total) : b;
              }
              next.validCounts[out] = total;
            }
          }
      }
    levels.push(next);
    source = next;
  }
  return {
    levels,
    method: grid.method,
    origin: [...grid.origin],
    columnStep: [...grid.columnStep],
    rowStep: [...grid.rowStep],
    registration: grid.registration,
    heightReference: grid.heightReference
  };
}
