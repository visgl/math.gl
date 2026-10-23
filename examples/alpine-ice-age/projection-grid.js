// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  ProjectionTransform,
  albersEqualArea,
  equalEarth,
  mollweide,
  robinson,
  equidistantCylindrical,
  mercator,
  sinusoidal,
  millerCylindrical
} from '@math.gl/geospatial/projection';
import {REGIONAL_VIEWS, regionalCoordinate, inRegion} from './regional-views.js';

const R = 6371008.8;
const plugins = {
  eqearth: equalEarth,
  moll: mollweide,
  robin: robinson,
  sinu: sinusoidal,
  mill: millerCylindrical,
  eqc: equidistantCylindrical,
  merc: mercator,
  albersNorthAmerica: albersEqualArea,
  albersEurope: albersEqualArea
};
const engines = Object.fromEntries(
  Object.entries(plugins).map(([id, plugin]) => [
    id,
    new ProjectionTransform({
      from: `+proj=longlat +R=${R}`,
      to: `${REGIONAL_VIEWS[id]?.definition || `+proj=${id}`} +R=${R} +units=m`,
      projections: [plugin]
    })
  ])
);
const grids = new Map();
export function projectionGrid(view) {
  if (grids.has(view)) return grids.get(view);
  const positions = new Float64Array(361 * 181 * 2);
  for (let y = 0; y <= 180; y++)
    for (let x = 0; x <= 360; x++) {
      const i = (y * 361 + x) * 2;
      positions.set(regionalCoordinate(view, x - 180, y - 90), i);
    }
  if (view !== 'globe') engines[view].projectFlatSync(positions, 2);
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  if (view !== 'globe')
    for (let i = 0; i < positions.length; i += 2) {
      const vertex = i / 2;
      if (!inRegion(view, (vertex % 361) - 180, Math.floor(vertex / 361) - 90)) continue;
      minX = Math.min(minX, positions[i]);
      maxX = Math.max(maxX, positions[i]);
      minY = Math.min(minY, positions[i + 1]);
      maxY = Math.max(maxY, positions[i + 1]);
    }
  const centerX = view === 'globe' ? 0 : (minX + maxX) / 2,
    centerY = view === 'globe' ? 0 : (minY + maxY) / 2;
  maxX = view === 'globe' ? 0 : (maxX - minX) / 2;
  maxY = view === 'globe' ? 0 : (maxY - minY) / 2;
  if (view !== 'globe')
    for (let i = 0; i < positions.length; i += 2) {
      positions[i] -= centerX;
      positions[i + 1] -= centerY;
    }
  const indices = new Uint32Array(360 * 180 * 6);
  let k = 0;
  for (let y = 0; y < 180; y++)
    for (let x = 0; x < 360; x++) {
      const i = y * 361 + x;
      if (!inRegion(view, x - 180, y - 90) || !inRegion(view, x - 179, y - 89)) continue;
      indices.set([i, i + 1, i + 361, i + 1, i + 362, i + 361], k);
      k += 6;
    }
  const result = {
    positions,
    indices: indices.slice(0, k),
    maxX,
    maxY,
    centerX,
    centerY
  };
  grids.set(view, result);
  return result;
}

export function projectCoordinate(view, position) {
  return engines[view].projectSync(regionalCoordinate(view, ...position));
}
