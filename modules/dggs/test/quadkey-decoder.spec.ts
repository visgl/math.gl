// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
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

test('QuadkeyDecoder#cellToBoundary', () => {
  for (const {quadkey} of TEST_DATA) {
    const polygon = QuadkeyDecoder.cellToBoundary(quadkey);
    expect(polygon.length - 1, `${quadkey} polygon has 4 sides`).toBe(4);
    expect(polygon[0], `${quadkey} polygon is closed`).toEqual(polygon.at(-1));
  }
});

test('quadkeyToWorldBounds', () => {
  for (const {quadkey, expectedBounds} of TEST_DATA) {
    const bounds = quadkeyToWorldBounds(quadkey);
    expect(bounds, 'Quadkey bounds calculated').toEqual(expectedBounds);
  }
});
