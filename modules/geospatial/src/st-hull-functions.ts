// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Binary} from 'apache-arrow';
import {writeWKB} from '@math.gl/core/arrow';
import {concaveHull, convexHull} from './spatial-hulls';
import {geometryTypes, spatialFunction} from './spatial-sql';

/** Returns the smallest convex footprint enclosing the input vertices. */
export const ST_CONVEXHULL = /* @__PURE__ */ spatialFunction(
  'ST_ConvexHull',
  [[...geometryTypes, 'GeometryCollection']],
  /* @__PURE__ */ new Binary(),
  ([geometry]) => writeWKB(convexHull(geometry!), 'xy')
);

/** Returns a hole-free concave footprint around a planar point cloud. */
export const ST_CONCAVEHULL = /* @__PURE__ */ spatialFunction(
  'ST_ConcaveHull',
  [['Point', 'MultiPoint']],
  /* @__PURE__ */ new Binary(),
  ([geometry], ratio) => writeWKB(concaveHull(geometry!, ratio!), 'xy'),
  1
);
