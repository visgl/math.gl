// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createMartiniTerrainMesh} from './martini';
import {updateMeshRegions, type TerrainMeshRegions} from './mesh-regions-data';
import type {HeightField} from './height-field';
import type {AdaptiveTerrainMesh} from './adaptive-mesh-types';
import type {TerrainDirtyWindow} from './dirty-regions';
export type TerrainMartiniMeshRegions = TerrainMeshRegions<AdaptiveTerrainMesh | null>;
/** Complete square power-of-two cell regions; missing-data regions return null. Full
 * boundaries keep adjacent regions conforming. Partial edge regions are rejected. */
export function updateTerrainMartiniMeshRegions(
  previous: TerrainMartiniMeshRegions | null,
  field: HeightField,
  dirty: readonly TerrainDirtyWindow[],
  options: {maxError: number; cellsPerRegion?: number; maxSamples?: number; maxTests?: number}
): TerrainMartiniMeshRegions {
  const cells = options.cellsPerRegion ?? 32;
  if (
    !Number.isSafeInteger(cells) ||
    cells < 1 ||
    cells > 32768 ||
    (cells & (cells - 1)) !== 0 ||
    (field.width - 1) % cells ||
    (field.height - 1) % cells ||
    !Number.isFinite(options.maxError) ||
    options.maxError < 0
  )
    throw new Error('Invalid MARTINI region dimensions or error');
  return updateMeshRegions(previous, field, dirty, options, `martini:${options.maxError}`, f =>
    f.validCount !== f.width * f.height
      ? null
      : createMartiniTerrainMesh(f, {
          maxError: options.maxError,
          fullEdges: ['minColumn', 'maxColumn', 'minRow', 'maxRow']
        })
  );
}
