// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {quadkeyToWorldBounds, getQuadkeyBoundary} from '@math.gl/dggs-quadkey';

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

test('quadkey#quadkeyToWorldBounds', () => {
  for (const {quadkey, expectedBounds} of TEST_DATA) {
    const bounds = quadkeyToWorldBounds(quadkey);
    expect(bounds, 'Quadkey bounds calculated').toEqual(expectedBounds);
  }
});

test.skip('quadkey#getQuadkeyBoundary', () => {
  for (const {quadkey} of TEST_DATA) {
    const polygon = getQuadkeyBoundary(quadkey);
    expect(polygon instanceof Array, 'polygon is flat array').toBeTruthy();
    expect(polygon.length / 2 - 1, 'polygon has 4 sides').toBe(4);
    expect(polygon.slice(0, 2), 'polygon is closed').toEqual(polygon.slice(-2));
  }
});
