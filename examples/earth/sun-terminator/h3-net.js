// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Face orientations: H3 v4.3.0 faceijk.c; see assets/h3-NOTICE.txt (Apache-2.0).
import centers from './assets/h3-face-centers.json' with {type: 'json'};

const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const unit = p => p.map(v => v / Math.hypot(...p));
const xyz = (lon, lat) => [
  Math.cos(lat) * Math.cos(lon),
  Math.cos(lat) * Math.sin(lon),
  Math.sin(lat)
];
const geo = p => [
  (Math.atan2(p[1], p[0]) * 180) / Math.PI,
  (Math.asin(Math.max(-1, Math.min(1, p[2]))) * 180) / Math.PI
];
const normals = centers.map(([lat, lon]) => xyz(lon, lat));
const vertices = [];
// Voronoi vertices of H3's twenty face normals reconstruct the oriented icosahedron.
for (let a = 0; a < 20; a++)
  for (let b = a + 1; b < 20; b++)
    for (let c = b + 1; c < 20; c++) {
      const v = unit(cross(sub(normals[a], normals[b]), sub(normals[a], normals[c])));
      for (const p of [v, v.map(x => -x)]) {
        const d = dot(normals[a], p);
        if (normals.every(n => dot(n, p) <= d + 1e-8) && !vertices.some(v => dot(v, p) > 1 - 1e-8))
          vertices.push(p);
      }
    }
export const H3_FACES = normals.map((normal, index) => {
  const indices = vertices
    .map((v, i) => ({i, d: dot(normal, v)}))
    .sort((a, b) => b.d - a.d)
    .slice(0, 3)
    .map(v => v.i);
  if (
    dot(
      cross(
        sub(vertices[indices[1]], vertices[indices[0]]),
        sub(vertices[indices[2]], vertices[indices[0]])
      ),
      normal
    ) < 0
  )
    [indices[1], indices[2]] = [indices[2], indices[1]];
  return {index, normal, vertices: indices, neighbors: [], flat: null};
});
for (const a of H3_FACES)
  for (const b of H3_FACES)
    if (a !== b && a.vertices.filter(v => b.vertices.includes(v)).length === 2)
      a.neighbors.push(b.index);

function overlap(a, b) {
  for (const t of [a, b])
    for (let i = 0; i < 3; i++) {
      const p = t[i],
        q = t[(i + 1) % 3],
        axis = [p[1] - q[1], q[0] - p[0]];
      const x = a.map(v => dot(v, axis)),
        y = b.map(v => dot(v, axis));
      if (
        Math.min(Math.max(...x), Math.max(...y)) - Math.max(Math.min(...x), Math.min(...y)) <
        1e-7
      )
        return false;
    }
  return true;
}
function neighborTriangle(parent, face) {
  const shared = parent.vertices.filter(v => face.vertices.includes(v));
  const a = parent.flat[parent.vertices.indexOf(shared[0])],
    b = parent.flat[parent.vertices.indexOf(shared[1])];
  const old = parent.flat[parent.vertices.findIndex(v => !shared.includes(v))],
    mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const perp = [(-(b[1] - a[1]) * Math.sqrt(3)) / 2, ((b[0] - a[0]) * Math.sqrt(3)) / 2];
  const sign = dot(sub(old, mid), perp) > 0 ? -1 : 1;
  return face.vertices.map(v =>
    v === shared[0]
      ? a.slice()
      : v === shared[1]
        ? b.slice()
        : mid.map((x, i) => x + sign * perp[i])
  );
}
// Deterministic backtracking produces a connected net without overlapping faces.
H3_FACES[2].flat = [
  [0, 0],
  [1, 0],
  [0.5, Math.sqrt(3) / 2]
];
let attempts = 0;
function place(count) {
  if (count === 20) return true;
  if (++attempts > 20000) return false;
  const candidates = [];
  for (const parent of H3_FACES.filter(f => f.flat))
    for (const index of parent.neighbors) {
      const face = H3_FACES[index];
      if (face.flat) continue;
      const flat = neighborTriangle(parent, face);
      if (H3_FACES.some(f => f.flat && overlap(flat, f.flat))) continue;
      const points = H3_FACES.filter(f => f.flat)
        .flatMap(f => f.flat)
        .concat(flat);
      const score =
        (Math.max(...points.map(p => p[0])) - Math.min(...points.map(p => p[0]))) *
        (Math.max(...points.map(p => p[1])) - Math.min(...points.map(p => p[1])));
      candidates.push({face, flat, score});
    }
  candidates.sort((a, b) => a.score - b.score || a.face.index - b.face.index);
  for (const {face, flat} of candidates) {
    face.flat = flat;
    if (place(count + 1)) return true;
    face.flat = null;
  }
  return false;
}
if (vertices.length !== 12 || !place(1)) throw new Error('Unable to construct H3 icosahedron net');
const all = H3_FACES.flatMap(f => f.flat);
const midpoint = [0, 1].map(
  i => (Math.min(...all.map(p => p[i])) + Math.max(...all.map(p => p[i]))) / 2
);
for (const face of H3_FACES) {
  face.flat = face.flat.map(p => p.map((v, i) => (v - midpoint[i]) * 63.78137));
  face.basis = face.vertices.map(i => vertices[i].map(v => v / dot(vertices[i], face.normal)));
  face.x = unit(sub(face.basis[1], face.basis[0]));
  face.y = cross(face.normal, face.x);
  face.local = face.basis.map(p => [dot(p, face.x), dot(p, face.y)]);
  face.bounds = [
    Math.min(...face.flat.map(p => p[0])),
    Math.min(...face.flat.map(p => p[1])),
    Math.max(...face.flat.map(p => p[0])),
    Math.max(...face.flat.map(p => p[1]))
  ];
}
const barycentric = (p, triangle) => {
  const [a, b, c] = triangle,
    den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  const u = ((b[1] - c[1]) * (p[0] - c[0]) + (c[0] - b[0]) * (p[1] - c[1])) / den;
  const v = ((c[1] - a[1]) * (p[0] - c[0]) + (a[0] - c[0]) * (p[1] - c[1])) / den;
  return [u, v, 1 - u - v];
};
export function h3Face(lon, lat) {
  const p = xyz((lon * Math.PI) / 180, (lat * Math.PI) / 180);
  return normals.map(n => dot(n, p)).reduce((best, v, i, a) => (v > a[best] ? i : best), 0);
}
export function projectH3(lon, lat, index = h3Face(lon, lat)) {
  const p = xyz((lon * Math.PI) / 180, (lat * Math.PI) / 180),
    face = H3_FACES[index],
    d = dot(p, face.normal);
  const w = barycentric([dot(p, face.x) / d, dot(p, face.y) / d], face.local);
  return Object.assign(
    [0, 1].map(i => w.reduce((sum, v, k) => sum + v * face.flat[k][i], 0)).concat(0),
    {part: index}
  );
}
export function unprojectH3(point, index) {
  let face =
    index === undefined
      ? H3_FACES.find(f => barycentric(point, f.flat).every(v => v >= -1e-8))
      : H3_FACES[index];
  if (!face)
    face = H3_FACES.slice().sort(
      (a, b) =>
        Math.hypot(
          point[0] - (a.bounds[0] + a.bounds[2]) / 2,
          point[1] - (a.bounds[1] + a.bounds[3]) / 2
        ) -
        Math.hypot(
          point[0] - (b.bounds[0] + b.bounds[2]) / 2,
          point[1] - (b.bounds[1] + b.bounds[3]) / 2
        )
    )[0];
  let w = barycentric(point, face.flat).map(v => Math.max(0, v));
  const total = w.reduce((a, b) => a + b);
  w = w.map(v => v / total);
  return geo(unit([0, 1, 2].map(i => w.reduce((sum, v, k) => sum + v * face.basis[k][i], 0))));
}
export function h3Regions() {
  return H3_FACES.map(face => ({
    id: 'face-' + face.index,
    index: face.index,
    bounds: face.bounds,
    longitudeOrigin: (centers[face.index][1] * 180) / Math.PI,
    unproject: p => unprojectH3(p, face.index)
  }));
}
export function buildH3Mesh() {
  const positions = [],
    texCoords = [],
    n = 64;
  for (const face of H3_FACES)
    for (let a = 0; a < n; a++)
      for (let b = 0; b < n - a; b++) {
        const point = (x, y) =>
          [0, 1].map(
            i =>
              face.flat[0][i] +
              ((face.flat[1][i] - face.flat[0][i]) * x) / n +
              ((face.flat[2][i] - face.flat[0][i]) * y) / n
          );
        const triangles = [[point(a, b), point(a + 1, b), point(a, b + 1)]];
        if (a + b < n - 1) triangles.push([point(a + 1, b), point(a + 1, b + 1), point(a, b + 1)]);
        for (const triangle of triangles) {
          const g = triangle.map(p => unprojectH3(p, face.index));
          if (Math.max(...g.map(p => p[0])) - Math.min(...g.map(p => p[0])) > 180)
            for (const p of g) if (p[0] < 0) p[0] += 360;
          triangle.forEach((p, i) => {
            positions.push(...p, 0);
            texCoords.push((g[i][0] + 180) / 360, (90 - g[i][1]) / 180);
          });
        }
      }
  return {
    positions: new Float64Array(positions),
    texCoords: new Float32Array(texCoords),
    indices: Uint32Array.from({length: positions.length / 3}, (_, i) => i),
    vertexCount: positions.length / 3,
    bounds: [
      Math.min(...all.map(p => (p[0] - midpoint[0]) * 63.78137)),
      Math.min(...all.map(p => (p[1] - midpoint[1]) * 63.78137)),
      Math.max(...all.map(p => (p[0] - midpoint[0]) * 63.78137)),
      Math.max(...all.map(p => (p[1] - midpoint[1]) * 63.78137))
    ]
  };
}
export const h3FacePaths = H3_FACES.map(f => f.flat.concat([f.flat[0]]).map(p => [...p, 0]));
