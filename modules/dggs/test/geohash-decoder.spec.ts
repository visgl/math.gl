// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {GeohashDecoder} from '@math.gl/dggs';

const TEST_DATA = [
  {
    geohash: '9',
    expectedBounds: [
      [-135, 0],
      [-90, 45]
    ]
  },
  {
    geohash: '9q8yybj',
    expectedBounds: [
      [-122.39181518554688, 37.7490234375],
      [-122.39044189453125, 37.750396728515625]
    ]
  },
  {
    geohash: '9q8yy',
    expectedBounds: [
      [-122.431640625, 37.7490234375],
      [-122.3876953125, 37.79296875]
    ]
  }
];

test('GeohashDecoder#cellToBounds', () => {
  for (const {geohash, expectedBounds} of TEST_DATA) {
    expect(GeohashDecoder.cellToBounds(geohash), `${geohash} bounds`).toEqual(expectedBounds);
  }
});

test('GeohashDecoder#cellToBoundary', () => {
  for (const {geohash} of TEST_DATA) {
    const polygon = GeohashDecoder.cellToBoundary(geohash);
    expect(polygon.length - 1, `${geohash} polygon has 4 sides`).toBe(4);
    expect(polygon[0], `${geohash} polygon is closed`).toEqual(polygon.at(-1));
  }
});
