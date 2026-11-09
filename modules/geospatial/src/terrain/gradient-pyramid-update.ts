// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createTerrainGradientPyramid, type TerrainGradientPyramid} from './gradient-pyramid';
import type {TerrainMixedGradientSnapshot} from './mixed-gradient-update';
export type TerrainGradientPyramidSnapshot = {
  source: TerrainMixedGradientSnapshot['tiles'][number];
  data: TerrainGradientPyramid;
}[];
/** Rebuild derivative hierarchies only when the immutable source grid changes. */
export function updateTerrainGradientPyramids(
  previous: TerrainGradientPyramidSnapshot | null,
  gradients: TerrainMixedGradientSnapshot,
  options: {maxSamples?: number} = {}
): TerrainGradientPyramidSnapshot {
  const limit = options.maxSamples ?? 4_000_000;
  const count = gradients.tiles.reduce((n, t) => n + t.grid.width * t.grid.height, 0);
  if (!Number.isSafeInteger(limit) || limit < 0 || !Number.isSafeInteger(count) || count > limit)
    throw new Error('Gradient pyramid update sample capacity exceeded');
  const cached = new Map(previous?.map(t => [t.source.grid, t.data]));
  return gradients.tiles.map(source => ({
    source,
    data: cached.get(source.grid) ?? createTerrainGradientPyramid(source.grid, {maxSamples: limit})
  }));
}
