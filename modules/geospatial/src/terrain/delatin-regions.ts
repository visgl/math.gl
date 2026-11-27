// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createDelatinTerrainMesh} from './delatin';
import {updateMeshRegions, type TerrainMeshRegions} from './mesh-regions-data';
import type {HeightField} from './height-field';
import type {AdaptiveTerrainMesh} from './adaptive-mesh-types';
import type {TerrainDirtyWindow} from './dirty-regions';
export type TerrainDelatinMeshRegions = TerrainMeshRegions<AdaptiveTerrainMesh | null>;
/** Missing regions return null. Independent adaptive boundaries require explicit
 * stitchTerrainMeshEdges before treating the regions as a conforming surface. */
export function updateTerrainDelatinMeshRegions(
  previous: TerrainDelatinMeshRegions | null,
  field: HeightField,
  dirty: readonly TerrainDirtyWindow[],
  options: {maxError: number; cellsPerRegion?: number; maxSamples?: number; maxTests?: number}
): TerrainDelatinMeshRegions {
  if (!Number.isFinite(options.maxError) || options.maxError < 0)
    throw new Error('Invalid Delatin region error');
  return updateMeshRegions(previous, field, dirty, options, `delatin:${options.maxError}`, f =>
    f.validCount !== f.width * f.height
      ? null
      : createDelatinTerrainMesh(f, {maxError: options.maxError})
  );
}
