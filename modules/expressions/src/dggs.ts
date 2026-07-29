// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getGeohashBoundary,
  getGeohashBoundaryFlat,
  getGeohashBounds,
  getGeohashLngLat
} from '@math.gl/dggs-geohash';
import {
  getQuadkeyBoundary,
  getQuadkeyBoundaryFlat,
  getQuadkeyLngLat,
  quadkeyToWorldBounds
} from '@math.gl/dggs-quadkey';
import {
  getS2BoundaryFlat,
  getS2ChildIndex,
  getS2IndexFromToken,
  getS2TokenFromIndex
} from '@math.gl/dggs-s2';
import type {ExpressionFunctionLibrary} from './function-libraries';

/**
 * GeoHash functions ready to register with an expression evaluator.
 */
export const GEOHASH_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  getGeohashBoundary,
  getGeohashBoundaryFlat,
  getGeohashBounds,
  getGeohashLngLat
};

/**
 * Quadkey functions ready to register with an expression evaluator.
 */
export const QUADKEY_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  getQuadkeyBoundary,
  getQuadkeyBoundaryFlat,
  getQuadkeyLngLat,
  quadkeyToWorldBounds
};

/**
 * S2 functions ready to register with an expression evaluator.
 */
export const S2_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  getS2BoundaryFlat,
  getS2ChildIndex,
  getS2IndexFromToken,
  getS2TokenFromIndex
};

/**
 * Combined GeoHash, Quadkey, and S2 function table.
 */
export const DGGS_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  ...GEOHASH_FUNCTION_LIBRARY,
  ...QUADKEY_FUNCTION_LIBRARY,
  ...S2_FUNCTION_LIBRARY
};
