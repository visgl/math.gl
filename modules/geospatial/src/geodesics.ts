// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {EllipsoidGeodesicExact, GeodesicPolygonExact} from './geodesic-exact';
export type {ExactGeodesicOptions, ExactPolygonOptions, ExactPolygonResult} from './geodesic-exact';
export {
  GEODESIC_BUFFER_FIELDS,
  RHUMB_BUFFER_FIELDS,
  GeodesicLineBuffer,
  RhumbLineBuffer
} from './geodesic-buffer';

export {EllipsoidGeodesic} from './ellipsoid-geodesic';
export type {
  GeodesicResult,
  GeodesicLine,
  GeodesicParameters,
  GeodesicOptions
} from './ellipsoid-geodesic';
export {GeodesicPolygon} from './geodesic-polygon';
export type {GeodesicPolygonResult, GeodesicPolygonOptions} from './geodesic-polygon';

export {EllipsoidRhumb, RhumbDomainError} from './ellipsoid-rhumb';
export type {RhumbOptions, RhumbResult, RhumbLine} from './ellipsoid-rhumb';
export {RhumbPolygon} from './rhumb-polygon';
export type {RhumbPolygonOptions, RhumbPolygonResult, RhumbPointOptions} from './rhumb-polygon';
export {GeodesicIntersections} from './geodesic-intersections';
export type {
  GeodesicPath as GeodesicIntersectionPath,
  IntersectionPoint,
  IntersectionSearchOptions,
  IntersectionSearch,
  ClosestIntersection,
  SegmentIntersection
} from './geodesic-intersections';
export {GeodesicPath} from './geodesic-path';
export type {GeodesicPathOptions} from './geodesic-path';
export {RhumbPath} from './rhumb-path';
export type {RhumbPathOptions} from './rhumb-path';
