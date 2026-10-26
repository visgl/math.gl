// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createSolid,
  edgeKey,
  faceNormal,
  dot,
  subtract,
  type Solid,
  type Vec3
} from '../../../../examples/unfolding-polyhedron/polyhedra';
import {
  createLayout,
  maximumSpanningTree,
  countOverlaps
} from '../../../../examples/unfolding-polyhedron/layout';

for (const [solid, v, e, f, degree] of [
  ['tetrahedron', 4, 6, 4, 3],
  ['cube', 8, 12, 6, 4],
  ['octahedron', 6, 12, 8, 3],
  ['dodecahedron', 20, 30, 12, 5],
  ['icosahedron', 12, 30, 20, 3]
] as const) {
  test(`${solid}: independently generated regular closed solid`, () => {
    const mesh = createSolid(solid),
      edges = new Map<string, number>();
    expect(mesh.vertices.length).toBe(v);
    expect(mesh.faces.length).toBe(f);
    let length = 0;
    for (const face of mesh.faces) {
      expect(face.length).toBe(degree);
      const normal = faceNormal(mesh, face);
      expect(dot(normal, mesh.vertices[face[0]])).toBeGreaterThan(0);
      for (let j = 0; j < face.length; j++) {
        const a = face[j],
          b = face[(j + 1) % face.length],
          key = edgeKey(a, b);
        edges.set(key, (edges.get(key) || 0) + 1);
        const distance = Math.hypot(...subtract(mesh.vertices[a], mesh.vertices[b]));
        if (!length) length = distance;
        expect(distance).toBeCloseTo(length, 10);
        expect(dot(normal, subtract(mesh.vertices[a], mesh.vertices[face[0]]))).toBeCloseTo(0, 10);
      }
    }
    expect(edges.size).toBe(e);
    expect([...edges.values()].every(n => n === 2)).toBe(true);
    expect(v - e + f).toBe(2);
  });
}

test('icosphere subdivision shares edge midpoints and preserves a closed sphere', () => {
  for (let level = 0; level <= 3; level++) {
    const mesh = createSolid('icosahedron', level),
      layout = createLayout(mesh);
    expect(mesh.faces.length).toBe(20 * 4 ** level);
    expect(mesh.vertices.length).toBe(10 * 4 ** level + 2);
    expect(layout.edges.length).toBe(30 * 4 ** level);
    expect(layout.edges.every(e => e.faces.length === 2)).toBe(true);
    for (const v of mesh.vertices) expect(Math.hypot(...v)).toBeCloseTo(1, 10);
  }
  expect(() => createSolid('icosahedron', 4)).toThrow();
  expect(() => createSolid('cube', 1)).toThrow();
});

test('maximum spanning tree chooses the global maximum and breaks ties deterministically', () => {
  const edges = [
    {faces: [0, 1], weight: 1},
    {faces: [1, 2], weight: 5},
    {faces: [0, 2], weight: 4},
    {faces: [2, 3], weight: 3},
    {faces: [1, 3], weight: 2}
  ];
  expect(maximumSpanningTree(4, edges)).toEqual([1, 2, 3]);
  expect(
    maximumSpanningTree(3, [
      {faces: [0, 1], weight: 1},
      {faces: [1, 2], weight: 1},
      {faces: [0, 2], weight: 1}
    ])
  ).toEqual([0, 1]);
  expect(() => maximumSpanningTree(4, edges.slice(0, 2))).toThrow(/Disconnected/);
});

for (const solid of [
  'tetrahedron',
  'cube',
  'octahedron',
  'dodecahedron',
  'icosahedron'
] as Solid[]) {
  test(`${solid}: automatic cuts preserve hinges and rigid faces and flatten every panel`, () => {
    const mesh = createSolid(solid, solid === 'icosahedron' ? 3 : 0),
      layout = createLayout(mesh, 7);
    expect(layout.edges.filter(e => e.hinge).length).toBe(mesh.faces.length - 1);
    expect(layout.panels.filter(p => p.parent === -1).length).toBe(1);
    for (const amount of [0, 0.37, 1]) {
      const points = layout.evaluate(amount);
      for (let i = 0; i < mesh.faces.length; i++) {
        const face = mesh.faces[i];
        for (let j = 0; j < face.length; j++)
          for (let k = j + 1; k < face.length; k++) {
            expect(Math.hypot(...subtract(points[i][j], points[i][k]))).toBeCloseTo(
              Math.hypot(...subtract(mesh.vertices[face[j]], mesh.vertices[face[k]])),
              8
            );
          }
        if (amount === 1) for (const p of points[i]) expect(p[2]).toBeCloseTo(0, 8);
      }
      for (const edge of layout.edges.filter(e => e.hinge || amount === 0)) {
        const [a, b] = edge.faces;
        for (const vertex of [edge.a, edge.b]) {
          const p = points[a][mesh.faces[a].indexOf(vertex)],
            q = points[b][mesh.faces[b].indexOf(vertex)];
          expect(Math.hypot(...subtract(p, q))).toBeLessThan(1e-8);
        }
      }
    }
    expect(createLayout(mesh, 7).panels).toEqual(layout.panels);
  });
}

test('overlap diagnostic distinguishes shared boundaries from positive-area intersections', () => {
  const square = (x: number, y: number): Vec3[] => [
    [x, y, 0],
    [x + 1, y, 0],
    [x + 1, y + 1, 0],
    [x, y + 1, 0]
  ];
  expect(countOverlaps([square(0, 0), square(1, 0)])).toBe(0);
  expect(countOverlaps([square(0, 0), square(0.5, 0.5)])).toBe(1);
  expect(countOverlaps([square(0, 0), square(0, 0)])).toBe(1);
  expect(countOverlaps([square(0, 0), square(2, 0)])).toBe(0);
});
