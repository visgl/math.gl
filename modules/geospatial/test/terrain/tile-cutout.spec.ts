// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  HeightField,
  createTerrainMesh,
  splitTerrainMeshTiles,
  stitchTerrainMeshEdges,
  createTerrainCutoutSkirts,
  TerrainSurface,
  type TerrainCutoutInput
} from '@math.gl/geospatial/terrain';

const ring = [
  [0.25, 0.25],
  [1.75, 0.25],
  [1.75, 0.75],
  [0.25, 0.75]
] as const;
function tile(x: number, size = 3) {
  return createTerrainMesh(
    new HeightField({
      width: size,
      height: size,
      origin: [x, 0],
      columnStep: [1 / (size - 1), 0],
      rowStep: [0, 1 / (size - 1)],
      heights: Float64Array.from(
        {length: size * size},
        (_, i) => 2 * (x + (i % size) / (size - 1)) + (3 * Math.floor(i / size)) / (size - 1)
      )
    }),
    {origin: [0, 0, 0]}
  );
}
function area(mesh: TerrainCutoutInput) {
  let sum = 0;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = Array.from(mesh.indices.subarray(i, i + 3), id => id * 3);
    const p = mesh.positions;
    sum += ((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[c] - p[a]) * (p[b + 1] - p[a + 1])) / 2;
  }
  return sum;
}
function qualify(tiles: TerrainCutoutInput[], expectedPatch: number, expectedTotal: number) {
  const cut = splitTerrainMeshTiles(tiles, ring);
  expect(area(cut.patch)).toBeCloseTo(expectedPatch, 12);
  expect(area(cut.patch) + area(cut.remainder)).toBeCloseTo(expectedTotal, 12);
  for (const piece of [cut.patch, cut.remainder]) {
    expect(() => new TerrainSurface(piece)).not.toThrow();
    for (let i = 0; i < piece.sourceTriangles.length; i++) {
      const face = piece.sourceTriangles[i];
      const source = tiles[cut.sourceTiles[face]];
      for (let axis = 0; axis < 3; axis++) {
        let value = 0;
        for (let k = 0; k < 3; k++)
          value +=
            source.positions[source.indices[cut.sourceTileFaces[face] * 3 + k] * 3 + axis] *
            piece.sourceWeights[i * 3 + k];
        expect(value).toBeCloseTo(piece.positions[i * 3 + axis], 12);
      }
    }
    for (let i = 0; i < piece.cutEdges.length; i += 2) {
      const a = piece.cutEdges[i] * 3,
        b = piece.cutEdges[i + 1] * 3;
      // The shared tile edge is never an exposed cut.
      expect(piece.positions[a] === 1 && piece.positions[b] === 1).toBe(false);
    }
  }
  const skirts = createTerrainCutoutSkirts(cut, {
    lift: 2,
    patch: {baseZ: -1},
    remainder: {baseZ: -1}
  });
  expect(skirts.patch.skirt?.sourceVertexIndices.length).toBe(cut.patch.cutEdges.length);
  return cut;
}

test('same-level cut conserves area and original tile barycentric provenance without seam walls', () => {
  const tiles = [tile(0), tile(1)];
  const snapshot = tiles.map(t => t.positions.slice());
  qualify(tiles, 0.75, 2);
  expect(tiles.map(t => t.positions)).toEqual(snapshot);
  qualify([...tiles].reverse(), 0.75, 2);
});

test('mixed-level cut composes with the existing sparse edge stitcher', () => {
  for (const [a, b] of [
    [2, 5],
    [3, 9],
    [4, 6],
    [9, 3]
  ]) {
    const stitched = stitchTerrainMeshEdges(tile(0, a), 'maxColumn', tile(1, b), 'minColumn', {
      maxHeightAdjustment: 1e-12
    });
    qualify([stitched.a, stitched.b], 0.75, 2);
  }
});

test('arrival and eviction preserve the resident domain and restore the same cut', () => {
  const a = tile(0),
    b = tile(1);
  const full = qualify([a, b], 0.75, 2);
  qualify([a], 0.375, 1);
  qualify([b], 0.375, 1);
  expect(splitTerrainMeshTiles([a, b], ring)).toEqual(full);
  const empty = splitTerrainMeshTiles([], ring);
  expect(empty.patch.indices.length + empty.remainder.indices.length).toBe(0);
});

test('a cut on the tile boundary creates paired walls only while both sides are resident', () => {
  const boundary = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1]
  ] as const;
  const full = splitTerrainMeshTiles([tile(0), tile(1)], boundary);
  expect(full.patch.cutEdges.length).toBeGreaterThan(0);
  expect(splitTerrainMeshTiles([tile(0)], boundary).patch.cutEdges).toHaveLength(0);
});

test('rejects unreconciled seams, overlaps, malformed data and exhausted budgets', () => {
  expect(() => splitTerrainMeshTiles([tile(0, 2), tile(1, 5)], ring)).toThrow();
  expect(() => splitTerrainMeshTiles([tile(0), tile(0)], ring)).toThrow();
  const raised = tile(1);
  for (let i = 2; i < raised.positions.length; i += 3) raised.positions[i] += 1;
  expect(() => splitTerrainMeshTiles([tile(0), raised], ring)).toThrow();
  for (const options of [{maxWork: 1}, {maxVertices: 2}, {maxTriangles: 1}, {maxWork: -1}])
    expect(() => splitTerrainMeshTiles([tile(0)], ring, options)).toThrow();
  expect(() =>
    splitTerrainMeshTiles([{positions: Float64Array.of(0), indices: new Uint32Array()}], ring)
  ).toThrow();
  expect(() =>
    splitTerrainMeshTiles(
      [{positions: Float64Array.of(NaN, 0, 0), indices: new Uint32Array()}],
      ring
    )
  ).toThrow();
  expect(() =>
    splitTerrainMeshTiles(
      [{positions: Float64Array.of(0, 0, 0), indices: Uint32Array.of(0, 1, 2)}],
      ring
    )
  ).toThrow();
});

test('paired boundary coordinates agree exactly and have opposite direction across tiles', () => {
  const cut = splitTerrainMeshTiles([tile(0), tile(1)], ring);
  for (let i = 0; i < cut.patch.cutEdges.length; i += 2) {
    for (let endpoint = 0; endpoint < 2; endpoint++) {
      const a = cut.patch.cutEdges[i + endpoint] * 3;
      const b = cut.remainder.cutEdges[i + 1 - endpoint] * 3;
      expect(cut.patch.positions.slice(a, a + 3)).toEqual(cut.remainder.positions.slice(b, b + 3));
    }
  }
});

test('disconnected resident tiles do not fill the missing domain or create skirts there', () => {
  const polygon = [
    [0.25, 0.25],
    [2.75, 0.25],
    [2.75, 0.75],
    [0.25, 0.75]
  ] as const;
  const cut = splitTerrainMeshTiles([tile(0), tile(2)], polygon);
  expect(area(cut.patch)).toBeCloseTo(0.75, 12);
  expect(area(cut.patch) + area(cut.remainder)).toBeCloseTo(2, 12);
  for (let i = 0; i < cut.patch.cutEdges.length; i += 2) {
    const a = cut.patch.positions[cut.patch.cutEdges[i] * 3];
    const b = cut.patch.positions[cut.patch.cutEdges[i + 1] * 3];
    expect(a === b && (a === 1 || a === 2)).toBe(false);
  }
});
