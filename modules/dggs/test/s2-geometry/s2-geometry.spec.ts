// @ts-nocheck

import test from 'tape-promise/tape';

import {getS2Cell, toHilbertQuadkey} from '@math.gl/dggs/s2-geometry/s2-geometry';
import {S2} from 's2-geometry';

test('S2 Hilbert quadkey conversion', t => {
  const TEST_COORDINATES = [
    {lat: 0, lng: 0},
    {lat: -122.45, lng: 37.78},
    {lat: 85, lng: 180}
  ];

  const TEST_LEVELS = [1, 2, 4, 8, 16];

  for (let face = 0; face < 6; face++) {
    const id = (BigInt(face) << 61n) | (1n << 60n);
    t.is(toHilbertQuadkey(id), `${face}/`, `face ${face} level 0 key`);
    t.deepEqual(getS2Cell(id), {face, ij: [0, 0], level: 0}, `face ${face} level 0 cell`);
  }

  for (const point of TEST_COORDINATES) {
    for (const level of TEST_LEVELS) {
      const key = S2.latLngToKey(point.lat, point.lng, level);
      const id = BigInt(S2.keyToId(key));
      const cell = S2.S2Cell.FromHilbertQuadKey(key);

      t.comment(`level ${level}, id: ${id.toString()}`);
      t.is(toHilbertQuadkey(id), key, 'Id to quad key');
      t.deepEqual(
        getS2Cell(id),
        {face: cell.face, ij: cell.ij, level: cell.level},
        'Id to S2 cell'
      );
    }
  }

  t.end();
});
