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
 * Pass the options used for the previous snapshot; changes to its grid transform,
 * dimensions, height reference or reconciliation tolerance require a full rebuild.
 */
export function updateTerrainVertexTileHalos(
  previous: readonly TerrainVertexHaloTile[],
  resident: readonly TerrainVertexTile[],
  changed: readonly TerrainVertexTileAddress[],
  options: TerrainVertexTileOptions & {previousOptions: TerrainVertexTileOptions}
): {
  tiles: TerrainVertexHaloTile[];
  rebuilt: TerrainVertexTileAddress[];
  removed: TerrainVertexTileAddress[];
} {
  const prior = options.previousOptions;
  if (!prior) throw new Error('Previous vertex tile options are required');
  const paddedCount = (options.width + 2) * (options.height + 2) * resident.length;
  if (!Number.isSafeInteger(paddedCount) || paddedCount > (options.maxSamples ?? 4_000_000))
    throw new Error('Vertex tile halo sample capacity exceeded');
  const equalPair = (a: readonly [number, number], b: readonly [number, number]): boolean =>
    a[0] === b[0] && a[1] === b[1];
  if (
    prior.width !== options.width ||
    prior.height !== options.height ||
    !equalPair(prior.origin ?? [0, 0], options.origin ?? [0, 0]) ||
    !equalPair(prior.columnStep ?? [1, 0], options.columnStep ?? [1, 0]) ||
    !equalPair(prior.rowStep ?? [0, 1], options.rowStep ?? [0, 1]) ||
    (prior.heightReference ?? 'unknown') !== (options.heightReference ?? 'unknown') ||
    (prior.maxHeightDifference ?? 0) !== (options.maxHeightDifference ?? 0)
  )
    throw new Error('Vertex tile options changed; rebuild the full snapshot');
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
