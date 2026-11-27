// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type TerrainVertexTileAddress = {column: number; row: number};

/** Identify resident tiles whose one-vertex halo may change after tile updates.
 * Updates include arrivals, replacements and evictions; resident addresses describe
 * the snapshot after applying them. The result is deduplicated and sorted by column,
 * then row. A two-vertex tile can depend on tiles two addresses away because a
 * halo point is itself shared with the next tile. The result is conservative.
 */
export function getTerrainVertexHaloAffectedTiles(
  resident: readonly TerrainVertexTileAddress[],
  changed: readonly TerrainVertexTileAddress[],
  options: {width: number; height: number; maxTiles?: number}
): TerrainVertexTileAddress[] {
  const limit = options.maxTiles ?? 4096;
  if (
    !Number.isSafeInteger(limit) ||
    limit < 0 ||
    resident.length > limit ||
    changed.length > limit ||
    !Number.isSafeInteger(options.width) ||
    options.width < 2 ||
    !Number.isSafeInteger(options.height) ||
    options.height < 2
  )
    throw new Error('Invalid vertex halo tile capacity');
  const addresses = new Map<string, TerrainVertexTileAddress>();
  const key = (tile: TerrainVertexTileAddress): string => {
    if (!Number.isSafeInteger(tile.column) || !Number.isSafeInteger(tile.row))
      throw new Error('Invalid vertex tile address');
    return `${tile.column},${tile.row}`;
  };
  for (const tile of resident) {
    const id = key(tile);
    if (addresses.has(id)) throw new Error('Duplicate resident vertex tile address');
    addresses.set(id, {column: tile.column, row: tile.row});
  }
  const affected = new Map<string, TerrainVertexTileAddress>();
  for (const tile of changed) {
    key(tile);
    const rx = options.width === 2 ? 2 : 1,
      ry = options.height === 2 ? 2 : 1;
    for (let x = -rx; x <= rx; x++)
      for (let y = -ry; y <= ry; y++) {
        const column = tile.column + x,
          row = tile.row + y;
        if (!Number.isSafeInteger(column) || !Number.isSafeInteger(row)) continue;
        const id = `${column},${row}`;
        const target = addresses.get(id);
        if (target) affected.set(id, target);
      }
  }
  return [...affected.values()].sort((a, b) => a.column - b.column || a.row - b.row);
}
