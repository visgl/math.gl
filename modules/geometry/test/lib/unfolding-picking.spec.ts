// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {pickSurface} from '../../../../examples/unfolding-polyhedron/picking';
import {createSolid, type Polyhedron} from '../../../../examples/unfolding-polyhedron/polyhedra';
import {createLayout} from '../../../../examples/unfolding-polyhedron/layout';

test('hover follows original geographic coordinates throughout unfolding', () => {
  const mesh = createSolid('icosahedron'),
    layout = createLayout(mesh);
  for (const amount of [0, 0.4, 1]) {
    const positions = layout
      .evaluate(amount)
      .map(face => face.map(([x, y, z]) => [x / 10, y / 10, -z / 10]));
    const p = positions[0].reduce((a, v) => a.map((x, i) => x + v[i] / 3), [0, 0, 0]);
    const hit = pickSurface(mesh, positions, p[0], p[1]);
    expect(hit).not.toBeNull();
    // Isolate the target face, so another overlapping face cannot obscure it.
    const one: Polyhedron = {vertices: mesh.vertices, faces: [mesh.faces[0]]};
    const isolated = pickSurface(one, [positions[0]], p[0], p[1])!;
    const source = mesh.faces[0]
      .map(i => mesh.vertices[i])
      .reduce((a, v) => a.map((x, i) => x + v[i] / 3), [0, 0, 0]);
    expect(isolated.longitude).toBeCloseTo((Math.atan2(source[1], source[0]) * 180) / Math.PI, 8);
    expect(isolated.latitude).toBeCloseTo(
      (Math.atan2(source[2], Math.hypot(source[0], source[1])) * 180) / Math.PI,
      8
    );
  }
});
test('picking selects the nearest panel, includes back faces, and rejects gaps', () => {
  const mesh: Polyhedron = {
    vertices: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 0, 1],
      [-1, 0, 0],
      [-1, -1, 0],
      [-1, 0, 1]
    ],
    faces: [
      [0, 1, 2],
      [3, 4, 5]
    ]
  };
  const positions = [
    [
      [-1, -1, 0.5],
      [1, -1, 0.5],
      [0, 1, 0.5]
    ],
    [
      [-1, -1, -0.5],
      [0, 1, -0.5],
      [1, -1, -0.5]
    ]
  ];
  expect(pickSurface(mesh, positions, 0, 0)!.face).toBe(1);
  expect(pickSurface(mesh, positions, 0.9, 0.9)).toBeNull();
  expect(pickSurface(mesh, positions, 0, -1)).not.toBeNull();
});
test('picking interpolates Cartesian coordinates across the antimeridian', () => {
  const mesh: Polyhedron = {
    vertices: [
      [-1, 0.1, 0],
      [-1, -0.1, 0],
      [-1, 0, 0.2]
    ],
    faces: [[0, 1, 2]]
  };
  const hit = pickSurface(
    mesh,
    [
      [
        [-1, -1, 0],
        [1, -1, 0],
        [0, 1, 0]
      ]
    ],
    0,
    -0.5
  )!;
  expect(Math.abs(hit.longitude)).toBeCloseTo(180, 10);
  expect(hit.latitude).toBeGreaterThan(0);
});
