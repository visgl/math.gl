// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {HeightFieldMinMax, type TerrainBoundsLevel} from './bounds';
import {
  sameTerrainFrame,
  validateTerrainDirtyWindows,
  terrainDirtyIndices,
  type TerrainDirtyWindow
} from './dirty-regions';
import type {HeightField} from './height-field';
export type TerrainBoundsRegions = {
  field: HeightField;
  levels: TerrainBoundsLevel[];
  updatedCounts: Uint32Array;
};
/** Copy-on-write hierarchy arrays; recompute only cells near dirty source samples
 * and their ancestors. Array copies retain snapshot immutability. */
export function updateTerrainBoundsRegions(
  previous: TerrainBoundsRegions | null,
  field: HeightField,
  dirty: readonly TerrainDirtyWindow[],
  options: {maxSamples?: number; maxTests?: number} = {}
): TerrainBoundsRegions {
  const limit = options.maxSamples ?? 4_000_000,
    budget = options.maxTests ?? 10_000_000;
  if (
    ![limit, budget].every(Number.isSafeInteger) ||
    limit < 0 ||
    budget < 0 ||
    field.width * field.height > limit
  )
    throw new Error('Invalid bounds region capacity');
  validateTerrainDirtyWindows(dirty, field.width, field.height);
  if (!previous || !sameTerrainFrame(previous.field, field)) {
    const bounds = new HeightFieldMinMax(field),
      levels = Array.from({length: bounds.levelCount}, (_, i) => bounds.copyLevel(i));
    return {field, levels, updatedCounts: Uint32Array.from(levels, l => l.width * l.height)};
  }
  let ids = terrainDirtyIndices(dirty, field.width - 1, field.height - 1, 1, budget),
    tests = 0;
  const counts: number[] = [],
    levels = previous.levels.slice();
  for (let l = 0; l < levels.length; l++) {
    counts.push(ids.size);
    if (!ids.size) continue;
    const old = levels[l],
      next = {
        ...old,
        minimums: old.minimums.slice(),
        maximums: old.maximums.slice(),
        populatedCellCounts: old.populatedCellCounts.slice(),
        completeCellCounts: old.completeCellCounts.slice()
      };
    const parents = new Set<number>();
    for (const id of ids) {
      if (++tests > budget) throw new Error('Bounds region work budget exceeded');
      const x = id % next.width,
        y = Math.floor(id / next.width);
      let min = Infinity,
        max = -Infinity,
        populated = 0,
        complete = 0;
      if (l === 0) {
        let valid = 0;
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            const h = field.getHeight(x + dx, y + dy);
            if (h !== undefined) {
              valid++;
              min = Math.min(min, h);
              max = Math.max(max, h);
            }
          }
        populated = valid ? 1 : 0;
        complete = valid === 4 ? 1 : 0;
      } else {
        const child = levels[l - 1];
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            const cx = x * 2 + dx,
              cy = y * 2 + dy;
            if (cx >= child.width || cy >= child.height) continue;
            const i = cy * child.width + cx;
            if (child.populatedCellCounts[i]) {
              min = Math.min(min, child.minimums[i]);
              max = Math.max(max, child.maximums[i]);
            }
            populated += child.populatedCellCounts[i];
            complete += child.completeCellCounts[i];
          }
      }
      next.minimums[id] = populated ? min : 0;
      next.maximums[id] = populated ? max : 0;
      next.populatedCellCounts[id] = populated;
      next.completeCellCounts[id] = complete;
      parents.add(Math.floor(y / 2) * Math.ceil(next.width / 2) + Math.floor(x / 2));
    }
    levels[l] = next;
    ids = parents;
  }
  return {field, levels, updatedCounts: Uint32Array.from(counts)};
}
