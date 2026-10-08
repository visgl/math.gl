// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getTileBounds,
  getTileIndex,
  isTileIndexInRange,
  validateTileMatrix
} from '../src/tile-matrix';
import type {TileMatrix} from '../src/tile-matrix';

const matrix: TileMatrix = {
  id: 'national-grid:coarse',
  resolution: 2,
  origin: [100, 200],
  cornerOfOrigin: 'topLeft',
  tileSize: [10, 5],
  matrixSize: [3, 2]
};

test.each(['topLeft', 'bottomLeft'] as const)(
  'bounds and inverse indexing with %s origin',
  cornerOfOrigin => {
    const grid = {...matrix, cornerOfOrigin};
    for (let column = 0; column < 3; column++) {
      for (let row = 0; row < 2; row++) {
        const bounds = getTileBounds(grid, column, row);
        expect(bounds).toEqual([
          100 + column * 20,
          cornerOfOrigin === 'topLeft' ? 190 - row * 10 : 200 + row * 10,
          120 + column * 20,
          cornerOfOrigin === 'topLeft' ? 200 - row * 10 : 210 + row * 10
        ]);
        expect(
          getTileIndex(grid, [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2])
        ).toEqual([column, row]);
      }
    }
    expect(getTileIndex(grid, [100, 200])).toEqual([0, 0]);
    expect(getTileIndex(grid, [160, 200])).toBeNull();
    expect(getTileIndex(grid, [100, cornerOfOrigin === 'topLeft' ? 180 : 220])).toBeNull();
    expect(getTileIndex(grid, [120, cornerOfOrigin === 'topLeft' ? 190 : 210])).toEqual([1, 1]);
  }
);

test('indices are bounded integers and limits are inclusive', () => {
  const limits = {minTileColumn: 1, maxTileColumn: 2, minTileRow: 0, maxTileRow: 0};
  expect(isTileIndexInRange(matrix, 1, 0, limits)).toBe(true);
  expect(isTileIndexInRange(matrix, 2, 0, limits)).toBe(true);
  expect(isTileIndexInRange(matrix, 0, 0, limits)).toBe(false);
  expect(isTileIndexInRange(matrix, 1, 1, limits)).toBe(false);
  for (const column of [-1, 3, 0.5, NaN, Infinity]) {
    expect(isTileIndexInRange(matrix, column, 0)).toBe(false);
    expect(() => getTileBounds(matrix, column, 0)).toThrow(RangeError);
  }
  expect(() => isTileIndexInRange(matrix, 0, 0, {...limits, maxTileColumn: 3})).toThrow(RangeError);
  expect(() =>
    isTileIndexInRange(matrix, 0, 0, {...limits, minTileColumn: 2, maxTileColumn: 1})
  ).toThrow(RangeError);
  expect(getTileIndex(matrix, [NaN, 200])).toBeNull();
  expect(getTileIndex(matrix, [99, 200])).toBeNull();
});

test.each([
  {resolution: 0},
  {resolution: Infinity},
  {origin: [NaN, 0]},
  {origin: [1e20, 0]},
  {tileSize: [0, 5]},
  {matrixSize: [1.5, 2]},
  {id: ''},
  {cornerOfOrigin: 'right'},
  {resolution: Number.MAX_VALUE},
  {resolution: Number.MIN_VALUE, tileSize: [1, 1]}
])('rejects invalid geometry %j', replacement => {
  const grid = {...matrix, ...replacement} as TileMatrix;
  expect(() => validateTileMatrix(grid)).toThrow(RangeError);
});

test.each(['topLeft', 'bottomLeft'] as const)(
  'fractional edges belong to the following tile with %s origin',
  cornerOfOrigin => {
    const grid = {
      ...matrix,
      resolution: 0.1,
      tileSize: [256, 256] as const,
      matrixSize: [3, 3] as const,
      cornerOfOrigin
    };
    const direction = cornerOfOrigin === 'topLeft' ? -1 : 1;
    for (let index = 0; index < 3; index++) {
      const bounds = getTileBounds(grid, index, index);
      const edgeY = cornerOfOrigin === 'topLeft' ? bounds[3] : bounds[1];
      expect(getTileIndex(grid, [bounds[0], edgeY])).toEqual([index, index]);
      expect(getTileIndex(grid, [bounds[0] - 1e-10, edgeY])).toEqual(
        index === 0 ? null : [index - 1, index]
      );
      expect(getTileIndex(grid, [bounds[0], edgeY - direction * 1e-10])).toEqual(
        index === 0 ? null : [index, index - 1]
      );
    }
    const outer = getTileBounds(grid, 2, 2);
    expect(getTileIndex(grid, [outer[2], grid.origin[1]])).toBeNull();
    expect(
      getTileIndex(grid, [grid.origin[0], cornerOfOrigin === 'topLeft' ? outer[1] : outer[3]])
    ).toBeNull();
    const single = {...grid, matrixSize: [1, 1] as const};
    expect(getTileIndex(single, [getTileBounds(single, 0, 0)[2], single.origin[1]])).toBeNull();
  }
);

test('coordinate lookup supports large matrix dimensions without enumerating tiles', () => {
  const grid = {
    ...matrix,
    origin: [0, 0] as const,
    resolution: 1,
    tileSize: [1, 1] as const,
    matrixSize: [Number.MAX_SAFE_INTEGER, 1] as const
  };
  expect(getTileIndex(grid, [Number.MAX_SAFE_INTEGER - 1, 0])).toEqual([
    Number.MAX_SAFE_INTEGER - 1,
    0
  ]);
});
