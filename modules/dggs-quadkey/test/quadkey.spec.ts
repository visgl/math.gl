// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {QuadkeyDecoder, _quadkeyToWorldBounds} from '@math.gl/dggs-quadkey';

const TEST_DATA = [
  {
    quadkey: '0',
    expectedBounds: [
      [0, 512],
      [253.44, 258.56]
    ]
  },
  {
    quadkey: '0123',
    expectedBounds: [
      [160, 416],
      [191.68, 384.32]
    ]
  },
  {
    quadkey: '333',
    expectedBounds: [
      [448, 64],
      [511.36, 0.6399999999999864]
    ]
  }
];

test.skip('QuadkeyDecoder#getCellBoundaryPolygon', (t) => {
  for (const {quadkey} of TEST_DATA) {
    const polygon = QuadkeyDecoder.getCellBoundaryPolygon(quadkey);
    t.ok(polygon instanceof Array, 'polygon is flat array');
    t.is(polygon.length / 2 - 1, 4, 'polygon has 4 sides');
    t.deepEqual(polygon.slice(0, 2), polygon.slice(-2), 'polygon is closed');
  }
  t.end();
});

test('QuadkeyDecoder#ToWorldBounds', (t) => {
  for (const {quadkey, expectedBounds} of TEST_DATA) {
    const bounds = _quadkeyToWorldBounds(quadkey);
    t.deepEquals(bounds, expectedBounds, 'Quadkey bounds calculated');
  }

  t.end();
});
