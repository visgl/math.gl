// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {HeightFieldProps, TerrainArray} from './types';

/** Addresses are in one same-resolution tile lattice, not geographic coordinates. */
export type TerrainVertexTile = {
  column: number;
  row: number;
  heights: TerrainArray;
  validity?: Uint8Array;
};
export type TerrainVertexTileOptions = {
  width: number;
  height: number;
  origin?: readonly [number, number];
  columnStep?: readonly [number, number];
  rowStep?: readonly [number, number];
  heightReference?: string;
  /** Maximum permitted disagreement between valid copies of a shared vertex. Default 0. */
  maxHeightDifference?: number;
  maxTiles?: number;
  maxSamples?: number;
};
export type ReconciledTerrainVertexTile = {
  column: number;
  row: number;
  field: HeightFieldProps;
};

/** Copy vertex tiles into coherent same-level grids. The lexicographically smallest
 * (column,row) owns each shared height. Any missing copy makes that shared vertex missing.
 * No resampling, averaging, extrapolation or runtime HeightField dependency.
 */
export function reconcileTerrainVertexTiles(
  tiles: readonly TerrainVertexTile[],
  options: TerrainVertexTileOptions
): {tiles: ReconciledTerrainVertexTile[]; sharedVertices: number; maxHeightDifference: number} {
  const {width, height} = options;
  const maxTiles = options.maxTiles ?? 4096,
    maxSamples = options.maxSamples ?? 4_000_000;
  const tolerance = options.maxHeightDifference ?? 0;
  if (
    ![width, height, maxTiles, maxSamples].every(Number.isSafeInteger) ||
    width < 2 ||
    height < 2 ||
    maxTiles < 0 ||
    maxSamples < 0 ||
    tiles.length > maxTiles ||
    !Number.isSafeInteger(width * height * tiles.length) ||
    width * height * tiles.length > maxSamples ||
    !Number.isFinite(tolerance) ||
    tolerance < 0
  )
    throw new Error('Invalid vertex tile dimensions, capacity or height tolerance');
  const origin = options.origin ?? [0, 0],
    columnStep = options.columnStep ?? [1, 0],
    rowStep = options.rowStep ?? [0, 1];
  for (const vector of [origin, columnStep, rowStep])
    if (vector.length !== 2 || !vector.every(Number.isFinite))
      throw new Error('Invalid vertex tile transform');
  const determinant = columnStep[0] * rowStep[1] - columnStep[1] * rowStep[0];
  if (
    !Number.isFinite(determinant) ||
    Math.abs(determinant) <= Number.EPSILON * Math.hypot(...columnStep) * Math.hypot(...rowStep)
  )
    throw new Error('Singular vertex tile transform');
  const heightReference = options.heightReference ?? 'unknown';
  if (typeof heightReference !== 'string') throw new Error('Invalid vertex tile height reference');
  const sorted = [...tiles].sort((a, b) => a.column - b.column || a.row - b.row);
  const seen = new Set<string>();
  const shared = new Map<
    string,
    {height: number; valid: boolean; min: number; max: number; copies: [number, number][]}
  >();
  const result: ReconciledTerrainVertexTile[] = [];
  for (const tile of sorted) {
    const key = `${tile.column},${tile.row}`;
    if (!Number.isSafeInteger(tile.column) || !Number.isSafeInteger(tile.row) || seen.has(key))
      throw new Error('Invalid or duplicate vertex tile address');
    seen.add(key);
    const x = tile.column * (width - 1),
      y = tile.row * (height - 1);
    if (![x, y, x + width - 1, y + height - 1].every(Number.isSafeInteger))
      throw new Error('Vertex tile lattice overflow');
    if (
      !(tile.heights instanceof Float32Array || tile.heights instanceof Float64Array) ||
      tile.heights.length !== width * height ||
      (tile.validity !== undefined &&
        (!(tile.validity instanceof Uint8Array) || tile.validity.length !== width * height))
    )
      throw new Error('Invalid vertex tile buffers');
    const heights = Float64Array.from(tile.heights),
      validity = new Uint8Array(heights.length);
    const tileOrigin: [number, number] = [
      origin[0] + x * columnStep[0] + y * rowStep[0],
      origin[1] + x * columnStep[1] + y * rowStep[1]
    ];
    if (!tileOrigin.every(Number.isFinite)) throw new Error('Vertex tile coordinate overflow');
    const index = result.length;
    result.push({
      column: tile.column,
      row: tile.row,
      field: {
        width,
        height,
        heights,
        validity,
        origin: tileOrigin,
        columnStep: [...columnStep],
        rowStep: [...rowStep],
        registration: 'vertex',
        heightReference
      }
    });
    for (let r = 0; r < height; r++)
      for (let c = 0; c < width; c++) {
        const i = r * width + c,
          valid = Number.isFinite(heights[i]) && (!tile.validity || tile.validity[i] !== 0);
        validity[i] = Number(valid);
        if (!valid) heights[i] = 0;
        if (r !== 0 && c !== 0 && r !== height - 1 && c !== width - 1) continue;
        const address = `${x + c},${y + r}`;
        let vertex = shared.get(address);
        if (!vertex) {
          vertex = {
            height: heights[i],
            valid,
            min: valid ? heights[i] : Infinity,
            max: valid ? heights[i] : -Infinity,
            copies: []
          };
          shared.set(address, vertex);
        } else {
          vertex.valid &&= valid;
          if (valid) {
            vertex.min = Math.min(vertex.min, heights[i]);
            vertex.max = Math.max(vertex.max, heights[i]);
          }
        }
        vertex.copies.push([index, i]);
      }
  }
  let sharedVertices = 0,
    maxHeightDifference = 0;
  for (const vertex of shared.values()) {
    if (vertex.copies.length < 2) continue;
    sharedVertices++;
    const difference = vertex.min === Infinity ? 0 : vertex.max - vertex.min;
    if (!Number.isFinite(difference) || difference > tolerance)
      throw new Error('Shared vertex height disagreement exceeds tolerance');
    maxHeightDifference = Math.max(maxHeightDifference, difference);
    for (const [tile, i] of vertex.copies) {
      result[tile].field.heights[i] = vertex.valid ? vertex.height : 0;
      result[tile].field.validity![i] = Number(vertex.valid);
    }
  }
  return {tiles: result, sharedVertices, maxHeightDifference};
}
