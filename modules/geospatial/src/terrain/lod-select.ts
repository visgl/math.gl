// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

type XYZ = readonly [number, number, number];

export type TerrainLodCandidate = {
  id: string;
  min: XYZ;
  max: XYZ;
  /** World-space geometric error for this tile. */
  geometricError: number;
  resident: boolean;
  /** Children must completely partition the parent terrain footprint. */
  children?: readonly TerrainLodCandidate[];
};

export type TerrainLodView = {
  position: XYZ;
  verticalFov: number;
  viewportHeight: number;
  targetPixels: number;
  /** Fractional threshold reduction for previously refined tiles. */
  hysteresis?: number;
  previouslyRefined?: ReadonlySet<string>;
  maxVisited?: number;
};

/** Select a resident cut using perspective screen-space error and complete child fallback. */
export function selectTerrainLod(roots: readonly TerrainLodCandidate[], view: TerrainLodView) {
  const {
    position,
    verticalFov,
    viewportHeight,
    targetPixels,
    hysteresis = 0.2,
    previouslyRefined,
    maxVisited = 100_000
  } = view;
  if (
    !position.every(Number.isFinite) ||
    !Number.isFinite(verticalFov) ||
    verticalFov <= 0 ||
    verticalFov >= Math.PI ||
    !Number.isFinite(viewportHeight) ||
    viewportHeight <= 0 ||
    !Number.isFinite(targetPixels) ||
    targetPixels <= 0 ||
    !(hysteresis >= 0 && hysteresis < 1) ||
    !Number.isSafeInteger(maxVisited) ||
    maxVisited < 1
  )
    throw new Error('Invalid terrain LOD view');
  const scale = viewportHeight / (2 * Math.tan(verticalFov / 2));
  if (!Number.isFinite(scale)) throw new Error('Terrain LOD projection scale overflow');
  const selected: {tile: TerrainLodCandidate; pixels: number}[] = [];
  const refined = new Set<string>();
  const unavailable: string[] = [];
  const seen = new Set<string>();
  const pending = [...roots].reverse();
  while (pending.length) {
    const tile = pending.pop()!;
    if (seen.size >= maxVisited) throw new Error('Terrain LOD visit limit exceeded');
    if (seen.has(tile.id)) throw new Error('Duplicate terrain LOD tile or cycle');
    seen.add(tile.id);
    if (
      ![...tile.min, ...tile.max, tile.geometricError].every(Number.isFinite) ||
      tile.geometricError < 0 ||
      tile.min.some((n, i) => n > tile.max[i])
    )
      throw new Error('Invalid terrain LOD tile bounds or error');
    if (!tile.resident) {
      unavailable.push(tile.id);
      continue;
    }
    const distance = Math.hypot(
      ...position.map((n, i) => Math.max(tile.min[i] - n, n - tile.max[i], 0))
    );
    const pixels = tile.geometricError === 0 ? 0 : (tile.geometricError / distance) * scale;
    const threshold = targetPixels * (previouslyRefined?.has(tile.id) ? 1 - hysteresis : 1);
    if (
      pixels > threshold &&
      tile.children?.length &&
      tile.children.every(child => child.resident)
    ) {
      if (pending.length + seen.size + tile.children.length > maxVisited)
        throw new Error('Terrain LOD visit limit exceeded');
      refined.add(tile.id);
      for (let i = tile.children.length - 1; i >= 0; i--) pending.push(tile.children[i]);
    } else {
      selected.push({tile, pixels});
    }
  }
  return {selected, refined, unavailable};
}
