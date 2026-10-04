// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original ENU basis rotation and inverse, inspired by PROJ's documented deformation contract; no PROJ implementation is copied or forked. Geocentric conversion reuses the attributed proj4js adaptation in datum.ts.
import {createSpatialDeformationModel} from './spatial-deformation';
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

/** Time-invariant ENU velocity, source-sampled in fixed XYZ space. */
export function createDeformationModel(options: DeformationModelOptions): DeformationModel {
  if (!options.grid || typeof options.grid.sample !== 'function')
    throw new Error('Prepared velocity grid required');
  const sample = options.grid.sample.bind(options.grid);
  return createSpatialDeformationModel(options, sample, true);
}
