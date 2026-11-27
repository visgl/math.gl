// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createTerrainMesh} from './mesh';
import {updateMeshRegions, type TerrainMeshRegions} from './mesh-regions-data';
import type {HeightField} from './height-field';
import type {TerrainGridMesh} from './mesh-data';
import type {TerrainDirtyWindow} from './dirty-regions';
export type TerrainRegularMeshRegions = TerrainMeshRegions<TerrainGridMesh>;
/** Dirty windows are inclusive source samples; report every changed height/validity. */
export function updateTerrainMeshRegions(
  previous: TerrainRegularMeshRegions | null,
  field: HeightField,
  dirty: readonly TerrainDirtyWindow[],
  options: {cellsPerRegion?: number; maxSamples?: number; maxTests?: number} = {}
): TerrainRegularMeshRegions {
  return updateMeshRegions(previous, field, dirty, options, 'regular', createTerrainMesh);
}
