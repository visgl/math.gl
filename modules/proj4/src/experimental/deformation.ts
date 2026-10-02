// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original ENU basis rotation and inverse, inspired by PROJ's documented
// deformation contract; no PROJ implementation is copied or forked.
// Geocentric conversion reuses the attributed proj4js adaptation in datum.ts.
import {geocentricToGeodeticInPlace} from './datum';
import type {ProjectionPoint} from './types';
import type {VelocityGrid} from './grids/velocity';

/** Both methods take the ORIGINAL source/target epoch pair. inverse solves forward,
 * rather than sampling the endpoint with a negated duration. XYZ are ECEF metres.
 * Successful calls mutate XYZ; a failure restores the input. No per-point allocations.
 */
export type DeformationModel = {
  forward(point: ProjectionPoint, sourceEpoch: number, targetEpoch: number): void;
  inverse(point: ProjectionPoint, sourceEpoch: number, targetEpoch: number): void;
};
export type DeformationModelOptions = {
  readonly grid: VelocityGrid;
  /** Inclusive, application-reviewed validity interval in decimal years. */
  readonly epochRange: readonly [number, number];
  /** Must match the velocity model's geographic reference frame. Default WGS84. */
  readonly ellipsoid?: {readonly semiMajorAxis: number; readonly flattening: number};
};

/** Linear, time-invariant ENU velocity model, applied in geocentric space.
 * No event offsets, time-varying components, extrapolation or automatic model loading.
 */
export function createDeformationModel(options: DeformationModelOptions): DeformationModel {
  const grid = options.grid;
  if (!grid || typeof grid.sample !== 'function')
    throw new Error('Prepared velocity grid required');
  const sample = grid.sample.bind(grid);
  const range = options.epochRange;
  if (
    !Array.isArray(range) ||
    range.length !== 2 ||
    !range.every(Number.isFinite) ||
    range[0] > range[1]
  )
    throw new Error('Finite ordered deformation epochRange required');
  const start = range[0],
    end = range[1];
  const a = options.ellipsoid?.semiMajorAxis ?? 6378137;
  const f = options.ellipsoid?.flattening ?? 1 / 298.257223563;
  if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(f) || f < 0 || f >= 1)
    throw new Error('Invalid deformation ellipsoid');
  if (!(a * (1 - f) > 0) || !(f * (2 - f) < 1)) throw new Error('Invalid deformation ellipsoid');
  const ellipsoid = Object.freeze({
    semiMajorAxis: a,
    semiMinorAxis: a * (1 - f),
    eccentricitySquared: f * (2 - f)
  });
  const duration = (source: number, target: number): number => {
    if (
      !Number.isFinite(source) ||
      !Number.isFinite(target) ||
      source < start ||
      source > end ||
      target < start ||
      target > end
    )
      throw new Error('Deformation epochs outside model epochRange or non-finite');
    const dt = target - source;
    if (!Number.isFinite(dt)) throw new Error('Non-finite deformation duration');
    return dt;
  };
  // Scratch belongs to the caller. Recursive custom sampling cannot overwrite shared state.
  const velocity = (point: ProjectionPoint): void => {
    geocentricToGeodeticInPlace(point, ellipsoid);
    const longitude = point.x,
      latitude = point.y;
    if (!sample(longitude, latitude, point)) throw new Error('No velocity grid covers coordinate');
    const east = point.x,
      north = point.y,
      up = point.z;
    const sp = Math.sin(latitude),
      cp = Math.cos(latitude),
      sl = Math.sin(longitude),
      cl = Math.cos(longitude);
    // Rotate north/up into the radial/Z plane, then rotate radial/east by longitude.
    const radial = up * cp - north * sp;
    point.x = radial * cl - east * sl;
    point.y = radial * sl + east * cl;
    point.z = up * sp + north * cp;
  };
  const apply = (
    point: ProjectionPoint,
    source: number,
    target: number,
    inverse: boolean
  ): void => {
    const dt = duration(source, target);
    const x = point.x,
      y = point.y,
      z = point.z;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
      throw new Error('Finite deformation XYZ required');
    try {
      let px = x,
        py = y,
        pz = z;
      for (let iteration = 0; iteration < (inverse ? 32 : 1); iteration++) {
        point.x = px;
        point.y = py;
        point.z = pz;
        velocity(point);
        const nx = x + (inverse ? -dt : dt) * point.x,
          ny = y + (inverse ? -dt : dt) * point.y,
          nz = z + (inverse ? -dt : dt) * point.z;
        if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz))
          throw new Error('Non-finite deformation output');
        if (!inverse || Math.hypot(nx - px, ny - py, nz - pz) <= 1e-8) {
          point.x = nx;
          point.y = ny;
          point.z = nz;
          return;
        }
        px = nx;
        py = ny;
        pz = nz;
      }
      throw new Error('Deformation inverse did not converge');
    } catch (error) {
      point.x = x;
      point.y = y;
      point.z = z;
      throw error;
    }
  };
  return Object.freeze({
    forward: (point, source, target) => apply(point, source, target, false),
    inverse: (point, source, target) => apply(point, source, target, true)
  });
}
