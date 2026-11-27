// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createTerrainCutoutSkirts,
  createTerrainSkirt,
  splitTerrainMesh,
  TerrainSurface
} from '@math.gl/geospatial/terrain';

const plane = {
  positions: Float64Array.of(0, 0, 0, 4, 0, 4, 4, 4, 12, 0, 4, 8),
  indices: Uint16Array.of(0, 1, 2, 0, 2, 3)
};
const ring = [
  [1, 1],
  [3, 1],
  [3, 3],
  [1, 3]
] as const;

/** Read a packed vertex for exact comparisons across the cut. */
const vertex = (positions: Float32Array | Float64Array, i: number) =>
  Array.from(positions.subarray(3 * i, 3 * i + 3));

/** Measure projected area from triangles independently of the partition. */
function area(mesh: Pick<typeof plane, 'positions'> & {indices: Uint32Array}) {
  let sum = 0;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = Array.from(mesh.indices.subarray(i, i + 3), id => vertex(mesh.positions, id));
    sum += ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
  }
  return sum;
}

test('conserves surface area and pairs identical XYZ on a welded cut', () => {
  const {patch, remainder} = splitTerrainMesh(plane, [...ring].reverse());
  expect(area(patch)).toBeCloseTo(4, 10);
  expect(area(remainder)).toBeCloseTo(12, 10);
  expect(patch.cutEdges).toHaveLength(8);
  expect(remainder.cutEdges).toHaveLength(8);
  for (let i = 0; i < patch.cutEdges.length; i += 2) {
    expect(vertex(patch.positions, patch.cutEdges[i])).toEqual(
      vertex(remainder.positions, remainder.cutEdges[i + 1])
    );
    expect(vertex(patch.positions, patch.cutEdges[i + 1])).toEqual(
      vertex(remainder.positions, remainder.cutEdges[i])
    );
  }
  for (const piece of [patch, remainder]) {
    expect(() => new TerrainSurface(piece)).not.toThrow();
    for (let i = 0; i < piece.sourceTriangles.length; i++) {
      const ids = plane.indices.subarray(
        piece.sourceTriangles[i] * 3,
        piece.sourceTriangles[i] * 3 + 3
      );
      const p = vertex(piece.positions, i);
      for (let k = 0; k < 3; k++) {
        const value = Array.from(ids).reduce(
          (sum, id, corner) =>
            sum + plane.positions[id * 3 + k] * piece.sourceWeights[i * 3 + corner],
          0
        );
        expect(value).toBeCloseTo(p[k], 12);
      }
    }
  }
  // The default skirt sees only the four true patch edges, not fan diagonals.
  expect(createTerrainSkirt(patch, {height: 1}).sourceVertexIndices).toHaveLength(8);
});

test('builds opposing walls at a common base and keeps the lift separate', () => {
  const split = splitTerrainMesh(plane, ring);
  const {patch, remainder} = createTerrainCutoutSkirts(split, {
    lift: 5,
    patch: {baseZ: -2},
    remainder: {baseZ: -2}
  });
  expect(patch.surface.positions[2]).toBe(split.patch.positions[2] + 5);
  expect(remainder.surface.positions).toEqual(split.remainder.positions);
  for (const piece of [patch, remainder]) {
    const skirt = piece.skirt!;
    expect(skirt.sourceVertexIndices).toHaveLength(8);
    for (let i = skirt.skirtVertexOffset * 3 + 2; i < skirt.positions.length; i += 3) {
      expect(skirt.positions[i]).toBe(-2);
    }
    expect(skirt.triangleValidity.slice(skirt.skirtTriangleOffset)).toEqual(new Uint8Array(8));
  }
  /** Compute the horizontal wall normal from triangle winding. */
  const normal = (skirt: NonNullable<typeof patch.skirt>, triangle: number) => {
    const [a, b, c] = Array.from(skirt.indices.subarray(triangle * 3, triangle * 3 + 3), i =>
      vertex(skirt.positions, i)
    );
    return [
      (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
      (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2])
    ];
  };
  for (let i = 0; i < 8; i += 2) {
    const a = normal(patch.skirt!, patch.skirt!.skirtTriangleOffset + i);
    const b = normal(remainder.skirt!, remainder.skirt!.skirtTriangleOffset + i);
    expect(a[0] * b[0] + a[1] * b[1]).toBeLessThan(0);
  }
  for (const baseZ of [NaN, Infinity, 3])
    expect(() => createTerrainSkirt(split.patch, {baseZ})).toThrow();
});

test('skips skirts on misses and enclosing cuts', () => {
  for (const polygon of [
    [
      [4, 4],
      [5, 4],
      [5, 5],
      [4, 5]
    ],
    [
      [-1, -1],
      [5, -1],
      [5, 5],
      [-1, 5]
    ]
  ] as const) {
    const cut = splitTerrainMesh(plane, polygon);
    const result = createTerrainCutoutSkirts(cut, {patch: {height: 3}, remainder: {height: 1}});
    expect(result.patch.skirt).toBeUndefined();
    expect(result.remainder.skirt).toBeUndefined();
    expect(area(cut.patch) + area(cut.remainder)).toBe(16);
    expect(Math.min(cut.patch.indices.length, cut.remainder.indices.length)).toBe(0);
  }
});

test('uses Float64 cut vertices even with Float32 input and bounds work', () => {
  for (const positions of [plane.positions, Float32Array.from(plane.positions)]) {
    const nearEdge = [
      [4 - 1e-9, -1],
      [5, -1],
      [5, 5],
      [4 - 1e-9, 5]
    ] as const;
    const result = splitTerrainMesh({...plane, positions}, nearEdge);
    expect(result.patch.positions).toBeInstanceOf(Float64Array);
    expect(area(result.patch)).toBeCloseTo(4e-9, 12);
    expect(area(result.patch) + area(result.remainder)).toBeCloseTo(16, 10);
  }
  expect(() => splitTerrainMesh(plane, ring, {maxWork: 1})).toThrow('work budget');
  expect(() =>
    splitTerrainMesh({...plane, indices: Uint16Array.of(0, 1, 2, 0, 1, 2)}, ring)
  ).toThrow('edges');
});

test('pairs cuts on existing source edges and leaves uncovered boundaries alone', () => {
  const triangle = [
    [0, 0],
    [4, 0],
    [4, 4]
  ] as const;
  const split = splitTerrainMesh(plane, triangle);
  expect(area(split.patch)).toBe(8);
  expect(area(split.remainder)).toBe(8);
  expect(split.patch.cutEdges).toHaveLength(2);
  expect(split.remainder.cutEdges).toHaveLength(2);
  // Remove the neighbor to model nodata. The same edge now has no opposite terrain.
  const missing = splitTerrainMesh({...plane, indices: Uint16Array.of(0, 1, 2)}, triangle);
  expect(missing.patch.cutEdges).toHaveLength(0);
  expect(missing.remainder.indices).toHaveLength(0);
});

test('validates topology, output limits, and exclusive wall modes', () => {
  const overlaps = {
    positions: Float64Array.of(0, 0, 0, 4, 0, 0, 0, 4, 0, 1, 1, 1, 2, 1, 1, 1, 2, 1),
    indices: Uint16Array.of(0, 1, 2, 3, 4, 5)
  };
  expect(() => splitTerrainMesh(overlaps, ring)).toThrow('overlapping XY triangles');
  expect(() =>
    splitTerrainMesh(
      {
        positions: Float64Array.of(0, 0, 0, 4, 0, 0, 0, 4, 0, 2, 0, 0, 2, -2, 0),
        indices: Uint16Array.of(0, 1, 2, 3, 4, 1)
      },
      ring
    )
  ).toThrow('T-junction');
  expect(() => splitTerrainMesh(plane, ring, {maxVertices: 4})).toThrow('vertex budget');
  expect(() => splitTerrainMesh(plane, ring, {maxTriangles: 2})).toThrow('fragment budget');
  const {patch} = splitTerrainMesh(plane, ring);
  expect(() => createTerrainSkirt(patch, {height: 1, baseZ: -2} as never)).toThrow();
});
