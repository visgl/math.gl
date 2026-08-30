// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Bounds2D} from '@math.gl/types';

/** Cell identifiers used by the lightweight decoder API. */
export type DGGSCell = string | bigint;

/**
 * A deliberately small common API for decoding DGGS and DGGS-like cell tokens.
 * Decoder objects satisfy this interface so visualization code can use them interchangeably.
 */
export type DGGSDecoder = {
  /** The name of the DGGS */
  name: string;

  /** Whether cells have a 64-bit numeric representation. */
  hasNumericRepresentation: boolean;

  /** Conventional data column names that identify cells in this grid. */
  cellColumnNames: readonly string[];

  /** Convert a string token to a binary cell index. */
  tokenToCell?: (token: string) => bigint;
  /** Convert a cell to its string token. */
  cellToToken?: (cell: DGGSCell) => string;
  /** Return the center of the cell as `[longitude, latitude]`. */
  cellToLngLat: (cell: DGGSCell) => [number, number];
  /** Return the closed cell boundary as longitude/latitude pairs. */
  cellToBoundary: (cell: DGGSCell) => [number, number][];

  /** @returns the boundary of the cell, as a flat array */
  cellToBoundaryFlat: (cell: DGGSCell) => number[];
  /** @returns the longitude/latitude bounds of the cell */
  cellToBounds: (cell: DGGSCell) => Bounds2D;
};

/** A cell column and the decoder selected for it. */
export type DGGSCellColumn = {
  columnName: string;
  decoder: DGGSDecoder;
};

/** Require a string cell identifier for string-only grids. */
export function getDGGSCellToken(cell: DGGSCell, gridName: string): string {
  if (typeof cell !== 'string') {
    throw new Error(`${gridName} cell identifiers must be strings`);
  }
  return cell;
}

/** Calculate longitude/latitude bounds from a cell boundary. */
export function getDGGSCellBounds(boundary: [number, number][]): Bounds2D {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const [longitude, latitude] of boundary) {
    west = Math.min(west, longitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    north = Math.max(north, latitude);
  }

  return [
    [west, south],
    [east, north]
  ];
}
