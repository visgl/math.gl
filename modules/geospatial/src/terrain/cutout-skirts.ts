// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainCutout, TerrainCutoutPiece} from './mesh-cutout';
import {createTerrainSkirt, type TerrainSkirtMesh, type TerrainSkirtOptions} from './mesh-skirts';

/** Select wall height or a local base, without allowing arbitrary edge selection. */
type WallOptions = Pick<TerrainSkirtOptions, 'maxVertices' | 'maxTriangles'> &
  ({height: number; baseZ?: never} | {baseZ: number; height?: never});

/** Lift and wall settings for a terrain split. */
export type TerrainCutoutSkirtOptions = {
  /** Amount added to the patch's local Z coordinates. Defaults to zero. */
  lift?: number;
  /** Wall options for the lifted patch. */
  patch: WallOptions;
  /** Wall options for the unchanged remainder. */
  remainder: WallOptions;
};

/** Raised and stationary surfaces with optional visual skirts. */
export type SkirtedTerrainCutout = {
  patch: {surface: TerrainCutoutPiece; skirt?: TerrainSkirtMesh};
  remainder: {surface: TerrainCutoutPiece; skirt?: TerrainSkirtMesh};
};

/** Translate the patch and build both walls from the paired cut edges only. */
export function createTerrainCutoutSkirts(
  cutout: TerrainCutout,
  {lift = 0, patch, remainder}: TerrainCutoutSkirtOptions
): SkirtedTerrainCutout {
  if (!Number.isFinite(lift)) throw new RangeError('Invalid terrain cutout lift');
  const positions = cutout.patch.positions.slice();
  for (let i = 2; i < positions.length; i += 3) {
    positions[i] += lift;
    if (!Number.isFinite(positions[i])) throw new RangeError('Terrain cutout lift overflow');
  }
  return {
    patch: skirtPiece({...cutout.patch, positions}, patch),
    remainder: skirtPiece(cutout.remainder, remainder)
  };
}

/** Compose on a nonempty paired boundary only. */
function skirtPiece(surface: TerrainCutoutPiece, options: WallOptions) {
  if (!surface.cutEdges.length) return {surface};
  return {
    surface,
    skirt: createTerrainSkirt(surface, {...options, edges: surface.cutEdges})
  };
}
