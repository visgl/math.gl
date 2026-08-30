// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {cellToBoundary, cellToLonLat, hexToU64, u64ToHex} from 'a5-js';
import {type Bounds2D} from '@math.gl/types';
import {type DGGSCell, type DGGSDecoder, getDGGSCellBounds} from './dggs-decoder';

/** Lightweight cell geometry decoder for the A5 pentagonal DGGS. */
export const A5Decoder = {
  name: 'a5',
  hasNumericRepresentation: true,
  cellColumnNames: [
    'a5',
    'a5Token',
    'a5_token',
    'a5Cell',
    'a5_cell',
    'a5CellId',
    'a5_cell_id',
    'pentagon'
  ],
  tokenToCell: (token: string): bigint => hexToU64(removeHexPrefix(token)),
  cellToToken: (cell: DGGSCell): string =>
    typeof cell === 'string' ? removeHexPrefix(cell) : u64ToHex(cell),
  cellToLngLat: (cell: DGGSCell): [number, number] => cellToLonLat(getA5CellIndex(cell)),
  cellToBoundary: (cell: DGGSCell): [number, number][] => getA5Boundary(cell),
  cellToBoundaryFlat: (cell: DGGSCell): number[] => getA5Boundary(cell).flat(),
  cellToBounds: (cell: DGGSCell): Bounds2D => getDGGSCellBounds(getA5Boundary(cell))
} as const satisfies DGGSDecoder;

function getA5CellIndex(cell: DGGSCell): bigint {
  return typeof cell === 'bigint' ? cell : hexToU64(removeHexPrefix(cell));
}

function getA5Boundary(cell: DGGSCell): [number, number][] {
  return cellToBoundary(getA5CellIndex(cell)).map(([longitude, latitude]) => [longitude, latitude]);
}

function removeHexPrefix(token: string): string {
  return token.startsWith('0x') || token.startsWith('0X') ? token.slice(2) : token;
}
