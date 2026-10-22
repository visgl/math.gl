// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DiscontinuousMap, type MapRegion, type MapPlacement} from './map-layout';
import {airOceanMesh} from './air-ocean-mesh';
import {
  add,
  coordinates,
  cross,
  dot,
  geographic,
  RAD,
  scale,
  unit,
  type Position,
  type Vector
} from './math';
const subtract = (a: Vector, b: Vector) => add(a, scale(b, -1));

/** 24-panel AirOcean cut arrangement with radial/gnomonic face mapping.
 * This is NOT the Gray-Fuller projection. Output units scale with radius.
 */
export function createAirOceanMap(options: {radius?: number} = {}): DiscontinuousMap {
  const radius = validRadius(options.radius);
  const {
    mesh: {vertices, faces},
    joins
  } = airOceanMesh();
  const charts = faces.map(face => {
    const origin = vertices[face[0]],
      x = unit(subtract(vertices[face[1]], origin));
    const normal = unit(cross(x, subtract(vertices[face[2]], origin))),
      y = cross(normal, x);
    const height = dot(normal, origin);
    const plane = (p: Vector): Position => [
      dot(subtract(p, origin), x),
      dot(subtract(p, origin), y)
    ];
    return {origin, x, y, normal, height, plane};
  });
  const placements: MapPlacement[] = [];
  placements[0] = [radius, 0, 0, radius, 0, 0];
  const place = (i: number, p: Position): Position => {
    const [a, b, c, d, tx, ty] = placements[i];
    return [a * p[0] + c * p[1] + tx, b * p[0] + d * p[1] + ty];
  };
  // Solve each rigid 2D placement from its shared edge. No animated state is needed.
  const pending = [...joins];
  while (pending.length) {
    const index = pending.findIndex(([parent]) => placements[parent]);
    if (index < 0) throw new Error('Invalid AirOcean placement tree');
    const [parent, child] = pending.splice(index, 1)[0];
    const shared = faces[child].filter(v => faces[parent].includes(v));
    if (shared.length !== 2) throw new Error('Invalid AirOcean join');
    const p = charts[child].plane(vertices[shared[0]]),
      q = charts[child].plane(vertices[shared[1]]);
    const u = place(parent, charts[parent].plane(vertices[shared[0]])),
      v = place(parent, charts[parent].plane(vertices[shared[1]]));
    const dx = q[0] - p[0],
      dy = q[1] - p[1],
      length = dx * dx + dy * dy;
    const a = ((v[0] - u[0]) * dx + (v[1] - u[1]) * dy) / length;
    const b = ((v[1] - u[1]) * dx - (v[0] - u[0]) * dy) / length;
    placements[child] = [a, b, -b, a, u[0] - a * p[0] + b * p[1], u[1] - b * p[0] - a * p[1]];
  }
  return new DiscontinuousMap(
    faces.map((face, i): MapRegion => {
      const chart = charts[i];
      return {
        id: `face-${i}`,
        boundary: face.map(v => coordinates(vertices[v])),
        interior: coordinates(unit(face.map(v => vertices[v]).reduce(add, [0, 0, 0]))),
        placement: placements[i],
        project: position => {
          const p = geographic(position);
          return chart.plane(scale(p, chart.height / dot(chart.normal, p)));
        },
        unproject: ([x, y]) =>
          coordinates(unit(add(chart.origin, add(scale(chart.x, x), scale(chart.y, y)))))
      };
    })
  );
}

/** Independent six-lobe sinusoidal layout. Coordinates are spherical radians
 * times radius, not an ellipsoidal CRS. Equatorial joins remain continuous.
 */
export function createInterruptedSinusoidalMap(options: {radius?: number} = {}): DiscontinuousMap {
  const radius = validRadius(options.radius);
  const breaks = [
    [-180, -60, 60, 180],
    [-180, -100, 20, 180]
  ];
  const equator = [...new Set(breaks.flat())].sort((a, b) => a - b);
  const regions: MapRegion[] = [];
  breaks.forEach((limits, hemisphere) => {
    const sign = hemisphere === 0 ? 1 : -1;
    for (let i = 1; i < limits.length; i++) {
      const west = limits[i - 1],
        east = limits[i],
        center = (west + east) / 2;
      const boundary: Position[] = [
        [west, 90 * sign],
        ...equator.filter(lon => lon >= west && lon <= east).map(lon => [lon, 0] as Position)
      ];
      regions.push({
        id: `${sign > 0 ? 'north' : 'south'}-${i - 1}`,
        boundary,
        interior: [center, 45 * sign],
        project: ([lon, lat]) => {
          const delta = ((((lon - center + 180) % 360) + 360) % 360) - 180;
          return [radius * (center * RAD + delta * RAD * Math.cos(lat * RAD)), radius * lat * RAD];
        },
        unproject: ([x, y]) => {
          const lat = y / radius;
          if (Math.abs(lat) > Math.PI / 2 + 1e-10) return null;
          const cosine = Math.cos(lat);
          if (Math.abs(cosine) < 1e-12)
            return Math.abs(x / radius - center * RAD) < 1e-10 ? [center, sign * 90] : null;
          const delta = (x / radius - center * RAD) / cosine / RAD;
          if (Math.abs(delta) > 180 + 1e-8) return null;
          return [center + delta, Math.max(-90, Math.min(90, lat / RAD))];
        }
      });
    }
  });
  return new DiscontinuousMap(regions);
}
function validRadius(value = 1): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error('Radius must be finite and positive');
  return value;
}
