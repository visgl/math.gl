// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {HeightField} from './height-field';
import {createTerrainIsobands} from './isobands';
import {reconcileMixedSurface, type TerrainMixedSurfaceOptions} from './mixed-surface';
import type {TerrainMixedVertexTile} from './mixed-vertex-halos';
/** Polygonize a bounded conforming subdivision of dyadic mixed-resolution fields.
 * Interiors retain their triangle surface; shared edges use coarsest incident ownership.
 * Adjustment defaults to zero; explicitly budget any intended seam reconciliation. */
export function createTerrainMixedIsobands(
  tiles: readonly TerrainMixedVertexTile[],
  levels: readonly number[],
  options: TerrainMixedSurfaceOptions & Parameters<typeof createTerrainIsobands>[2] = {}
) {
  const maxLevels = options.maxLevels ?? 256;
  if (
    !Number.isSafeInteger(maxLevels) ||
    maxLevels < 2 ||
    levels.length < 2 ||
    levels.length > maxLevels ||
    levels.some((v, i) => !Number.isFinite(v) || (i > 0 && v <= levels[i - 1]))
  )
    throw new Error('Invalid mixed isoband levels or capacity');
  const triangles = tiles.reduce(
    (n, t) => n + 2 * (t.field.width - 1) * (t.field.height - 1) * t.spacing * t.spacing,
    0
  );
  const maxTriangles = options.maxTriangles ?? 2_000_000;
  if (
    !Number.isSafeInteger(triangles) ||
    !Number.isSafeInteger(maxTriangles) ||
    maxTriangles < 0 ||
    triangles > maxTriangles
  )
    throw new Error('Mixed isoband triangle capacity exceeded');
  const maxTests = options.maxTests ?? 20_000_000;
  const surface = reconcileMixedSurface(tiles, {...options, maxTests});
  const bands = createTerrainIsobands(
    surface.tiles.map(t => new HeightField(t.field)),
    levels,
    {...options, maxTests: maxTests - surface.tests}
  );
  return {
    ...bands,
    maxHeightAdjustment: surface.maxHeightAdjustment,
    sharedSamples: surface.sharedSamples
  };
}
