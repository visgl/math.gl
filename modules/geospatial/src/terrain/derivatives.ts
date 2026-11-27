// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {HeightField} from './height-field';
import {TerrainSampleStatus as Status} from './types';

export type TerrainGradientMethod = 'horn' | 'zevenbergen-thorne';
export type TerrainGradientGrid = {
  width: number;
  height: number;
  /** Packed world-frame dz/dx, dz/dy; zero where status is not VALID. */
  gradients: Float64Array;
  statuses: Uint8Array;
  method: TerrainGradientMethod;
  origin: readonly [number, number];
  columnStep: readonly [number, number];
  rowStep: readonly [number, number];
  registration: HeightField['registration'];
  heightReference: string;
};

/** Raster stencil derivatives, distinct from derivatives of an interpolation patch.
 * Both methods require all nine samples; no extrapolation or nodata filling occurs.
 */
export function createTerrainGradientGrid(
  field: HeightField,
  options: {method?: TerrainGradientMethod; maxSamples?: number} = {}
): TerrainGradientGrid {
  const method = options.method ?? 'horn';
  if (method !== 'horn' && method !== 'zevenbergen-thorne')
    throw new Error('Unknown terrain gradient method');
  const count = field.width * field.height,
    limit = options.maxSamples ?? 1_100_000;
  if (!Number.isSafeInteger(limit) || limit < 0 || count > limit)
    throw new Error('Terrain gradient sample capacity exceeded');
  const gradients = new Float64Array(count * 2),
    statuses = new Uint8Array(count).fill(Status.OUTSIDE_DOMAIN);
  const [a, c] = field.columnStep,
    [b, d] = field.rowStep;
  const determinant = a * d - b * c;
  const ix = d / determinant,
    iy = -c / determinant,
    jx = -b / determinant,
    jy = a / determinant;
  const window = new Float64Array(9);
  for (let row = 1; row < field.height - 1; row++)
    for (let column = 1; column < field.width - 1; column++) {
      const index = row * field.width + column;
      let valid = true;
      for (let y = -1; y <= 1; y++)
        for (let x = -1; x <= 1; x++) {
          const value = field.getHeight(column + x, row + y);
          if (value === undefined) valid = false;
          window[(y + 1) * 3 + x + 1] = value ?? 0;
        }
      if (!valid) {
        statuses[index] = Status.NO_DATA;
        continue;
      }
      const dc =
        method === 'horn'
          ? difference(window[2], window[0], 8) +
            difference(window[5], window[3], 4) +
            difference(window[8], window[6], 8)
          : difference(window[5], window[3], 2);
      const dr =
        method === 'horn'
          ? difference(window[6], window[0], 8) +
            difference(window[7], window[1], 4) +
            difference(window[8], window[2], 8)
          : difference(window[7], window[1], 2);
      const gx = dc * ix + dr * iy,
        gy = dc * jx + dr * jy;
      if (!Number.isFinite(gx) || !Number.isFinite(gy)) {
        statuses[index] = Status.NUMERIC_ERROR;
        continue;
      }
      gradients[2 * index] = gx;
      gradients[2 * index + 1] = gy;
      statuses[index] = Status.VALID;
    }
  return {
    width: field.width,
    height: field.height,
    gradients,
    statuses,
    method,
    origin: field.origin,
    columnStep: field.columnStep,
    rowStep: field.rowStep,
    registration: field.registration,
    heightReference: field.heightReference
  };
}

function difference(a: number, b: number, divisor: number): number {
  const delta = a - b;
  return Number.isFinite(delta) ? delta / divisor : a / divisor - b / divisor;
}
