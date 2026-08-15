// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {ExpressionFunctionRegistry, compile} from '@math.gl/expressions';
import {
  DGGS_FUNCTION_LIBRARY,
  GEOHASH_FUNCTION_LIBRARY,
  QUADKEY_FUNCTION_LIBRARY,
  S2_FUNCTION_LIBRARY
} from '@math.gl/expressions/dggs';

test('@math.gl/expressions/dggs function tables', () => {
  const registry = new ExpressionFunctionRegistry([DGGS_FUNCTION_LIBRARY]);

  expect(
    compile('getGeohashLngLat(hash)', {registry})({hash: '9q8yy'}),
    'binds GeoHash functions'
  ).toEqual(GEOHASH_FUNCTION_LIBRARY.getGeohashLngLat('9q8yy'));
  expect(
    compile('getQuadkeyBoundary(key)', {registry})({key: '0230102033'}),
    'binds Quadkey functions'
  ).toEqual(QUADKEY_FUNCTION_LIBRARY.getQuadkeyBoundary('0230102033'));
  expect(
    compile('getS2TokenFromIndex(getS2IndexFromToken(token))', {registry})({token: '89c25'}),
    'binds nested S2 functions'
  ).toBe(S2_FUNCTION_LIBRARY.getS2TokenFromIndex(S2_FUNCTION_LIBRARY.getS2IndexFromToken('89c25')));
});
