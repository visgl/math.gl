// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {getGeohashBounds, getGeohashBoundaryFlat} from '@math.gl/dggs-geohash';

const TEST_DATA = [
  {
    geohash: '9',
    expectedBounds: [0, -135, 45, -90]
  },
  {
    geohash: '9q8yybj',
    expectedBounds: [37.7490234375, -122.39181518554688, 37.750396728515625, -122.39044189453125]
  },
  {
    geohash: '9q8yy',
    expectedBounds: [37.7490234375, -122.431640625, 37.79296875, -122.3876953125]
  }
];

// TODO - restore test
test.skip('geohash#getGeohashBounds', () => {
  for (const {geohash} of TEST_DATA) {
    const polygon = getGeohashBounds(geohash);
    expect(polygon instanceof Array, 'polygon is flat array').toBeTruthy();
    expect(polygon.length / 2 - 1, 'polygon has 4 sides').toBe(4);
    expect(polygon.slice(0, 2), 'polygon is closed').toEqual(polygon.slice(-2));
  }
});

// TODO - restore test
test.skip('geohash#getGeohashBoundaryFlat', () => {
  for (const {geohash, expectedBounds} of TEST_DATA) {
    const bounds = getGeohashBoundaryFlat(geohash);
    expect(bounds, 'Geohash bounds calculated').toEqual(expectedBounds);
  }
});
