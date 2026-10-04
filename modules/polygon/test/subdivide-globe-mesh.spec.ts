// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {subdivideGlobeMesh} from '@math.gl/polygon';

const mesh = {
  positions: [170, -20, 190, -20, 190, 20, 170, 20],
  indices: [0, 1, 2, 0, 2, 3]
};

test('globe mesh follows a sphere across an unwrapped dateline and retains UV provenance', () => {
  const result = subdivideGlobeMesh(mesh, {
    semiMajorAxis: 1,
    tolerance: 0.005
  });
  expect(result.indices.length).toBeGreaterThan(6);
  for (let i = 0; i < result.positions.length; i += 3) {
    expect(Math.hypot(...result.positions.slice(i, i + 3))).toBeCloseTo(1, 12);
    const vertex = i / 3;
    for (let axis = 0; axis < 2; axis++) {
      let source = 0;
      for (let j = 0; j < 3; j++)
        source +=
          mesh.positions[result.sourceVertexIndices[i + j] * 2 + axis] *
          result.sourceVertexWeights[i + j];
      expect(source).toBeCloseTo(result.sourcePositions[vertex * 2 + axis], 10);
    }
  }
  expect(mesh.indices).toEqual([0, 1, 2, 0, 2, 3]);
});

test('globe mesh supports oblate bodies, heights and bounded work', () => {
  const elevated = subdivideGlobeMesh(
    {positions: [0, 0, 1, 10, 0, 1, 0, 10, 1], indices: [0, 1, 2]},
    {size: 3, semiMajorAxis: 2, semiMinorAxis: 1, tolerance: 1}
  );
  expect(Array.from(elevated.positions.slice(0, 3))).toEqual([3, 0, 0]);
  const polar = subdivideGlobeMesh(
    {positions: [0, 90, 10, 80, -10, 80], indices: [0, 1, 2]},
    {semiMajorAxis: 2, semiMinorAxis: 1, tolerance: 1}
  );
  expect(polar.positions[2]).toBeCloseTo(1, 12);
  expect(() =>
    subdivideGlobeMesh(mesh, {
      semiMajorAxis: 1,
      tolerance: 1e-9,
      maxTriangles: 2
    })
  ).toThrow(/maxTriangles/);
  expect(() =>
    subdivideGlobeMesh(mesh, {
      semiMajorAxis: 1,
      tolerance: 1e-9,
      maxDepth: 0
    })
  ).toThrow(/maxDepth/);
  expect(() =>
    subdivideGlobeMesh({positions: [170, 0, -170, 0, 0, 10], indices: [0, 1, 2]}, {tolerance: 1})
  ).toThrow(/Unwrap/);
  expect(() => subdivideGlobeMesh(mesh, {semiMajorAxis: 0, tolerance: 1})).toThrow(RangeError);
});

test('globe mesh preserves triangulated holes and independent attribute seams', () => {
  // Four strips around a rectangular hole: subdivision must not fill the hole.
  const positions = [-20, -20, 20, -20, 20, 20, -20, 20, -5, -5, 5, -5, 5, 5, -5, 5];
  const indices = [0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7];
  const result = subdivideGlobeMesh({positions, indices}, {semiMajorAxis: 1, tolerance: 0.003});
  for (let i = 0; i < result.indices.length; i += 3) {
    const corners = Array.from(result.indices.slice(i, i + 3));
    const lon = corners.reduce((sum, index) => sum + result.sourcePositions[index * 2], 0) / 3;
    const lat = corners.reduce((sum, index) => sum + result.sourcePositions[index * 2 + 1], 0) / 3;
    expect(Math.abs(lon) >= 5 - 1e-10 || Math.abs(lat) >= 5 - 1e-10).toBe(true);
    expect(result.sourceTriangleIndices[i / 3]).toBeLessThan(8);
  }
  const seams = subdivideGlobeMesh(
    {positions: [0, 0, 10, 0, 0, 10, 0, 0, 10, 0, 0, -10], indices: [0, 1, 2, 3, 4, 5]},
    {semiMajorAxis: 1, tolerance: 0.001}
  );
  expect(Array.from(seams.sourceVertexIndices.slice(0, 3))).toEqual([0, 0, 0]);
  expect(seams.sourceVertexIndices[9]).toBe(3);
  // Every face's provenance stays on its own side of the duplicated seam.
  for (let i = 0; i < seams.indices.length; i += 3) {
    const allowed = seams.sourceTriangleIndices[i / 3] === 0 ? [0, 1, 2] : [3, 4, 5];
    for (const index of seams.indices.slice(i, i + 3))
      for (let slot = 0; slot < 3; slot++) {
        if (seams.sourceVertexWeights[index * 3 + slot] > 0)
          expect(allowed).toContain(seams.sourceVertexIndices[index * 3 + slot]);
      }
  }
});
