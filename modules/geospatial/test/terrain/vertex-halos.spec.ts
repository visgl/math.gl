// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createTerrainVertexTileHalos,
  getTerrainVertexHaloAffectedTiles,
  TerrainVertexHaloStatus as S,
  HeightField,
  createTerrainGradientGrid
} from '@math.gl/geospatial/terrain';

test('halo invalidation includes diagonal neighbors and width-two shared halo points', () => {
  const resident = [
    {column: 0, row: 0},
    {column: 1, row: 1},
    {column: 2, row: 0},
    {column: -1, row: 0}
  ];
  const changed = [
    {column: 0, row: 0},
    {column: 0, row: 0}
  ];
  expect(getTerrainVertexHaloAffectedTiles(resident, changed, {width: 3, height: 3})).toEqual([
    resident[3],
    resident[0],
    resident[1]
  ]);
  expect(getTerrainVertexHaloAffectedTiles(resident, changed, {width: 2, height: 3})).toEqual([
    resident[3],
    resident[0],
    resident[1],
    resident[2]
  ]);
  expect(() =>
    getTerrainVertexHaloAffectedTiles([resident[0], resident[0]], changed, {width: 3, height: 3})
  ).toThrow(/Duplicate/);
  expect(() =>
    getTerrainVertexHaloAffectedTiles(resident, changed, {width: 1, height: 3})
  ).toThrow();
});

test('two-vertex tiles receive halo data from a tile two addresses away', () => {
  const target = {column: 0, row: 0, heights: new Float64Array([0, 1, 2, 3])};
  const distant = {column: -2, row: 0, heights: new Float64Array([7, 8, 9, 10])};
  const result = createTerrainVertexTileHalos([target, distant], {width: 2, height: 2});
  const padded = result.tiles.find(t => t.column === 0)!;
  expect(padded.field.heights[1 * 4]).toBe(8);
  expect(padded.statuses[1 * 4]).toBe(S.VALID);
  expect(getTerrainVertexHaloAffectedTiles([target], [distant], {width: 2, height: 2})).toEqual([
    {column: 0, row: 0}
  ]);
});

function tile(column: number, row: number) {
  return {
    column,
    row,
    heights: Float64Array.from({length: 9}, (_, i) => {
      const x = column * 2 + (i % 3),
        y = row * 2 + Math.floor(i / 3);
      return x * x + 3 * y;
    })
  };
}

test('neighbor halos provide identical stencil gradients at shared edges and corners', () => {
  const input = [tile(0, 0), tile(1, 0), tile(0, 1), tile(1, 1)];
  const options = {width: 3, height: 3, columnStep: [2, 1] as const, rowStep: [-1, 2] as const};
  const result = createTerrainVertexTileHalos(input, options);
  expect(createTerrainVertexTileHalos([...input].reverse(), options)).toEqual(result);
  for (const method of ['horn', 'zevenbergen-thorne'] as const) {
    const gradients = result.tiles.map(t =>
      createTerrainGradientGrid(new HeightField(t.field), {method})
    );
    // The common vertex is (2, 2); it is an interior stencil point in all four padded tiles.
    const indices = [3 * 5 + 3, 1 * 5 + 3, 3 * 5 + 1, 1 * 5 + 1];
    const samples = gradients.map((g, i) => {
      expect(g.statuses[indices[i]]).toBe(0);
      return [...g.gradients.slice(2 * indices[i], 2 * indices[i] + 2)];
    });
    for (const sample of samples) {
      expect(sample[0]).toBeCloseTo(1, 12);
      expect(sample[1]).toBeCloseTo(2, 12);
    }
  }
  expect(input[0].heights).toHaveLength(9);
  expect(result.tiles[0].field.origin).toEqual([-1, -3]);
});

test('no-data differs from nonresident neighbors and remains conservative at shared vertices', () => {
  const a = tile(-1, 0),
    b = {...tile(0, 0), validity: new Uint8Array(9).fill(1)};
  b.validity[3] = 0;
  const result = createTerrainVertexTileHalos([a, b], {width: 3, height: 3});
  const left = result.tiles[0],
    right = result.tiles[1];
  expect(left.statuses[0]).toBe(S.NOT_RESIDENT);
  expect(left.statuses[2 * 5 + 3]).toBe(S.NO_DATA);
  expect(right.statuses[2 * 5 + 1]).toBe(S.NO_DATA);
  expect(left.field.validity![2 * 5 + 3]).toBe(0);
  expect(left.statuses[1 * 5 + 4]).toBe(S.VALID);
  const only = createTerrainVertexTileHalos([a], {width: 3, height: 3}).tiles[0];
  expect(only.statuses[1 * 5 + 4]).toBe(S.NOT_RESIDENT);
});

test('halo admission limits and invalid input are checked before output', () => {
  expect(() =>
    createTerrainVertexTileHalos([tile(0, 0)], {width: 3, height: 3, maxSamples: 24})
  ).toThrow(/capacity/);
  expect(
    createTerrainVertexTileHalos([tile(0, 0)], {width: 3, height: 3, maxSamples: 25}).tiles
  ).toHaveLength(1);
  expect(() =>
    createTerrainVertexTileHalos([tile(0, 0), tile(0, 0)], {width: 3, height: 3})
  ).toThrow(/duplicate/);
  expect(() =>
    createTerrainVertexTileHalos([tile(Number.MAX_SAFE_INTEGER, 0)], {width: 2, height: 2})
  ).toThrow();
});
