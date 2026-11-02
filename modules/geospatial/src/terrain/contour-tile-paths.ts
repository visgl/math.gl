// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  weldTerrainContourTiles,
  type TerrainContourTile,
  type TerrainContourTileWeldOptions
} from './contour-tile-weld';
import {stitchTerrainContours, type TerrainContourPaths} from './contour-paths';

/** Weld a same-level tile snapshot and trace its maximal contour paths.
 * Missing tiles and source gaps remain open. This does not simplify paths.
 */
export function stitchTerrainContourTiles(
  tiles: readonly TerrainContourTile[],
  options: TerrainContourTileWeldOptions
): TerrainContourPaths {
  return stitchTerrainContours(weldTerrainContourTiles(tiles, options), options);
}
