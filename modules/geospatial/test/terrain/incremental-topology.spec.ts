// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  updateTerrainMixedVertexTileHalos,
  updateTerrainMixedGradientGrids,
  createTerrainMixedVertexTileHalos,
  simplifyTerrainContourPathsTopology,
  stitchTerrainContours,
  type TerrainMixedVertexTile
} from '@math.gl/geospatial';
function tile(column: number, spacing = 1): TerrainMixedVertexTile {
  return {
    column,
    row: 0,
    spacing,
    field: {
      width: 5,
      height: 5,
      origin: [column, 0],
      columnStep: [spacing, 0],
      heights: Float64Array.from({length: 25}, (_, i) => column + (i % 5) + 2 * Math.floor(i / 5))
    }
  };
}
test('incremental arrivals, edits and evictions equal full rebuilds and reuse distant results', () => {
  const left = tile(-8, 2);
  left.field.rowStep = [0, 2];
  const fine = tile(0),
    far = tile(100);
  let state = updateTerrainMixedVertexTileHalos(null, [left, fine, far]);
  let gradients = updateTerrainMixedGradientGrids(null, state);
  for (const sources of [
    [fine, far],
    [left, fine, far],
    [{...left, field: {...left.field, validity: new Uint8Array(25)}}, fine, far]
  ]) {
    const next = updateTerrainMixedVertexTileHalos(state, sources);
    expect(next.tiles).toEqual(createTerrainMixedVertexTileHalos(sources).tiles);
    expect(next.tiles.find(t => t.column === 100)).toBe(state.tiles.find(t => t.column === 100));
    const g = updateTerrainMixedGradientGrids(gradients, next);
    expect(g.tiles.find(t => t.halo.column === 100)).toBe(
      gradients.tiles.find(t => t.halo.column === 100)
    );
    expect(g).toEqual(updateTerrainMixedGradientGrids(null, next));
    state = next;
    gradients = g;
  }
  expect(updateTerrainMixedVertexTileHalos(state, state.sources).rebuilt).toEqual([]);
  expect(updateTerrainMixedGradientGrids(gradients, state, {method: 'zevenbergen-thorne'})).toEqual(
    updateTerrainMixedGradientGrids(null, state, {method: 'zevenbergen-thorne'})
  );
  expect(() => updateTerrainMixedVertexTileHalos(state, [fine], {maxDependencyTests: 0})).toThrow(
    /budget/
  );
  expect(() => updateTerrainMixedGradientGrids(null, state, {maxSamples: 1})).toThrow(/capacity/);
});
function paths(points: number[], edges: number[]) {
  return stitchTerrainContours({
    positions: Float64Array.from(points),
    gridCoordinates: new Float64Array((points.length / 3) * 2),
    segments: Uint32Array.from(edges),
    levels: new Float64Array([0]),
    levelIndices: new Uint32Array(edges.length / 2),
    origin: [0, 0, 0],
    heightReference: 'local'
  });
}
test('safe shortcuts simplify; seam anchors remain; crossing inputs are rejected', () => {
  const p = paths([0, 0, 0, 1, 0.1, 0, 2, 0, 0], [0, 1, 1, 2]);
  const out = simplifyTerrainContourPathsTopology(p, {maxError: 1});
  expect(out.indices.length).toBe(2);
  expect(out.rejected).toBe(false);
  expect(
    simplifyTerrainContourPathsTopology(p, {
      maxError: 1,
      protectedVertexIndices: new Uint32Array([1])
    }).indices.length
  ).toBe(3);
  expect(() => simplifyTerrainContourPathsTopology(p, {maxError: 1, maxTopologyTests: 0})).toThrow(
    /budget/
  );
  expect(() =>
    simplifyTerrainContourPathsTopology(paths([0, 0, 0, 2, 2, 0, 0, 2, 0, 2, 0, 0], [0, 1, 2, 3]), {
      maxError: 1
    })
  ).toThrow(/crossings/);
});
test('shortcuts cannot sweep a neighboring component or change nesting', () => {
  const p = paths([0, 0, 0, 2, 3, 0, 4, 0, 0, 1.9, 1, 0, 2.1, 1, 0], [0, 1, 1, 2, 3, 4]);
  const out = simplifyTerrainContourPathsTopology(p, {maxError: 10});
  expect(out.rejected).toBe(true);
  expect(out.indices).toEqual(p.indices);
  expect(out.maxDeviation).toBe(0);
  out.positions[0] = 99;
  expect(p.positions[0]).toBe(0);
});

test('nested rings and shared junctions survive conservative topology simplification', () => {
  const nested = paths(
    [0, 0, 0, 4, 0, 0, 4, 4, 0, 0, 4, 0, 1, 1, 0, 2, 1, 0, 2, 2, 0, 1, 2, 0],
    [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4]
  );
  const result = simplifyTerrainContourPathsTopology(nested, {maxError: 10});
  expect(Array.from(result.closed)).toEqual([1, 1]);
  expect(result.indices.length).toBeGreaterThanOrEqual(8);
  const branch = paths([0, 0, 0, 1, 0, 0, 2, 0, 0, 1, 1, 0], [0, 1, 1, 2, 1, 3]);
  expect(simplifyTerrainContourPathsTopology(branch, {maxError: 10}).sourceVertexIndices).toContain(
    1
  );
});

test('source coverage shrink and movement invalidate old and new neighbors', () => {
  const wide = tile(0);
  wide.field.width = 9;
  wide.field.heights = new Float64Array(45);
  const neighbors = [tile(-4), tile(8), tile(12), tile(100)];
  const initial = updateTerrainMixedVertexTileHalos(null, [wide, ...neighbors]);
  for (const replacement of [tile(0), tile(12)]) {
    const sources = [replacement, ...neighbors.filter(t => t.column !== replacement.column)];
    const next = updateTerrainMixedVertexTileHalos(initial, sources);
    expect(next.tiles).toEqual(createTerrainMixedVertexTileHalos(sources).tiles);
    expect(next.tiles.find(t => t.column === 100)).toBe(initial.tiles.find(t => t.column === 100));
  }
});

test('a shortcut crossing its own replaced chain is rejected', () => {
  const p = paths([0, 0, 0, 1, 2, 0, 2, -1, 0, 3, 2, 0, 4, 0, 0], [0, 1, 1, 2, 2, 3, 3, 4]);
  const out = simplifyTerrainContourPathsTopology(p, {maxError: 10});
  expect(out.rejected).toBe(true);
  expect(out.indices).toEqual(p.indices);
});

test('unused vertex pools do not participate in exact topology conversion', () => {
  const p = paths([0, 0, 0, 1, 0.1, 0, 2, 0, 0, 99, 99, 0], [0, 1, 1, 2]);
  expect(simplifyTerrainContourPathsTopology(p, {maxError: 1}).sourceVertexIndices).toEqual(
    new Uint32Array([0, 2])
  );
});

test('monotone straight runs simplify without cancelling unrelated reductions', () => {
  const p = paths(
    [0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 3, 0, 1, 3.1, 0, 2, 3, 0],
    [0, 1, 1, 2, 3, 4, 4, 5]
  );
  const out = simplifyTerrainContourPathsTopology(p, {maxError: 1});
  expect(out.rejected).toBe(false);
  expect(out.indices.length).toBe(4);
});

test('interior edits preserve nearby halo identities while corner edits invalidate them', () => {
  const left = tile(0);
  left.field.width = left.field.height = 9;
  left.field.heights = new Float64Array(81);
  const right = tile(8);
  const diagonal = {...tile(8), row: 8, field: {...tile(8).field, origin: [8, 8] as const}};
  const resident = [left, right, diagonal, ...Array.from({length: 9}, (_, i) => tile(100 + 8 * i))];
  let state = updateTerrainMixedVertexTileHalos(null, resident);
  for (const [index, expected] of [
    [40, ['1/0/0']],
    [80, ['1/0/0', '1/8/8']]
  ] as const) {
    const heights = Float64Array.from(resident[0].field.heights);
    heights[index] = NaN;
    resident[0] = {...left, field: {...left.field, heights}};
    const next = updateTerrainMixedVertexTileHalos(state, resident);
    expect(next.tiles).toEqual(createTerrainMixedVertexTileHalos(resident).tiles);
    expect(next.rebuilt).toEqual(expected);
    for (const halo of next.tiles) {
      if (!next.rebuilt.includes(`${halo.spacing}/${halo.column}/${halo.row}`)) {
        expect(halo).toBe(
          state.tiles.find(old => old.column === halo.column && old.row === halo.row)
        );
      }
    }
    state = next;
  }
});

test('mixed halo preparation follows layout changes and preserves retained snapshots', () => {
  const sources = Array.from({length: 10}, (_, i) => tile(i * 4));
  const initial = updateTerrainMixedVertexTileHalos(null, sources);
  const resized = {
    ...sources[3],
    field: {...sources[3].field, width: 6, heights: new Float64Array(30)}
  };
  const edited = sources.map((source, i) => (i === 3 ? resized : source));
  const next = updateTerrainMixedVertexTileHalos(initial, edited);
  expect(next.tiles).toEqual(createTerrainMixedVertexTileHalos(edited).tiles);
  const branch = sources.slice(1).reverse();
  expect(updateTerrainMixedVertexTileHalos(initial, branch).tiles).toEqual(
    createTerrainMixedVertexTileHalos(branch).tiles
  );
  expect(updateTerrainMixedVertexTileHalos(next, sources).tiles).toEqual(
    createTerrainMixedVertexTileHalos(sources).tiles
  );
  expect(() => updateTerrainMixedVertexTileHalos(next, edited, {maxSamples: 1})).toThrow(
    /capacity/
  );
});
