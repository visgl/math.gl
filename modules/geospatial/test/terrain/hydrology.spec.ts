// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createTerrainDrainage, getTerrainCellMetrics, HeightField} from '@math.gl/geospatial';

/** A small cell-registered raster, with optional affine steps. */
function raster(heights: number[], columnStep = [1, 0], rowStep = [0, 1]) {
  return new HeightField({
    width: 3,
    height: heights.length / 3,
    registration: 'cell',
    heights: Float64Array.from(heights),
    columnStep: [columnStep[0], columnStep[1]],
    rowStep: [rowStep[0], rowStep[1]]
  });
}

test('horizontal flux integrates to affine cell area for both grid orientations', () => {
  for (const row of [
    [1, 4],
    [1, -4]
  ]) {
    const column = [3, 0];
    const field = raster(Array(9).fill(0), column, row);
    const {area, faceLengths, faceNormals} = getTerrainCellMetrics(field);
    expect(area).toBe(12);
    expect(faceLengths).toEqual([Math.sqrt(17), Math.sqrt(17), 3, 3]);
    // Exact face midpoint quadrature for F(x,y)=(x,y), with divergence 2.
    const midpoints = [
      column.map(v => -v / 2),
      column.map(v => v / 2),
      row.map(v => -v / 2),
      row.map(v => v / 2)
    ];
    const flux = faceNormals.reduce((sum, [x, y], i) => {
      expect(Math.hypot(x, y)).toBeCloseTo(1);
      const [mx, my] = midpoints[i];
      const outwardFlux = (x * mx + y * my) * faceLengths[i];
      expect(outwardFlux).toBeGreaterThan(0);
      return sum + outwardFlux;
    }, 0);
    expect(flux).toBeCloseTo(24);
  }
});

test('a sloped raster conserves area into independently known row catchments', () => {
  const field = raster([2, 1, 0, 2, 1, 0, 2, 1, 0], [2, 0], [0, -3]);
  const drainage = createTerrainDrainage(field);
  expect([...drainage.receiver]).toEqual([1, 2, -1, 4, 5, -1, 7, 8, -1]);
  expect([...drainage.terminal]).toEqual([2, 2, 2, 5, 5, 5, 8, 8, 8]);
  expect([...drainage.contributingCells]).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3]);
  const outletArea = [2, 5, 8].reduce(
    (sum, i) => sum + drainage.contributingCells[i] * drainage.cellArea,
    0
  );
  expect(outletArea).toBe(54);
});

test('directions use metric slopes with deterministic ties and explicit outlets', () => {
  const heights = [10, 8, 10, 10, 10, 8, 10, 10, 10];
  expect(createTerrainDrainage(raster(heights)).receiver[4]).toBe(1);
  expect(createTerrainDrainage(raster(heights, [1, 0], [0, 4])).receiver[4]).toBe(5);
  const stopped = createTerrainDrainage(raster(heights), {outlets: [4]});
  expect(stopped.receiver[4]).toBe(-1);
  expect(stopped.terminal[4]).toBe(4);
});

test('nodata blocks diagonal shortcuts, and flats remain separate terminals', () => {
  const field = raster([5, NaN, 1, NaN, 1, 1, NaN, 2, 1]);
  const drainage = createTerrainDrainage(field);
  expect([...drainage.receiver]).toEqual([-1, -1, -1, -1, -1, -1, -1, 4, -1]);
  expect([...drainage.terminal]).toEqual([0, -1, 2, -1, 4, 5, -1, 4, 8]);
  expect([...drainage.contributingCells]).toEqual([1, 0, 1, 0, 2, 1, 0, 1, 1]);
  expect(() => createTerrainDrainage(field, {outlets: [1]})).toThrow('valid cell');
  expect(() => createTerrainDrainage(field, {maxCells: 8})).toThrow('cell budget');
  expect(() =>
    createTerrainDrainage(new HeightField({width: 2, height: 2, heights: new Float64Array(4)}))
  ).toThrow('cell registration');
});

test('an interior depression receives all eight surrounding cells without filling', () => {
  const field = raster([5, 5, 5, 5, -2, 5, 5, 5, 5]);
  const result = createTerrainDrainage(field);
  expect([...result.receiver]).toEqual([4, 4, 4, 4, -1, 4, 4, 4, 4]);
  expect([...result.terminal]).toEqual(Array(9).fill(4));
  expect([...result.contributingCells]).toEqual([1, 1, 1, 1, 9, 1, 1, 1, 1]);
  expect(field.getHeight(1, 1)).toBe(-2);
});
