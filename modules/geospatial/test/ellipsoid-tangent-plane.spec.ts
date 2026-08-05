// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {Vector2, Vector3, _MathUtils, equals} from '@math.gl/core';
import {Ellipsoid, EllipsoidTangentPlane} from '@math.gl/geospatial';

test('EllipsoidTangentPlane constructs an east-north-up frame', () => {
  const surfacePoint = Ellipsoid.WGS84.cartographicToCartesian([0, 0, 0]);
  const tangentPlane = new EllipsoidTangentPlane(surfacePoint);

  expect(equals(tangentPlane.origin, surfacePoint, _MathUtils.EPSILON8)).toBe(true);
  expect(equals(tangentPlane.xAxis, [0, 1, 0], _MathUtils.EPSILON15)).toBe(true);
  expect(equals(tangentPlane.yAxis, [0, 0, 1], _MathUtils.EPSILON15)).toBe(true);
  expect(equals(tangentPlane.zAxis, [1, 0, 0], _MathUtils.EPSILON15)).toBe(true);
});

test('EllipsoidTangentPlane projects onto the local two-dimensional plane', () => {
  const surfacePoint = Ellipsoid.WGS84.cartographicToCartesian([0, 0, 0]);
  const tangentPlane = new EllipsoidTangentPlane(surfacePoint);
  const point = new Vector3(surfacePoint).add([25, 100, 50]);
  const originalPoint = point.clone();
  const result = new Vector2();

  const returnedResult = tangentPlane.projectPointToNearestOnPlane(point, result);

  expect(returnedResult, 'returns the supplied result').toBe(result);
  expect(equals(result, [100, 50], _MathUtils.EPSILON10)).toBe(true);
  expect(equals(point, originalPoint), 'does not mutate the input point').toBe(true);
});

test('EllipsoidTangentPlane instances do not share mutable frame state', () => {
  const first = new EllipsoidTangentPlane(Ellipsoid.WGS84.cartographicToCartesian([0, 0, 0]));
  const firstOrigin = first.origin.clone();
  const firstNormal = first.plane.normal.clone();
  const firstDistance = first.plane.distance;

  new EllipsoidTangentPlane(Ellipsoid.WGS84.cartographicToCartesian([90, 0, 0]));

  expect(equals(first.origin, firstOrigin)).toBe(true);
  expect(equals(first.plane.normal, firstNormal)).toBe(true);
  expect(first.plane.distance).toBe(firstDistance);
});
