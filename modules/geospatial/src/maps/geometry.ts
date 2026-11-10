// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import polygonClipping from 'polygon-clipping';
import {projectSphericalPolygon} from './global-polygons';
import {prepareMapFeatures} from './prepare-features';
/** Explicit polygon clipping and prepared-feature support. */
export const mapGeometry = {polygonClipping, projectSphericalPolygon, prepareMapFeatures};
/** Enable polygon operations on a standalone chart map. */
export function withMapGeometry<T extends object>(map: T): T {
  return Object.assign(map, {polygonClipping});
}
