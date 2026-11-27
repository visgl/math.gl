// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createTerrainGradientPyramid} from './gradient-pyramid';
import {
  validateTerrainDirtyWindows,
  terrainDirtyIndices,
  type TerrainDirtyWindow
} from './dirty-regions';
import {
  packTerrainHierarchyLevel,
  persistentHierarchyOptions,
  updatePersistentHierarchy,
  type TerrainPersistentLevel,
  type TerrainHierarchyUpdateStats
} from './persistent-hierarchy-data';
import type {TerrainGradientGrid} from './derivatives';
export type TerrainPersistentGradients = {
  source: TerrainGradientGrid;
  levels: readonly TerrainPersistentLevel[];
  stats: TerrainHierarchyUpdateStats;
};
/** Values are mean dz/dx,dz/dy; counts are valid/total original samples.
 * Dirty windows refer to gradient samples, including stencil dependencies. */
export function updateTerrainPersistentGradients(
  previous: TerrainPersistentGradients | null,
  grid: TerrainGradientGrid,
  dirty: readonly TerrainDirtyWindow[],
  options: {nodesPerBlock?: number; maxSamples?: number; maxTests?: number} = {}
): TerrainPersistentGradients {
  const {nodesPerBlock, maxSamples, charge} = persistentHierarchyOptions(
    options,
    grid.width * grid.height
  );
  if (
    !Number.isSafeInteger(grid.width) ||
    grid.width < 1 ||
    !Number.isSafeInteger(grid.height) ||
    grid.height < 1 ||
    !(grid.gradients instanceof Float64Array) ||
    grid.gradients.length !== 2 * grid.width * grid.height ||
    !(grid.statuses instanceof Uint8Array) ||
    grid.statuses.length !== grid.width * grid.height ||
    (grid.method !== 'horn' && grid.method !== 'zevenbergen-thorne') ||
    (grid.registration !== 'vertex' && grid.registration !== 'cell') ||
    typeof grid.heightReference !== 'string' ||
    ![grid.origin, grid.columnStep, grid.rowStep].every(
      v => v.length === 2 && v.every(Number.isFinite)
    )
  )
    throw new Error('Invalid persistent gradient grid');
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
    !old.rowStep.every((v, i) => v === grid.rowStep[i]) ||
    previous!.levels[0].nodesPerBlock !== nodesPerBlock
  ) {
    const pyramid = createTerrainGradientPyramid(grid, {maxSamples}),
      levels = pyramid.levels.map(l => {
        const counts = new Uint32Array(2 * l.width * l.height);
        for (let i = 0; i < l.width * l.height; i++) {
          counts[2 * i] = l.validCounts[i];
          counts[2 * i + 1] = l.sampleCounts[i];
        }
        return packTerrainHierarchyLevel(
          l.width,
          l.height,
          l.blockSize,
          l.gradients,
          counts,
          nodesPerBlock
        );
      });
    return {
      source: grid,
      levels,
      stats: {
        copiedBlocks: levels.reduce((n, l) => n + l.blocks.length, 0),
        copiedBytes: levels.reduce(
          (n, l) => n + l.blocks.reduce((s, b) => s + b.values.byteLength + b.counts.byteLength, 0),
          0
        ),
        updatedNodes: Uint32Array.from(levels, l => l.width * l.height)
      }
    };
  }
  const ids = terrainDirtyIndices(dirty, grid.width, grid.height, 0, charge);
  const result = updatePersistentHierarchy(
    previous!.levels,
    ids,
    'gradient',
    (x, y) => {
      const i = y * grid.width + x,
        s = grid.statuses[i];
      if (s > 6) throw new Error('Invalid terrain gradient status');
      if (
        s === 0 &&
        (!Number.isFinite(grid.gradients[2 * i]) || !Number.isFinite(grid.gradients[2 * i + 1]))
      )
        throw new Error('Invalid terrain gradient value');
      return {
        values: s === 0 ? [grid.gradients[2 * i], grid.gradients[2 * i + 1]] : [0, 0],
        counts: [s === 0 ? 1 : 0, 1]
      };
    },
    charge
  );
  return {source: grid, ...result};
}
