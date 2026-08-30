// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {S2Decoder} from '@math.gl/dggs';

test('S2Decoder#getCellLngLat', () => {
  const s2Token = '8085873c';
  const lngLat = S2Decoder.getCellLngLat(s2Token);
  expect(lngLat[0]).toBeCloseTo(-122.4637079795235, 10);
  expect(lngLat[1]).toBeCloseTo(37.78228912269449, 10);
});

test('S2Decoder#token/index roundtrip', () => {
  const token = '80858004';
  const index = S2Decoder.getCellIndexFromToken(token);
  const token2 = S2Decoder.getTokenFromCellIndex(index);
  expect(token2, 'round trips').toBe(token);
});

test('S2Decoder#getCellBoundaryPolygonFlat', () => {
  const TEST_TOKENS = [
    '80858004', // face 4
    '1c', // face 0
    '2c', // face 1
    '5b', // face 2
    '6b', // face 3
    'ab', // face 5
    '54', // antimeridian
    '5c' // antimeridian
  ];

  for (const token of TEST_TOKENS) {
    const polygon = S2Decoder.getCellBoundaryPolygonFlat(token);
    expect((polygon.length / 2 - 1) % 4, 'polygon has 4 sides').toBe(0);
    expect(polygon.slice(0, 2), 'polygon is closed').toEqual(polygon.slice(-2));
  }
});
