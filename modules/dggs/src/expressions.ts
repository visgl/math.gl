// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */

import {GeohashDecoder} from './geohash-decoder';
import {QuadkeyDecoder, quadkeyToWorldBounds} from './quadkey-decoder';
import {S2Decoder} from './s2-decoder';
import {getS2ChildIndex} from './s2-geometry/s2-token';
type ExpressionFunctionLibrary = Record<string, (...args: any[]) => any>;

export const GEOHASH_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  getGeohashBoundary: GeohashDecoder.cellToBoundary,
  getGeohashBoundaryFlat: GeohashDecoder.cellToBoundaryFlat,
  getGeohashBounds: GeohashDecoder.cellToBounds,
  getGeohashLngLat: GeohashDecoder.cellToLngLat
};

export const QUADKEY_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  getQuadkeyBoundary: QuadkeyDecoder.cellToBoundary,
  getQuadkeyBoundaryFlat: QuadkeyDecoder.cellToBoundaryFlat,
  getQuadkeyLngLat: QuadkeyDecoder.cellToLngLat,
  quadkeyToWorldBounds
};

export const S2_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  getS2BoundaryFlat: S2Decoder.cellToBoundaryFlat,
  getS2ChildIndex,
  getS2IndexFromToken: S2Decoder.tokenToCell,
  getS2TokenFromIndex: S2Decoder.cellToToken
};

export const DGGS_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  ...GEOHASH_FUNCTION_LIBRARY,
  ...QUADKEY_FUNCTION_LIBRARY,
  ...S2_FUNCTION_LIBRARY
};
