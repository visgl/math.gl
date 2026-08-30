// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  GeohashDecoder,
  QuadkeyDecoder,
  S2Decoder,
  getS2ChildIndex,
  quadkeyToWorldBounds
} from '@math.gl/dggs';
import type {ExpressionFunctionLibrary} from './function-libraries';

/**
 * GeoHash functions ready to register with an expression evaluator.
 */
export const GEOHASH_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  getGeohashBoundary: GeohashDecoder.cellToBoundary,
  getGeohashBoundaryFlat: GeohashDecoder.cellToBoundaryFlat,
  getGeohashBounds: GeohashDecoder.cellToBounds,
  getGeohashLngLat: GeohashDecoder.cellToLngLat
};

/**
 * Quadkey functions ready to register with an expression evaluator.
 */
export const QUADKEY_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  getQuadkeyBoundary: QuadkeyDecoder.cellToBoundary,
  getQuadkeyBoundaryFlat: QuadkeyDecoder.cellToBoundaryFlat,
  getQuadkeyLngLat: QuadkeyDecoder.cellToLngLat,
  quadkeyToWorldBounds
};

/**
 * S2 functions ready to register with an expression evaluator.
 */
export const S2_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  getS2BoundaryFlat: S2Decoder.cellToBoundaryFlat,
  getS2ChildIndex,
  getS2IndexFromToken: S2Decoder.tokenToCell,
  getS2TokenFromIndex: S2Decoder.cellToToken
};

/**
 * Combined GeoHash, Quadkey, and S2 function table.
 */
export const DGGS_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  ...GEOHASH_FUNCTION_LIBRARY,
  ...QUADKEY_FUNCTION_LIBRARY,
  ...S2_FUNCTION_LIBRARY
};
