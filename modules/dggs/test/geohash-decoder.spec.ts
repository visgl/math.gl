// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('GeohashDecoder#getCellBounds', t => {
  for (const {geohash, expectedBounds} of TEST_DATA) {
    t.deepEqual(GeohashDecoder.getCellBounds(geohash), expectedBounds, `${geohash} bounds`);
  }

  t.end();
});

test('GeohashDecoder#getCellBoundaryPolygon', t => {
  for (const {geohash} of TEST_DATA) {
    const polygon = GeohashDecoder.getCellBoundaryPolygon(geohash);
    t.is(polygon.length - 1, 4, `${geohash} polygon has 4 sides`);
    t.deepEqual(polygon[0], polygon.at(-1), `${geohash} polygon is closed`);
  }

  t.end();
});
