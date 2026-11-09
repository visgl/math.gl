// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {buildMixedVertexTileHalos, type TerrainMixedVertexTile} from './mixed-vertex-halos';

export type TerrainMixedHaloSnapshot = {
  /** Immutable source descriptors and buffers; replace the descriptor after every edit. */
  sources: readonly TerrainMixedVertexTile[];
  tiles: ReturnType<typeof buildMixedVertexTileHalos>['tiles'];
};
const key = (t: Pick<TerrainMixedVertexTile, 'spacing' | 'column' | 'row'>) =>
  `${t.spacing}/${t.column}/${t.row}`;

/** Conservative dependencies include old and new coverage, corners and overlap ownership. */
export function updateTerrainMixedVertexTileHalos(
  previous: TerrainMixedHaloSnapshot | null,
  resident: readonly TerrainMixedVertexTile[],
  options: {maxSamples?: number; maxTileTests?: number; maxDependencyTests?: number} = {}
): TerrainMixedHaloSnapshot & {rebuilt: string[]; removed: string[]} {
  const budget = options.maxDependencyTests ?? 10_000_000;
  if (!Number.isSafeInteger(budget) || budget < 0)
    throw new Error('Invalid mixed halo dependency budget');
  const old = new Map(previous?.sources.map(t => [key(t), t]));
  const current = new Map(resident.map(t => [key(t), t]));
  const changed = [...old.values()]
    .filter(t => current.get(key(t)) !== t)
    .concat(resident.filter(t => old.get(key(t)) !== t));
  const cached = new Map(previous?.tiles.map(t => [key(t), t]));
  const targets = new Set<string>();
  let tests = 0;
  for (const tile of resident) {
    if (!cached.has(key(tile))) targets.add(key(tile));
    for (const source of changed) {
      if (++tests > budget) throw new Error('Mixed halo dependency budget exceeded');
      // Inclusive rectangles: canonical ownership can change on a shared edge or corner.
      if (
        tile.column - tile.spacing <= source.column + (source.field.width - 1) * source.spacing &&
        tile.column + tile.field.width * tile.spacing >= source.column &&
        tile.row - tile.spacing <= source.row + (source.field.height - 1) * source.spacing &&
        tile.row + tile.field.height * tile.spacing >= source.row
      )
        targets.add(key(tile));
    }
  }
  const built = buildMixedVertexTileHalos(resident, options, targets).tiles;
  for (const tile of built) cached.set(key(tile), tile);
  const tiles = resident
    .map(t => cached.get(key(t))!)
    .sort((a, b) => a.spacing - b.spacing || a.column - b.column || a.row - b.row);
  return {
    sources: resident.slice(),
    tiles,
    rebuilt: built.map(key),
    removed: [...old.keys()].filter(k => !current.has(k)).sort()
  };
}
