// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  type DGGSBoundaryOptions,
  type DGGSCell,
  type DGGSCellColumn,
  type DGGSDecoder,
  unwrapDGGSBoundary,
  DGGS_DECODERS,
  findDGGSCellColumn
} from './decoders';
export {A5Decoder} from './a5-decoder';
export {GeohashDecoder} from './geohash-decoder';
export {H3Decoder} from './h3-decoder';
export {PlusCodeDecoder} from './plus-code-decoder';
export {QuadkeyDecoder, quadkeyToWorldBounds} from './quadkey-decoder';
export {S2Decoder, getS2Bounds, getS2LngLat, getS2BoundaryFlat} from './s2-decoder';
export {
  getS2ChildIndex,
  getS2IndexFromToken,
  getS2Level,
  getS2TokenFromIndex,
  isS2IndexValid,
  isS2TokenValid
} from './s2-geometry/s2-token';
export {getS2DescendantIndex, getS2IndexFromCell} from './s2-geometry/s2-geometry';
export type {S2Cell} from './s2-geometry/s2-geometry';

// Public named exports. Implementations remain in independently tree-shakable files.
export {getGeohashBounds} from './geohash';
export {
  GEOHASH_FUNCTION_LIBRARY,
  QUADKEY_FUNCTION_LIBRARY,
  S2_FUNCTION_LIBRARY,
  DGGS_FUNCTION_LIBRARY
} from './expressions';
