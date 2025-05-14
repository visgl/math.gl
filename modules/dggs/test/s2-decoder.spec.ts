// loaders.gl, MIT license
import test from 'tape-promise/tape';

import {S2Decoder} from '@math.gl/dggs-s2';

test.skip('S2Decoder#getCellLngLat', (t) => {
  const s2Token = '8085873c';
  const lngLat = S2Decoder.getCellLngLat(s2Token);
  t.deepEquals(
    lngLat.map((d) => Number(d.toFixed(12))),
    [-122.4637079795235, 37.78228912269449].map((d) => Number(d.toFixed(12)))
  );
  t.end();
});

test('S2Decoder#token/index roundtrip', (t) => {
  const token = '80858004';
  const index = S2Decoder.getCellIndexFromToken(token);
  const token2 = S2Decoder.getTokenFromCellIndex(index);
  t.is(token2, token, 'round trips');
  t.end();
});

test('getS2BoundaryFlat', (t) => {
  const TEST_TOKENS = [
    '80858004', // face 4
    '1c', // face 0
    '2c', // face 1
    '5b', // face 2
    '6b', // face 3
    'ab', // face 5
    // '4/001003', TODO - not supported
    '54', // antimeridian
    '5c' // antimeridian
    // new Long(0, -2138636288, false),
    // new Long(0, 1832910848, false)
  ];

  for (const token of TEST_TOKENS) {
    const polygon = S2Decoder.getCellBoundaryPolygonFlat(token);
    t.is((polygon.length / 2 - 1) % 4, 0, 'polygon has 4 sides');
    t.deepEqual(polygon.slice(0, 2), polygon.slice(-2), 'polygon is closed');

    let minLng = 180;
    let maxLng = -180;
    for (let i = 0; i < polygon.length; i += 2) {
      minLng = Math.min(minLng, polygon[i]);
      maxLng = Math.max(maxLng, polygon[i]);
    }
    // TODO - restore test
    // t.ok(maxLng - minLng < 180, 'longitude is adjusted cross the antimeridian');
  }

  t.end();
});
