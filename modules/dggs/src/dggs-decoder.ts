// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Bounds2D} from '@math.gl/types';

/**
 * A deliberately small common API for decoding DGGS and DGGS-like cell tokens.
 * Decoder objects satisfy this interface so visualization code can use them interchangeably.
 */
export type DGGSDecoder = {
  /** The name of the DGGS */
  name: string;

  /** Conventional data column names that identify cells in this grid. */
  cellColumnNames: readonly string[];

  /** Convert a binary cell index to a token */
  getTokenFromCellIndex?: (index: bigint) => string;
  /** Convert a string token to a binary cell index */
  getCellIndexFromToken?: (token: string) => bigint;
  /** @returns the center of the cell */
  getCellLngLat: (cell: string) => number[];
  /** @returns the boundary of the cell, as an array of coordinate arrays */
  getCellBoundaryPolygon: (cell: string) => [number, number][];
  /** @returns the boundary of the cell, as a flat array */
  getCellBoundaryPolygonFlat: (cell: string) => number[];
  /** @returns the bounds of the cell, as a flat array */
  getCellBounds: (cell: string) => Bounds2D;
};

/** A cell column and the decoder selected for it. */
export type DGGSCellColumn = {
  columnName: string;
  decoder: DGGSDecoder;
};
