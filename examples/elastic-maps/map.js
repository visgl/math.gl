// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {MapEngine} from '@math.gl/geospatial/discontinuous';
import {elasticI, elasticII, elasticIII} from '@math.gl/geospatial/elastic';
import land from '../unfolding-polyhedron/data/land.json' with {type: 'json'};
const datasets = {I: elasticI, II: elasticII, III: elasticIII};
const cache = new Map();
export const coastlines = land.flatMap(p => p);
export const graticule = [];
for (let lon = -180; lon < 180; lon += 30)
  graticule.push(Array.from({length: 37}, (_, i) => [lon, -90 + 5 * i]));
for (let lat = -60; lat <= 60; lat += 30)
  graticule.push(Array.from({length: 73}, (_, i) => [-180 + 5 * i, lat]));
export const samplePolygon = [
  [
    [-40, 20],
    [40, 20],
    [40, 60],
    [-40, 60]
  ]
];
export const ocean = [];
for (let lon = -180; lon < 180; lon += 90) {
  ocean.push([
    [
      [lon, 0],
      [lon + 90, 0],
      [lon + 45, 90]
    ]
  ]);
  ocean.push([
    [
      [lon + 90, 0],
      [lon, 0],
      [lon + 45, -90]
    ]
  ]);
}
/** Projection preparation; no UI or drawing dependencies. */
export function createMapData(preset) {
  if (cache.has(preset)) return cache.get(preset);
  const data = datasets[preset];
  if (!data && preset !== 'sinusoidal') throw new Error('Unknown Elastic preset');
  const map = new MapEngine(
    {
      version: 1,
      id: `elastic-${preset}`,
      title: data?.name ?? 'Sinusoidal',
      attribution: ['Justin Kunimune — Elastic projections (Unlicense)'],
      definition: data ? {type: 'elastic', data} : {type: 'world', projection: 'sinusoidal'}
    },
    {sampling: {tolerance: 0.001}}
  );
  const coast = coastlines.flatMap(r => map.projectLine(r));
  const grid = graticule.flatMap(r => map.projectLine(r));
  const polygon = map.projectPolygon(samplePolygon);
  const cities = [
    ['London', -0.1, 51.5],
    ['Tokyo', 139.7, 35.7],
    ['New York', -74, 40.7],
    ['Sydney', 151.2, -33.9]
  ].map(([label, lon, lat]) => ({label, ...map.projectPoint([lon, lat])}));
  const result = {map, coast, grid, polygon, cities, minLabelWidth: 560};
  cache.set(preset, result);
  return result;
}
