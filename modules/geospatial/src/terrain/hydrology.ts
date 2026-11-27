// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {HeightField} from './height-field';

/** Uniform horizontal finite-volume metrics for an affine cell-centered grid. */
export type TerrainCellMetrics = {
  /** Horizontal area of one cell, in square meters. */
  area: number;
  /** Face lengths ordered by negative column, positive column, negative row, positive row. */
  faceLengths: readonly [number, number, number, number];
  /** Outward horizontal unit normals in the same order as the face lengths. */
  faceNormals: readonly [
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
    readonly [number, number]
  ];
};

/** Derive projected cell area and face geometry, including shear and reflected grids. */
export function getTerrainCellMetrics(
  field: Pick<HeightField, 'registration' | 'columnStep' | 'rowStep'>
): TerrainCellMetrics {
  if (field.registration !== 'cell')
    throw new Error('Terrain cell metrics require cell registration');
  const [cx, cy] = field.columnStep;
  const [rx, ry] = field.rowStep;
  const determinant = cx * ry - cy * rx;
  const columnLength = Math.hypot(cx, cy);
  const rowLength = Math.hypot(rx, ry);
  const area = Math.abs(determinant);
  if (!(area > 0 && Number.isFinite(area) && Number.isFinite(columnLength + rowLength)))
    throw new RangeError('Invalid terrain cell geometry');
  const sign = Math.sign(determinant);
  const east = [(sign * ry) / rowLength, (-sign * rx) / rowLength] as const;
  const south = [(-sign * cy) / columnLength, (sign * cx) / columnLength] as const;
  return {
    area,
    faceLengths: [rowLength, rowLength, columnLength, columnLength],
    faceNormals: [[-east[0], -east[1]], east, [-south[0], -south[1]], south]
  };
}

/** Drainage options for the unconditioned cell grid. */
export type TerrainDrainageOptions = {
  /** Valid row-major cell indices where flow terminates, even if lower neighbors exist. */
  outlets?: readonly number[];
  /** Maximum grid cells before allocating drainage buffers. Defaults to 4,194,304. */
  maxCells?: number;
};

/** Row-major routing, catchments and accumulation for a single affine cell grid. */
export type TerrainDrainage = {
  /** Receiver index, or -1 for nodata and terminal cells. */
  receiver: Int32Array;
  /** Terminal cell index for the catchment, or -1 for nodata. */
  terminal: Int32Array;
  /** Upstream cell count including the cell itself. Zero denotes nodata. */
  contributingCells: Uint32Array;
  /** Multiply by contributingCells to get contributing area in square meters. */
  cellArea: number;
};

/** Route each valid cell to its steepest strictly lower neighbor in projected XY.
 * Equal slopes select the lower row-major index. Diagonal flow requires both
 * intervening side cells to be valid. The exterior and nodata block flow.
 * Flats, pits and declared outlets terminate flow. Accumulation is O(cells).
 */
export function createTerrainDrainage(
  field: HeightField,
  {outlets = [], maxCells = 4_194_304}: TerrainDrainageOptions = {}
): TerrainDrainage {
  const {width, height, columnStep, rowStep} = field;
  const count = width * height;
  if (!Number.isSafeInteger(maxCells) || maxCells < 0 || count > maxCells || count > 0x7fffffff)
    throw new RangeError('Terrain drainage exceeds its cell budget');
  const {area: cellArea} = getTerrainCellMetrics(field);
  for (const i of outlets) {
    if (
      !Number.isInteger(i) ||
      i < 0 ||
      i >= count ||
      field.getHeight(i % width, Math.floor(i / width)) === undefined
    )
      throw new RangeError('Terrain outlet must identify a valid cell');
  }
  const {heights, validity} = field.copyData();
  const receiver = new Int32Array(count).fill(-1);
  const terminal = new Int32Array(count).fill(-1);
  const contributingCells = new Uint32Array(count);
  const incoming = new Uint8Array(count);
  const queue = new Int32Array(count);
  const outletSet = new Set(outlets);
  const offsets = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const distance = Math.hypot(
        dx * columnStep[0] + dy * rowStep[0],
        dx * columnStep[1] + dy * rowStep[1]
      );
      if (!(distance > 0 && Number.isFinite(distance)))
        throw new RangeError('Invalid terrain neighbor distance');
      offsets.push({dx, dy, distance});
    }
  }
  for (let i = 0; i < count; i++) {
    if (!validity[i]) continue;
    contributingCells[i] = 1;
    if (outletSet.has(i)) continue;
    const col = i % width;
    const row = Math.floor(i / width);
    let steepest = 0;
    for (const {dx, dy, distance} of offsets) {
      if (col + dx < 0 || col + dx >= width || row + dy < 0 || row + dy >= height) continue;
      const j = i + dx + dy * width;
      if (!validity[j] || heights[j] >= heights[i]) continue;
      if (dx && dy && (!validity[i + dx] || !validity[i + dy * width])) continue;
      const slope = (heights[i] - heights[j]) / distance;
      if (!Number.isFinite(slope) || slope === 0)
        throw new RangeError('Terrain drainage slope is outside the representable range');
      // Offsets visit neighbors in ascending row-major order.
      if (slope > steepest) {
        steepest = slope;
        receiver[i] = j;
      }
    }
    if (receiver[i] >= 0) incoming[receiver[i]]++;
  }
  let end = 0;
  for (let i = 0; i < count; i++) if (validity[i] && !incoming[i]) queue[end++] = i;
  // Strict descent makes the graph acyclic. Topological order permits one
  // accumulation pass and one backward catchment pass without sorting heights.
  for (let cursor = 0; cursor < end; cursor++) {
    const i = queue[cursor];
    const next = receiver[i];
    if (next < 0) continue;
    contributingCells[next] += contributingCells[i];
    if (--incoming[next] === 0) queue[end++] = next;
  }
  for (let cursor = end - 1; cursor >= 0; cursor--) {
    const i = queue[cursor];
    const next = receiver[i];
    terminal[i] = next < 0 ? i : terminal[next];
  }
  return {receiver, terminal, contributingCells, cellArea};
}
