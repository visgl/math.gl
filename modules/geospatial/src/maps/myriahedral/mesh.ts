// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type Vec3 = [number, number, number];
export type Polyhedron = {vertices: Vec3[]; faces: number[][]};
export type Solid = 'tetrahedron' | 'cube' | 'octahedron' | 'dodecahedron' | 'icosahedron';
export const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
export const normalize = (v: Vec3): Vec3 => {
  const n = Math.hypot(...v);
  return v.map(x => x / n) as Vec3;
};
export const center = (points: Vec3[]): Vec3 =>
  [0, 1, 2].map(i => points.reduce((s, p) => s + p[i], 0) / points.length) as Vec3;

/** Independent construction from symmetric coordinates, with a small convex hull
 * used only for the 4–20 vertices of the regular solids. No imported mesh tables.
 */
export function createSolid(solid: Solid, subdivisions = 0): Polyhedron {
  if (!Number.isInteger(subdivisions) || subdivisions < 0 || subdivisions > 3)
    throw new RangeError('Subdivision must be 0–3');
  let vertices: Vec3[] = [];
  switch (solid) {
    case 'tetrahedron':
      vertices = [
        [1, 1, 1],
        [1, -1, -1],
        [-1, 1, -1],
        [-1, -1, 1]
      ];
      break;
    case 'cube':
      for (const x of [-1, 1])
        for (const y of [-1, 1]) for (const z of [-1, 1]) vertices.push([x, y, z]);
      break;
    case 'octahedron':
      vertices = [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1]
      ];
      break;
    case 'icosahedron': {
      const phi = (1 + Math.sqrt(5)) / 2;
      for (const a of [-1, 1])
        for (const b of [-phi, phi]) vertices.push([0, a, b], [a, b, 0], [b, 0, a]);
      break;
    }
    case 'dodecahedron': {
      // The dual of the icosahedron: its face centers are dodecahedron vertices.
      const ico = createSolid('icosahedron');
      vertices = ico.faces.map(face => center(face.map(i => ico.vertices[i])));
      break;
    }
    default:
      throw new RangeError('Unknown solid');
  }
  vertices = vertices.map(normalize);
  let faces = convexFaces(vertices);
  // Triangulate polygonal faces around a shared spherical face center before
  // recursive subdivision; triangle edges and all subsequent midpoints are shared.
  if (subdivisions)
    faces = faces.flatMap(face => {
      if (face.length === 3) return [face];
      const middle = vertices.push(normalize(center(face.map(i => vertices[i])))) - 1;
      return face.map((v, i) => [v, face[(i + 1) % face.length], middle]);
    });
  for (let level = 0; level < subdivisions; level++) {
    const midpoints = new Map<string, number>();
    const midpoint = (a: number, b: number): number => {
      const key = edgeKey(a, b);
      if (!midpoints.has(key))
        midpoints.set(key, vertices.push(normalize(center([vertices[a], vertices[b]]))) - 1);
      return midpoints.get(key)!;
    };
    faces = faces.flatMap(([a, b, c]) => {
      const ab = midpoint(a, b),
        bc = midpoint(b, c),
        ca = midpoint(c, a);
      return [
        [a, ab, ca],
        [ab, b, bc],
        [ca, bc, c],
        [ab, bc, ca]
      ];
    });
  }
  return {vertices, faces};
}
export function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
export function faceNormal(mesh: Polyhedron, face: number[]): Vec3 {
  return normalize(
    cross(
      subtract(mesh.vertices[face[1]], mesh.vertices[face[0]]),
      subtract(mesh.vertices[face[2]], mesh.vertices[face[0]])
    )
  );
}
function convexFaces(vertices: Vec3[]): number[][] {
  const found = new Map<string, number[]>();
  for (let a = 0; a < vertices.length; a++)
    for (let b = a + 1; b < vertices.length; b++)
      for (let c = b + 1; c < vertices.length; c++) {
        let n = cross(subtract(vertices[b], vertices[a]), subtract(vertices[c], vertices[a]));
        if (Math.hypot(...n) < 1e-8) continue;
        n = normalize(n);
        let distances = vertices.map(v => dot(n, subtract(v, vertices[a])));
        if (distances.some(d => d > 1e-8) && distances.some(d => d < -1e-8)) continue;
        if (dot(n, vertices[a]) < 0) {
          n = n.map(x => -x) as Vec3;
          distances = distances.map(x => -x);
        }
        const ids = distances.flatMap((d, i) => (Math.abs(d) < 1e-8 ? [i] : []));
        const key = ids.join(':');
        if (found.has(key)) continue;
        const origin = center(ids.map(i => vertices[i]));
        const x = normalize(subtract(vertices[ids[0]], origin)),
          y = cross(n, x);
        ids.sort((i, j) => {
          const p = subtract(vertices[i], origin),
            q = subtract(vertices[j], origin);
          return Math.atan2(dot(p, y), dot(p, x)) - Math.atan2(dot(q, y), dot(q, x));
        });
        found.set(key, ids);
      }
  return [...found.values()];
}
