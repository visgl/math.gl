// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Exact solver facade over the attributed compensated SurfacePolygon kernel; see ../../GEOGRAPHICLIB-LICENSE.txt.
import {EllipsoidGeodesicExact} from '../geodesic-exact';
import type {GeodesicParameters} from '../ellipsoid-geodesic';
import {SurfacePolygon} from '../ellipsoid-helpers/surface-polygon';
/** Compensated exact-geodesic polygon or open polyline. Angles are degrees. */
export class GeodesicPolygonExact extends SurfacePolygon {
  constructor(parameters: GeodesicParameters, options: {polyline?: boolean} = {}) {
    super(new EllipsoidGeodesicExact(parameters), options);
  }
  override addPoint(
    latitude: number,
    longitude: number,
    options: {longitudeTurns?: number} = {}
  ): this {
    if (options.longitudeTurns !== undefined && options.longitudeTurns !== 0)
      throw new RangeError(
        'Exact geodesic point insertion does not select winding routes; use addEdge'
      );
    return super.addPoint(latitude, longitude);
  }
}
