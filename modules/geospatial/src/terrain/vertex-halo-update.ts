// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createTerrainVertexTileHalos, type TerrainVertexHaloTile} from './vertex-halos';
import {
  getTerrainVertexHaloAffectedTiles,
  type TerrainVertexTileAddress
} from './vertex-halo-invalidation';
import type {TerrainVertexTile, TerrainVertexTileOptions} from './vertex-tiles';

/** Update selected halo tiles using a complete post-update resident tile snapshot.
 * The caller must enumerate every arrival, replacement and eviction in `changed`.
 * Unaffected halo objects are shared with the previous snapshot and must be treated
 * as immutable. This function does not retain source buffers or mutate inputs.
 */
export function updateTerrainVertexTileHalos(
  previous: readonly TerrainVertexHaloTile[],
  resident: readonly TerrainVertexTile[],
  changed: readonly TerrainVertexTileAddress[],
  options: TerrainVertexTileOptions
): {
  tiles: TerrainVertexHaloTile[];
  rebuilt: TerrainVertexTileAddress[];
  removed: TerrainVertexTileAddress[];
} {
  const key = (t: TerrainVertexTileAddress): string => `${t.column},${t.row}`;
  const affected = getTerrainVertexHaloAffectedTiles(resident, changed, options);
  // Validate previous addresses and obtain an ordered, duplicate-free snapshot.
  getTerrainVertexHaloAffectedTiles(previous, [], options);
  const previousMap = new Map(previous.map(tile => [key(tile), tile]));
  const currentKeys = new Set(resident.map(key));
  const changedKeys = new Set(changed.map(key));
  for (const tile of resident) {
    if (!previousMap.has(key(tile)) && !changedKeys.has(key(tile)))
      throw new Error('Unreported vertex tile arrival');
  }
  const removed: TerrainVertexTileAddress[] = [];
  for (const tile of previous) {
    if (!currentKeys.has(key(tile))) {
      if (!changedKeys.has(key(tile))) throw new Error('Unreported vertex tile eviction');
      removed.push({column: tile.column, row: tile.row});
    }
  }
  removed.sort((a, b) => a.column - b.column || a.row - b.row);
  const affectedKeys = new Set(affected.map(key));
  const rx = options.width === 2 ? 2 : 1;
  const ry = options.height === 2 ? 2 : 1;
  const needed = new Set<string>();
  for (const tile of affected)
    for (let x = -rx; x <= rx; x++)
      for (let y = -ry; y <= ry; y++) {
        const column = tile.column + x,
          row = tile.row + y;
        if (Number.isSafeInteger(column) && Number.isSafeInteger(row))
          needed.add(`${column},${row}`);
      }
  const source = resident.filter(tile => needed.has(key(tile)));
  const rebuilt = createTerrainVertexTileHalos(source, options).tiles;
  const results = new Map(
    previous
      .filter(tile => currentKeys.has(key(tile)) && !affectedKeys.has(key(tile)))
      .map(tile => [key(tile), tile])
  );
  for (const tile of rebuilt) if (affectedKeys.has(key(tile))) results.set(key(tile), tile);
  if (results.size !== resident.length) throw new Error('Incomplete vertex halo update');
  return {
    tiles: [...results.values()].sort((a, b) => a.column - b.column || a.row - b.row),
    rebuilt: affected,
    removed
  };
}
