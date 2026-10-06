// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {Ellipsoid} from './ellipsoid';
export {EllipsoidTangentPlane} from './ellipsoid-tangent-plane';
export {LngLatRectangle} from './lng-lat-rectangle';
export {makeOBBFromRegion} from './make-obb-from-region';
export type {GeodeticRegion, MakeOBBFromRegionOptions} from './make-obb-from-region';
export {isWGS84} from './type-utils';

export type {SpheroidParameters} from '@math.gl/types';

export {EllipsoidOccluder} from './ellipsoid-occluder';
export type {EllipsoidHorizon} from './ellipsoid-occluder';
export {getGlobeHorizonBounds, splitGlobeBounds} from './globe-horizon-bounds';
export type {GlobeBounds} from './globe-horizon-bounds';

export {
  getGeographicTile,
  getGeographicTileBounds,
  getGeographicTileRanges
} from './geographic-tiles';
export type {GeographicTile, GeographicTileRange} from './geographic-tiles';
