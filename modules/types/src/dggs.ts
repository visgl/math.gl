// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Bounds2D} from './bounds-types';

/**
 * This type declares a "standardized" API for accessing basic DGGS token decoding
 * DGGS modules export objects that satisfy this "interface",
 * allowing different DGGS systems can be used interchangeably.
 */
export type DGGSDecoder = {
  /** The name of the DGGS */
  name: string;

  /** Convert a binary cell index to a token */
  getTokenFromCellIndex?: (index: bigint) => string;
  /** Convert a string token to a binary cell index */
  getCellIndexFromToken?: (token: string) => bigint;
  /** @returns the center of the cell */
  getCellLngLat: (geohash: string) => number[];
  /** @returns the boundary of the cell, as an array of coordinate arrays */
  getCellBoundaryPolygon: (geohash: string) => [number, number][];
  /** @returns the boundary of the cell, as a flat array */
  getCellBoundaryPolygonFlat: (geohash: string) => number[];
  /** @returns the bounds of the cell, as a flat array */
  getCellBounds: (geohash: string) => Bounds2D;
};
