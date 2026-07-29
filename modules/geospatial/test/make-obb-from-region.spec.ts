// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {toRadians} from '@math.gl/core';
import {OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid, makeOBBFromRegion} from '@math.gl/geospatial';

const TEST_REGIONS = [
  {
    name: 'narrow region',
    degrees: [-10, -5, 15, 20, -100, 500]
  },
  {
    name: 'wide region',
    degrees: [-120, -30, 120, 40, 0, 1000]
  },
  {
    name: 'region crossing the antimeridian',
    degrees: [170, -10, -170, 10, 0, 250]
  }
];

test('makeOBBFromRegion bounds representative WGS84 regions', (t) => {
  for (const testCase of TEST_REGIONS) {
    const [west, south, east, north, minimumHeight, maximumHeight] = testCase.degrees;
    const region = [
      toRadians(west),
      toRadians(south),
      toRadians(east),
      toRadians(north),
      minimumHeight,
      maximumHeight
    ];
    const box = makeOBBFromRegion(region);

    t.ok(box instanceof OrientedBoundingBox, `${testCase.name}: returns an oriented bounding box`);
    t.ok(box.center.every(Number.isFinite), `${testCase.name}: center is finite`);
    t.ok(box.halfAxes.every(Number.isFinite), `${testCase.name}: half axes are finite`);

    for (const longitude of [west, east]) {
      for (const latitude of [south, north]) {
        for (const height of [minimumHeight, maximumHeight]) {
          const corner = Ellipsoid.WGS84.cartographicToCartesian([longitude, latitude, height]);
          t.ok(
            box.distanceTo(corner) < 1e-5,
            `${testCase.name}: contains [${longitude}, ${latitude}, ${height}]`
          );
        }
      }
    }
  }
  t.end();
});
