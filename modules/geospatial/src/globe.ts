// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {LngLatRectangle} from './lng-lat-rectangle';
export {makeOBBFromRegion} from './make-obb-from-region';
export type {GeodeticRegion, MakeOBBFromRegionOptions} from './make-obb-from-region';
export {EllipsoidOccluder} from './ellipsoid-occluder';
export type {EllipsoidHorizon} from './ellipsoid-occluder';
export {getGlobeHorizonBounds, splitGlobeBounds} from './globe-horizon-bounds';
export type {GlobeBounds} from './globe-horizon-bounds';

export {subdivideGlobeMesh} from './subdivide-globe-mesh';
export type {SubdivideGlobeMeshOptions} from './subdivide-globe-mesh';
export {subdivideGeodesicPolyline} from './subdivide-geodesic-polyline';
export type {SubdivideGeodesicPolylineOptions} from './subdivide-geodesic-polyline';
export {subdivideRhumbPolyline} from './subdivide-rhumb-polyline';
export type {SubdivideRhumbPolylineOptions} from './subdivide-rhumb-polyline';
export {
  splitGeographicPolyline,
  splitGeographicPolygon,
  GeographicSeamError
} from './geographic-seams';
export type {
  GeographicSeamOptions,
  GeographicEdgeSource,
  GeographicSeamRing,
  GeographicSeamPolyline,
  GeographicPolygonRing,
  GeographicSeamPolygon
} from './geographic-seams';
