// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {GeohashDecoder} from '@math.gl/dggs/geohash';
import {QuadkeyDecoder} from '@math.gl/dggs/quadkey';
import {S2Decoder} from '@math.gl/dggs/s2';

test('@math.gl/dggs decoder subpath exports', () => {
  expect(GeohashDecoder.name).toBe('geohash');
  expect(QuadkeyDecoder.name).toBe('quadkey');
  expect(S2Decoder.name).toBe('s2');
});
