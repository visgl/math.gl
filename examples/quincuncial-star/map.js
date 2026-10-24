// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {MapEngine} from '@math.gl/geospatial/discontinuous';
import land from '../unfolding-polyhedron/data/land.json' with {type: 'json'};

/** Geographic preparation only: the renderer receives ordinary XY paths. */
export function createMapData(type, lobes, centralMeridian) {
  const map = new MapEngine(
    {
      version: 1,
      id: type,
      definition: ['berghaus', 'gingery'].includes(type)
        ? {type, lobes, centralMeridian}
        : {type, centralMeridian}
    },
    {sampling: {maxAngularStep: 3, tolerance: 0.001}}
  );
  const coast = land.flatMap(polygon => polygon.flatMap(ring => map.projectLine(ring)));
  const grid = [];
  for (let lon = -180; lon < 180; lon += 30)
    grid.push(...map.projectLine(Array.from({length: 37}, (_, i) => [lon, -90 + i * 5])));
  for (let lat = -60; lat <= 60; lat += 30)
    grid.push(...map.projectLine(Array.from({length: 73}, (_, i) => [-180 + i * 5, lat])));
  const polygon = map.projectPolygon([
    [
      [155, 5],
      [175, 5],
      [175, 25],
      [155, 25],
      [155, 5]
    ]
  ]);
  const cities = [
    ['London', -0.1, 51.5],
    ['Tokyo', 139.7, 35.7],
    ['New York', -74, 40.7],
    ['Sydney', 151.2, -33.9]
  ].map(([label, lon, lat]) => ({label, ...map.projectPoint([lon, lat])}));
  return {map, coast, grid, polygon, cities};
}
