// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createGraticule} from '../../../geospatial/src/discontinuous/myriahedral/graticule';
import {createMyriahedralLayout} from '../../../../examples/myriahedral-maps/layout';
import {
  dot,
  faceNormal,
  subtract,
  edgeKey
} from '../../../../examples/unfolding-polyhedron/polyhedra';

for (const columns of [24, 48, 72, 96]) {
  test(`graticule ${columns}: planar outward faces and a closed shared seam`, () => {
    const mesh = createGraticule(columns);
    const counts = new Map<string, number>();
    let maximumError = 0;
    for (const face of mesh.faces) {
      const normal = faceNormal(mesh, face);
      expect(dot(normal, mesh.vertices[face[0]])).toBeGreaterThan(0);
      face.forEach((v, i) => {
        const key = edgeKey(v, face[(i + 1) % face.length]);
        counts.set(key, (counts.get(key) || 0) + 1);
        maximumError = Math.max(
          maximumError,
          Math.abs(dot(normal, subtract(mesh.vertices[v], mesh.vertices[face[0]])))
        );
      });
    }
    expect(maximumError).toBeLessThan(1e-12);
    expect([...counts.values()].every(count => count === 2)).toBe(true);
    expect(mesh.vertices.length - counts.size + mesh.faces.length).toBe(2);
    expect(mesh.faces.length).toBe((columns * columns) / 2);
  });
}

test('structured geographic layout preserves hinges, rigid faces, and continent order', () => {
  const layout = createMyriahedralLayout(1, 1, 'ocean');
  expect(layout.cutLandKm).toBeLessThan(createMyriahedralLayout(1, 1, 'legacy').cutLandKm);
  expect(layout.edges.filter(e => e.hinge)).toHaveLength(layout.mesh.faces.length - 1);
  for (const edge of layout.edges) {
    const a = layout.mesh.vertices[edge.a],
      b = layout.mesh.vertices[edge.b];
    if (Math.abs(a[2] - b[2]) < 1e-10) continue;
    const longitude = Math.atan2(a[1] + b[1], a[0] + b[0]);
    const seam = Math.abs(Math.abs(longitude) - Math.PI) < 1e-8;
    if (seam) expect(edge.hinge).toBe(false);
    else if (Math.min(a[2], b[2]) === 0) expect(edge.hinge).toBe(true);
  }
  for (const amount of [0, 0.5, 1]) {
    const poses = layout.evaluate(amount);
    let error = 0;
    for (const edge of layout.edges.filter(e => e.hinge)) {
      const [a, b] = edge.faces;
      for (const vertex of [edge.a, edge.b]) {
        const p = poses[a][layout.mesh.faces[a].indexOf(vertex)];
        const q = poses[b][layout.mesh.faces[b].indexOf(vertex)];
        error = Math.max(error, Math.hypot(...subtract(p, q)));
      }
    }
    for (let f = 0; f < poses.length; f++) {
      const ids = layout.mesh.faces[f];
      for (let i = 1; i < ids.length; i++) {
        const original = Math.hypot(
          ...subtract(layout.mesh.vertices[ids[0]], layout.mesh.vertices[ids[i]])
        );
        const transformed = Math.hypot(...subtract(poses[f][0], poses[f][i]));
        error = Math.max(error, Math.abs(original - transformed));
      }
    }
    expect(error).toBeLessThan(1e-10);
    if (amount === 1)
      expect(Math.max(...poses.flat().map(p => Math.abs(p[2])))).toBeLessThan(1e-10);
  }
  const flat = layout.evaluate(1);
  const centroid = (lon: number, lat: number) => {
    const r = Math.PI / 180;
    const target = [
      Math.cos(lat * r) * Math.cos(lon * r),
      Math.cos(lat * r) * Math.sin(lon * r),
      Math.sin(lat * r)
    ];
    let best = 0,
      distance = Infinity;
    layout.mesh.faces.forEach((face, f) => {
      const center = [0, 1, 2].map(
        k => face.reduce((s, v) => s + layout.mesh.vertices[v][k], 0) / face.length
      );
      const d = Math.hypot(...center.map((v, k) => v - target[k]));
      if (d < distance) {
        distance = d;
        best = f;
      }
    });
    return flat[best][0];
  };
  expect(centroid(-100, 40)[0]).toBeLessThan(centroid(20, 0)[0]);
  expect(centroid(-60, -15)[0]).toBeLessThan(centroid(20, 0)[0]);
  expect(centroid(100, 40)[0]).toBeGreaterThan(centroid(20, 0)[0]);
  expect(centroid(135, -25)[0]).toBeGreaterThan(centroid(20, 0)[0]);
}, 60000);
