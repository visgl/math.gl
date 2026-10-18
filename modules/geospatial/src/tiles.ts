// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  getGeographicTile,
  getGeographicTileBounds,
  getGeographicTileRanges
} from './geographic-tiles';
export type {GeographicTile, GeographicTileRange} from './geographic-tiles';

export {
  validateTileMatrix,
  isTileIndexInRange,
  getTileBounds,
  getTileIndex,
  getTileRange,
  selectTileMatrix
} from './tile-matrix';
export type {TileMatrix, TileMatrixSet, TileMatrixLimits, TileMatrixBounds} from './tile-matrix';
