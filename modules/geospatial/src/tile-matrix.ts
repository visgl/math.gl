// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Bounds in the matrix coordinate system: minimum X/Y followed by maximum X/Y. */
export type TileMatrixBounds = readonly [number, number, number, number];

/** A regular rectangular tile grid at one resolution, independent of service protocols. */
export type TileMatrix = {
  /** Opaque identifier; it is not a numeric zoom or array index. */
  readonly id: string;
  /** Coordinate units per pixel, positive and finite. */
  readonly resolution: number;
  /** Origin in X/Y order in the matrix coordinate system. */
  readonly origin: readonly [number, number];
  /** Origin corner; columns increase in X, rows decrease/increase in Y for top/bottom left. */
  readonly cornerOfOrigin: 'topLeft' | 'bottomLeft';
  /** Positive integer tile width and height in pixels. */
  readonly tileSize: readonly [number, number];
  /** Positive integer matrix width and height in tiles. */
  readonly matrixSize: readonly [number, number];
};

/** Matrices sharing a coordinate system; no ordering or quadtree relationship is assumed. */
export type TileMatrixSet = {
  /** Opaque coordinate-system identifier. Utilities do not transform coordinates. */
  readonly crs: string;
  /** Matrices with unique identifiers. */
  readonly matrices: readonly TileMatrix[];
};

/** Inclusive column and row limits for a rectangular subset of a matrix. */
export type TileMatrixLimits = {
  /** First available column. */
  readonly minTileColumn: number;
  /** Last available column. */
  readonly maxTileColumn: number;
  /** First available row. */
  readonly minTileRow: number;
  /** Last available row. */
  readonly maxTileRow: number;
};

/** Rejects malformed or numerically unrepresentable matrix geometry. */
export function validateTileMatrix(matrix: TileMatrix): void {
  if (
    typeof matrix.id !== 'string' ||
    !matrix.id ||
    matrix.origin.length !== 2 ||
    matrix.tileSize.length !== 2 ||
    matrix.matrixSize.length !== 2 ||
    !Number.isFinite(matrix.resolution) ||
    matrix.resolution <= 0 ||
    !matrix.origin.every(Number.isFinite) ||
    ![...matrix.tileSize, ...matrix.matrixSize].every(
      value => Number.isSafeInteger(value) && value > 0
    ) ||
    !['topLeft', 'bottomLeft'].includes(matrix.cornerOfOrigin)
  ) {
    throw new RangeError('Invalid tile matrix geometry');
  }
  for (let axis = 0; axis < 2; axis++) {
    const tileSpan = matrix.resolution * matrix.tileSize[axis];
    const span = tileSpan * matrix.matrixSize[axis];
    const direction = axis === 1 && matrix.cornerOfOrigin === 'topLeft' ? -1 : 1;
    const end = matrix.origin[axis] + direction * span;
    if (
      !Number.isFinite(span) ||
      span <= 0 ||
      !Number.isFinite(end) ||
      matrix.origin[axis] + direction * tileSpan === matrix.origin[axis] ||
      end - direction * tileSpan === end
    ) {
      throw new RangeError('Tile matrix extent must be finite');
    }
  }
}

/** Tests integer indices against the matrix and optional inclusive coverage limits. Does not wrap. */
export function isTileIndexInRange(
  matrix: TileMatrix,
  column: number,
  row: number,
  limits?: TileMatrixLimits
): boolean {
  validateTileMatrix(matrix);
  if (limits) {
    const values = [
      limits.minTileColumn,
      limits.maxTileColumn,
      limits.minTileRow,
      limits.maxTileRow
    ];
    if (
      !values.every(value => Number.isSafeInteger(value) && value >= 0) ||
      limits.minTileColumn > limits.maxTileColumn ||
      limits.minTileRow > limits.maxTileRow ||
      limits.maxTileColumn >= matrix.matrixSize[0] ||
      limits.maxTileRow >= matrix.matrixSize[1]
    ) {
      throw new RangeError('Invalid tile matrix limits');
    }
  }
  return (
    Number.isSafeInteger(column) &&
    Number.isSafeInteger(row) &&
    column >= 0 &&
    row >= 0 &&
    column < matrix.matrixSize[0] &&
    row < matrix.matrixSize[1] &&
    (!limits ||
      (column >= limits.minTileColumn &&
        column <= limits.maxTileColumn &&
        row >= limits.minTileRow &&
        row <= limits.maxTileRow))
  );
}

/** Returns tile bounds in matrix coordinates. Throws for indices outside the matrix. */
export function getTileBounds(matrix: TileMatrix, column: number, row: number): TileMatrixBounds {
  if (!isTileIndexInRange(matrix, column, row)) throw new RangeError('Tile index outside matrix');
  const width = matrix.resolution * matrix.tileSize[0];
  const height = matrix.resolution * matrix.tileSize[1];
  const minimumX = matrix.origin[0] + column * width;
  const minimumY =
    matrix.cornerOfOrigin === 'topLeft'
      ? matrix.origin[1] - (row + 1) * height
      : matrix.origin[1] + row * height;
  return [
    minimumX,
    minimumY,
    matrix.origin[0] + (column + 1) * width,
    matrix.cornerOfOrigin === 'topLeft'
      ? matrix.origin[1] - row * height
      : matrix.origin[1] + (row + 1) * height
  ];
}

/**
 * Finds the containing tile without clamping or wrapping. Tile intervals are half-open in column
 * and row direction: the origin edge belongs to the matrix, the opposite outer edge does not.
 * Returns null for nonfinite coordinates or coordinates outside the matrix.
 */
export function getTileIndex(
  matrix: TileMatrix,
  coordinate: readonly [number, number]
): [number, number] | null {
  validateTileMatrix(matrix);
  if (!coordinate.every(Number.isFinite)) return null;
  const column = getTileAxisIndex(
    matrix.origin[0],
    1,
    matrix.resolution * matrix.tileSize[0],
    matrix.matrixSize[0],
    coordinate[0]
  );
  const row = getTileAxisIndex(
    matrix.origin[1],
    matrix.cornerOfOrigin === 'topLeft' ? -1 : 1,
    matrix.resolution * matrix.tileSize[1],
    matrix.matrixSize[1],
    coordinate[1]
  );
  return column === null || row === null ? null : [column, row];
}

/** Finds half-open edge ownership using the same arithmetic as bounds, without division drift. */
function getTileAxisIndex(
  origin: number,
  direction: number,
  tileSpan: number,
  matrixSize: number,
  coordinate: number
): number | null {
  const end = origin + direction * (matrixSize * tileSpan);
  if (
    direction === 1
      ? coordinate < origin || coordinate >= end
      : coordinate > origin || coordinate <= end
  ) {
    return null;
  }
  // Find the first edge strictly beyond the coordinate. Binary search also handles large grids
  // without enumerating edges or assuming a division result is accurate near an integer.
  let lower = 0;
  let upper = matrixSize;
  while (lower < upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    const edge = origin + direction * (middle * tileSpan);
    if (direction === 1 ? coordinate >= edge : coordinate <= edge) lower = middle + 1;
    else upper = middle;
  }
  return lower - 1;
}
