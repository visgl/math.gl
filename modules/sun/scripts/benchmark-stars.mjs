// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {getStarPositions, getStarLayerData} from '../dist/stars.js';
const observer = {latitude: 37.8, longitude: -122.4, elevation: 0};
for (const model of ['rectilinear', 'galactic']) {
  const start = performance.now();
  const stars = getStarPositions(1002000, {model});
  const end = performance.now();
  const data = getStarLayerData(stars, {observer, timestamp: Date.UTC(2026, 9, 4), clipHorizon: true});
  console.log(`${model}: ${stars.length} sources in ${(end - start).toFixed(1)} ms; ${data.length} GlobeView points in ${(performance.now() - end).toFixed(1)} ms`);
}
