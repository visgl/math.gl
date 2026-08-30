// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {PlusCodeDecoder} from '@math.gl/dggs/plus-code';

const PLUS_CODE = '849VQHFJ+X6';

test('PlusCodeDecoder decodes full Plus Codes', () => {
  expect(PlusCodeDecoder.cellToLngLat(PLUS_CODE)).toEqual([-122.4194375, 37.77493749999999]);
  expect(PlusCodeDecoder.cellToBounds(PLUS_CODE)).toEqual([
    [-122.4195, 37.774874999999994],
    [-122.419375, 37.77499999999999]
  ]);

  const boundary = PlusCodeDecoder.cellToBoundary(PLUS_CODE);
  expect(boundary).toHaveLength(5);
  expect(boundary[0]).toEqual(boundary.at(-1));
  expect(PlusCodeDecoder.cellToBoundaryFlat(PLUS_CODE)).toEqual(boundary.flat());
});

test('PlusCodeDecoder rejects short codes that need a reference location', () => {
  expect(() => PlusCodeDecoder.cellToLngLat('QHFJ+X6')).toThrow(
    'Plus Code decoder requires a full code'
  );
});
