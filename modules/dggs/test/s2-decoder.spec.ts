// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {
  getS2Bounds,
  getS2IndexFromToken,
  isS2IndexValid,
  isS2TokenValid,
  S2Decoder
} from '@math.gl/dggs';

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

test('S2 tokens and indexes are validated and canonicalized', () => {
  for (const token of ['1', '04', '89c25', '80858004', 'ABC']) {
    expect(isS2TokenValid(token), token).toBe(true);
    expect(isS2IndexValid(getS2IndexFromToken(token)), token).toBe(true);
  }
  for (const token of ['', 'X', '0', '2', 'f', '10', 'not-hex', '10000000000000001']) {
    expect(isS2TokenValid(token), token).toBe(false);
  }
  expect(S2Decoder.cellToToken('ABC')).toBe('abc');
  expect(() => S2Decoder.cellToLngLat('f')).toThrow(/Invalid S2 token/);
  expect(isS2IndexValid(0n)).toBe(false);
  expect(isS2IndexValid(-1n)).toBe(false);
  expect(isS2IndexValid(1n << 64n)).toBe(false);
});

test('S2 bounds cover all root faces, including the poles and antimeridian', () => {
  const polarLatitude = (Math.asin(Math.sqrt(1 / 3)) * 180) / Math.PI;
  expect(getS2Bounds('1')).toEqual([
    [-45, -45],
    [45, 45]
  ]);
  expect(getS2Bounds('3')).toEqual([
    [45, -45],
    [135, 45]
  ]);
  expect(getS2Bounds('5')).toEqual([
    [-180, polarLatitude],
    [180, 90]
  ]);
  expect(getS2Bounds('7')).toEqual([
    [135, -45],
    [225, 45]
  ]);
  expect(getS2Bounds('9')).toEqual([
    [-135, -45],
    [-45, 45]
  ]);
  expect(getS2Bounds('b')).toEqual([
    [-180, -90],
    [180, -polarLatitude]
  ]);
});

test('S2 non-root bounds are ordered and contain the tessellated boundary', () => {
  for (const token of ['54', '5c', '89c25', '80858004']) {
    const [[west, south], [east, north]] = getS2Bounds(token);
    expect(east).toBeGreaterThanOrEqual(west);
    expect(north).toBeGreaterThanOrEqual(south);
    const boundary = S2Decoder.cellToBoundary(token);
    for (const [rawLongitude, latitude] of boundary) {
      let longitude = rawLongitude;
      while (longitude < west) longitude += 360;
      while (longitude > east) longitude -= 360;
      expect(longitude, `${token} longitude`).toBeGreaterThanOrEqual(west);
      expect(longitude, `${token} longitude`).toBeLessThanOrEqual(east);
      expect(latitude, `${token} latitude`).toBeGreaterThanOrEqual(south);
      expect(latitude, `${token} latitude`).toBeLessThanOrEqual(north);
    }
  }
});

test('S2 bounds preserve the longitude extent of cells adjacent to a pole', () => {
  const [[west], [east]] = getS2Bounds('4555555554');
  expect(west).toBeLessThanOrEqual(0);
  expect(east).toBeGreaterThanOrEqual(90);
});
