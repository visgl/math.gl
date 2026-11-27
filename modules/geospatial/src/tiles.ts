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
  validateTileMatrixSet,
  validateTileMatrixLimits,
  resolveTileIndex,
  isTileIndexInRange,
  getTileBounds,
  getTileIndex,
  getTileRange,
  getTileRanges,
  selectTileMatrix
} from './tile-matrix';
export type {
  TileMatrix,
  TileMatrixSet,
  TileMatrixLimits,
  TileMatrixSetLimits,
  TileMatrixBounds,
  VariableMatrixWidth,
  TileMatrixRowRange
} from './tile-matrix';
