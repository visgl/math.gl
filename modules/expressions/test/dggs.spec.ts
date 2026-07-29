// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {ExpressionFunctionRegistry, compile} from '@math.gl/expressions';
import {
  DGGS_FUNCTION_LIBRARY,
  GEOHASH_FUNCTION_LIBRARY,
  QUADKEY_FUNCTION_LIBRARY,
  S2_FUNCTION_LIBRARY
} from '@math.gl/expressions/dggs';

test('@math.gl/expressions/dggs function tables', t => {
  const registry = new ExpressionFunctionRegistry([DGGS_FUNCTION_LIBRARY]);

  t.deepEqual(
    compile('getGeohashLngLat(hash)', {registry})({hash: '9q8yy'}),
    GEOHASH_FUNCTION_LIBRARY.getGeohashLngLat('9q8yy'),
    'binds GeoHash functions'
  );
  t.deepEqual(
    compile('getQuadkeyBoundary(key)', {registry})({key: '0230102033'}),
    QUADKEY_FUNCTION_LIBRARY.getQuadkeyBoundary('0230102033'),
    'binds Quadkey functions'
  );
  t.equal(
    compile('getS2TokenFromIndex(getS2IndexFromToken(token))', {registry})({token: '89c25'}),
    S2_FUNCTION_LIBRARY.getS2TokenFromIndex(S2_FUNCTION_LIBRARY.getS2IndexFromToken('89c25')),
    'binds nested S2 functions'
  );
  t.end();
});
