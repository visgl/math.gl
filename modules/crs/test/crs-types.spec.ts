// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {
  invalidCRSType,
  objectDefinitions,
  proj4Definitions,
  serializedDefinitions,
  unsupportedCompoundCRS,
  unsupportedVerticalCRS
} from './crs-types';

test('CRS definitions expose the intended compile-time subsets', t => {
  t.equal(serializedDefinitions.length, 3, 'accepts serialized definitions');
  t.equal(objectDefinitions.length, 4, 'accepts standards-based object definitions');
  t.equal(proj4Definitions.length, 4, 'accepts the proj4js PROJJSON subset');
  t.ok(invalidCRSType, 'invalid type is covered by a compile-time assertion');
  t.ok(unsupportedCompoundCRS, 'compound CRS is covered by a compile-time assertion');
  t.ok(unsupportedVerticalCRS, 'vertical CRS is covered by a compile-time assertion');
  t.end();
});
