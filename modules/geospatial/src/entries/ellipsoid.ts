// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {Ellipsoid} from '../ellipsoid';
export {EllipsoidTangentPlane} from '../ellipsoid-tangent-plane';
export {isWGS84} from '../type-utils';
export type {SpheroidParameters} from '@math.gl/core/types';
export {EllipsoidGeodesic} from '../ellipsoid-geodesic';
export type {
  GeodesicResult,
  GeodesicLine,
  GeodesicParameters,
  GeodesicOptions
} from '../ellipsoid-geodesic';
export {LocalReferenceFrame} from '../local-reference-frame';
export type {LocalReferenceFrameOptions, HeadingPitchRoll} from '../local-reference-frame';
export type {TangentPlaneProjectionMode, TangentPlaneProjection} from '../ellipsoid-tangent-plane';

export {EllipsoidMetrics} from '../ellipsoid-metrics';
export type {AuxiliaryLatitude} from '../ellipsoid-metrics';
export {GeodesicPolygon} from '../geodesic-polygon';
export type {GeodesicPolygonResult, GeodesicPolygonOptions} from '../geodesic-polygon';

export {EllipsoidRhumb, RhumbDomainError} from '../ellipsoid-rhumb';
export type {RhumbOptions, RhumbResult, RhumbLine} from '../ellipsoid-rhumb';
export {RhumbPolygon} from '../rhumb-polygon';
export type {RhumbPolygonOptions, RhumbPolygonResult, RhumbPointOptions} from '../rhumb-polygon';
export {GeodesicIntersections} from '../geodesic-intersections';
export type {
  GeodesicPath,
  IntersectionPoint,
  IntersectionSearchOptions,
  IntersectionSearch,
  ClosestIntersection,
  SegmentIntersection
} from '../geodesic-intersections';
