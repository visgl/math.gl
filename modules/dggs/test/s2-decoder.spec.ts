// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {S2Decoder} from '@math.gl/dggs';

test('S2Decoder#cellToLngLat', () => {
  const s2Token = '8085873c';
  const lngLat = S2Decoder.cellToLngLat(s2Token);
  expect(lngLat[0]).toBeCloseTo(-122.4637079795235, 10);
  expect(lngLat[1]).toBeCloseTo(37.78228912269449, 10);
});

test('S2Decoder#token/index roundtrip', () => {
  const token = '80858004';
  const index = S2Decoder.tokenToCell(token);
  const token2 = S2Decoder.cellToToken(index);
  expect(token2, 'round trips').toBe(token);
  expect(S2Decoder.cellToLngLat(index)).toEqual(S2Decoder.cellToLngLat(token));
});

test('S2Decoder#cellToBoundaryFlat', () => {
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
    const polygon = S2Decoder.cellToBoundaryFlat(token);
    expect((polygon.length / 2 - 1) % 4, 'polygon has 4 sides').toBe(0);
    expect(polygon.slice(0, 2), 'polygon is closed').toEqual(polygon.slice(-2));
  }
});

test('S2Decoder exposes object boundaries and bounds for token and bigint inputs', () => {
  const token = '80858004';
  const index = S2Decoder.tokenToCell(token);
  const boundaryFromToken = S2Decoder.cellToBoundary(token);
  const boundaryFromIndex = S2Decoder.cellToBoundary(index);
  expect(boundaryFromToken).toEqual(boundaryFromIndex);
  expect(S2Decoder.cellToBounds(token)).toEqual(S2Decoder.cellToBounds(index));
  expect(S2Decoder.cellToLngLat(index)).toEqual(S2Decoder.cellToLngLat(token));
  expect(S2Decoder.cellToToken(index)).toBe(token);
});
