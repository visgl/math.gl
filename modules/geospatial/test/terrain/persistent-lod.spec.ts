// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  HeightField,
  HeightFieldMinMax,
  createTerrainGradientGrid,
  createTerrainGradientPyramid,
  updateTerrainPersistentBounds,
  updateTerrainPersistentGradients,
  getTerrainHierarchyNode,
  createTerrainLodMorph,
  evaluateTerrainLodMorph,
  TerrainMorphStatus
} from '@math.gl/geospatial';
const make = (h: Float64Array, width = 17, height = 17) =>
  new HeightField({width, height, heights: h});
test('persistent bounds and weighted gradients match flat hierarchies and retain untouched blocks', () => {
  const heights = Float64Array.from({length: 17 * 17}, (_, i) => Math.sin(i / 5));
  let field = make(heights),
    bounds = updateTerrainPersistentBounds(null, field, [], {nodesPerBlock: 16}),
    gradients = updateTerrainPersistentGradients(null, createTerrainGradientGrid(field), [], {
      nodesPerBlock: 16
    });
  for (const value of [100, NaN, -100, 0]) {
    heights[20] = value;
    field = make(heights);
    const prior = bounds;
    bounds = updateTerrainPersistentBounds(
      bounds,
      field,
      [{minColumn: 3, maxColumn: 3, minRow: 1, maxRow: 1}],
      {nodesPerBlock: 16}
    );
    const flat = new HeightFieldMinMax(field);
    for (let l = 0; l < flat.levelCount; l++) {
      const expected = flat.copyLevel(l),
        actual = bounds.levels[l];
      for (let y = 0; y < actual.height; y++)
        for (let x = 0; x < actual.width; x++) {
          const n = getTerrainHierarchyNode(actual, x, y),
            i = y * actual.width + x;
          expect(n.values).toEqual([expected.minimums[i], expected.maximums[i]]);
          expect(n.counts).toEqual([
            expected.populatedCellCounts[i],
            expected.completeCellCounts[i]
          ]);
        }
    }
    expect(bounds.levels[0].blocks.at(-1)).toBe(prior.levels[0].blocks.at(-1));
    expect(bounds.stats.copiedBytes).toBeLessThan(256 * 24 * 2);
    const grid = createTerrainGradientGrid(field);
    gradients = updateTerrainPersistentGradients(
      gradients,
      grid,
      [{minColumn: 2, maxColumn: 4, minRow: 0, maxRow: 2}],
      {nodesPerBlock: 16}
    );
    const expected = createTerrainGradientPyramid(grid);
    for (let l = 0; l < expected.levels.length; l++) {
      const a = gradients.levels[l],
        b = expected.levels[l];
      for (let y = 0; y < a.height; y++)
        for (let x = 0; x < a.width; x++) {
          const n = getTerrainHierarchyNode(a, x, y),
            i = y * a.width + x;
          expect(n.values).toEqual(Array.from(b.gradients.subarray(2 * i, 2 * i + 2)));
          expect(n.counts).toEqual([b.validCounts[i], b.sampleCounts[i]]);
        }
    }
  }
  const unchanged = updateTerrainPersistentBounds(bounds, field, [], {nodesPerBlock: 16});
  expect(unchanged.levels[0]).toBe(bounds.levels[0]);
  expect(unchanged.stats.copiedBytes).toBe(0);
  expect(() =>
    updateTerrainPersistentBounds(
      bounds,
      field,
      [{minColumn: 3, maxColumn: 3, minRow: 1, maxRow: 1}],
      {maxTests: 0, nodesPerBlock: 16}
    )
  ).toThrow(/budget/);
  expect(() => getTerrainHierarchyNode(bounds.levels[0], -1, 0)).toThrow();
});
test('odd persistent edges, method changes and block-size resets preserve full-rebuild semantics', () => {
  const h = Float64Array.from({length: 24}, (_, i) => i),
    a = make(h, 6, 4),
    before = updateTerrainPersistentBounds(null, a, [], {nodesPerBlock: 3});
  h[23] = NaN;
  const b = make(h, 6, 4),
    after = updateTerrainPersistentBounds(
      before,
      b,
      [{minColumn: 5, maxColumn: 5, minRow: 3, maxRow: 3}],
      {nodesPerBlock: 3}
    );
  expect(after.levels).toEqual(
    updateTerrainPersistentBounds(null, b, [], {nodesPerBlock: 3}).levels
  );
  const g = createTerrainGradientGrid(b),
    old = updateTerrainPersistentGradients(null, g, []),
    zt = createTerrainGradientGrid(b, {method: 'zevenbergen-thorne'});
  expect(updateTerrainPersistentGradients(old, zt, []).levels).toEqual(
    updateTerrainPersistentGradients(null, zt, []).levels
  );
  expect(() => updateTerrainPersistentGradients(null, g, [], {nodesPerBlock: 0})).toThrow(
    /capacity/
  );
});
test('LOD correspondence preserves planes and produces exact morph endpoints at ratios 2 and 4', () => {
  for (const ratio of [2, 4])
    for (const diagonal of ['00-11', '10-01'] as const) {
      const fine = new HeightField({
        width: 9,
        height: 9,
        origin: [1e12, 0],
        columnStep: [0.1, 0],
        rowStep: [0, 0.1],
        diagonal,
        heights: Float64Array.from({length: 81}, (_, i) => (i % 9) + 2 * Math.floor(i / 9))
      });
      const size = 8 / ratio + 1,
        coarse = new HeightField({
          width: size,
          height: size,
          origin: [1e12, 0],
          columnStep: [0.1 * ratio, 0],
          rowStep: [0, 0.1 * ratio],
          diagonal,
          heights: Float64Array.from(
            {length: size * size},
            (_, i) => (i % size) * ratio + 2 * Math.floor(i / size) * ratio
          )
        });
      const morph = createTerrainLodMorph(fine, coarse, {ratio});
      expect(morph.maxNodalDisplacement).toBeCloseTo(0);
      expect(morph.statuses.every(s => s === 0)).toBe(true);
      expect(evaluateTerrainLodMorph(morph, 0).heights).toEqual(morph.fineHeights);
      expect(evaluateTerrainLodMorph(morph, 1).heights).toEqual(morph.coarseHeights);
      expect(evaluateTerrainLodMorph(morph, 0.5).heights).toEqual(morph.fineHeights);
    }
});
test('LOD nodata, partial coverage, displacement and incompatible frames remain explicit', () => {
  const fine = new HeightField({width: 5, height: 5, heights: new Float64Array(25).fill(5)}),
    h = new Float64Array(4);
  h[3] = NaN;
  const coarse = new HeightField({
    width: 2,
    height: 2,
    heights: h,
    columnStep: [2, 0],
    rowStep: [0, 2]
  });
  const m = createTerrainLodMorph(fine, coarse, {ratio: 2});
  expect(m.statuses).toContain(TerrainMorphStatus.OUTSIDE_COARSE);
  expect(m.statuses).toContain(TerrainMorphStatus.COARSE_NO_DATA);
  expect(m.maxNodalDisplacement).toBe(5);
  expect(evaluateTerrainLodMorph(m, 0.5).heights[0]).toBe(2.5);
  expect(() => evaluateTerrainLodMorph(m, 2)).toThrow();
  expect(() => createTerrainLodMorph(fine, coarse, {ratio: 3})).toThrow();
  expect(() => createTerrainLodMorph(fine, coarse, {ratio: 2, maxSamples: 1})).toThrow();
  expect(() =>
    createTerrainLodMorph(
      fine,
      new HeightField({
        width: 2,
        height: 2,
        heights: new Float64Array(4),
        origin: [1, 0],
        columnStep: [2, 0],
        rowStep: [0, 2]
      }),
      {ratio: 2}
    )
  ).toThrow(/origins/);
});

test('LOD shifted coarse coverage and fine nodata do not extrapolate or fill holes', () => {
  const heights = new Float64Array(25).fill(5);
  heights[6] = NaN;
  const fine = new HeightField({width: 5, height: 5, heights}),
    coarse = new HeightField({
      width: 3,
      height: 3,
      origin: [-2, -2],
      columnStep: [2, 0],
      rowStep: [0, 2],
      heights: Float64Array.from({length: 9}, (_, i) => -4 + 2 * (i % 3) + 2 * Math.floor(i / 3))
    });
  const m = createTerrainLodMorph(fine, coarse, {ratio: 2, coarseOrigin: [-2, -2]});
  expect(m.statuses[6]).toBe(TerrainMorphStatus.FINE_NO_DATA);
  expect(m.statuses[4]).toBe(TerrainMorphStatus.OUTSIDE_COARSE);
  expect(m.coarseHeights[0]).toBe(0);
  expect(evaluateTerrainLodMorph(m, 1).validity[6]).toBe(0);
  expect(() =>
    createTerrainLodMorph(
      fine,
      new HeightField({
        width: 3,
        height: 3,
        heights: new Float64Array(9),
        columnStep: [2, 0],
        rowStep: [0, 2],
        diagonal: '10-01'
      }),
      {ratio: 2}
    )
  ).toThrow(/diagonal/);
});

test('matching-diagonal morph endpoint equals the coarse triangle surface between fine nodes', () => {
  for (const diagonal of ['00-11', '10-01'] as const) {
    const fine = new HeightField({width: 17, height: 17, diagonal, heights: new Float64Array(289)}),
      coarse = new HeightField({
        width: 5,
        height: 5,
        diagonal,
        columnStep: [4, 0],
        rowStep: [0, 4],
        heights: Float64Array.from({length: 25}, (_, i) => Math.sin(i * 0.7) * 10)
      });
    const morph = createTerrainLodMorph(fine, coarse, {ratio: 4}),
      evaluated = evaluateTerrainLodMorph(morph, 1),
      target = new HeightField({width: 17, height: 17, diagonal, ...evaluated});
    for (let i = 0; i < 100; i++) {
      const x = (i * 7.13) % 16,
        y = (i * 3.79) % 16;
      expect(target.sample(x, y, {interpolation: 'triangle'}).height).toBeCloseTo(
        coarse.sample(x, y, {interpolation: 'triangle'}).height,
        11
      );
    }
  }
});
