// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {findDGGSCellColumn, GeohashDecoder, QuadkeyDecoder, S2Decoder} from '@math.gl/dggs';

test('findDGGSCellColumn detects conventional cell columns', () => {
  expect(findDGGSCellColumn(['count', 'geohash'])).toEqual({
    columnName: 'geohash',
    decoder: GeohashDecoder
  });
  expect(findDGGSCellColumn(['value', 'quadkey_id'])).toEqual({
    columnName: 'quadkey_id',
    decoder: QuadkeyDecoder
  });
  expect(findDGGSCellColumn(['S2Token', 'metric'])).toEqual({
    columnName: 'S2Token',
    decoder: S2Decoder
  });
});

test('findDGGSCellColumn returns null for missing or ambiguous columns', () => {
  expect(findDGGSCellColumn(['name', 'value'])).toBeNull();
  expect(findDGGSCellColumn(['geohash', 's2_token'])).toBeNull();
});
