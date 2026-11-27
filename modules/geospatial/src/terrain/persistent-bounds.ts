// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {HeightFieldMinMax} from './bounds';
import {
  sameTerrainFrame,
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
import type {HeightField} from './height-field';
export type TerrainPersistentBounds = {
  field: HeightField;
  levels: readonly TerrainPersistentLevel[];
  stats: TerrainHierarchyUpdateStats;
};
/** Immutable block-sharing extrema hierarchy. Values are min/max; counts are
 * populated/complete source-cell counts. Report every changed source sample. */
export function updateTerrainPersistentBounds(
  previous: TerrainPersistentBounds | null,
  field: HeightField,
  dirty: readonly TerrainDirtyWindow[],
  options: {nodesPerBlock?: number; maxSamples?: number; maxTests?: number} = {}
): TerrainPersistentBounds {
  const {nodesPerBlock, charge} = persistentHierarchyOptions(options, field.width * field.height);
  validateTerrainDirtyWindows(dirty, field.width, field.height);
  if (
    !previous ||
    !sameTerrainFrame(previous.field, field) ||
    previous.levels[0].nodesPerBlock !== nodesPerBlock
  ) {
    const bounds = new HeightFieldMinMax(field),
      levels = Array.from({length: bounds.levelCount}, (_, i) => {
        const l = bounds.copyLevel(i),
          values = new Float64Array(2 * l.width * l.height),
          counts = new Uint32Array(values.length);
        for (let j = 0; j < l.width * l.height; j++) {
          values[2 * j] = l.minimums[j];
          values[2 * j + 1] = l.maximums[j];
          counts[2 * j] = l.populatedCellCounts[j];
          counts[2 * j + 1] = l.completeCellCounts[j];
        }
        return packTerrainHierarchyLevel(
          l.width,
          l.height,
          l.blockSize,
          values,
          counts,
          nodesPerBlock
        );
      });
    return {
      field,
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
  const ids = terrainDirtyIndices(dirty, field.width - 1, field.height - 1, 1, charge);
  const result = updatePersistentHierarchy(
    previous.levels,
    ids,
    'bounds',
    (x, y) => {
      let min = Infinity,
        max = -Infinity,
        n = 0;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const z = field.getHeight(x + dx, y + dy);
          if (z !== undefined) {
            min = Math.min(min, z);
            max = Math.max(max, z);
            n++;
          }
        }
      return {values: n ? [min, max] : [0, 0], counts: [n ? 1 : 0, n === 4 ? 1 : 0]};
    },
    charge
  );
  return {field, ...result};
}
