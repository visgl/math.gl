// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  HeightField,
  HeightFieldMinMax,
  createTerrainGradientGrid,
  createTerrainGradientPyramid,
  updateTerrainMeshRegions,
  updateTerrainMartiniMeshRegions,
  updateTerrainDelatinMeshRegions,
  updateTerrainBoundsRegions,
  updateTerrainGradientPyramidRegions,
  simplifyTerrainContourPathsTopology,
  stitchTerrainContours
} from '@math.gl/geospatial';
const field = (
  heights = Float64Array.from({length: 81}, (_, i) => Math.sin(i % 9) + Math.cos(Math.floor(i / 9)))
) => new HeightField({width: 9, height: 9, heights});
const window = {minColumn: 2, minRow: 2, maxColumn: 2, maxRow: 2};
test('dirty regular and adaptive regions match full rebuilds and reuse untouched buffers', () => {
  for (const algorithm of ['regular', 'martini', 'delatin']) {
    const build = (prior: any, f: HeightField, dirty: any[]) =>
      algorithm === 'regular'
        ? updateTerrainMeshRegions(prior, f, dirty, {cellsPerRegion: 4})
        : algorithm === 'martini'
          ? updateTerrainMartiniMeshRegions(prior, f, dirty, {cellsPerRegion: 4, maxError: 0.5})
          : updateTerrainDelatinMeshRegions(prior, f, dirty, {cellsPerRegion: 4, maxError: 0.5});
    let current = field(),
      state = build(null, current, []);
    for (const value of [100, NaN, 0]) {
      const heights = current.copyData().heights;
      heights[20] = value;
      current = field(Float64Array.from(heights));
      const next = build(state, current, [window]),
        full = build(null, current, []);
      expect(next.regions).toEqual(full.regions);
      expect(Array.from(next.rebuilt)).toEqual([0]);
      expect(next.regions[3]).toBe(state.regions[3]);
      state = next;
    }
  }
  const initial = updateTerrainMeshRegions(null, field(), [], {cellsPerRegion: 4});
  const boundary = updateTerrainMeshRegions(
    initial,
    field(),
    [{minColumn: 4, maxColumn: 4, minRow: 2, maxRow: 2}],
    {cellsPerRegion: 4}
  );
  expect(boundary.rebuilt.length).toBe(2);
  expect(() => updateTerrainMeshRegions(null, field(), [], {maxSamples: 1})).toThrow(/capacity/);
});
test('dirty bounds and gradient ancestors match full hierarchies through edits and nodata', () => {
  let f = field(),
    bounds = updateTerrainBoundsRegions(null, f, []),
    grid = createTerrainGradientGrid(f),
    gradients = updateTerrainGradientPyramidRegions(null, grid, []);
  for (const value of [100, NaN, -100, 0]) {
    const h = f.copyData().heights;
    h[20] = value;
    f = field(Float64Array.from(h));
    const next = updateTerrainBoundsRegions(bounds, f, [window]),
      full = new HeightFieldMinMax(f);
    for (let l = 0; l < full.levelCount; l++) expect(next.levels[l]).toEqual(full.copyLevel(l));
    expect(next.updatedCounts[0]).toBeLessThan(64);
    expect(bounds.levels[0].maximums).not.toBe(next.levels[0].maximums);
    bounds = next;
    grid = createTerrainGradientGrid(f);
    gradients = updateTerrainGradientPyramidRegions(gradients, grid, [
      {minColumn: 1, minRow: 1, maxColumn: 3, maxRow: 3}
    ]);
    expect(gradients.pyramid).toEqual(createTerrainGradientPyramid(grid));
  }
  expect(updateTerrainBoundsRegions(bounds, f, []).levels[0]).toBe(bounds.levels[0]);
  expect(updateTerrainGradientPyramidRegions(gradients, grid, []).pyramid.levels[0]).toBe(
    gradients.pyramid.levels[0]
  );
  expect(() => updateTerrainBoundsRegions(bounds, f, [{...window, minColumn: -1}])).toThrow(
    /window/
  );
});
function paths(points: number[], segments: number[]) {
  return stitchTerrainContours({
    positions: Float64Array.from(points),
    gridCoordinates: new Float64Array((points.length / 3) * 2),
    levels: new Float64Array([0]),
    levelIndices: new Uint32Array(segments.length / 2),
    segments: Uint32Array.from(segments),
    origin: [0, 0, 0],
    heightReference: 'local'
  });
}
test('path-local rejection preserves unrelated safe reductions', () => {
  const p = paths(
    [0, 0, 0, 2, 3, 0, 4, 0, 0, 1.9, 1, 0, 2.1, 1, 0, 10, 0, 0, 11, 0.1, 0, 12, 0, 0],
    [0, 1, 1, 2, 3, 4, 5, 6, 6, 7]
  );
  const batch = simplifyTerrainContourPathsTopology(p, {maxError: 10}),
    local = simplifyTerrainContourPathsTopology(p, {maxError: 10, rejection: 'path'});
  expect(batch.indices.length).toBe(8);
  expect(local.indices.length).toBe(7);
  expect(local.rejected).toBe(true);
});
test('indexed topology handles thousands of separated components within a bounded work budget', () => {
  const points: number[] = [],
    edges: number[] = [];
  for (let i = 0; i < 2000; i++) {
    const v = points.length / 3;
    points.push(i * 4, 0, 0, i * 4 + 1, 0.1, 0, i * 4 + 2, 0, 0);
    edges.push(v, v + 1, v + 1, v + 2);
  }
  const result = simplifyTerrainContourPathsTopology(paths(points, edges), {
    maxError: 1,
    maxTopologyTests: 1_000_000
  });
  expect(result.indices.length).toBe(4000);
  expect(result.topologyTests).toBeLessThan(1_000_000);
});

test('indexed isobands handle thousands of separated conforming patches', async () => {
  const {createTerrainIsobands} = await import('@math.gl/geospatial');
  const fields = Array.from(
    {length: 2000},
    (_, i) =>
      new HeightField({
        width: 2,
        height: 2,
        origin: [i * 3, 0],
        heights: new Float64Array(4).fill(1)
      })
  );
  const bands = createTerrainIsobands(fields, [0, 2], {maxTests: 1_000_000});
  expect(bands.parents.length).toBe(2000);
});

test('odd hierarchy edges, metadata resets and work admission remain correct', () => {
  const heights = Float64Array.from({length: 24}, (_, i) => i);
  const a = new HeightField({width: 6, height: 4, heights}),
    old = updateTerrainBoundsRegions(null, a, []);
  heights[23] = NaN;
  const b = new HeightField({width: 6, height: 4, heights});
  const next = updateTerrainBoundsRegions(old, b, [
      {minColumn: 5, maxColumn: 5, minRow: 3, maxRow: 3}
    ]),
    full = new HeightFieldMinMax(b);
  for (let i = 0; i < full.levelCount; i++) expect(next.levels[i]).toEqual(full.copyLevel(i));
  const ga = createTerrainGradientGrid(a),
    gb = createTerrainGradientGrid(b);
  const first = updateTerrainGradientPyramidRegions(null, ga, []),
    second = updateTerrainGradientPyramidRegions(first, gb, [
      {minColumn: 4, maxColumn: 5, minRow: 2, maxRow: 3}
    ]);
  expect(second.pyramid).toEqual(createTerrainGradientPyramid(gb));
  const zt = createTerrainGradientGrid(b, {method: 'zevenbergen-thorne'});
  expect(updateTerrainGradientPyramidRegions(second, zt, []).pyramid).toEqual(
    createTerrainGradientPyramid(zt)
  );
  expect(() =>
    updateTerrainBoundsRegions(old, b, [{minColumn: 5, maxColumn: 5, minRow: 3, maxRow: 3}], {
      maxTests: 0
    })
  ).toThrow(/budget/);
  expect(() =>
    updateTerrainGradientPyramidRegions(
      first,
      gb,
      [{minColumn: 4, maxColumn: 5, minRow: 2, maxRow: 3}],
      {maxTests: 0}
    )
  ).toThrow(/budget/);
});

test('range pruning never hides conflicting shared heights', async () => {
  const {createTerrainIsobands} = await import('@math.gl/geospatial');
  const make = (x: number, h: number) =>
    new HeightField({width: 2, height: 2, origin: [x, 0], heights: new Float64Array(4).fill(h)});
  expect(() => createTerrainIsobands([make(0, 1), make(1, 10)], [0, 2])).toThrow(/shared heights/);
  expect(() => createTerrainIsobands([make(0, 1), make(1, 10)], [100, 200])).toThrow(
    /shared heights/
  );
});

test('mesh regions share parent-relative coordinates at large world origins', () => {
  const f = new HeightField({
    width: 5,
    height: 3,
    origin: [1e12, 0],
    columnStep: [0.1, 0],
    heights: new Float64Array(15)
  });
  const state = updateTerrainMeshRegions(null, f, [], {cellsPerRegion: 2});
  expect(state.origin).toEqual([1e12, 0, 0]);
  const left = state.regions[0].data,
    right = state.regions[1].data;
  expect(left.origin).toEqual([0, 0, 0]);
  expect(right.origin).toEqual([0, 0, 0]);
  expect(left.positions[6]).toBe(0.2);
  expect(right.positions[0]).toBe(left.positions[6]);
});

test('hierarchy work budgets include selection and recomputation together', () => {
  const f = new HeightField({width: 2, height: 2, heights: new Float64Array(4)}),
    w = [{minColumn: 0, maxColumn: 0, minRow: 0, maxRow: 0}];
  const bounds = updateTerrainBoundsRegions(null, f, []);
  expect(() => updateTerrainBoundsRegions(bounds, f, w, {maxTests: 1})).toThrow(/budget/);
  const grid = {
    width: 1,
    height: 1,
    gradients: new Float64Array([1, 2]),
    statuses: new Uint8Array([0]),
    method: 'horn' as const,
    origin: [0, 0] as const,
    columnStep: [1, 0] as const,
    rowStep: [0, 1] as const,
    registration: 'vertex' as const,
    heightReference: 'local'
  };
  const initial = updateTerrainGradientPyramidRegions(null, grid, []);
  expect(() => updateTerrainGradientPyramidRegions(initial, grid, w, {maxTests: 1})).toThrow(
    /budget/
  );
});

test('mesh initialization and configuration resets do not charge unused dirty comparisons', () => {
  const f = field(),
    dirty = [{minColumn: 2, maxColumn: 2, minRow: 2, maxRow: 2}];
  const initial = updateTerrainMeshRegions(null, f, dirty, {cellsPerRegion: 4, maxTests: 0});
  expect(initial.rebuilt.length).toBe(4);
  expect(
    updateTerrainMeshRegions(initial, f, dirty, {cellsPerRegion: 2, maxTests: 0}).rebuilt.length
  ).toBe(16);
  expect(() =>
    updateTerrainMeshRegions(null, f, [{...dirty[0], minColumn: -1}], {maxTests: 0})
  ).toThrow(/window/);
});
