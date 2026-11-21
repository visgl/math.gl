// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {HeightField} from './height-field';
import {fillTerrainDepressions} from './depression-fill';
import {
  accumulateTerrainWatersheds,
  type TerrainWatershedAccumulation
} from './watershed-accumulation';

/** A cell-registered tile at an integer offset within a regional affine grid. */
export type TerrainWatershedTile = {
  /** Column of the tile's first cell. */
  column: number;
  /** Row of the tile's first cell. */
  row: number;
  /** Tile in the regional frame, with its own translated origin. */
  field: HeightField;
};

/** Regional raster dimensions, frame and confirmed outlets. */
export type TerrainRegionalWatershedOptions = {
  /** Number of columns in the modeled window. */
  width: number;
  /** Number of rows in the modeled window. */
  height: number;
  /** Affine origin of the modeled window. */
  origin: readonly [number, number];
  /** Regional row-major indices of confirmed valid outlets. */
  outlets: readonly number[];
  /** Maximum window cells, including absent tiles. Defaults to 4,194,304. */
  maxCells?: number;
};

/** Conditioning and accumulation over the known cells of a regional window. */
export type TerrainRegionalWatersheds = TerrainWatershedAccumulation & {
  /** Conditioned grid in the supplied regional frame. */
  field: HeightField;
  /** Regional routing forest: -1 at outlets and -2 for excluded cells. */
  receiver: Int32Array;
  /** Per-cell coverage: 0 for absent, 1 for known nodata, 2 for valid. */
  coverage: Uint8Array;
  /** Valid cells face-connected to an absent cell in the window. */
  touchesUnknown: Uint8Array;
};

/**
 * Condition and accumulate across aligned, nonoverlapping tiles.
 * Missing cells and known nodata block modeled paths. Outside the rectangular
 * window is closed. Results are conditional on known coverage and declared
 * outlets; touchesUnknown identifies components that could change as gaps fill.
 * Storage scales with window area. Use bounded windows for sparse regions.
 */
export function createTerrainRegionalWatersheds(
  tiles: readonly TerrainWatershedTile[],
  {width, height, origin, outlets, maxCells = 4_194_304}: TerrainRegionalWatershedOptions
): TerrainRegionalWatersheds {
  const count = width * height;
  if (
    !Number.isSafeInteger(width) ||
    width < 2 ||
    !Number.isSafeInteger(height) ||
    height < 2 ||
    !Number.isSafeInteger(maxCells) ||
    maxCells < 0 ||
    origin.length !== 2 ||
    !origin.every(Number.isFinite) ||
    count > maxCells ||
    count > 0x7fffffff ||
    !tiles.length
  )
    throw new RangeError('Invalid regional watershed window or cell budget');
  const {columnStep, rowStep, heightReference, diagonal} = tiles[0].field;
  const heights = new Float64Array(count);
  const validity = new Uint8Array(count);
  const coverage = new Uint8Array(count);
  for (const {column, row, field} of tiles) {
    if (
      !Number.isSafeInteger(column) ||
      !Number.isSafeInteger(row) ||
      column < 0 ||
      row < 0 ||
      column + field.width > width ||
      row + field.height > height ||
      field.registration !== 'cell' ||
      field.heightReference !== heightReference ||
      field.diagonal !== diagonal ||
      !origin.every(
        (value, axis) =>
          field.origin[axis] === value + column * columnStep[axis] + row * rowStep[axis] &&
          field.columnStep[axis] === columnStep[axis] &&
          field.rowStep[axis] === rowStep[axis]
      )
    )
      throw new RangeError('Regional watershed tiles must align to the shared cell grid');
    for (let y = 0; y < field.height; y++) {
      for (let x = 0; x < field.width; x++) {
        const index = (row + y) * width + column + x;
        if (coverage[index]) throw new RangeError('Regional watershed tiles overlap');
        const value = field.getHeight(x, y);
        coverage[index] = value === undefined ? 1 : 2;
        if (value !== undefined) {
          heights[index] = value;
          validity[index] = 1;
        }
      }
    }
  }
  const mosaic = new HeightField({
    width,
    height,
    origin,
    columnStep,
    rowStep,
    heightReference,
    diagonal,
    registration: 'cell',
    heights,
    validity
  });
  const {field, receiver} = fillTerrainDepressions(mosaic, {outlets, maxCells});
  const touchesUnknown = new Uint8Array(count);
  const queue = new Int32Array(count);
  let end = 0;

  /** Mark and enqueue a valid cell once. */
  function mark(index: number): void {
    if (coverage[index] !== 2 || touchesUnknown[index]) return;
    touchesUnknown[index] = 1;
    queue[end++] = index;
  }

  /** Expand from absent cells into the adjacent known valid domain. */
  function markNeighbors(index: number): void {
    const x = index % width;
    if (x > 0) mark(index - 1);
    if (x + 1 < width) mark(index + 1);
    if (index >= width) mark(index - width);
    if (index < count - width) mark(index + width);
  }

  for (let i = 0; i < count; i++) if (coverage[i] === 0) markNeighbors(i);
  for (let i = 0; i < end; i++) markNeighbors(queue[i]);

  return {
    field,
    receiver,
    coverage,
    touchesUnknown,
    ...accumulateTerrainWatersheds(receiver, {maxCells})
  };
}
