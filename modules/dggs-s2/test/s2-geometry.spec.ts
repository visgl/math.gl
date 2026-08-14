// @ts-nocheck

import {test, expect} from 'vitest';

import {_toHilbertQuadKey as toHilbertQuadKey} from '@math.gl/dggs-s2';
import {S2} from 's2-geometry';

// TODO - restore test
test.skip('S2#toHilbertQuadkey', () => {
  const TEST_COORDINATES = [
    {lat: 0, lng: 0},
    {lat: -122.45, lng: 37.78},
    {lat: 85, lng: 180}
  ];

  const TEST_LEVELS = [1, 2, 4, 8, 16];

  for (const point of TEST_COORDINATES) {
    for (const level of TEST_LEVELS) {
      const key = S2.latLngToKey(point.lat, point.lng, level);
      const id = BigInt(S2.keyToId(key));
      const token = id.toString(16).replace(/0+$/, '');

      console.log(`level ${level}, id: ${id.toString()}, token: ${token}`);
      expect(toHilbertQuadKey(key), 'Quad key to quad key').toBe(key);
      expect(toHilbertQuadKey(id), 'Id to quad key').toBe(key);
      expect(toHilbertQuadKey(token), 'Token to quad key').toBe(key);
    }
  }
});
