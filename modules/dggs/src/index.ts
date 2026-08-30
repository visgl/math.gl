// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type DGGSCellColumn, type DGGSDecoder} from './dggs-decoder';
import {GeohashDecoder} from './geohash-decoder';
import {QuadkeyDecoder} from './quadkey-decoder';
import {S2Decoder} from './s2-decoder';

export {type DGGSCellColumn, type DGGSDecoder};
export {GeohashDecoder};
export {QuadkeyDecoder, quadkeyToWorldBounds} from './quadkey-decoder';
export {S2Decoder};
export {getS2ChildIndex} from './s2-geometry/s2-token';

/** Lightweight decoders bundled with this module. */
export const DGGS_DECODERS: readonly DGGSDecoder[] = [GeohashDecoder, QuadkeyDecoder, S2Decoder];

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
