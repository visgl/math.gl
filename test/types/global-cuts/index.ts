// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  cutSphericalPolygon,
  projectSphericalPolygon,
  MapEngine,
  type SphericalCutEdge
} from '@math.gl/geospatial/discontinuous';
const ring = [
  [0, 0],
  [30, 0],
  [0, 30]
] as const;
const map = new MapEngine({version: 1, id: 'map', definition: {type: 'air-ocean'}});
const parts = cutSphericalPolygon([ring], {interior: 'left'});
const edge: SphericalCutEdge = parts[0].edges[0][0];
if (edge.kind === 'source') edge.startFraction;
projectSphericalPolygon(map, [ring], {interior: 'left'});
map.projectGlobalPolygon([ring], {interior: 'right', maxWork: 1e6});
map.prepareFeatures([{geometry: {type: 'Polygon', coordinates: [ring]}}], {
  sphericalCuts: {interior: 'left'}
});
// @ts-expect-error Global complements require an explicit side.
cutSphericalPolygon([ring], {});
