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
  getTerrainHierarchyNode
} from '@math.gl/geospatial';
import mountain from './fixtures/sierra-streaming.json';
import coastal from './fixtures/pacific-streaming.json';
import missing from './fixtures/sierra-nodata-streaming.json';
for (const [name, input] of [
  ['mountain', mountain],
  ['coastal', coastal],
  ['nodata-heavy', missing]
] as const)
  test(`257x257 ${name} streaming edits retain full hierarchy equivalence`, () => {
    const heights = Float64Array.from(input.heights, h => h ?? NaN),
      make = () =>
        new HeightField({
          ...input,
          registration: 'cell',
          origin: input.origin as [number, number],
          columnStep: input.columnStep as [number, number],
          rowStep: input.rowStep as [number, number],
          heights
        });
    let field = make(),
      bounds = updateTerrainPersistentBounds(null, field, []),
      gradients = updateTerrainPersistentGradients(null, createTerrainGradientGrid(field), []);
    const retained = bounds,
      original = retained.levels[0].blocks[56].values.slice();
    for (const [step, [x, y]] of [
      [41, 57],
      [129, 131],
      [1, 255],
      [200, 1]
    ].entries()) {
      const index = y * 257 + x;
      heights[index] = step % 2 === 0 ? NaN : 100 + step;
      field = make();
      const w = {minColumn: x, maxColumn: x, minRow: y, maxRow: y};
      bounds = updateTerrainPersistentBounds(bounds, field, [w]);
      const grid = createTerrainGradientGrid(field);
      gradients = updateTerrainPersistentGradients(gradients, grid, [
        {
          minColumn: Math.max(0, x - 1),
          maxColumn: Math.min(256, x + 1),
          minRow: Math.max(0, y - 1),
          maxRow: Math.min(256, y + 1)
        }
      ]);
      const flat = new HeightFieldMinMax(field),
        flatGradient = createTerrainGradientPyramid(grid);
      for (let l = 0; l < bounds.levels.length; l++) {
        const expected = flat.copyLevel(l),
          actual = bounds.levels[l];
        for (let row = 0; row < actual.height; row++)
          for (let col = 0; col < actual.width; col++) {
            const node = getTerrainHierarchyNode(actual, col, row),
              i = row * actual.width + col;
            if (
              node.values[0] !== expected.minimums[i] ||
              node.values[1] !== expected.maximums[i] ||
              node.counts[0] !== expected.populatedCellCounts[i] ||
              node.counts[1] !== expected.completeCellCounts[i]
            )
              throw new Error(`Regional bounds mismatch ${name} ${step}/${l}/${i}`);
          }
      }
      for (let l = 0; l < gradients.levels.length; l++) {
        const expected = flatGradient.levels[l],
          actual = gradients.levels[l];
        for (let row = 0; row < actual.height; row++)
          for (let col = 0; col < actual.width; col++) {
            const node = getTerrainHierarchyNode(actual, col, row),
              i = row * actual.width + col;
            if (
              node.values[0] !== expected.gradients[2 * i] ||
              node.values[1] !== expected.gradients[2 * i + 1] ||
              node.counts[0] !== expected.validCounts[i] ||
              node.counts[1] !== expected.sampleCounts[i]
            )
              throw new Error(`Regional gradient mismatch ${name} ${step}/${l}/${i}`);
          }
      }
      expect(bounds.stats.copiedBytes).toBeLessThan(256 * 256 * 24);
      expect(bounds.levels[0].blocks[200]).toBe(retained.levels[0].blocks[200]);
    }
    expect(retained.levels[0].blocks[56].values).toEqual(original);
  });
