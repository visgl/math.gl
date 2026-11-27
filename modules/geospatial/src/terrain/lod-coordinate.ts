// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {evaluateTerrainLodMorph} from './lod-morph-evaluate';
import {
  reconcileMixedSurface,
  type TerrainMixedSurfaceOptions,
  type TerrainMixedSurface
} from './mixed-surface';
import type {TerrainLodMorph} from './lod-morph';
export type TerrainLodTile = {
  column: number;
  row: number;
  spacing: number;
  morph: TerrainLodMorph;
  factor: number;
};
/** Coordinate independent tile morph factors on a conforming finest-lattice
 * transition tessellation. Coarsest incident tile owns shared edges/corners at its
 * requested factor. Interior factors remain independent. Missing incident support
 * masks the seam. This bounded CPU reference intentionally densifies coarse tiles. */
export function coordinateTerrainLodMorphs(
  tiles: readonly TerrainLodTile[],
  options: TerrainMixedSurfaceOptions = {}
): TerrainMixedSurface {
  const limit = options.maxSamples ?? 4_000_000;
  if (!Number.isSafeInteger(limit) || limit < 0)
    throw new Error('Invalid coordinated morph sample capacity');
  let count = 0;
  for (const t of tiles) {
    count += t.morph.width * t.morph.height;
    if (!Number.isSafeInteger(count) || count > limit)
      throw new Error('Coordinated morph sample capacity exceeded');
  }
  return reconcileMixedSurface(
    tiles.map(t => {
      const evaluated = evaluateTerrainLodMorph(t.morph, t.factor);
      return {
        column: t.column,
        row: t.row,
        spacing: t.spacing,
        field: {
          ...evaluated,
          width: t.morph.width,
          height: t.morph.height,
          origin: t.morph.origin,
          columnStep: t.morph.columnStep,
          rowStep: t.morph.rowStep,
          registration: 'vertex' as const,
          diagonal: t.morph.diagonal,
          heightReference: t.morph.heightReference
        }
      };
    }),
    {...options, maxHeightAdjustment: options.maxHeightAdjustment ?? Infinity}
  );
}
