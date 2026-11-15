// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  prepareTerrainLodScreenError,
  type TerrainLodErrorBounds,
  type TerrainLodProjection
} from './lod-screen-error';

/** Cartesian coordinate triple. */
type XYZ = readonly [number, number, number];

/** A tile and its error bound in the selector's Cartesian frame. */
export type TerrainLodCandidate = TerrainLodErrorBounds & {
  /** Unique tile identifier within the tree. */
  id: string;
  /** Whether this tile is available to render. */
  resident: boolean;
  /** Children must completely partition the parent terrain footprint. */
  children?: readonly TerrainLodCandidate[];
};

/** Controls shared by both LOD selection modes. */
type TerrainLodSelectionOptions = {
  /** Maximum desired pixel error. */
  targetPixels: number;
  /** Fractional threshold reduction for previously refined tiles. */
  hysteresis?: number;
  /** Tile IDs that refined in the previous selection. */
  previouslyRefined?: ReadonlySet<string>;
  /** Maximum number of candidates visited during selection. */
  maxVisited?: number;
};

/** Camera parameters for the distance-based pixel estimate. */
export type TerrainLodView = TerrainLodSelectionOptions & {
  /** Camera position in the same frame as tile bounds. */
  position: XYZ;
  /** Vertical field of view in radians. */
  verticalFov: number;
  /** Viewport height in pixels. */
  viewportHeight: number;
};

/** View using a conservative projection bound for LOD selection. */
export type TerrainLodCertifiedView = TerrainLodSelectionOptions & {
  /** Cartesian-to-clip transform and viewport. */
  projection: TerrainLodProjection;
};

/** Select a resident cut using perspective screen-space error and complete child fallback. */
export function selectTerrainLod(
  roots: readonly TerrainLodCandidate[],
  view: TerrainLodView | TerrainLodCertifiedView
) {
  const {targetPixels, hysteresis = 0.2, previouslyRefined, maxVisited = 100_000} = view;
  if (
    !Number.isFinite(targetPixels) ||
    targetPixels <= 0 ||
    !(hysteresis >= 0 && hysteresis < 1) ||
    !Number.isSafeInteger(maxVisited) ||
    maxVisited < 1
  )
    throw new Error('Invalid terrain LOD view');
  const pixelError =
    'projection' in view
      ? prepareTerrainLodScreenError(view.projection)
      : createDistanceEstimator(view.position, view.verticalFov, view.viewportHeight);
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
      tile.min.length !== 3 ||
      tile.max.length !== 3 ||
      ![...tile.min, ...tile.max, tile.geometricError].every(Number.isFinite) ||
      tile.geometricError < 0 ||
      tile.min.some((n, i) => n > tile.max[i])
    )
      throw new Error('Invalid terrain LOD tile bounds or error');
    if (!tile.resident) {
      unavailable.push(tile.id);
      continue;
    }
    const pixels = pixelError(tile);
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

/** Prepare the legacy distance-based pixel estimate. */
function createDistanceEstimator(position: XYZ, verticalFov: number, viewportHeight: number) {
  if (
    !position.every(Number.isFinite) ||
    !Number.isFinite(verticalFov) ||
    verticalFov <= 0 ||
    verticalFov >= Math.PI ||
    !Number.isFinite(viewportHeight) ||
    viewportHeight <= 0
  )
    throw new Error('Invalid terrain LOD view');
  const scale = viewportHeight / (2 * Math.tan(verticalFov / 2));
  if (!Number.isFinite(scale)) throw new Error('Terrain LOD projection scale overflow');
  return (tile: TerrainLodCandidate) => {
    const distance = Math.hypot(
      ...position.map((n, i) => Math.max(tile.min[i] - n, n - tile.max[i], 0))
    );
    return tile.geometricError === 0 ? 0 : (tile.geometricError / distance) * scale;
  };
}
