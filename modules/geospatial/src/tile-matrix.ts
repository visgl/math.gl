// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Bounds in the matrix coordinate system: minimum X/Y followed by maximum X/Y. */
export type TileMatrixBounds = readonly [number, number, number, number];

/** Coalescence of contiguous base-grid columns over an inclusive band of rows. */
export type VariableMatrixWidth = {
  /** Number of base columns per tile; an integer greater than one dividing matrix width. */
  readonly coalesce: number;
  /** First row in this band, in the matrix's native row direction. */
  readonly minTileRow: number;
  /** Last row in this band, inclusive. */
  readonly maxTileRow: number;
};

/** A rectangular tile grid at one resolution, independent of service protocols. */
export type TileMatrix = {
  /** Opaque identifier; it is not a numeric zoom or array index. */
  readonly id: string;
  /** X coordinate units per pixel, positive and finite; also used for Y unless overridden. */
  readonly resolution: number;
  /** Y coordinate units per pixel, positive and finite; defaults to resolution. */
  readonly resolutionY?: number;
  /** Origin in X/Y order in the matrix coordinate system. */
  readonly origin: readonly [number, number];
  /** Origin corner; columns increase in X, rows decrease/increase in Y for top/bottom left. */
  readonly cornerOfOrigin: 'topLeft' | 'bottomLeft';
  /** Positive integer tile width and height in pixels. */
  readonly tileSize: readonly [number, number];
  /** Positive integer base-grid width and height in tiles, before coalescence. */
  readonly matrixSize: readonly [number, number];
  /** Optional disjoint row bands; omitted rows have coalescence one. Order is immaterial. */
  readonly variableMatrixWidths?: readonly VariableMatrixWidth[];
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

/** Inclusive base-grid coverage identified by native matrix ID; omitted levels have no coverage. */
export type TileMatrixSetLimits = readonly (TileMatrixLimits & {
  /** Native identifier of the matrix addressed by this coverage rectangle. */
  readonly tileMatrix: string;
})[];

/** An exact row-band range of canonical columns, enumerated using columnStep. */
export type TileMatrixRowRange = TileMatrixLimits & {
  /** Increment between canonical columns; rows increment by one. */
  readonly columnStep: number;
};

/** Rejects malformed or numerically unrepresentable matrix geometry. */
export function validateTileMatrix(matrix: TileMatrix): void {
  validateTileMatrixGeometry(matrix);
}

/**
 * Validates complete geometry, a nonempty opaque CRS identifier, unique matrix IDs and optional
 * identified coverage. Empty sets and empty coverage lists are valid. Does not mutate inputs,
 * interpret the CRS, or require ordered levels or quadtree relationships.
 */
export function validateTileMatrixSet(
  matrixSet: TileMatrixSet,
  limits?: TileMatrixSetLimits
): void {
  if (
    !matrixSet ||
    typeof matrixSet.crs !== 'string' ||
    !matrixSet.crs.trim() ||
    !Array.isArray(matrixSet.matrices)
  ) {
    throw new RangeError('Invalid tile matrix set');
  }
  const matrices = new Map<string, TileMatrix>();
  for (const matrix of matrixSet.matrices) {
    validateTileMatrix(matrix);
    if (matrices.has(matrix.id)) throw new RangeError('Tile matrix identifiers must be unique');
    matrices.set(matrix.id, matrix);
  }
  if (limits === undefined) return;
  if (!Array.isArray(limits)) throw new RangeError('Tile matrix set limits require an array');
  const identifiers = new Set<string>();
  for (const limit of limits) {
    if (
      !limit ||
      typeof limit.tileMatrix !== 'string' ||
      !limit.tileMatrix ||
      identifiers.has(limit.tileMatrix)
    ) {
      throw new RangeError('Tile matrix set limits require unique matrix identifiers');
    }
    const matrix = matrices.get(limit.tileMatrix);
    if (!matrix) throw new RangeError('Tile matrix limits reference an unknown matrix');
    validateTileMatrixCoverage(matrix, limit);
    identifiers.add(limit.tileMatrix);
  }
}

/** Validates complete matrix geometry and inclusive base-grid coverage without mutating either. */
export function validateTileMatrixLimits(matrix: TileMatrix, limits: TileMatrixLimits): void {
  validateTileMatrix(matrix);
  validateTileMatrixCoverage(matrix, limits);
}

/** Validates geometry and returns a sorted copy of the declared coalescence bands. */
function validateTileMatrixGeometry(matrix: TileMatrix): VariableMatrixWidth[] {
  if (
    !matrix ||
    typeof matrix.id !== 'string' ||
    !Array.isArray(matrix.origin) ||
    !Array.isArray(matrix.tileSize) ||
    !Array.isArray(matrix.matrixSize) ||
    (matrix.variableMatrixWidths !== undefined && !Array.isArray(matrix.variableMatrixWidths)) ||
    !matrix.id ||
    matrix.origin.length !== 2 ||
    matrix.tileSize.length !== 2 ||
    matrix.matrixSize.length !== 2 ||
    !Number.isFinite(matrix.resolution) ||
    matrix.resolution <= 0 ||
    (matrix.resolutionY !== undefined &&
      (!Number.isFinite(matrix.resolutionY) || matrix.resolutionY <= 0)) ||
    !matrix.origin.every(Number.isFinite) ||
    ![...matrix.tileSize, ...matrix.matrixSize].every(
      value => Number.isSafeInteger(value) && value > 0
    ) ||
    !['topLeft', 'bottomLeft'].includes(matrix.cornerOfOrigin)
  ) {
    throw new RangeError('Invalid tile matrix geometry');
  }
  const bands = [...(matrix.variableMatrixWidths ?? [])];
  if (bands.some(band => !band)) throw new RangeError('Invalid variable matrix width');
  bands.sort((first, second) => first.minTileRow - second.minTileRow);
  let previousRow = -1;
  for (const band of bands) {
    if (
      !Number.isSafeInteger(band.coalesce) ||
      band.coalesce <= 1 ||
      matrix.matrixSize[0] % band.coalesce !== 0 ||
      !Number.isSafeInteger(band.minTileRow) ||
      !Number.isSafeInteger(band.maxTileRow) ||
      band.minTileRow <= previousRow ||
      band.maxTileRow < band.minTileRow ||
      band.maxTileRow >= matrix.matrixSize[1]
    )
      throw new RangeError('Invalid variable matrix width');
    previousRow = band.maxTileRow;
  }
  for (let axis = 0; axis < 2; axis++) {
    const resolution = axis === 1 ? (matrix.resolutionY ?? matrix.resolution) : matrix.resolution;
    const tileSpan = resolution * matrix.tileSize[axis];
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
  return bands;
}

/** Tests integer indices against the matrix and optional inclusive coverage limits. Does not wrap. */
export function isTileIndexInRange(
  matrix: TileMatrix,
  column: number,
  row: number,
  limits?: TileMatrixLimits
): boolean {
  validateTileMatrix(matrix);
  if (limits) validateTileMatrixCoverage(matrix, limits);
  return (
    isTileIndexWithinMatrix(matrix, column, row) &&
    (!limits ||
      (column >= limits.minTileColumn &&
        column <= limits.maxTileColumn &&
        row >= limits.minTileRow &&
        row <= limits.maxTileRow))
  );
}

/** Tests base-grid indices against already validated dimensions. */
function isTileIndexWithinMatrix(matrix: TileMatrix, column: number, row: number): boolean {
  return (
    Number.isSafeInteger(column) &&
    Number.isSafeInteger(row) &&
    column >= 0 &&
    row >= 0 &&
    column < matrix.matrixSize[0] &&
    row < matrix.matrixSize[1]
  );
}

/**
 * Resolves integer base-grid indices to a canonical column/row, or null for noninteger,
 * nonfinite, outside-matrix or unavailable indices. A coalesced tile is available when any of
 * its aliases intersects the inclusive base-grid limits; the canonical column may precede
 * minTileColumn. Validates geometry and limits even for an invalid query. Does not wrap or mutate.
 */
export function resolveTileIndex(
  matrix: TileMatrix,
  column: number,
  row: number,
  limits?: TileMatrixLimits
): [number, number] | null {
  validateTileMatrix(matrix);
  if (limits !== undefined) validateTileMatrixCoverage(matrix, limits);
  if (!isTileIndexWithinMatrix(matrix, column, row)) return null;
  const coalesce = getRowCoalesce(matrix, row);
  const canonicalColumn = Math.floor(column / coalesce) * coalesce;
  if (
    limits &&
    (row < limits.minTileRow ||
      row > limits.maxTileRow ||
      canonicalColumn > limits.maxTileColumn ||
      canonicalColumn + coalesce - 1 < limits.minTileColumn)
  ) {
    return null;
  }
  return [canonicalColumn, row];
}

/** Returns the entire tile footprint, including column aliases. Throws for out-of-range indices. */
export function getTileBounds(matrix: TileMatrix, column: number, row: number): TileMatrixBounds {
  if (!isTileIndexInRange(matrix, column, row)) throw new RangeError('Tile index outside matrix');
  const width = matrix.resolution * matrix.tileSize[0];
  const height = (matrix.resolutionY ?? matrix.resolution) * matrix.tileSize[1];
  const coalesce = getRowCoalesce(matrix, row);
  const canonicalColumn = Math.floor(column / coalesce) * coalesce;
  const minimumX = matrix.origin[0] + canonicalColumn * width;
  const minimumY =
    matrix.cornerOfOrigin === 'topLeft'
      ? matrix.origin[1] - (row + 1) * height
      : matrix.origin[1] + row * height;
  return [
    minimumX,
    minimumY,
    matrix.origin[0] + (canonicalColumn + coalesce) * width,
    matrix.cornerOfOrigin === 'topLeft'
      ? matrix.origin[1] - row * height
      : matrix.origin[1] + (row + 1) * height
  ];
}

/**
 * Finds the containing tile without clamping or wrapping. Tile intervals are half-open in column
 * and row direction: the origin edge belongs to the matrix, the opposite outer edge does not.
 * Returns a canonical column for coalesced rows, or null for nonfinite/outside coordinates.
 */
export function getTileIndex(
  matrix: TileMatrix,
  coordinate: readonly [number, number]
): [number, number] | null {
  validateTileMatrix(matrix);
  if (!coordinate.every(Number.isFinite)) return null;
  const row = getTileAxisIndex(
    matrix.origin[1],
    matrix.cornerOfOrigin === 'topLeft' ? -1 : 1,
    (matrix.resolutionY ?? matrix.resolution) * matrix.tileSize[1],
    matrix.matrixSize[1],
    coordinate[1]
  );
  if (row === null) return null;
  const coalesce = getRowCoalesce(matrix, row);
  const column = getTileAxisIndex(
    matrix.origin[0],
    1,
    matrix.resolution * matrix.tileSize[0],
    matrix.matrixSize[0],
    coordinate[0],
    coalesce
  );
  return column === null ? null : [column, row];
}

/** Finds half-open edge ownership using the same arithmetic as bounds, without division drift. */
function getTileAxisIndex(
  origin: number,
  direction: number,
  tileSpan: number,
  matrixSize: number,
  coordinate: number,
  columnStep = 1
): number | null {
  const end = origin + direction * (matrixSize * tileSpan);
  if (
    direction === 1
      ? coordinate < origin || coordinate >= end
      : coordinate > origin || coordinate <= end
  ) {
    return null;
  }
  return (
    (findTileAxisBoundary(origin, direction, tileSpan, matrixSize, coordinate, false, columnStep) -
      1) *
    columnStep
  );
}

/** Finds the first edge beyond a coordinate, optionally including an equal edge. */
function findTileAxisBoundary(
  origin: number,
  direction: number,
  tileSpan: number,
  matrixSize: number,
  coordinate: number,
  includeEqualEdge: boolean,
  columnStep = 1
): number {
  // Binary search avoids enumerating edges or assuming division is accurate near an integer.
  let lower = 0;
  let upper = matrixSize / columnStep;
  while (lower < upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    const edge = origin + direction * (middle * columnStep * tileSpan);
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
function validateTileMatrixCoverage(matrix: TileMatrix, limits: TileMatrixLimits): void {
  if (!limits) throw new RangeError('Invalid tile matrix limits');
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
function getRegularTileRange(
  matrix: TileMatrix,
  bounds: TileMatrixBounds,
  limits?: TileMatrixLimits
): TileMatrixLimits | null {
  validateTileQueryBounds(bounds);
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
    (matrix.resolutionY ?? matrix.resolution) * matrix.tileSize[1],
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

/** Rejects nonfinite or unordered query bounds independently of matrix validation. */
function validateTileQueryBounds(bounds: TileMatrixBounds): void {
  if (
    bounds.length !== 4 ||
    !bounds.every(Number.isFinite) ||
    bounds[0] > bounds[2] ||
    bounds[1] > bounds[3]
  ) {
    throw new RangeError('Tile query bounds must be finite and ordered');
  }
}

/**
 * Returns a rectangular range for a regular matrix. Variable-width matrices require getTileRanges
 * so callers cannot accidentally enumerate aliases as separate tiles.
 */
export function getTileRange(
  matrix: TileMatrix,
  bounds: TileMatrixBounds,
  limits?: TileMatrixLimits
): TileMatrixLimits | null {
  validateTileMatrix(matrix);
  if (matrix.variableMatrixWidths?.length) {
    throw new RangeError('Use getTileRanges for variable-width matrices');
  }
  if (limits) validateTileMatrixCoverage(matrix, limits);
  return getRegularTileRange(matrix, bounds, limits);
}

/** Returns the coalescence factor for an already validated row. */
function getRowCoalesce(matrix: TileMatrix, row: number): number {
  return (
    matrix.variableMatrixWidths?.find(band => row >= band.minTileRow && row <= band.maxTileRow)
      ?.coalesce ?? 1
  );
}

/**
 * Returns exact canonical-column ranges, ordered by native row, split at coalescence changes.
 * Columns advance by columnStep, rows by one. Limits use base-grid indices: a tile is included
 * when any of its aliases falls within those limits. Canonical columns may precede minTileColumn.
 * Work and output scale with row bands rather than the number of tiles or rows.
 */
export function getTileRanges(
  matrix: TileMatrix,
  bounds: TileMatrixBounds,
  limits?: TileMatrixLimits
): TileMatrixRowRange[] {
  const declaredBands = validateTileMatrixGeometry(matrix);
  if (limits) validateTileMatrixCoverage(matrix, limits);
  validateTileQueryBounds(bounds);
  const bands: VariableMatrixWidth[] = [];
  let nextRow = 0;
  for (const band of declaredBands) {
    if (nextRow < band.minTileRow) {
      bands.push({coalesce: 1, minTileRow: nextRow, maxTileRow: band.minTileRow - 1});
    }
    bands.push(band);
    nextRow = band.maxTileRow + 1;
  }
  if (nextRow < matrix.matrixSize[1]) {
    bands.push({coalesce: 1, minTileRow: nextRow, maxTileRow: matrix.matrixSize[1] - 1});
  }
  const topLeft = matrix.cornerOfOrigin === 'topLeft';
  const rows = getTileAxisRange(
    matrix.origin[1],
    topLeft ? -1 : 1,
    (matrix.resolutionY ?? matrix.resolution) * matrix.tileSize[1],
    matrix.matrixSize[1],
    topLeft ? bounds[3] : bounds[1],
    topLeft ? bounds[1] : bounds[3]
  );
  if (!rows) return [];
  const ranges: TileMatrixRowRange[] = [];
  for (const band of bands) {
    const minimumRow = Math.max(band.minTileRow, rows[0], limits?.minTileRow ?? 0);
    const maximumRow = Math.min(
      band.maxTileRow,
      rows[1],
      limits?.maxTileRow ?? matrix.matrixSize[1] - 1
    );
    if (minimumRow > maximumRow) continue;
    const columns = getTileAxisRange(
      matrix.origin[0],
      1,
      matrix.resolution * matrix.tileSize[0],
      matrix.matrixSize[0],
      bounds[0],
      bounds[2],
      band.coalesce
    );
    if (!columns) continue;
    const minimumColumn = Math.max(
      columns[0],
      Math.floor((limits?.minTileColumn ?? 0) / band.coalesce) * band.coalesce
    );
    const maximumColumn = Math.min(
      columns[1],
      Math.floor((limits?.maxTileColumn ?? matrix.matrixSize[0] - 1) / band.coalesce) *
        band.coalesce
    );
    if (minimumColumn <= maximumColumn)
      ranges.push({
        minTileColumn: minimumColumn,
        maxTileColumn: maximumColumn,
        minTileRow: minimumRow,
        maxTileRow: maximumRow,
        columnStep: band.coalesce
      });
  }
  return ranges;
}

/** Finds an inclusive range along one directed axis, clipping before comparing computed edges. */
function getTileAxisRange(
  origin: number,
  direction: number,
  tileSpan: number,
  matrixSize: number,
  start: number,
  end: number,
  columnStep = 1
): [number, number] | null {
  if (start === end) {
    const index = getTileAxisIndex(origin, direction, tileSpan, matrixSize, start, columnStep);
    return index === null ? null : [index, index];
  }
  const matrixEnd = origin + direction * (matrixSize * tileSpan);
  const clippedStart = direction === 1 ? Math.max(start, origin) : Math.min(start, origin);
  const clippedEnd = direction === 1 ? Math.min(end, matrixEnd) : Math.max(end, matrixEnd);
  if (direction === 1 ? clippedStart >= clippedEnd : clippedStart <= clippedEnd) return null;
  return [
    (findTileAxisBoundary(
      origin,
      direction,
      tileSpan,
      matrixSize,
      clippedStart,
      false,
      columnStep
    ) -
      1) *
      columnStep,
    (findTileAxisBoundary(origin, direction, tileSpan, matrixSize, clippedEnd, true, columnStep) -
      1) *
      columnStep
  ];
}

/**
 * Selects the coarsest matrix with resolution at or below the positive finite target, or the
 * finest available matrix when all levels are coarser. Target units must match the matrix set's
 * coordinate units per pixel. Returns null for an empty set; ties retain the first matrix.
 * Uses nominal uncoalesced resolution; selection is independent of row.
 * Uses the larger axis resolution for anisotropic pixels, so both axes meet the target.
 * Validates the complete set, including its CRS identifier. Does not sort or mutate the set.
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
  let selectedResolution = -Infinity;
  let finestResolution = Infinity;
  validateTileMatrixSet(matrixSet);
  for (const matrix of matrixSet.matrices) {
    const resolution = Math.max(matrix.resolution, matrix.resolutionY ?? matrix.resolution);
    if (!finest || resolution < finestResolution) {
      finest = matrix;
      finestResolution = resolution;
    }
    if (resolution <= targetResolution && (!selected || resolution > selectedResolution)) {
      selected = matrix;
      selectedResolution = resolution;
    }
  }
  return selected ?? finest;
}
