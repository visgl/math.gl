// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {Polygon} from './polygon';

export {
  getPolygonSignedArea,
  getPolygonWindingDirection,
  forEachSegmentInPolygon,
  modifyPolygonWindingDirection,
  WINDING
} from './polygon-utils';

export {earcut} from './earcut';

export {clipPolygon, clipPolyline} from './lineclip';

export {cutPolygonByGrid, cutPolylineByGrid} from './cut-by-grid';

export {cutPolylineByMercatorBounds, cutPolygonByMercatorBounds} from './cut-by-mercator-bounds';

/** @deprecated */
export {Polygon as _Polygon} from './polygon';
