// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original rhumb polygon facade over the original rhumb integrals and separately attributed shared GeographicLib polygon transit/reduction rules.
import {EllipsoidRhumb, validateRhumbPoint} from './ellipsoid-rhumb';
import type {GeodesicParameters} from './ellipsoid-geodesic';
import {SurfacePolygon, type SurfacePointOptions} from './ellipsoid-helpers/surface-polygon';
export type {
  SurfacePolygonOptions as RhumbPolygonOptions,
  SurfacePolygonResult as RhumbPolygonResult,
  SurfacePointOptions as RhumbPointOptions
} from './ellipsoid-helpers/surface-polygon';
/** Streaming rhumb polygon/polyline. Extra inverse turns are explicit per point. */
export class RhumbPolygon extends SurfacePolygon {
  constructor(parameters: GeodesicParameters, options: {polyline?: boolean} = {}) {
    super(new EllipsoidRhumb(parameters), options);
  }
  override addPoint(latitude: number, longitude: number, options: SurfacePointOptions = {}): this {
    validateRhumbPoint(latitude, longitude);
    if (!Number.isSafeInteger(options.longitudeTurns ?? 0))
      throw new RangeError('Rhumb longitudeTurns must be a safe integer');
    return super.addPoint(latitude, longitude, options);
  }
}
