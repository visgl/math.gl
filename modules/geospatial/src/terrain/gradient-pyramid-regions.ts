// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createTerrainGradientPyramid, type TerrainGradientPyramid} from './gradient-pyramid';
import {
  validateTerrainDirtyWindows,
  terrainDirtyIndices,
  type TerrainDirtyWindow
} from './dirty-regions';
import type {TerrainGradientGrid} from './derivatives';
export type TerrainGradientPyramidRegions = {
  source: TerrainGradientGrid;
  pyramid: TerrainGradientPyramid;
  updatedCounts: Uint32Array;
};
/** Dirty windows identify changed gradient grid samples, not source-height edits.
 * Expand source-height windows by the derivative stencil radius before use. */
export function updateTerrainGradientPyramidRegions(
  previous: TerrainGradientPyramidRegions | null,
  grid: TerrainGradientGrid,
  dirty: readonly TerrainDirtyWindow[],
  options: {maxSamples?: number; maxTests?: number} = {}
): TerrainGradientPyramidRegions {
  const limit = options.maxSamples ?? 4_000_000,
    budget = options.maxTests ?? 10_000_000;
  if (
    ![limit, budget].every(Number.isSafeInteger) ||
    limit < 0 ||
    budget < 0 ||
    !Number.isSafeInteger(grid.width) ||
    grid.width < 1 ||
    !Number.isSafeInteger(grid.height) ||
    grid.height < 1 ||
    grid.width * grid.height > limit
  )
    throw new Error('Invalid gradient region capacity');
  if (
    (grid.method !== 'horn' && grid.method !== 'zevenbergen-thorne') ||
    (grid.registration !== 'vertex' && grid.registration !== 'cell') ||
    typeof grid.heightReference !== 'string' ||
    ![grid.origin, grid.columnStep, grid.rowStep].every(
      v => v.length === 2 && v.every(Number.isFinite)
    )
  )
    throw new Error('Invalid gradient region metadata');
  validateTerrainDirtyWindows(dirty, grid.width, grid.height);
  const old = previous?.source;
  if (
    !old ||
    old.width !== grid.width ||
    old.height !== grid.height ||
    old.method !== grid.method ||
    old.registration !== grid.registration ||
    old.heightReference !== grid.heightReference ||
    !old.origin.every((v, i) => v === grid.origin[i]) ||
    !old.columnStep.every((v, i) => v === grid.columnStep[i]) ||
    !old.rowStep.every((v, i) => v === grid.rowStep[i])
  ) {
    const pyramid = createTerrainGradientPyramid(grid, {maxSamples: limit});
    return {
      source: grid,
      pyramid,
      updatedCounts: Uint32Array.from(pyramid.levels, l => l.width * l.height)
    };
  }
  if (
    !(grid.gradients instanceof Float64Array) ||
    grid.gradients.length !== 2 * grid.width * grid.height ||
    !(grid.statuses instanceof Uint8Array) ||
    grid.statuses.length !== grid.width * grid.height
  )
    throw new Error('Invalid gradient region buffers');
  const levels = previous!.pyramid.levels.slice();
  let ids = terrainDirtyIndices(dirty, grid.width, grid.height, 0, budget),
    tests = 0;
  const counts: number[] = [];
  for (let l = 0; l < levels.length; l++) {
    counts.push(ids.size);
    if (!ids.size) continue;
    const oldLevel = levels[l],
      next = {
        ...oldLevel,
        gradients: oldLevel.gradients.slice(),
        validCounts: oldLevel.validCounts.slice(),
        sampleCounts: oldLevel.sampleCounts
      };
    const parents = new Set<number>();
    for (const id of ids) {
      if (++tests > budget) throw new Error('Gradient region work budget exceeded');
      const x = id % next.width,
        y = Math.floor(id / next.width);
      next.validCounts[id] = 0;
      next.gradients[2 * id] = next.gradients[2 * id + 1] = 0;
      if (l === 0) {
        if (grid.statuses[id] > 6) throw new Error('Invalid terrain gradient status');
        if (grid.statuses[id] === 0) {
          if (
            !Number.isFinite(grid.gradients[2 * id]) ||
            !Number.isFinite(grid.gradients[2 * id + 1])
          )
            throw new Error('Invalid terrain gradient value');
          next.validCounts[id] = 1;
          next.gradients[2 * id] = grid.gradients[2 * id];
          next.gradients[2 * id + 1] = grid.gradients[2 * id + 1];
        }
      } else {
        const child = levels[l - 1];
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            const cx = x * 2 + dx,
              cy = y * 2 + dy;
            if (cx >= child.width || cy >= child.height) continue;
            const i = cy * child.width + cx,
              n = child.validCounts[i],
              count = next.validCounts[id];
            if (n) {
              const total = count + n;
              for (let axis = 0; axis < 2; axis++) {
                const a = next.gradients[2 * id + axis],
                  b = child.gradients[2 * i + axis];
                next.gradients[2 * id + axis] = count ? a * (count / total) + b * (n / total) : b;
              }
              next.validCounts[id] = total;
            }
          }
      }
      parents.add(Math.floor(y / 2) * Math.ceil(next.width / 2) + Math.floor(x / 2));
    }
    levels[l] = next;
    ids = parents;
  }
  return {
    source: grid,
    pyramid: {...previous!.pyramid, levels},
    updatedCounts: Uint32Array.from(counts)
  };
}
