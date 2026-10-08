// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getTileBounds,
  getTileIndex,
  getTileRange,
  selectTileMatrix,
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

test.each(['topLeft', 'bottomLeft'] as const)(
  'extent queries clip compact ranges with %s origin',
  cornerOfOrigin => {
    const grid = {...matrix, cornerOfOrigin};
    const fullRange = {minTileColumn: 0, maxTileColumn: 2, minTileRow: 0, maxTileRow: 1};
    expect(getTileRange(grid, [-1e300, -1e300, 1e300, 1e300])).toEqual(fullRange);
    expect(getTileRange(grid, getTileBounds(grid, 1, 0))).toEqual({
      minTileColumn: 1,
      maxTileColumn: 1,
      minTileRow: 0,
      maxTileRow: 0
    });
    const limits = {minTileColumn: 1, maxTileColumn: 1, minTileRow: 1, maxTileRow: 1};
    expect(getTileRange(grid, [-1e300, -1e300, 1e300, 1e300], limits)).toEqual(limits);
    expect(getTileRange(grid, getTileBounds(grid, 0, 0), limits)).toBeNull();
    expect(getTileRange(grid, [160, -1e300, 170, 1e300])).toBeNull();
    expect(getTileRange(grid, [90, -1e300, 100, 1e300])).toBeNull();
    const edgeY = cornerOfOrigin === 'topLeft' ? 190 : 210;
    expect(getTileRange(grid, [120, edgeY, 120, edgeY])).toEqual({
      minTileColumn: 1,
      maxTileColumn: 1,
      minTileRow: 1,
      maxTileRow: 1
    });
    expect(getTileRange(grid, [120, -1e300, 120, 1e300])).toEqual({
      ...fullRange,
      minTileColumn: 1,
      maxTileColumn: 1
    });
    expect(getTileRange(grid, [100, 200, 160, 200])).toEqual({...fullRange, maxTileRow: 0});
    const farY = cornerOfOrigin === 'topLeft' ? 180 : 220;
    expect(getTileRange(grid, [100, farY, 160, farY])).toBeNull();
    expect(getTileRange(grid, [160, edgeY, 160, edgeY])).toBeNull();
    expect(
      getTileRange(grid, [
        100,
        cornerOfOrigin === 'topLeft' ? 170 : 220,
        160,
        cornerOfOrigin === 'topLeft' ? 180 : 230
      ])
    ).toBeNull();
  }
);

test.each(['topLeft', 'bottomLeft'] as const)(
  'fractional tile bounds query exactly one tile with %s origin',
  cornerOfOrigin => {
    const grid = {...matrix, cornerOfOrigin, resolution: 0.1, tileSize: [256, 256] as const};
    for (let column = 0; column < 3; column++) {
      for (let row = 0; row < 2; row++) {
        expect(getTileRange(grid, getTileBounds(grid, column, row))).toEqual({
          minTileColumn: column,
          maxTileColumn: column,
          minTileRow: row,
          maxTileRow: row
        });
      }
    }
  }
);

test.each(['topLeft', 'bottomLeft'] as const)(
  'range queries agree with positive-area intersection with %s origin',
  cornerOfOrigin => {
    const grid = {...matrix, cornerOfOrigin};
    const query =
      cornerOfOrigin === 'topLeft'
        ? ([110, 185, 145, 195] as const)
        : ([110, 205, 145, 215] as const);
    const range = getTileRange(grid, query)!;
    for (let column = 0; column < 3; column++) {
      for (let row = 0; row < 2; row++) {
        const bounds = getTileBounds(grid, column, row);
        const overlaps =
          bounds[0] < query[2] &&
          bounds[2] > query[0] &&
          bounds[1] < query[3] &&
          bounds[3] > query[1];
        expect(isTileIndexInRange(grid, column, row, range)).toBe(overlaps);
      }
    }
  }
);

test.each([
  [NaN, 0, 1, 1],
  [0, 0, Infinity, 1],
  [2, 0, 1, 1],
  [0, 2, 1, 1]
] as const)('rejects invalid extent %j', bounds => {
  expect(() => getTileRange(matrix, bounds)).toThrow(RangeError);
});

test('ranges validate coverage limits and support large grids without enumeration', () => {
  expect(() =>
    getTileRange(matrix, [0, 0, 1, 1], {
      minTileColumn: 0,
      maxTileColumn: 3,
      minTileRow: 0,
      maxTileRow: 0
    })
  ).toThrow(RangeError);
  const grid = {
    ...matrix,
    origin: [0, 0] as const,
    resolution: 1,
    tileSize: [1, 1] as const,
    matrixSize: [Number.MAX_SAFE_INTEGER, 1] as const
  };
  expect(getTileRange(grid, [Number.MAX_SAFE_INTEGER - 2, -1, Number.MAX_SAFE_INTEGER, 0])).toEqual(
    {
      minTileColumn: Number.MAX_SAFE_INTEGER - 2,
      maxTileColumn: Number.MAX_SAFE_INTEGER - 1,
      minTileRow: 0,
      maxTileRow: 0
    }
  );
});

test('resolution selection uses values rather than identifiers or array order', () => {
  const coarse = {...matrix, id: 'arbitrary', resolution: 4};
  const fine = {...matrix, id: '100', resolution: 1};
  const medium = {...matrix, id: '0', resolution: 2};
  const matrixSet = Object.freeze({
    crs: 'EPSG:32618',
    matrices: Object.freeze([medium, coarse, fine])
  });
  expect(selectTileMatrix(matrixSet, 10)).toBe(coarse);
  expect(selectTileMatrix(matrixSet, 2)).toBe(medium);
  expect(selectTileMatrix(matrixSet, 1.5)).toBe(fine);
  expect(selectTileMatrix(matrixSet, 0.5)).toBe(fine);
  expect(selectTileMatrix({crs: matrixSet.crs, matrices: []}, 1)).toBeNull();
  expect(
    selectTileMatrix({crs: matrixSet.crs, matrices: [medium, {...medium, id: 'tie'}]}, 2)
  ).toBe(medium);
});

test.each([0, -1, Infinity, NaN])('rejects invalid target resolution %s', target => {
  expect(() => selectTileMatrix({crs: 'EPSG:32618', matrices: []}, target)).toThrow(RangeError);
});

test('selection rejects duplicate identifiers and malformed unselected matrices', () => {
  expect(() => selectTileMatrix({crs: 'EPSG:32618', matrices: [matrix, matrix]}, 2)).toThrow(
    'unique'
  );
  expect(() =>
    selectTileMatrix(
      {crs: 'EPSG:32618', matrices: [matrix, {...matrix, id: 'invalid', resolution: -1}]},
      2
    )
  ).toThrow(RangeError);
});
