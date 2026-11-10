// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Snyder (1992), An Equal-Area Map Projection for Polyhedral Globes.
// Vector formulation: BRSR, https://brsr.github.io/2021/08/31/snyder-equal-area.html.
// Original implementation of the published equations, with bounded inverse.
import {DiscontinuousMap, type MapRegion, type MapPlacement} from './map-layout';
import {
  add,
  cross,
  dot,
  scale,
  unit,
  coordinates,
  geographic,
  type Vector,
  type Position
} from './math';
import {icosahedron, dodecahedron, iseaParents, dseaParents} from './snyder-mesh';

export type SnyderMapOptions = {radius?: number};
export function createIcosahedralSnyderMap(options: SnyderMapOptions = {}) {
  return snyderMap(false, options);
}
export function createDodecahedralSnyderMap(options: SnyderMapOptions = {}) {
  return snyderMap(true, options);
}
const difference = (a: Vector, b: Vector) => add(a, scale(b, -1));
const area = (a: Vector, b: Vector, c: Vector) =>
  2 * Math.atan2(Math.abs(dot(a, cross(b, c))), 1 + dot(a, b) + dot(b, c) + dot(c, a));
const chord = (a: Vector, b: Vector) => Math.hypot(...difference(a, b));

/** Area-preserving map from a spherical triangle to barycentric coordinates.
 * The apex-to-point ray meets the opposite great-circle edge. Its area fraction
 * sets the planar direction; its chord-distance fraction sets the radius.
 */
export function snyderTriangle(a: Vector, b: Vector, c: Vector, u: Position, v: Position) {
  const total = area(a, b, c);
  const edgeNormal = cross(b, c);
  const det = u[0] * v[1] - u[1] * v[0];
  return {
    project(p: Vector): Position {
      const distance = chord(a, p);
      if (distance < 1e-14) return [0, 0];
      let edge = unit(cross(cross(a, p), edgeNormal));
      if (dot(edge, add(b, c)) < 0) edge = scale(edge, -1);
      const h = distance / chord(a, edge);
      const w = (h * area(a, b, edge)) / total;
      return [(h - w) * u[0] + w * v[0], (h - w) * u[1] + w * v[1]];
    },
    unproject([x, y]: Position): Vector | null {
      const beta = (x * v[1] - y * v[0]) / det;
      const gamma = (u[0] * y - u[1] * x) / det;
      const h = beta + gamma;
      if (beta < -1e-9 || gamma < -1e-9 || h > 1 + 1e-9) return null;
      if (h < 1e-14) return a;
      // Area is monotone along the opposite edge. Normalized linear interpolation
      // spans that minor arc; bisection avoids fragile inverse trig at vertices.
      const target = Math.max(0, Math.min(1, gamma / h)) * total;
      let low = 0,
        high = 1;
      for (let i = 0; i < 48; i++) {
        const t = (low + high) / 2;
        const q = unit(add(scale(b, 1 - t), scale(c, t)));
        if (area(a, b, q) < target) low = t;
        else high = t;
      }
      const t = (low + high) / 2;
      const q = unit(add(scale(b, 1 - t), scale(c, t)));
      const sinHalf = Math.min(1, Math.max(0, (h * chord(a, q)) / 2));
      const theta = 2 * Math.asin(sinHalf);
      const direction = unit(difference(q, scale(a, dot(a, q))));
      return add(scale(a, Math.cos(theta)), scale(direction, Math.sin(theta)));
    }
  };
}
function snyderMap(dual: boolean, {radius = 1}: SnyderMapOptions) {
  if (!Number.isFinite(radius) || radius <= 0)
    throw new Error('Radius must be finite and positive');
  const mesh = dual ? dodecahedron : icosahedron;
  const parents = dual ? dseaParents : iseaParents;
  const vertices = mesh.vertices as Vector[];
  const faces = mesh.faces;
  const frames = faces.map(face => {
    const normal = unit(face.map(i => vertices[i]).reduce(add, [0, 0, 0]));
    const x = unit(difference(vertices[face[0]], scale(normal, dot(normal, vertices[face[0]]))));
    const y = cross(normal, x);
    const plane = (v: Vector): Position => [dot(x, v), dot(y, v)];
    return {normal, plane};
  });
  const placements: MapPlacement[] = [];
  const root = parents.indexOf(-1);
  // Normalize planar area to the unit sphere: total output area is 4πr².
  const first = faces[0].map(i => frames[0].plane(vertices[i]));
  let planarArea = 0;
  for (let i = 0; i < first.length; i++) {
    const a = first[i],
      b = first[(i + 1) % first.length];
    planarArea += a[0] * b[1] - a[1] * b[0];
  }
  const k = radius * Math.sqrt((4 * Math.PI) / ((faces.length * Math.abs(planarArea)) / 2));
  placements[root] = [k, 0, 0, k, 0, 0];
  const pending = faces.map((_, i) => i).filter(i => i !== root);
  const place = (i: number, [x, y]: Position): Position => {
    const [a, b, c, d, e, f] = placements[i];
    return [a * x + c * y + e, b * x + d * y + f];
  };
  while (pending.length) {
    const n = pending.findIndex(i => placements[parents[i]]);
    if (n < 0) throw new Error('Invalid Snyder net');
    const child = pending.splice(n, 1)[0],
      parent = parents[child];
    const shared = faces[child].filter(i => faces[parent].includes(i));
    const [p, q] = shared.map(i => frames[child].plane(vertices[i]));
    const [u, v] = shared.map(i => place(parent, frames[parent].plane(vertices[i])));
    const dx = q[0] - p[0],
      dy = q[1] - p[1],
      length = dx * dx + dy * dy;
    const a = ((v[0] - u[0]) * dx + (v[1] - u[1]) * dy) / length;
    const b = ((v[1] - u[1]) * dx - (v[0] - u[0]) * dy) / length;
    placements[child] = [a, b, -b, a, u[0] - a * p[0] + b * p[1], u[1] - b * p[0] - a * p[1]];
  }
  // Only the external face edges can be cut. Keep the continuous internal
  // subdivision inside each kernel instead of multiplying clipping work by 6/10.
  const charts: MapRegion[] = faces.map((face, i) => {
    const {normal, plane} = frames[i];
    const pieces = face.flatMap((index, j) => {
      const b = vertices[index],
        c = vertices[face[(j + 1) % face.length]];
      const midpoint = unit(add(b, c));
      const pb = plane(b),
        pc = plane(c);
      const pm: Position = [(pb[0] + pc[0]) / 2, (pb[1] + pc[1]) / 2];
      return [
        [b, midpoint],
        [midpoint, c]
      ].map((triangle, side) => ({
        start: cross(normal, triangle[0]),
        end: cross(triangle[1], normal),
        kernel: snyderTriangle(
          normal,
          triangle[0],
          triangle[1],
          side === 0 ? pb : pm,
          side === 0 ? pm : pc
        )
      }));
    });
    return {
      id: `face-${i}`,
      boundary: face.map(index => coordinates(vertices[index])),
      interior: coordinates(normal),
      placement: placements[i],
      project: p => {
        const v = geographic(p);
        const piece = pieces.find(q => dot(q.start, v) >= -1e-12 && dot(q.end, v) >= -1e-12);
        if (!piece) throw new Error('Point outside Snyder face');
        return piece.kernel.project(v);
      },
      unproject: p => {
        for (const piece of pieces) {
          const q = piece.kernel.unproject([...p]);
          if (q) return coordinates(q);
        }
        return null;
      }
    };
  });
  return new DiscontinuousMap(charts);
}
