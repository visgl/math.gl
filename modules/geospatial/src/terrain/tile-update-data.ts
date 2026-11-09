// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {HeightField} from './height-field';
export type TerrainFieldTile = {id: string; field: HeightField};
/** Immutable tile-granular updates. Replace the field after any edit. */
export function updateTerrainTileData<T>(
  previous: readonly {source: TerrainFieldTile; data: T}[] | null,
  resident: readonly TerrainFieldTile[],
  create: (field: HeightField) => T,
  maxSamples = 4_000_000
): {source: TerrainFieldTile; data: T}[] {
  if (!Number.isSafeInteger(maxSamples) || maxSamples < 0)
    throw new Error('Invalid terrain update sample capacity');
  let count = 0;
  const ids = new Set<string>();
  for (const tile of resident) {
    if (typeof tile.id !== 'string' || ids.has(tile.id))
      throw new Error('Invalid or duplicate terrain update tile');
    ids.add(tile.id);
    count += tile.field.width * tile.field.height;
    if (!Number.isSafeInteger(count) || count > maxSamples)
      throw new Error('Terrain update sample capacity exceeded');
  }
  const cached = new Map(previous?.map(t => [t.source.id, t]));
  return resident.map(source => {
    const old = cached.get(source.id);
    return old?.source.field === source.field
      ? {source, data: old.data}
      : {source, data: create(source.field)};
  });
}
