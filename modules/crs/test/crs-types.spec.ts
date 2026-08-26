// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {
  invalidCRSType,
  objectDefinitions,
  proj4Definitions,
  projAst,
  serializedDefinitions,
  unsupportedCompoundCRS,
  unsupportedVerticalCRS,
  wktAst
} from './crs-types';

test('CRS definitions expose the intended compile-time subsets', () => {
  expect(serializedDefinitions).toHaveLength(3);
  expect(objectDefinitions).toHaveLength(4);
  expect(proj4Definitions).toHaveLength(4);
  expect(invalidCRSType).toBeTruthy();
  expect(unsupportedCompoundCRS).toBeTruthy();
  expect(unsupportedVerticalCRS).toBeTruthy();
  expect(wktAst.root.keyword).toBe('GEOGCRS');
  expect(projAst.parameters[0].name).toBe('proj');
});
