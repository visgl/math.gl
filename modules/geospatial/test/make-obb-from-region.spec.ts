// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {Matrix4, toRadians} from '@math.gl/core';
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

test('makeOBBFromRegion bounds representative WGS84 regions', () => {
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

    expect(
      box instanceof OrientedBoundingBox,
      `${testCase.name}: returns an oriented bounding box`
    ).toBeTruthy();
    expect(box.center.every(Number.isFinite), `${testCase.name}: center is finite`).toBeTruthy();
    expect(
      box.halfAxes.every(Number.isFinite),
      `${testCase.name}: half axes are finite`
    ).toBeTruthy();

    for (const longitude of [west, east]) {
      for (const latitude of [south, north]) {
        for (const height of [minimumHeight, maximumHeight]) {
          const corner = Ellipsoid.WGS84.cartographicToCartesian([longitude, latitude, height]);
          expect(
            box.distanceTo(corner) < 1e-5,
            `${testCase.name}: contains [${longitude}, ${latitude}, ${height}]`
          ).toBeTruthy();
        }
      }
    }
  }
});

test('supports degree input, custom ellipsoids and affine transforms', () => {
  const radiansRegion = [
    toRadians(170),
    toRadians(-10),
    toRadians(-170),
    toRadians(10),
    0,
    250
  ] as const;
  const degreesRegion = [170, -10, -170, 10, 0, 250] as const;
  const radiansBox = makeOBBFromRegion(radiansRegion);
  const degreesBox = makeOBBFromRegion(degreesRegion, undefined, {units: 'degrees'});
  expect(radiansBox.center).toEqual(degreesBox.center);
  expect(radiansBox.halfAxes).toEqual(degreesBox.halfAxes);
  expect(Math.abs(radiansBox.center.x)).toBeGreaterThan(6e6);
  expect(radiansBox.halfSize[0]).toBeLessThan(2e6);

  const ellipsoid = new Ellipsoid(100, 100, 100);
  const customBox = makeOBBFromRegion([0, 0, 0.1, 0.1, 0, 1], ellipsoid);
  expect(customBox.center.every(Number.isFinite)).toBeTruthy();
  expect(customBox.center.len()).toBeLessThan(101);

  const transform = new Matrix4().translate([10, 20, 30]).scale([2, 3, 4]);
  const transformed = makeOBBFromRegion([0, 0, 0.1, 0.1, 0, 1], ellipsoid, {transform});
  const expectedCenter = transform.transformAsPoint(customBox.center);
  expect(transformed.center).toEqual(expectedCenter);
  expect(transformed.halfAxes.every(Number.isFinite)).toBeTruthy();
});

test('keeps polar and degenerate regions finite', () => {
  const regions = [
    [0, toRadians(89), toRadians(90), toRadians(89.9), 0, 0],
    [0, toRadians(89.9), toRadians(180), Math.PI / 2, 0, 1],
    [1, 0, 1, 0, 5, 5]
  ];
  for (const region of regions) {
    const box = makeOBBFromRegion(region as never);
    expect(box.center.every(Number.isFinite)).toBeTruthy();
    expect(box.halfAxes.every(Number.isFinite)).toBeTruthy();
  }
});

test('rejects malformed regions', () => {
  expect(() => makeOBBFromRegion([0, 0, 0, 0, 1, 0] as never)).toThrow(/minimumHeight/);
  expect(() => makeOBBFromRegion([0, -2, 0, 0, 0, 0] as never)).toThrow(/latitude/);
  expect(() => makeOBBFromRegion([0, 0, 0, 0, NaN, 0] as never)).toThrow(/six finite/);
});
