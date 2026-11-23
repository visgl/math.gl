// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type DGGSCell, type DGGSCellColumn, type DGGSDecoder} from './dggs-decoder';
// Reuse the published decoder classes so bundled CommonJS entry points share their identity.
import {A5Decoder} from '@math.gl/dggs/a5';
import {GeohashDecoder} from '@math.gl/dggs/geohash';
import {H3Decoder} from '@math.gl/dggs/h3';
import {PlusCodeDecoder} from '@math.gl/dggs/plus-code';
import {QuadkeyDecoder} from '@math.gl/dggs/quadkey';
import {S2Decoder} from '@math.gl/dggs/s2';

export {type DGGSBoundaryOptions} from './dggs-decoder';
export {type DGGSCell, type DGGSCellColumn, type DGGSDecoder};
export {unwrapDGGSBoundary} from './unwrap-dggs-boundary';
/** Lightweight decoders bundled with this module. */
export const DGGS_DECODERS: readonly DGGSDecoder[] = [
  A5Decoder,
  GeohashDecoder,
  H3Decoder,
  PlusCodeDecoder,
  QuadkeyDecoder,
  S2Decoder
];

/**
 * Finds a conventional DGGS cell column by name.
 *
 * Returns `null` when there is no match or when columns from more than one
 * decoder match. Callers should ask the user to choose in the ambiguous case.
 */
export function findDGGSCellColumn(
  columnNames: Iterable<string>,
  decoders: readonly DGGSDecoder[] = DGGS_DECODERS
): DGGSCellColumn | null {
  const actualNames = new Map<string, string>();
  for (const columnName of columnNames) {
    actualNames.set(columnName.toLowerCase(), columnName);
  }

  let match: DGGSCellColumn | null = null;
  for (const decoder of decoders) {
    for (const candidate of decoder.cellColumnNames) {
      const columnName = actualNames.get(candidate.toLowerCase());
      if (!columnName) {
        continue;
      }
      if (match && (match.decoder !== decoder || match.columnName !== columnName)) {
        return null;
      }
      match = {columnName, decoder};
    }
  }
  return match;
}
export {
  GEOHASH_FUNCTION_LIBRARY,
  QUADKEY_FUNCTION_LIBRARY,
  S2_FUNCTION_LIBRARY,
  DGGS_FUNCTION_LIBRARY
} from './expressions';
