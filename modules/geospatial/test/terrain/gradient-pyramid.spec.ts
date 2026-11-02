// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  HeightField,
  createTerrainGradientGrid,
  createTerrainGradientPyramid
} from '@math.gl/geospatial/terrain';
import reference from './fixtures/n43-reference.json';

function qualify(field: HeightField): void {
  for (const method of ['horn', 'zevenbergen-thorne'] as const) {
    const grid = createTerrainGradientGrid(field, {method});
    const pyramid = createTerrainGradientPyramid(grid);
    expect(pyramid.method).toBe(method);
    expect(pyramid.registration).toBe(field.registration);
    for (const level of pyramid.levels) {
      for (let y = 0; y < level.height; y++)
        for (let x = 0; x < level.width; x++) {
          let total = 0,
            valid = 0,
            gx = 0,
            gy = 0;
          for (
            let sy = y * level.blockSize;
            sy < Math.min(field.height, (y + 1) * level.blockSize);
            sy++
          )
            for (
              let sx = x * level.blockSize;
              sx < Math.min(field.width, (x + 1) * level.blockSize);
              sx++
            ) {
              const i = sy * field.width + sx;
              total++;
              if (grid.statuses[i] === 0) {
                valid++;
                gx += grid.gradients[2 * i];
                gy += grid.gradients[2 * i + 1];
              }
            }
          const i = y * level.width + x;
          expect(level.sampleCounts[i]).toBe(total);
          expect(level.validCounts[i]).toBe(valid);
          expect(level.gradients[2 * i]).toBeCloseTo(valid ? gx / valid : 0, 10);
          expect(level.gradients[2 * i + 1]).toBeCloseTo(valid ? gy / valid : 0, 10);
        }
    }
  }
}

test('gradient pyramids match an independent direct block oracle for rotated odd grids', () => {
  const heights = Float64Array.from({length: 35}, (_, i) => (i % 7) ** 2 + Math.floor(i / 7));
  heights[10] = NaN;
  qualify(new HeightField({width: 7, height: 5, heights, columnStep: [2, 1], rowStep: [-1, 2]}));
});

test('gradient pyramids match direct source weights for the independently qualified DTED fixture', () => {
  qualify(
    new HeightField({
      width: reference.width,
      height: reference.height,
      heights: Float64Array.from(reference.heights, h => h ?? NaN),
      origin: reference.origin as [number, number],
      columnStep: reference.columnStep as [number, number],
      rowStep: reference.rowStep as [number, number],
      registration: 'cell'
    })
  );
});

test('gradient pyramid rejects invalid valid samples and capacity without mutating inputs', () => {
  const field = new HeightField({width: 3, height: 3, heights: new Float64Array(9)});
  const grid = createTerrainGradientGrid(field);
  expect(() => createTerrainGradientPyramid(grid, {maxSamples: 8})).toThrow(/capacity/);
  grid.gradients[8] = NaN;
  expect(() => createTerrainGradientPyramid(grid)).toThrow(/gradient value/);
  grid.statuses[4] = 2;
  expect(createTerrainGradientPyramid(grid).levels.at(-1)!.validCounts[0]).toBe(0);
  expect(Number.isNaN(grid.gradients[8])).toBe(true);
});

test('gradient pyramid handles opposing extreme vectors and owns its metadata and buffers', () => {
  const field = new HeightField({width: 2, height: 2, heights: new Float64Array(4)});
  const grid = createTerrainGradientGrid(field);
  grid.statuses.set([0, 0, 2, 2]);
  grid.gradients.set([1e308, -1e308, -1e308, 1e308, 0, 0, 0, 0]);
  const pyramid = createTerrainGradientPyramid(grid);
  expect([...pyramid.levels[1].gradients]).toEqual([0, 0]);
  expect(pyramid.levels[1].validCounts[0]).toBe(2);
  expect(pyramid.levels[1].sampleCounts[0]).toBe(4);
  grid.gradients[0] = 123;
  expect(pyramid.levels[0].gradients[0]).toBe(1e308);
  expect(pyramid.origin).not.toBe(grid.origin);
});
