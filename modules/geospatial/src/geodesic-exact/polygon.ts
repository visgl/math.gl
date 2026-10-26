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
    const solver = new EllipsoidGeodesicExact(parameters);
    // Preserve the 360-degree transit parity while bounding internal labels.
    // External point inputs retain the solver's documented magnitude limit.
    super(
      {
        surfaceArea: solver.surfaceArea,
        inverse: (a, b, c, d, opts) => solver.inverse(a, b % 720, c, d % 720, opts),
        direct: (a, b, c, d, opts) => solver.direct(a, b % 720, c, d, opts)
      },
      options
    );
  }
  override addPoint(
    latitude: number,
    longitude: number,
    options: {longitudeTurns?: number} = {}
  ): this {
    if (Math.abs(longitude) > 1e6)
      throw new RangeError('Exact polygon longitude exceeds input profile');
    if (options.longitudeTurns !== undefined && options.longitudeTurns !== 0)
      throw new RangeError(
        'Exact geodesic point insertion does not select winding routes; use addEdge'
      );
    return super.addPoint(latitude, longitude);
  }
}
