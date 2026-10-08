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
  if (limits) validateTileMatrixLimits(matrix, limits);
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
  return findTileAxisBoundary(origin, direction, tileSpan, matrixSize, coordinate, false) - 1;
}

/** Finds the first edge beyond a coordinate, optionally including an equal edge. */
function findTileAxisBoundary(
  origin: number,
  direction: number,
  tileSpan: number,
  matrixSize: number,
  coordinate: number,
  includeEqualEdge: boolean
): number {
  // Binary search avoids enumerating edges or assuming division is accurate near an integer.
  let lower = 0;
  let upper = matrixSize;
  while (lower < upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    const edge = origin + direction * (middle * tileSpan);
    const precedesCoordinate =
      direction === 1
        ? includeEqualEdge
          ? edge < coordinate
          : edge <= coordinate
        : includeEqualEdge
          ? edge > coordinate
          : edge >= coordinate;
    if (precedesCoordinate) lower = middle + 1;
    else upper = middle;
  }
  return lower;
}

/** Validates inclusive coverage limits against the dimensions of an already validated matrix. */
function validateTileMatrixLimits(matrix: TileMatrix, limits: TileMatrixLimits): void {
  const values = [limits.minTileColumn, limits.maxTileColumn, limits.minTileRow, limits.maxTileRow];
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

/**
 * Returns a compact inclusive tile range intersecting an X/Y extent, clipped to the matrix and
 * optional coverage limits, or null for no intersection. Positive-area queries exclude tiles
 * that only touch an edge. Zero-width/height queries use point edge ownership on that axis.
 * Bounds must be finite and ordered; no wrapping or coordinate transformation is performed.
 */
export function getTileRange(
  matrix: TileMatrix,
  bounds: TileMatrixBounds,
  limits?: TileMatrixLimits
): TileMatrixLimits | null {
  validateTileMatrix(matrix);
  if (limits) validateTileMatrixLimits(matrix, limits);
  if (
    bounds.length !== 4 ||
    !bounds.every(Number.isFinite) ||
    bounds[0] > bounds[2] ||
    bounds[1] > bounds[3]
  ) {
    throw new RangeError('Tile query bounds must be finite and ordered');
  }
  const columns = getTileAxisRange(
    matrix.origin[0],
    1,
    matrix.resolution * matrix.tileSize[0],
    matrix.matrixSize[0],
    bounds[0],
    bounds[2]
  );
  const topLeft = matrix.cornerOfOrigin === 'topLeft';
  const rows = getTileAxisRange(
    matrix.origin[1],
    topLeft ? -1 : 1,
    matrix.resolution * matrix.tileSize[1],
    matrix.matrixSize[1],
    topLeft ? bounds[3] : bounds[1],
    topLeft ? bounds[1] : bounds[3]
  );
  if (!columns || !rows) return null;
  const range = {
    minTileColumn: Math.max(columns[0], limits?.minTileColumn ?? 0),
    maxTileColumn: Math.min(columns[1], limits?.maxTileColumn ?? matrix.matrixSize[0] - 1),
    minTileRow: Math.max(rows[0], limits?.minTileRow ?? 0),
    maxTileRow: Math.min(rows[1], limits?.maxTileRow ?? matrix.matrixSize[1] - 1)
  };
  return range.minTileColumn > range.maxTileColumn || range.minTileRow > range.maxTileRow
    ? null
    : range;
}

/** Finds an inclusive range along one directed axis, clipping before comparing computed edges. */
function getTileAxisRange(
  origin: number,
  direction: number,
  tileSpan: number,
  matrixSize: number,
  start: number,
  end: number
): [number, number] | null {
  if (start === end) {
    const index = getTileAxisIndex(origin, direction, tileSpan, matrixSize, start);
    return index === null ? null : [index, index];
  }
  const matrixEnd = origin + direction * (matrixSize * tileSpan);
  const clippedStart = direction === 1 ? Math.max(start, origin) : Math.min(start, origin);
  const clippedEnd = direction === 1 ? Math.min(end, matrixEnd) : Math.max(end, matrixEnd);
  if (direction === 1 ? clippedStart >= clippedEnd : clippedStart <= clippedEnd) return null;
  return [
    findTileAxisBoundary(origin, direction, tileSpan, matrixSize, clippedStart, false) - 1,
    findTileAxisBoundary(origin, direction, tileSpan, matrixSize, clippedEnd, true) - 1
  ];
}

/**
 * Selects the coarsest matrix with resolution at or below the positive finite target, or the
 * finest available matrix when all levels are coarser. Target units must match the matrix set's
 * coordinate units per pixel. Returns null for an empty set; ties retain the first matrix.
 * Validates every matrix and unique identifiers. Does not sort or mutate the set.
 */
export function selectTileMatrix(
  matrixSet: TileMatrixSet,
  targetResolution: number
): TileMatrix | null {
  if (!Number.isFinite(targetResolution) || targetResolution <= 0) {
    throw new RangeError('Target resolution must be positive and finite');
  }
  let selected: TileMatrix | null = null;
  let finest: TileMatrix | null = null;
  const identifiers = new Set<string>();
  for (const matrix of matrixSet.matrices) {
    validateTileMatrix(matrix);
    if (identifiers.has(matrix.id)) throw new RangeError('Tile matrix identifiers must be unique');
    identifiers.add(matrix.id);
    if (!finest || matrix.resolution < finest.resolution) finest = matrix;
    if (
      matrix.resolution <= targetResolution &&
      (!selected || matrix.resolution > selected.resolution)
    ) {
      selected = matrix;
    }
  }
  return selected ?? finest;
}
