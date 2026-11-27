// math.gl
// SPDX-License-Identifier: MIT AND ISC
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock

// Octahedral topology, Waterman W5 construction, and parent tree follow
// d3-geo-projection (Mike Bostock, ISC; see D3-LICENSE.txt). Chart construction
// and seam handling use math.gl's spherical map pipeline.
import {DiscontinuousMap, type MapRegion, type MapPlacement} from './map-layout';
import {
  add,
  scale,
  unit,
  dot,
  cross,
  coordinates,
  geographic,
  RAD,
  type Position,
  type Vector
} from './math';

export type PolyhedralMapOptions = {radius?: number};
export function createButterflyMap(options: PolyhedralMapOptions = {}) {
  return polyhedral('butterfly', options);
}
export function createCollignonButterflyMap(options: PolyhedralMapOptions = {}) {
  return polyhedral('collignon', options);
}
export function createWatermanMap(options: PolyhedralMapOptions = {}) {
  return polyhedral('waterman', options);
}
function polyhedral(
  kind: 'butterfly' | 'collignon' | 'waterman',
  {radius = 1}: PolyhedralMapOptions
) {
  if (!Number.isFinite(radius) || radius <= 0)
    throw new Error('Radius must be finite and positive');
  const vertices: Position[] = [
    [0, 90],
    [-90, 0],
    [0, 0],
    [90, 0],
    [180, 0],
    [0, -90]
  ];
  const octahedron = [
    [0, 2, 1],
    [0, 3, 2],
    [5, 1, 2],
    [5, 2, 3],
    [0, 1, 4],
    [0, 4, 3],
    [5, 4, 1],
    [5, 3, 4]
  ].map(face => face.map(i => geographic(vertices[i])));
  const parents = [-1, 0, 0, 1, 0, 1, 4, 5];
  let faces = octahedron;
  if (kind === 'waterman') {
    faces = octahedron.map(face =>
      face.flatMap((b, i) => {
        const a = face[(i + 2) % 3];
        return [unit(add(scale(a, 3), b)), unit(add(scale(b, 3), a))];
      })
    );
    for (let j = 0; j < 8; j++)
      for (let i = 0; i < 3; i++) {
        faces.push([octahedron[j][i], faces[j][(i * 2 + 2) % 6], faces[j][i * 2 + 1]]);
        parents.push(j);
      }
  }
  const charts = faces.map((face, i): MapRegion => {
    const center = unit(face.reduce(add, [0, 0, 0]));
    let project: MapRegion['project'], unproject: MapRegion['unproject'];
    if (kind === 'collignon') {
      const [longitude, latitude] = coordinates(center);
      const sign = Math.sign(latitude);
      const k = 4 / Math.sqrt(3 * Math.PI);
      project = ([lon, lat]) => {
        const delta = (((((lon - longitude + 180) % 360) + 360) % 360) - 180) * RAD;
        const t = Math.sqrt(Math.max(0, 1 - Math.sin(sign * lat * RAD)));
        return [k * delta * t, sign * Math.sqrt(Math.PI) * (1 - t)];
      };
      unproject = ([x, y]) => {
        const t = 1 - (sign * y) / Math.sqrt(Math.PI);
        if (t < -1e-10 || t > Math.SQRT2 + 1e-10) return null;
        return [
          longitude + (t > 1e-12 ? x / (k * t * RAD) : 0),
          (sign * Math.asin(Math.max(-1, Math.min(1, 1 - t * t)))) / RAD
        ];
      };
    } else {
      const normal = kind === 'waterman' && face.length === 3 ? face[0] : center;
      const [lon] = coordinates(normal);
      const east: Vector = [-Math.sin(lon * RAD), Math.cos(lon * RAD), 0];
      const north = cross(normal, east);
      project = position => {
        const p = geographic(position),
          h = dot(normal, p);
        return [dot(east, p) / h, dot(north, p) / h];
      };
      unproject = ([x, y]) => coordinates(unit(add(normal, add(scale(east, x), scale(north, y)))));
    }
    return {
      id: `face-${i}`,
      boundary: face.map(coordinates),
      interior: coordinates(center),
      project,
      unproject
    };
  });
  // Align each child to its shared edge with a similarity transform. Local
  // charts have the same orientation, so adjacent interiors lie on opposite sides.
  const placements: MapPlacement[] = [];
  const a = Math.cos(Math.PI / 6) * radius,
    b = -Math.sin(Math.PI / 6) * radius;
  placements[0] = [a, b, -b, a, 0, 0];
  const place = (i: number, [x, y]: Position): Position => {
    const [a, b, c, d, tx, ty] = placements[i];
    return [a * x + c * y + tx, b * x + d * y + ty];
  };
  for (let i = 1; i < faces.length; i++) {
    const parent = parents[i];
    const shared = faces[i].filter(v =>
      faces[parent].some(w => Math.hypot(...v.map((x, k) => x - w[k])) < 1e-10)
    );
    if (shared.length !== 2) throw new Error('Invalid polyhedral join');
    const [p, q] = shared.map(v => charts[i].project(coordinates(v)));
    const [u, v] = shared.map(w => place(parent, charts[parent].project(coordinates(w))));
    const dx = q[0] - p[0],
      dy = q[1] - p[1],
      length = dx * dx + dy * dy;
    const a = ((v[0] - u[0]) * dx + (v[1] - u[1]) * dy) / length;
    const b = ((v[1] - u[1]) * dx - (v[0] - u[0]) * dy) / length;
    placements[i] = [a, b, -b, a, u[0] - a * p[0] + b * p[1], u[1] - b * p[0] - a * p[1]];
  }
  return new DiscontinuousMap(charts.map((chart, i) => ({...chart, placement: placements[i]})));
}
