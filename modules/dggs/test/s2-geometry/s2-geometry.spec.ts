// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';

import {getS2Cell, toHilbertQuadkey} from '@math.gl/dggs/s2-geometry/s2-geometry';
import {S2} from 's2-geometry';
import {
  getS2ChildIndex,
  getS2IndexFromToken,
  getS2TokenFromIndex
} from '../../src/s2-geometry/s2-token';

test('S2 Hilbert quadkey conversion', () => {
  const TEST_COORDINATES = [
    {lat: 0, lng: 0},
    {lat: -122.45, lng: 37.78},
    {lat: 85, lng: 180}
  ];

  const TEST_LEVELS = [1, 2, 4, 8, 16];

  for (let face = 0; face < 6; face++) {
    const id = (BigInt(face) << 61n) | (1n << 60n);
    expect(toHilbertQuadkey(id), `face ${face} level 0 key`).toBe(`${face}/`);
    expect(getS2Cell(id), `face ${face} level 0 cell`).toEqual({
      face,
      ij: [0, 0],
      level: 0
    });
  }

  for (const point of TEST_COORDINATES) {
    for (const level of TEST_LEVELS) {
      const key = S2.latLngToKey(point.lat, point.lng, level);
      const id = BigInt(S2.keyToId(key));
      const cell = S2.S2Cell.FromHilbertQuadKey(key);

      expect(toHilbertQuadkey(id), `level ${level}, id ${id.toString()}: Id to quad key`).toBe(key);
      expect(getS2Cell(id), `level ${level}, id ${id.toString()}: Id to S2 cell`).toEqual({
        face: cell.face,
        ij: cell.ij,
        level: cell.level
      });
    }
  }
});

test('S2 tokens support empty cells, canonical padding and child indexes', () => {
  expect(getS2IndexFromToken('X')).toBe(0n);
  expect(getS2TokenFromIndex(0n)).toBe('X');
  const parent = getS2IndexFromToken('89c25');
  expect(getS2TokenFromIndex(parent)).toBe('89c25');
  for (let child = 0; child < 4; child++) {
    expect(getS2ChildIndex(parent, child)).not.toBe(parent);
  }
});
