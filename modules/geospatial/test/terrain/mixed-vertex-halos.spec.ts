// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  createTerrainMixedVertexTileHalos,
  createTerrainGradientGrid,
  HeightField,
  type TerrainMixedVertexTile
} from '@math.gl/geospatial';

function tile(column: number, row: number, spacing: number): TerrainMixedVertexTile {
  return {
    column,
    row,
    spacing,
    field: {
      width: 5,
      height: 5,
      origin: [column, row],
      columnStep: [spacing, 0],
      rowStep: [0, spacing],
      heights: Float64Array.from(
        {length: 25},
        (_, i) => 2 * (column + (i % 5) * spacing) + 3 * (row + Math.floor(i / 5) * spacing)
      )
    }
  };
}

test('mixed halos reproduce affine gradients across 2:1 and 4:1 seams', () => {
  for (const ratio of [2, 4]) {
    const input = [tile(-4 * ratio, 0, ratio), tile(0, 0, 1), tile(0, 4, 1)];
    const result = createTerrainMixedVertexTileHalos(input);
    expect(createTerrainMixedVertexTileHalos([...input].reverse())).toEqual(result);
    const fine = result.tiles.find(t => t.column === 0 && t.row === 0)!;
    expect(fine.field.origin).toEqual([-1, -1]);
    for (const method of ['horn', 'zevenbergen-thorne'] as const) {
      const grid = createTerrainGradientGrid(new HeightField(fine.field), {method});
      for (const y of [1, 2, 3, 4]) {
        const index = (y + 1) * 7 + 1;
        expect(grid.statuses[index]).toBe(0);
        expect(grid.gradients[index * 2]).toBeCloseTo(2, 12);
        expect(grid.gradients[index * 2 + 1]).toBeCloseTo(3, 12);
      }
    }
    expect(fine.statuses[0]).toBe(0);
    expect(input[1].field.heights).toHaveLength(25);
  }
});

test('finest resident coverage owns overlaps without nodata fallback', () => {
  const coarse = tile(0, 0, 2),
    fine = tile(0, 0, 1);
  fine.field.heights.fill(100);
  fine.field.validity = new Uint8Array(25).fill(1);
  fine.field.validity[12] = 0;
  const result = createTerrainMixedVertexTileHalos([coarse, fine]);
  expect(result.tiles[1].field.heights[1 * 7 + 1]).toBe(100);
  expect(result.tiles[1].statuses[2 * 7 + 2]).toBe(1);
  expect(result.tiles[1].field.validity![2 * 7 + 2]).toBe(0);
  result.tiles[0].field.heights.fill(0);
  expect(fine.field.heights[0]).toBe(100);
});

test('mixed halo admission and frames are checked even for disjoint tiles', () => {
  const a = tile(0, 0, 1);
  expect(createTerrainMixedVertexTileHalos([])).toEqual({tiles: []});
  expect(() => createTerrainMixedVertexTileHalos([a, a])).toThrow(/Duplicate/);
  for (const spacing of [0, 3, NaN, 1.5])
    expect(() => createTerrainMixedVertexTileHalos([{...a, spacing}])).toThrow();
  for (const maxSamples of [-1, NaN, 48])
    expect(() => createTerrainMixedVertexTileHalos([a], {maxSamples})).toThrow();
  expect(createTerrainMixedVertexTileHalos([a], {maxSamples: 49}).tiles).toHaveLength(1);
  expect(() => createTerrainMixedVertexTileHalos([a], {maxTileTests: 0})).toThrow(/budget/);
  expect(() =>
    createTerrainMixedVertexTileHalos([{...a, column: Number.MAX_SAFE_INTEGER}])
  ).toThrow(/overflow/);
  for (const change of [
    {origin: [101, 0]},
    {columnStep: [2, 0]},
    {heightReference: 'other'},
    {registration: 'cell'}
  ]) {
    const b = tile(100, 0, 1);
    Object.assign(b.field, change);
    expect(() => createTerrainMixedVertexTileHalos([a, b])).toThrow();
  }
});

test('skewed frames, negative addresses and strided inputs preserve world gradients', () => {
  const inputs = [tile(-8, 0, 2), tile(0, 0, 1)];
  for (const t of inputs) {
    t.field.origin = [10 + 2 * t.column - t.row, 20 + t.column + 2 * t.row];
    t.field.columnStep = [2 * t.spacing, t.spacing];
    t.field.rowStep = [-t.spacing, 2 * t.spacing];
    const buffer = new Float64Array(40);
    for (let y = 0; y < 5; y++) buffer.set(t.field.heights.subarray(y * 5, y * 5 + 5), 2 + y * 7);
    t.field.heights = buffer;
    t.field.offset = 2;
    t.field.stride = 7;
  }
  const fine = createTerrainMixedVertexTileHalos(inputs).tiles[0];
  const g = createTerrainGradientGrid(new HeightField(fine.field));
  expect(g.gradients[2 * (3 * 7 + 1)]).toBeCloseTo(0.2);
  expect(g.gradients[2 * (3 * 7 + 1) + 1]).toBeCloseTo(1.6);
});

test('coarse triangle diagonals and zero-weight nodata are respected', () => {
  const fine = tile(0, 0, 1);
  const coarse = tile(-8, 0, 2);
  coarse.field.heights = Float64Array.from({length: 25}, (_, i) => (i % 5) * Math.floor(i / 5));
  const sample = () => createTerrainMixedVertexTileHalos([coarse, fine]).tiles[0];
  // Fine left halo (-1, 1) lies at coarse (3.5, 0.5), inside a saddle cell.
  expect(sample().field.heights[2 * 7]).toBe(2);
  coarse.field.diagonal = '10-01';
  expect(sample().field.heights[2 * 7]).toBe(1.5);
  coarse.field.validity = new Uint8Array(25).fill(1);
  coarse.field.validity[4] = 0;
  expect(sample().statuses[2 * 7]).toBe(1);
  // Exact coarse node (3, 1) does not depend on the neighboring invalid node.
  const shifted = tile(-1, 0, 1);
  const padded = createTerrainMixedVertexTileHalos([coarse, shifted]).tiles[0];
  expect(padded.statuses[3 * 7]).toBe(2);
});

test('same-level tie ownership, corner coverage, eviction and re-arrival are deterministic', () => {
  const a = tile(-4, -4, 1),
    b = tile(0, 0, 1),
    diagonal = tile(-8, -8, 2);
  a.field.heights.fill(7);
  b.field.heights.fill(9);
  diagonal.field.heights.fill(11);
  const initial = createTerrainMixedVertexTileHalos([b, diagonal, a]);
  const target = initial.tiles.find(t => t.column === 0)!;
  expect(target.field.heights[8]).toBe(7); // Shared corner owned by (-4,-4).
  expect(target.field.heights[0]).toBe(7); // Diagonal fine coverage at (-1,-1).
  const evicted = createTerrainMixedVertexTileHalos([b]);
  expect(evicted.tiles[0].statuses[0]).toBe(0);
  expect(createTerrainMixedVertexTileHalos([a, b, diagonal])).toEqual(initial);
  const replaced = createTerrainMixedVertexTileHalos([b, diagonal]);
  expect(replaced.tiles[0].field.heights[0]).toBe(11);
});

test('frame validation rejects subcell displacement at large world origins and unsafe spans', () => {
  const a = tile(0, 0, 1),
    b = tile(4, 0, 1);
  a.field.origin = [1e16, 0];
  b.field.origin = [1e16 + 6, 0];
  expect(() => createTerrainMixedVertexTileHalos([a, b])).toThrow(/frames/);
  const left = tile(-Number.MAX_SAFE_INTEGER + 8, 0, 1);
  const right = tile(Number.MAX_SAFE_INTEGER - 8, 0, 1);
  expect(() => createTerrainMixedVertexTileHalos([left, right])).toThrow(/span/);
});

test('curved surfaces retain documented stencil-scale differences', () => {
  const input = [tile(-8, 0, 2), tile(0, 0, 1), tile(0, 4, 1)];
  for (const t of input)
    t.field.heights = Float64Array.from(
      {length: 25},
      (_, i) => (t.column + (i % 5) * t.spacing) ** 3
    );
  const result = createTerrainMixedVertexTileHalos(input);
  const fine = createTerrainGradientGrid(new HeightField(result.tiles[0].field));
  const coarse = createTerrainGradientGrid(new HeightField(result.tiles[2].field));
  expect(fine.statuses[3 * 7 + 1]).toBe(0);
  expect(coarse.statuses[2 * 7 + 5]).toBe(0);
  expect(fine.gradients[2 * (3 * 7 + 1)]).toBeCloseTo(2.5);
  expect(coarse.gradients[2 * (2 * 7 + 5)]).toBeCloseTo(4);
});
