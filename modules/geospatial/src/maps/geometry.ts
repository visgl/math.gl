// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  intersectPolygons,
  unionPolygons,
  subtractPolygons,
  xorPolygons
} from '@math.gl/geometry/polygon';
import {projectSphericalPolygon} from './global-polygons';
import {prepareMapFeatures} from './prepare-features';
/** Overlay callbacks exposed by the map geometry adapter. */
const polygonClipping = {
  intersection: intersectPolygons,
  union: unionPolygons,
  difference: subtractPolygons,
  xor: xorPolygons
};
/** Explicit polygon clipping and prepared-feature support. */
export const mapGeometry = {polygonClipping, projectSphericalPolygon, prepareMapFeatures};
/** Enable polygon operations on a standalone chart map. */
export function withMapGeometry<T extends object>(map: T): T {
  return Object.assign(map, {polygonClipping});
}
