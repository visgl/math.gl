// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField} from '@math.gl/geospatial/terrain';
import {HeightFieldMinMax} from '@math.gl/geospatial/terrain';

test('hierarchy windows exactly match exhaustive corner bounds on odd rectangular grids', () => {
  const field = new HeightField({
    width: 6,
    height: 4,
    heights: Float64Array.from({length: 24}, (_, i) => (i % 7 === 0 ? NaN : Math.sin(i) * 100))
  });
  const hierarchy = new HeightFieldMinMax(field);
  expect(hierarchy.width).toBe(5);
  expect(hierarchy.height).toBe(3);
  expect(hierarchy.levelCount).toBe(4);
  for (let minRow = 0; minRow < 3; minRow++)
    for (let maxRow = minRow; maxRow < 3; maxRow++)
      for (let minColumn = 0; minColumn < 5; minColumn++)
        for (let maxColumn = minColumn; maxColumn < 5; maxColumn++) {
          const values: number[] = [];
          let populated = 0,
            complete = 0;
          for (let row = minRow; row <= maxRow; row++)
            for (let column = minColumn; column <= maxColumn; column++) {
              const corners = [
                field.getHeight(column, row),
                field.getHeight(column + 1, row),
                field.getHeight(column, row + 1),
                field.getHeight(column + 1, row + 1)
              ].filter((v): v is number => v !== undefined);
              values.push(...corners);
              populated += Number(corners.length > 0);
              complete += Number(corners.length === 4);
            }
          expect(hierarchy.query({minColumn, minRow, maxColumn, maxRow})).toEqual({
            heightRange: values.length ? [Math.min(...values), Math.max(...values)] : undefined,
            cellCount: (maxColumn - minColumn + 1) * (maxRow - minRow + 1),
            populatedCellCount: populated,
            completeCellCount: complete
          });
        }
});

test('conservative hierarchy retains narrow ridges and missingness without averaging', () => {
  const heights = new Float64Array(25);
  heights[12] = 1000;
  heights[0] = NaN;
  const field = new HeightField({width: 5, height: 5, heights});
  const hierarchy = new HeightFieldMinMax(field);
  expect(hierarchy.query()).toEqual({
    heightRange: [0, 1000],
    cellCount: 16,
    populatedCellCount: 16,
    completeCellCount: 15
  });
  for (const interpolation of ['bilinear', 'triangle'] as const)
    for (let y = 0.5; y < 4; y += 0.25)
      for (let x = 0.5; x < 4; x += 0.25) {
        const sample = field.sample(x, y, {interpolation});
        const bounds = hierarchy.query({
          minColumn: Math.floor(x),
          maxColumn: Math.floor(x),
          minRow: Math.floor(y),
          maxRow: Math.floor(y)
        });
        if (sample.status === 0) {
          expect(sample.height).toBeGreaterThanOrEqual(bounds.heightRange![0]);
          expect(sample.height).toBeLessThanOrEqual(bounds.heightRange![1]);
        }
      }
  const root = hierarchy.copyLevel(hierarchy.levelCount - 1);
  expect(root.maximums[0]).toBe(1000);
  root.maximums[0] = 0;
  root.minimums[0] = 0;
  root.populatedCellCounts[0] = 0;
  root.completeCellCounts[0] = 0;
  heights.fill(-999);
  expect(hierarchy.query().heightRange).toEqual([0, 1000]);
});

test('empty and partially valid cells retain explicit coverage counts', () => {
  const empty = new HeightFieldMinMax(
    new HeightField({width: 2, height: 2, heights: new Float32Array(4).fill(NaN)})
  );
  expect(empty.levelCount).toBe(1);
  expect(empty.query()).toEqual({
    heightRange: undefined,
    cellCount: 1,
    populatedCellCount: 0,
    completeCellCount: 0
  });
  expect(Array.from(empty.copyLevel(0).minimums)).toEqual([0]);
  expect(Array.from(empty.copyLevel(0).maximums)).toEqual([0]);
  const partial = new HeightFieldMinMax(
    new HeightField({width: 2, height: 2, heights: new Float32Array([-5, NaN, NaN, NaN])})
  );
  expect(partial.query()).toEqual({
    heightRange: [-5, -5],
    cellCount: 1,
    populatedCellCount: 1,
    completeCellCount: 0
  });
  for (const window of [
    {minColumn: -1, minRow: 0, maxColumn: 0, maxRow: 0},
    {minColumn: 0, minRow: 0, maxColumn: 1, maxRow: 0},
    {minColumn: 0.5, minRow: 0, maxColumn: 0, maxRow: 0},
    {minColumn: 0, minRow: 1, maxColumn: 0, maxRow: 0}
  ])
    expect(() => empty.query(window)).toThrow('window');
  expect(() => empty.copyLevel(-1)).toThrow('level');
  expect(() => empty.copyLevel(1)).toThrow('level');
  expect(() => empty.copyLevel(0.5)).toThrow('level');
});
