// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getTileBounds,
  getTileIndex,
  getTileRange,
  getTileRanges,
  selectTileMatrix,
  isTileIndexInRange,
  validateTileMatrix,
  validateTileMatrixSet,
  validateTileMatrixLimits,
  resolveTileIndex
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

test.each(['topLeft', 'bottomLeft'] as const)(
  'anisotropic pixels preserve bounds, inverse edges and ranges for %s',
  cornerOfOrigin => {
    const grid: TileMatrix = {...matrix, resolutionY: 3, cornerOfOrigin};
    const direction = cornerOfOrigin === 'topLeft' ? -1 : 1;
    const bounds = getTileBounds(grid, 1, 1);
    expect(bounds).toEqual(
      cornerOfOrigin === 'topLeft' ? [120, 170, 140, 185] : [120, 215, 140, 230]
    );
    expect(getTileIndex(grid, [120, 200 + direction * 15])).toEqual([1, 1]);
    expect(getTileIndex(grid, [120, 200 + direction * 30])).toBeNull();
    expect(getTileRange(grid, bounds)).toEqual({
      minTileColumn: 1,
      maxTileColumn: 1,
      minTileRow: 1,
      maxTileRow: 1
    });
    expect(getTileRange(grid, [120, 200 + direction * 15, 120, 200 + direction * 15])).toEqual({
      minTileColumn: 1,
      maxTileColumn: 1,
      minTileRow: 1,
      maxTileRow: 1
    });
    expect(
      isTileIndexInRange(grid, 1, 1, {
        minTileColumn: 1,
        maxTileColumn: 1,
        minTileRow: 1,
        maxTileRow: 1
      })
    ).toBe(true);
    expect(getTileBounds({...grid, resolutionY: undefined}, 1, 1)).toEqual(
      getTileBounds({...matrix, cornerOfOrigin}, 1, 1)
    );
  }
);

test.each([0, -1, NaN, Infinity, Number.MAX_VALUE, Number.MIN_VALUE])(
  'rejects invalid or unrepresentable vertical resolution %s',
  resolutionY => expect(() => validateTileMatrix({...matrix, resolutionY})).toThrow(RangeError)
);

test('selects anisotropic matrices using the coarser pixel axis without mutating inputs', () => {
  const coarse: TileMatrix = {...matrix, id: 'coarse', resolution: 1, resolutionY: 8};
  const fine: TileMatrix = {...matrix, id: 'fine', resolution: 2, resolutionY: 3};
  const wide: TileMatrix = {...matrix, id: 'wide', resolution: 4, resolutionY: 1};
  const tied: TileMatrix = {...matrix, id: 'tied', resolution: 1, resolutionY: 4};
  const matrices = Object.freeze([coarse, fine, wide, tied]);
  const set = {crs: 'local', matrices};
  expect(selectTileMatrix(set, 4)).toBe(wide);
  expect(selectTileMatrix(set, 3)).toBe(fine);
  expect(selectTileMatrix(set, 0.5)).toBe(fine);
  expect(selectTileMatrix(set, 8)).toBe(coarse);
  expect(matrices).toEqual([coarse, fine, wide, tied]);
});

test.each(['topLeft', 'bottomLeft'] as const)(
  'coalesced columns retain OGC aliases and exact row bands with %s origin',
  cornerOfOrigin => {
    const grid: TileMatrix = {
      ...matrix,
      origin: [0, 0],
      resolution: 0.1,
      resolutionY: 0.2,
      tileSize: [10, 5],
      matrixSize: [8, 4],
      cornerOfOrigin,
      variableMatrixWidths: Object.freeze([
        {coalesce: 4, minTileRow: 3, maxTileRow: 3},
        {coalesce: 2, minTileRow: 0, maxTileRow: 0}
      ])
    };
    const direction = cornerOfOrigin === 'topLeft' ? -1 : 1;
    for (let row = 0; row < 4; row++) {
      const step = row === 0 ? 2 : row === 3 ? 4 : 1;
      for (let column = 0; column < 8; column++) {
        const canonical = Math.floor(column / step) * step;
        const bounds = getTileBounds(grid, column, row);
        expect(bounds[0]).toBe(canonical);
        expect(bounds[2]).toBe(canonical + step);
        expect(getTileIndex(grid, [bounds[0], direction * row])).toEqual([canonical, row]);
        expect(getTileRanges(grid, bounds)).toEqual([
          {
            minTileColumn: canonical,
            maxTileColumn: canonical,
            minTileRow: row,
            maxTileRow: row,
            columnStep: step
          }
        ]);
      }
    }
    expect(getTileIndex(grid, [8, 0])).toBeNull();
    expect(getTileIndex(grid, [0, direction * 4])).toBeNull();
    expect(getTileRanges(grid, [0, -10, 8, 10])).toEqual([
      {minTileColumn: 0, maxTileColumn: 6, minTileRow: 0, maxTileRow: 0, columnStep: 2},
      {minTileColumn: 0, maxTileColumn: 7, minTileRow: 1, maxTileRow: 2, columnStep: 1},
      {minTileColumn: 0, maxTileColumn: 4, minTileRow: 3, maxTileRow: 3, columnStep: 4}
    ]);
    const limits = {minTileColumn: 3, maxTileColumn: 3, minTileRow: 0, maxTileRow: 0};
    expect(getTileRanges(grid, [0, -10, 8, 10], limits)).toEqual([
      {...limits, minTileColumn: 2, maxTileColumn: 2, columnStep: 2}
    ]);
    expect(isTileIndexInRange(grid, 3, 0, limits)).toBe(true);
    expect(getTileRanges(grid, [9, -10, 10, 10])).toEqual([]);
    expect(() => getTileRange(grid, [0, -10, 8, 10])).toThrow('getTileRanges');
    expect(grid.variableMatrixWidths![0].minTileRow).toBe(3);
  }
);

test.each(
  [
    [{coalesce: 1, minTileRow: 0, maxTileRow: 0}],
    [{coalesce: 3, minTileRow: 0, maxTileRow: 0}],
    [{coalesce: 2.5, minTileRow: 0, maxTileRow: 0}],
    [{coalesce: Infinity, minTileRow: 0, maxTileRow: 0}],
    [{coalesce: 2, minTileRow: -1, maxTileRow: 0}],
    [{coalesce: 2, minTileRow: 1, maxTileRow: 0}],
    [{coalesce: 2, minTileRow: 0, maxTileRow: 2}],
    [{coalesce: 2, minTileRow: 0.5, maxTileRow: 1}],
    [
      {coalesce: 2, minTileRow: 0, maxTileRow: 1},
      {coalesce: 4, minTileRow: 1, maxTileRow: 1}
    ]
  ].map(variableMatrixWidths => ({variableMatrixWidths}))
)('rejects malformed or overlapping coalescence bands %j', ({variableMatrixWidths}) => {
  expect(() => validateTileMatrix({...matrix, matrixSize: [8, 2], variableMatrixWidths})).toThrow(
    RangeError
  );
});

test('row ranges stay compact for large dimensions and regular grids remain compatible', () => {
  const grid: TileMatrix = {
    ...matrix,
    origin: [0, 0],
    resolution: 1,
    tileSize: [1, 1],
    matrixSize: [2 ** 32, 2 ** 32],
    variableMatrixWidths: [{coalesce: 4, minTileRow: 0, maxTileRow: 2 ** 32 - 1}]
  };
  expect(getTileRanges(grid, [0, -(2 ** 32), 2 ** 32, 0])).toEqual([
    {
      minTileColumn: 0,
      maxTileColumn: 2 ** 32 - 4,
      minTileRow: 0,
      maxTileRow: 2 ** 32 - 1,
      columnStep: 4
    }
  ]);
  expect(getTileRanges(matrix, getTileBounds(matrix, 1, 0))).toEqual([
    {...getTileRange(matrix, getTileBounds(matrix, 1, 0)), columnStep: 1}
  ]);
  expect(() => getTileRanges(grid, [NaN, 0, 1, 1])).toThrow(RangeError);
});

test('fractional coalesced edges round-trip without division drift', () => {
  const grid: TileMatrix = {
    ...matrix,
    resolution: 0.1,
    tileSize: [3, 1],
    matrixSize: [6, 2],
    variableMatrixWidths: [{coalesce: 3, minTileRow: 0, maxTileRow: 1}]
  };
  for (const column of [0, 3]) {
    const bounds = getTileBounds(grid, column, 0);
    expect(getTileIndex(grid, [bounds[0], bounds[3]])).toEqual([column, 0]);
    expect(getTileRanges(grid, bounds)).toEqual([
      {minTileColumn: column, maxTileColumn: column, minTileRow: 0, maxTileRow: 0, columnStep: 3}
    ]);
  }
});

test.each(['topLeft', 'bottomLeft'] as const)(
  'coalesced rows share base-grid outer edges for %s',
  cornerOfOrigin => {
    const grid: TileMatrix = {
      ...matrix,
      origin: [0, 0],
      resolution: 0.1,
      tileSize: [1, 1],
      matrixSize: [9, 2],
      cornerOfOrigin,
      variableMatrixWidths: [{coalesce: 3, minTileRow: 0, maxTileRow: 0}]
    };
    const edge = 9 * 0.1;
    expect(getTileBounds(grid, 6, 0)[2]).toBe(edge);
    expect(getTileBounds(grid, 8, 1)[2]).toBe(edge);
    expect(getTileIndex(grid, [edge, 0])).toBeNull();
    expect(getTileRanges(grid, [edge, -1, edge, 1])).toEqual([]);
    const tile = getTileBounds(grid, 3, 0);
    expect(getTileIndex(grid, [tile[0], 0])).toEqual([3, 0]);
    expect(getTileRanges(grid, tile)).toEqual([
      {minTileColumn: 3, maxTileColumn: 3, minTileRow: 0, maxTileRow: 0, columnStep: 3}
    ]);
  }
);

test('set validation accepts unordered native IDs and optional sparse coverage without mutation', () => {
  const matrices = Object.freeze([
    Object.freeze({...matrix, id: 'detail'}),
    Object.freeze({...matrix, id: 'coarse', resolution: 8})
  ]);
  const set = Object.freeze({crs: 'local:survey', matrices});
  const limits = Object.freeze([
    Object.freeze({
      tileMatrix: 'coarse',
      minTileColumn: 1,
      maxTileColumn: 2,
      minTileRow: 0,
      maxTileRow: 1
    })
  ]);
  expect(() => validateTileMatrixSet(set, limits)).not.toThrow();
  expect(() => validateTileMatrixSet(set, [])).not.toThrow();
  expect(() => validateTileMatrixSet({crs: 'local', matrices: []}, [])).not.toThrow();
  expect(set.matrices.map(level => level.id)).toEqual(['detail', 'coarse']);
  expect(selectTileMatrix(set, 3)).toBe(matrices[0]);
});

test.each([
  null,
  {crs: '', matrices: []},
  {crs: '   ', matrices: []},
  {crs: 1, matrices: []},
  {crs: 'local'},
  {crs: 'local', matrices: {}},
  {crs: 'local', matrices: [matrix, matrix]},
  {crs: 'local', matrices: [null]},
  {crs: 'local', matrices: [{...matrix, origin: undefined}]},
  {crs: 'local', matrices: [{...matrix, resolution: 0}]},
  {crs: 'local', matrices: [{...matrix, variableMatrixWidths: {}}]},
  {crs: 'local', matrices: [{...matrix, variableMatrixWidths: [null]}]}
])('public set validation and selection reject malformed complete sets: %j', set => {
  expect(() => validateTileMatrixSet(set as any)).toThrow(RangeError);
  expect(() => selectTileMatrix(set as any, 1)).toThrow(RangeError);
});

test('set coverage rejects unknown/duplicate IDs and validates all levels', () => {
  const set = {crs: 'local', matrices: [matrix, {...matrix, id: 'fine'}]};
  const limit = {
    tileMatrix: 'fine',
    minTileColumn: 0,
    maxTileColumn: 0,
    minTileRow: 0,
    maxTileRow: 0
  };
  for (const limits of [
    [{...limit, tileMatrix: 'unknown'}],
    [limit, limit],
    [{...limit, tileMatrix: ''}],
    [{...limit, maxTileColumn: 3}],
    [null],
    {}
  ]) {
    expect(() => validateTileMatrixSet(set, limits as any)).toThrow(RangeError);
  }
});

test('public limits validation checks geometry and inclusive safe base indices', () => {
  const limit = {minTileColumn: 0, maxTileColumn: 2, minTileRow: 0, maxTileRow: 1};
  expect(() => validateTileMatrixLimits(matrix, Object.freeze(limit))).not.toThrow();
  for (const invalid of [
    null,
    {...limit, minTileColumn: -1},
    {...limit, maxTileColumn: 3},
    {...limit, maxTileRow: 2},
    {...limit, minTileRow: 1.5},
    {...limit, maxTileRow: Infinity},
    {...limit, minTileColumn: 2, maxTileColumn: 1}
  ]) {
    expect(() => validateTileMatrixLimits(matrix, invalid as any)).toThrow(RangeError);
  }
  expect(() => validateTileMatrixLimits({...matrix, resolution: 0}, limit)).toThrow(RangeError);
  expect(() => resolveTileIndex(matrix, -1, -1, {...limit, maxTileColumn: 3})).toThrow(RangeError);
});

test.each(['topLeft', 'bottomLeft'] as const)(
  'integer alias resolution agrees with row ranges for %s',
  cornerOfOrigin => {
    const grid: TileMatrix = {
      ...matrix,
      cornerOfOrigin,
      resolution: 0.1,
      resolutionY: 0.2,
      matrixSize: [6, 3],
      variableMatrixWidths: [{coalesce: 3, minTileRow: 1, maxTileRow: 1}]
    };
    const limits = {minTileColumn: 1, maxTileColumn: 1, minTileRow: 1, maxTileRow: 1};
    for (const column of [0, 1, 2])
      expect(resolveTileIndex(grid, column, 1, limits)).toEqual([0, 1]);
    expect(isTileIndexInRange(grid, 0, 1, limits)).toBe(false);
    expect(resolveTileIndex(grid, 3, 1, limits)).toBeNull();
    expect(resolveTileIndex(grid, 1, 0, limits)).toBeNull();
    expect(resolveTileIndex(grid, 2, 0)).toEqual([2, 0]);
    for (const coverage of [
      undefined,
      limits,
      {...limits, minTileColumn: 4, maxTileColumn: 5, maxTileRow: 2}
    ]) {
      for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 6; column++) {
          const ranges = getTileRanges(grid, getTileBounds(grid, column, row), coverage);
          expect(resolveTileIndex(grid, column, row, coverage)).toEqual(
            ranges.length ? [ranges[0].minTileColumn, row] : null
          );
        }
      }
    }
    for (const index of [-1, 6, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
      expect(resolveTileIndex(grid, index, 1)).toBeNull();
    for (const row of [-1, 3, 0.5, NaN, Infinity])
      expect(resolveTileIndex(grid, 0, row)).toBeNull();
  }
);

test('canonical resolution preserves large integer columns and regular-grid coverage', () => {
  const width = 2 ** 32;
  const grid: TileMatrix = {
    ...matrix,
    origin: [0, 0],
    resolution: 1,
    tileSize: [1, 1],
    matrixSize: [width, 1],
    variableMatrixWidths: [{coalesce: 4, minTileRow: 0, maxTileRow: 0}]
  };
  expect(resolveTileIndex(grid, width - 1, 0)).toEqual([width - 4, 0]);
  const limits = {minTileColumn: 1, maxTileColumn: 1, minTileRow: 0, maxTileRow: 0};
  expect(resolveTileIndex(matrix, 1, 0, limits)).toEqual([1, 0]);
  expect(resolveTileIndex(matrix, 0, 0, limits)).toBeNull();
  expect(() => resolveTileIndex({...matrix, resolution: 0}, -1, -1)).toThrow(RangeError);
});

test('set validation rejects sparse row bands with RangeError', () => {
  expect(() =>
    validateTileMatrixSet({
      crs: 'local',
      matrices: [{...matrix, variableMatrixWidths: new Array(1)}]
    })
  ).toThrow(RangeError);
});
