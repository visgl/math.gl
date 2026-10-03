// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original bilinear vertical grid and structural math.gl/geoid adapter.
// PROJ supplies independent numeric references; no upstream code is copied.
import type {VerticalGrid} from './types';
export type {VerticalGrid, VerticalGridCollection} from './types';

export type VerticalGridOptions = {
  /** Southwest node, [longitude, latitude] in degrees. */
  origin: readonly [number, number];
  /** Positive [longitude, latitude] node spacing in degrees. */
  step: readonly [number, number];
  size: readonly [number, number];
  /** Row-major south-to-north, west-to-east geoid undulations in metres. Copied. */
  offsets: ArrayLike<number>;
  /** Non-finite values are also treated as nodata. */
  noData?: number;
};

/** Prepare an owned, synchronous grid with inclusive edges and no extrapolation. */
export function createVerticalGrid(options: VerticalGridOptions): VerticalGrid {
  const [west, south] = options.origin;
  const [dx, dy] = options.step;
  const [width, height] = options.size;
  const east = west + (width - 1) * dx;
  const north = south + (height - 1) * dy;
  if (
    ![west, south, dx, dy, east, north].every(Number.isFinite) ||
    ![width, height].every(n => Number.isSafeInteger(n) && n >= 2) ||
    !(dx > 0 && dy > 0) ||
    east - west > 360 ||
    south < -90 ||
    north > 90 ||
    width * height !== options.offsets.length
  )
    throw new Error('Invalid vertical grid geometry or node count');
  const noData = options.noData;
  const values = Float64Array.from(options.offsets, value =>
    value === noData || !Number.isFinite(value) ? NaN : value
  );
  return Object.freeze({
    getOffset(longitude: number, latitude: number): number | undefined {
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude))
        throw new Error('Vertical grid coordinates must be finite');
      // Choose the equivalent longitude nearest the grid's centre, including
      // grids expressed in 0..360 degrees or crossing the antimeridian.
      let x = longitude * (180 / Math.PI);
      const epsilon = 1e-10;
      // Preserve either explicit edge of a grid with duplicate seam nodes.
      if (x < west - epsilon * dx || x > east + epsilon * dx)
        x += 360 * Math.round(((west + east) / 2 - x) / 360);
      let col = (x - west) / dx;
      let row = (latitude * (180 / Math.PI) - south) / dy;
      if (
        !Number.isFinite(col) ||
        !Number.isFinite(row) ||
        col < -epsilon ||
        row < -epsilon ||
        col > width - 1 + epsilon ||
        row > height - 1 + epsilon
      )
        return undefined;
      col = Math.max(0, Math.min(width - 1, col));
      row = Math.max(0, Math.min(height - 1, row));
      const i = Math.min(width - 2, Math.floor(col));
      const j = Math.min(height - 2, Math.floor(row));
      const u = col - i,
        v = row - j;
      let offset = 0;
      for (let n = 0; n < 4; n++) {
        const right = n % 2,
          upper = n > 1;
        const weight = (right ? u : 1 - u) * (upper ? v : 1 - v);
        if (!weight) continue;
        const value = values[(j + (upper ? 1 : 0)) * width + i + right];
        if (!Number.isFinite(value)) return undefined;
        offset += weight * value;
      }
      return offset;
    }
  });
}

/** Adapt an already loaded @math.gl/geoid Geoid without importing its implementation.
 * The supplied model owns its data and interpolation choice; do not mutate it while in use.
 */
export function createGeoidGrid(geoid: {
  getHeight(latitude: number, longitude: number): number;
}): VerticalGrid {
  if (!geoid || typeof geoid.getHeight !== 'function') throw new Error('Invalid geoid model');
  return Object.freeze({
    getOffset(longitude: number, latitude: number): number | undefined {
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude))
        throw new Error('Vertical grid coordinates must be finite');
      const offset = geoid.getHeight(latitude * (180 / Math.PI), longitude * (180 / Math.PI));
      return Number.isFinite(offset) ? offset : undefined;
    }
  });
}
