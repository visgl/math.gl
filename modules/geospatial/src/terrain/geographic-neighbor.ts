// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getGeographicTileBounds, type GeographicTile} from '../geographic-tiles';

export type TerrainGeographicEdge = 'west' | 'east' | 'north' | 'south';

/** Describe a same-level equal-angle seam in canonical order. */
export type TerrainGeographicNeighbor = {
  owner: GeographicTile;
  ownerEdge: 'west' | 'north';
  other: GeographicTile;
  otherEdge: 'east' | 'south';
  crossesAntimeridian: boolean;
};

/**
 * Discover the seam adjoining a tile edge. The tile whose west or north edge
 * touches the seam owns it, including the westernmost tile at the antimeridian.
 * Polar edges have no edge-adjacent tile. A level-zero tile can adjoin itself
 * across longitude, with distinct west and east edges.
 */
export function getGeographicTerrainNeighbor(
  tile: GeographicTile,
  edge: TerrainGeographicEdge
): TerrainGeographicNeighbor | null {
  getGeographicTileBounds(tile);
  const {x, y, level} = tile;
  const size = 2 ** level;
  switch (edge) {
    case 'west':
    case 'east': {
      const ownerX = edge === 'west' ? x : (x + 1) % size;
      return {
        owner: {x: ownerX, y, level},
        ownerEdge: 'west',
        other: {x: (ownerX + size - 1) % size, y, level},
        otherEdge: 'east',
        crossesAntimeridian: ownerX === 0
      };
    }
    case 'north':
    case 'south': {
      const ownerY = edge === 'north' ? y : y + 1;
      if (ownerY === 0 || ownerY === size) return null;
      return {
        owner: {x, y: ownerY, level},
        ownerEdge: 'north',
        other: {x, y: ownerY - 1, level},
        otherEdge: 'south',
        crossesAntimeridian: false
      };
    }
    default:
      throw new RangeError('Invalid geographic terrain edge');
  }
}
