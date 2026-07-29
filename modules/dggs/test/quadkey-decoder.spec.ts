// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {QuadkeyDecoder, quadkeyToWorldBounds} from '@math.gl/dggs';

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

test('QuadkeyDecoder#getCellBoundaryPolygon', t => {
  for (const {quadkey} of TEST_DATA) {
    const polygon = QuadkeyDecoder.getCellBoundaryPolygon(quadkey);
    t.is(polygon.length - 1, 4, `${quadkey} polygon has 4 sides`);
    t.deepEqual(polygon[0], polygon.at(-1), `${quadkey} polygon is closed`);
  }
  t.end();
});

test('quadkeyToWorldBounds', t => {
  for (const {quadkey, expectedBounds} of TEST_DATA) {
    const bounds = quadkeyToWorldBounds(quadkey);
    t.deepEquals(bounds, expectedBounds, 'Quadkey bounds calculated');
  }

  t.end();
});
