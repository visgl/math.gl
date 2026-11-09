// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {HeightField} from './height-field';
import {
  createTerrainGradientGrid,
  type TerrainGradientGrid,
  type TerrainGradientMethod
} from './derivatives';
import type {TerrainMixedHaloSnapshot} from './mixed-halo-update';

export type TerrainMixedGradientSnapshot = {
  method: TerrainGradientMethod;
  tiles: {halo: TerrainMixedHaloSnapshot['tiles'][number]; grid: TerrainGradientGrid}[];
};
/** Reuses grids by immutable halo identity; changing method rebuilds every grid. */
export function updateTerrainMixedGradientGrids(
  previous: TerrainMixedGradientSnapshot | null,
  halos: TerrainMixedHaloSnapshot,
  options: {method?: TerrainGradientMethod; maxSamples?: number} = {}
): TerrainMixedGradientSnapshot {
  const method = options.method ?? 'horn';
  if (method !== 'horn' && method !== 'zevenbergen-thorne')
    throw new Error('Unknown terrain gradient method');
  const limit = options.maxSamples ?? 4_000_000;
  const count = halos.tiles.reduce((n, t) => n + t.field.width * t.field.height, 0);
  if (!Number.isSafeInteger(limit) || limit < 0 || !Number.isSafeInteger(count) || count > limit)
    throw new Error('Mixed gradient sample capacity exceeded');
  const cache = new Map(previous?.method === method ? previous.tiles.map(t => [t.halo, t]) : []);
  return {
    method,
    tiles: halos.tiles.map(
      halo =>
        cache.get(halo) ?? {
          halo,
          grid: createTerrainGradientGrid(new HeightField(halo.field), {method, maxSamples: limit})
        }
    )
  };
}
