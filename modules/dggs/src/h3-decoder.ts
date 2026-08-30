// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {cellToBoundary, cellToLatLng} from 'h3-js';
import {type Bounds2D} from '@math.gl/types';
import {type DGGSCell, type DGGSDecoder, getDGGSCellBounds} from './dggs-decoder';

/** Lightweight cell geometry decoder for the H3 hexagonal DGGS. */
export const H3Decoder = {
  name: 'h3',
  hasNumericRepresentation: true,
  cellColumnNames: [
    'h3',
    'h3Index',
    'h3_index',
    'h3Cell',
    'h3_cell',
    'h3CellId',
    'h3_cell_id',
    'hexagon'
  ],
  tokenToCell: (token: string): bigint => getBigIntFromHexToken(token),
  cellToToken: (cell: DGGSCell): string => getH3Token(cell),
  cellToLngLat: (cell: DGGSCell): [number, number] => getH3LngLat(cell),
  cellToBoundary: (cell: DGGSCell): [number, number][] => getH3Boundary(cell),
  cellToBoundaryFlat: (cell: DGGSCell): number[] => getH3Boundary(cell).flat(),
  cellToBounds: (cell: DGGSCell): Bounds2D => getDGGSCellBounds(getH3Boundary(cell))
} as const satisfies DGGSDecoder;

function getH3Token(cell: DGGSCell): string {
  return typeof cell === 'bigint' ? cell.toString(16) : removeHexPrefix(cell);
}

function getH3LngLat(cell: DGGSCell): [number, number] {
  const [latitude, longitude] = cellToLatLng(getH3Token(cell));
  return [longitude, latitude];
}

function getH3Boundary(cell: DGGSCell): [number, number][] {
  return cellToBoundary(getH3Token(cell), true).map(([longitude, latitude]) => [
    longitude,
    latitude
  ]);
}

function getBigIntFromHexToken(token: string): bigint {
  return BigInt(`0x${removeHexPrefix(token)}`);
}

function removeHexPrefix(token: string): string {
  return token.startsWith('0x') || token.startsWith('0X') ? token.slice(2) : token;
}
