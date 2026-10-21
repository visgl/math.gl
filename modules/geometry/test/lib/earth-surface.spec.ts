// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, it, expect} from 'vitest';
import {createSolid} from '../../../../examples/unfolding-polyhedron/polyhedra';
import {createLayout} from '../../../../examples/unfolding-polyhedron/layout';
import {surfaceVertices} from '../../../../examples/unfolding-polyhedron/renderer';

describe('unfolding Earth surface attributes', () => {
  it('keeps the spherical texture attached to every vertex throughout unfolding', () => {
    const mesh = createSolid('icosahedron', 2);
    const layout = createLayout(mesh, 1);
    const folded = surfaceVertices(mesh, layout.evaluate(0));
    for (const amount of [0.5, 1]) {
      const unfolded = surfaceVertices(mesh, layout.evaluate(amount));
      expect(unfolded.length).toBe(mesh.faces.length * 3 * 9);
      let moved = false;
      for (let i = 0; i < unfolded.length; i += 9) {
        expect(Array.from(unfolded.slice(i + 3, i + 6))).toEqual(
          Array.from(folded.slice(i + 3, i + 6))
        );
        expect(Math.hypot(...unfolded.slice(i + 3, i + 6))).toBeCloseTo(1, 6);
        if (Math.abs(unfolded[i] - folded[i]) > 0.01) moved = true;
      }
      expect(moved).toBe(true);
    }
  });

  it('preserves Cartesian interpolation across the date line and poles', () => {
    // These triangles cross longitude +/-180 and surround the north pole.
    // Interpolating source XYZ keeps their interior in the same region;
    // interpolating wrapped vertex UVs would instead cross Greenwich.
    const mesh = {
      vertices: [
        [-1, 0.1, 0],
        [-1, -0.1, 0],
        [-1, 0, 0.1],
        [0.1, 0, 1],
        [-0.05, 0.0866, 1],
        [-0.05, -0.0866, 1]
      ] as [number, number, number][],
      faces: [
        [0, 1, 2],
        [3, 4, 5]
      ]
    };
    const data = surfaceVertices(
      mesh,
      mesh.faces.map(ids => ids.map(id => mesh.vertices[id]))
    );
    const centers = [0, 27].map(offset =>
      [0, 1, 2].map(
        axis => [0, 9, 18].reduce((sum, vertex) => sum + data[offset + vertex + 3 + axis], 0) / 3
      )
    );
    expect(centers[0][0]).toBe(-1);
    expect(centers[0][1]).toBe(0);
    expect(centers[1][0]).toBeCloseTo(0);
    expect(centers[1][1]).toBeCloseTo(0);
    expect(centers[1][2]).toBe(1);
  });
});
