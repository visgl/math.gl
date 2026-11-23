// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {A5Decoder} from '@math.gl/dggs/a5';
import {findDGGSCellColumn} from '@math.gl/dggs/decoders';
import {GeohashDecoder} from '@math.gl/dggs/geohash';
import {H3Decoder} from '@math.gl/dggs/h3';
import {PlusCodeDecoder} from '@math.gl/dggs/plus-code';
import {QuadkeyDecoder} from '@math.gl/dggs/quadkey';
import {S2Decoder} from '@math.gl/dggs/s2';

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
