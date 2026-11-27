// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {reconcileTerrainVertexTiles} from './vertex-tiles';
import type {TerrainVertexTile, TerrainVertexTileOptions} from './vertex-tiles';
import type {HeightFieldProps} from './types';

/** Residency and validity of each padded lattice point. */
export const TerrainVertexHaloStatus = {NOT_RESIDENT: 0, NO_DATA: 1, VALID: 2} as const;

export type TerrainVertexHaloTile = {
  column: number;
  row: number;
  /** One-sample border around the tile, suitable for a vertex-registered HeightField. */
  field: HeightFieldProps;
  /** Matches field buffers, including interior: NOT_RESIDENT, NO_DATA or VALID. */
  statuses: Uint8Array;
};

/** Reconcile and pad same-level vertex tiles with the actual adjacent lattice samples.
 * Missing neighbors are NOT_RESIDENT; resident invalid samples are NO_DATA. No values
 * are extrapolated. Recompute from a new tile snapshot after arrivals or evictions.
 */
export function createTerrainVertexTileHalos(
  tiles: readonly TerrainVertexTile[],
  options: TerrainVertexTileOptions
): {tiles: TerrainVertexHaloTile[]; sharedVertices: number; maxHeightDifference: number} {
  const {width, height} = options;
  const paddedWidth = width + 2,
    paddedHeight = height + 2;
  const paddedCount = paddedWidth * paddedHeight * tiles.length;
  if (!Number.isSafeInteger(paddedCount) || paddedCount > (options.maxSamples ?? 4_000_000))
    throw new Error('Vertex tile halo sample capacity exceeded');
  const reconciled = reconcileTerrainVertexTiles(tiles, options);
  const lattice = new Map<string, {height: number; valid: boolean}>();
  for (const tile of reconciled.tiles) {
    const x = tile.column * (width - 1),
      y = tile.row * (height - 1);
    if (![x - 1, y - 1, x + width, y + height].every(Number.isSafeInteger))
      throw new Error('Vertex tile halo lattice overflow');
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const index = row * width + col;
        lattice.set(`${x + col},${y + row}`, {
          height: tile.field.heights[index],
          valid: tile.field.validity![index] !== 0
        });
      }
    }
  }
  const result: TerrainVertexHaloTile[] = reconciled.tiles.map(tile => {
    const x = tile.column * (width - 1),
      y = tile.row * (height - 1);
    const heights = new Float64Array(paddedWidth * paddedHeight);
    const validity = new Uint8Array(heights.length);
    const statuses = new Uint8Array(heights.length);
    for (let row = 0; row < paddedHeight; row++) {
      for (let col = 0; col < paddedWidth; col++) {
        const index = row * paddedWidth + col;
        const value = lattice.get(`${x + col - 1},${y + row - 1}`);
        if (value) {
          statuses[index] = value.valid
            ? TerrainVertexHaloStatus.VALID
            : TerrainVertexHaloStatus.NO_DATA;
          if (value.valid) {
            heights[index] = value.height;
            validity[index] = 1;
          }
        }
      }
    }
    const origin = tile.field.origin!,
      columnStep = tile.field.columnStep!,
      rowStep = tile.field.rowStep!;
    const paddedOrigin: [number, number] = [
      origin[0] - columnStep[0] - rowStep[0],
      origin[1] - columnStep[1] - rowStep[1]
    ];
    if (!paddedOrigin.every(Number.isFinite))
      throw new Error('Vertex tile halo coordinate overflow');
    return {
      column: tile.column,
      row: tile.row,
      statuses,
      field: {
        ...tile.field,
        width: paddedWidth,
        height: paddedHeight,
        heights,
        validity,
        origin: paddedOrigin
      }
    };
  });
  return {
    tiles: result,
    sharedVertices: reconciled.sharedVertices,
    maxHeightDifference: reconciled.maxHeightDifference
  };
}
