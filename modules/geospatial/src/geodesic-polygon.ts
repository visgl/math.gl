// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Typed geodesic polygon facade; the shared polygon kernel retains GeographicLib transit/reduction credits and MIT terms.
import {EllipsoidGeodesic, type GeodesicParameters} from './ellipsoid-geodesic';
import {SurfacePolygon} from './ellipsoid-helpers/surface-polygon';
export type {
  SurfacePolygonOptions as GeodesicPolygonOptions,
  SurfacePolygonResult as GeodesicPolygonResult
} from './ellipsoid-helpers/surface-polygon';
/** Streaming geodesic polygon/open polyline; degrees and caller axis units. */
export class GeodesicPolygon extends SurfacePolygon {
  constructor(parameters: GeodesicParameters, options: {polyline?: boolean} = {}) {
    super(new EllipsoidGeodesic(parameters), options);
  }
  override addPoint(latitude: number, longitude: number): this {
    return super.addPoint(latitude, longitude);
  }
}
