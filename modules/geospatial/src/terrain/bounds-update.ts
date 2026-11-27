// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {HeightFieldMinMax} from './bounds';
import {updateTerrainTileData, type TerrainFieldTile} from './tile-update-data';
export type TerrainBoundsSnapshot = {source: TerrainFieldTile; data: HeightFieldMinMax}[];
/** Rebuild conservative corner bounds only for edited patches; extrema are never averaged. */
export function updateTerrainBounds(
  previous: TerrainBoundsSnapshot | null,
  resident: readonly TerrainFieldTile[],
  options: {maxSamples?: number} = {}
): TerrainBoundsSnapshot {
  return updateTerrainTileData(
    previous,
    resident,
    f => new HeightFieldMinMax(f),
    options.maxSamples
  );
}
