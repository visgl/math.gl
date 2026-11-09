// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createTerrainMesh} from './mesh';
import {updateTerrainTileData, type TerrainFieldTile} from './tile-update-data';
import type {TerrainGridMesh} from './mesh-data';
export type TerrainMeshSnapshot = {source: TerrainFieldTile; data: TerrainGridMesh}[];
/** Rebuild edited regular-mesh patches; unchanged mesh buffers retain identity. */
export function updateTerrainMeshes(
  previous: TerrainMeshSnapshot | null,
  resident: readonly TerrainFieldTile[],
  options: {maxSamples?: number} = {}
): TerrainMeshSnapshot {
  return updateTerrainTileData(previous, resident, createTerrainMesh, options.maxSamples);
}
