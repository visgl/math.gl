// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original shared source-sampled displacement and bounded inverse kernel; no upstream implementation copied.
import type {inverseDisplacement} from './deformation-inverse';
import {createLocalFrameBasis, eastNorthUpBasis, localToFixed} from '@math.gl/core/local-frame';
import {geocentricToGeodeticInPlace} from './datum';
import type {ProjectionPoint} from './types';
import type {DeformationModel, DeformationModelOptions} from './deformation';
export type DisplacementSampler = (
  longitude: number,
  latitude: number,
  output: ProjectionPoint,
  source: number,
  target: number
) => boolean;
export function createSpatialDeformationModel(
  options: Omit<DeformationModelOptions, 'grid'>,
  sample: DisplacementSampler,
  velocity = false,
  inverseSolver?: typeof inverseDisplacement
): DeformationModel {
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
  function validateEpochs(source: number, target: number): void {
    if (
      !Number.isFinite(source) ||
      !Number.isFinite(target) ||
      source < start ||
      source > end ||
      target < start ||
      target > end ||
      !Number.isFinite(target - source)
    )
      throw new Error('Deformation epochs outside model epochRange or non-finite');
  }
  const frame = createLocalFrameBasis();
  function displacement(point: ProjectionPoint, source: number, target: number): void {
    geocentricToGeodeticInPlace(point, ellipsoid);
    const longitude = point.x,
      latitude = point.y;
    if (!sample(longitude, latitude, point, source, target))
      throw new Error(
        velocity ? 'No velocity grid covers coordinate' : 'No deformation field covers coordinate'
      );
    if (!eastNorthUpBasis(longitude, latitude, frame) || !localToFixed(point, frame))
      throw new Error('Non-finite deformation output');
  }
  function apply(point: ProjectionPoint, source: number, target: number, inverse: boolean): void {
    validateEpochs(source, target);
    const x = point.x,
      y = point.y,
      z = point.z;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
      throw new Error('Finite deformation XYZ required');
    try {
      if (inverse && inverseSolver) {
        inverseSolver(point, x, y, z, source, target, displacement);
        return;
      }
      let px = x,
        py = y,
        pz = z;
      for (let iteration = 0; iteration < (inverse ? 32 : 1); iteration++) {
        point.x = px;
        point.y = py;
        point.z = pz;
        displacement(point, source, target);
        const scale = (inverse ? -1 : 1) * (velocity ? target - source : 1);
        const nx = x + scale * point.x,
          ny = y + scale * point.y,
          nz = z + scale * point.z;
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
  }
  return Object.freeze({
    forward: (point, source, target) => apply(point, source, target, false),
    inverse: (point, source, target) => apply(point, source, target, true)
  });
}
