// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {
  A5Decoder,
  findDGGSCellColumn,
  GeohashDecoder,
  H3Decoder,
  PlusCodeDecoder,
  QuadkeyDecoder,
  S2Decoder
} from '@math.gl/dggs';

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
  expect(findDGGSCellColumn(['value', 'a5_cell_id'])).toEqual({
    columnName: 'a5_cell_id',
    decoder: A5Decoder
  });
  expect(findDGGSCellColumn(['H3Index', 'metric'])).toEqual({
    columnName: 'H3Index',
    decoder: H3Decoder
  });
  expect(findDGGSCellColumn(['name', 'plus_code'])).toEqual({
    columnName: 'plus_code',
    decoder: PlusCodeDecoder
  });
});

test('findDGGSCellColumn returns null for missing or ambiguous columns', () => {
  expect(findDGGSCellColumn(['name', 'value'])).toBeNull();
  expect(findDGGSCellColumn(['geohash', 's2_token'])).toBeNull();
});
