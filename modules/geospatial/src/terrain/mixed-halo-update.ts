// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createTerrainBoxIndex, type TerrainBox} from './box-index';
import {
  buildMixedVertexTileHalos,
  type TerrainMixedVertexTile,
  type MixedHaloPreparation
} from './mixed-vertex-halos';

export type TerrainMixedHaloSnapshot = {
  /** Immutable source descriptors and buffers; replace the descriptor after every edit. */
  sources: readonly TerrainMixedVertexTile[];
  tiles: ReturnType<typeof buildMixedVertexTileHalos>['tiles'];
};
const key = (t: Pick<TerrainMixedVertexTile, 'spacing' | 'column' | 'row'>) =>
  `${t.spacing}/${t.column}/${t.row}`;

const bounds = (tile: TerrainMixedVertexTile, padding = 0): TerrainBox => ({
  minX: tile.column - padding,
  minY: tile.row - padding,
  maxX: tile.column + (tile.field.width - 1) * tile.spacing + padding,
  maxY: tile.row + (tile.field.height - 1) * tile.spacing + padding
});

const preparations = new WeakMap<TerrainMixedHaloSnapshot, MixedHaloPreparation>();

const targetIndexes = new WeakMap<
  TerrainMixedHaloSnapshot,
  ReturnType<typeof createTerrainBoxIndex>
>();

// Each changed vertex can influence only the cells incident to that vertex.
function editedBounds(
  old: TerrainMixedVertexTile,
  next: TerrainMixedVertexTile
): TerrainBox | null {
  const a = old.field;
  const b = next.field;
  if (
    a.width !== b.width ||
    a.height !== b.height ||
    (a.diagonal ?? '00-11') !== (b.diagonal ?? '00-11')
  )
    return bounds(next);
  const sample = (field: TerrainMixedVertexTile['field'], x: number, y: number) => {
    const i = (field.offset ?? 0) + y * (field.stride ?? field.width) + x;
    const z = field.heights[i];
    return Number.isFinite(z) && (field.validity === undefined || field.validity[i] !== 0)
      ? z
      : undefined;
  };
  let left = b.width,
    right = -1,
    top = b.height,
    bottom = -1;
  for (let y = 0; y < b.height; y++) {
    for (let x = 0; x < b.width; x++) {
      if (Object.is(sample(a, x, y), sample(b, x, y))) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < 0) return null;
  return {
    minX: next.column + Math.max(0, left - 1) * next.spacing,
    maxX: next.column + Math.min(b.width - 1, right + 1) * next.spacing,
    minY: next.row + Math.max(0, top - 1) * next.spacing,
    maxY: next.row + Math.min(b.height - 1, bottom + 1) * next.spacing
  };
}

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
  const cached = new Map(previous?.tiles.map(t => [key(t), t]));
  const targets = new Set<string>();
  const unchangedLayout =
    previous?.sources.length === resident.length &&
    resident.every((tile, i) => {
      const prior = previous.sources[i];
      return (
        key(prior) === key(tile) &&
        prior.field.width === tile.field.width &&
        prior.field.height === tile.field.height
      );
    });
  let index = unchangedLayout && previous ? targetIndexes.get(previous) : undefined;
  let tests = 0;
  const charge = () => {
    if (++tests > budget) throw new Error('Mixed halo dependency budget exceeded');
  };
  function invalidate(box: TerrainBox): void {
    index ??= createTerrainBoxIndex(resident.map(tile => bounds(tile, tile.spacing)));
    for (const id of index(box, charge)) targets.add(key(resident[id]));
  }
  for (const tile of resident) {
    const address = key(tile);
    const prior = old.get(address);
    if (!cached.has(address) || prior !== tile) targets.add(address);
    if (prior === tile || !previous) continue;
    if (!prior) {
      invalidate(bounds(tile));
    } else if (prior.field.width !== tile.field.width || prior.field.height !== tile.field.height) {
      invalidate(bounds(prior));
      invalidate(bounds(tile));
    } else {
      const dirty = editedBounds(prior, tile);
      if (dirty) invalidate(dirty);
    }
  }
  for (const [address, tile] of old) {
    if (!current.has(address) && resident.length) invalidate(bounds(tile));
  }
  const priorPreparation = previous && preparations.get(previous);
  const preparation: MixedHaloPreparation = {
    fields: priorPreparation?.fields ?? new WeakMap(),
    layout: priorPreparation?.layout
  };
  const built = buildMixedVertexTileHalos(resident, options, targets, preparation).tiles;
  for (const tile of built) cached.set(key(tile), tile);
  const tiles = resident
    .map(t => cached.get(key(t))!)
    .sort((a, b) => a.spacing - b.spacing || a.column - b.column || a.row - b.row);
  const snapshot = {
    sources: resident.slice(),
    tiles,
    rebuilt: built.map(key),
    removed: [...old.keys()].filter(k => !current.has(k)).sort()
  };
  preparations.set(snapshot, preparation);
  if (index) targetIndexes.set(snapshot, index);
  return snapshot;
}
