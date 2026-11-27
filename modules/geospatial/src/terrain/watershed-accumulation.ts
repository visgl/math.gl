// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Outlet labels and upstream counts for a terrain receiver forest. */
export type TerrainWatershedAccumulation = {
  /** Row-major outlet index, or -1 for excluded cells. */
  terminal: Int32Array;
  /** Number of contributing cells, including the cell itself. Excluded cells have zero. */
  contributingCells: Uint32Array;
};

/** Controls allocation for watershed accumulation. */
export type TerrainWatershedAccumulationOptions = {
  /** Limit before allocating working buffers. */
  maxCells?: number;
};

/**
 * Accumulates a receiver forest such as that returned by fillTerrainDepressions.
 * Each entry is a receiver index, -1 for an outlet, or -2 for an excluded cell.
 * createTerrainDrainage uses -1 for nodata. Map nodata cells to -2 before calling.
 * Rejects cycles and links to excluded cells. Time and storage are O(cell count).
 */
export function accumulateTerrainWatersheds(
  receiver: Int32Array,
  {maxCells = 4_194_304}: TerrainWatershedAccumulationOptions = {}
): TerrainWatershedAccumulation {
  const count = receiver.length;
  if (!Number.isSafeInteger(maxCells) || maxCells < 0 || count > maxCells || count > 0x7fffffff)
    throw new RangeError('Terrain watershed accumulation exceeds its cell budget');

  const incoming = new Uint32Array(count);
  const contributingCells = new Uint32Array(count);
  const terminal = new Int32Array(count).fill(-1);
  const queue = new Int32Array(count);
  let active = 0;
  for (let i = 0; i < count; i++) {
    const next = receiver[i];
    if (next === -2) continue;
    if (next < -1 || next >= count || (next >= 0 && receiver[next] === -2))
      throw new RangeError('Invalid terrain watershed receiver');
    active++;
    contributingCells[i] = 1;
    if (next >= 0) incoming[next]++;
  }

  let end = 0;
  for (let i = 0; i < count; i++) {
    if (contributingCells[i] && !incoming[i]) queue[end++] = i;
  }
  for (let cursor = 0; cursor < end; cursor++) {
    const i = queue[cursor];
    const next = receiver[i];
    if (next < 0) continue;
    contributingCells[next] += contributingCells[i];
    if (--incoming[next] === 0) queue[end++] = next;
  }
  if (end !== active) throw new RangeError('Terrain watershed receiver graph contains a cycle');

  for (let cursor = end - 1; cursor >= 0; cursor--) {
    const i = queue[cursor];
    const next = receiver[i];
    terminal[i] = next < 0 ? i : terminal[next];
  }
  return {terminal, contributingCells};
}
