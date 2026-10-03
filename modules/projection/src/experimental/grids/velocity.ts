// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original ENU grid preparation inspired by PROJ's velocity grid conventions. Bilinear interpolation reuses original math.gl vertical grids; no upstream fork.
import {createVerticalGrid} from './vertical';
import type {VerticalGridOptions} from './vertical';
import type {ProjectionPoint} from '../types';
import type {VerticalGrid} from './types';

/** Prepared velocities in metres per decimal year at Greenwich lon/lat radians.
 * sample writes ENU into output.x/y/z only on success. False means no coverage.
 */
export type VelocityGrid = {
  sample(longitude: number, latitude: number, output: ProjectionPoint): boolean;
};
export type VelocityGridOptions = Omit<VerticalGridOptions, 'offsets'> & {
  readonly units: 'm/year' | 'mm/year';
  /** Owned snapshots, row-major south-to-north and west-to-east. */
  readonly east: ArrayLike<number>;
  readonly north: ArrayLike<number>;
  readonly up: ArrayLike<number>;
};
/** Internal atomic three-band sampler: never mix components from different images. */
export function velocityGridFromComponents(
  east: VerticalGrid,
  north: VerticalGrid,
  up: VerticalGrid,
  scale: number
): VelocityGrid {
  return Object.freeze({
    sample(longitude: number, latitude: number, output: ProjectionPoint): boolean {
      const e = east.getOffset(longitude, latitude),
        n = north.getOffset(longitude, latitude),
        u = up.getOffset(longitude, latitude);
      if (e === undefined || n === undefined || u === undefined) return false;
      const x = e * scale,
        y = n * scale,
        z = u * scale;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
        throw new Error('Non-finite velocity interpolation');
      output.x = x;
      output.y = y;
      output.z = z;
      return true;
    }
  });
}
/** No extrapolation; nodata in any contributing component makes the sample unavailable. */
export function createVelocityGrid(options: VelocityGridOptions): VelocityGrid {
  if (!['m/year', 'mm/year'].includes(options.units))
    throw new Error('Explicit velocity units required');
  return velocityGridFromComponents(
    createVerticalGrid({...options, offsets: options.east}),
    createVerticalGrid({...options, offsets: options.north}),
    createVerticalGrid({...options, offsets: options.up}),
    options.units === 'mm/year' ? 0.001 : 1
  );
}
