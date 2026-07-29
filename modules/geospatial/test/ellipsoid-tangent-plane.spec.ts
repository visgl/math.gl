// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Vector2, Vector3, _MathUtils} from '@math.gl/core';
import {Ellipsoid, EllipsoidTangentPlane} from '@math.gl/geospatial';
import {tapeEquals, tapeEqualsEpsilon} from 'test/utils/tape-assertions';

test('EllipsoidTangentPlane constructs an east-north-up frame', t => {
  const surfacePoint = Ellipsoid.WGS84.cartographicToCartesian([0, 0, 0]);
  const tangentPlane = new EllipsoidTangentPlane(surfacePoint);

  tapeEqualsEpsilon(t, tangentPlane.origin, surfacePoint, _MathUtils.EPSILON8);
  tapeEqualsEpsilon(t, tangentPlane.xAxis, [0, 1, 0], _MathUtils.EPSILON15);
  tapeEqualsEpsilon(t, tangentPlane.yAxis, [0, 0, 1], _MathUtils.EPSILON15);
  tapeEqualsEpsilon(t, tangentPlane.zAxis, [1, 0, 0], _MathUtils.EPSILON15);
  t.end();
});

test('EllipsoidTangentPlane projects onto the local two-dimensional plane', t => {
  const surfacePoint = Ellipsoid.WGS84.cartographicToCartesian([0, 0, 0]);
  const tangentPlane = new EllipsoidTangentPlane(surfacePoint);
  const point = new Vector3(surfacePoint).add([25, 100, 50]);
  const originalPoint = point.clone();
  const result = new Vector2();

  const returnedResult = tangentPlane.projectPointToNearestOnPlane(point, result);

  t.equals(returnedResult, result, 'returns the supplied result');
  tapeEqualsEpsilon(t, result, [100, 50], _MathUtils.EPSILON10);
  tapeEquals(t, point, originalPoint, 'does not mutate the input point');
  t.end();
});

test('EllipsoidTangentPlane instances do not share mutable frame state', t => {
  const first = new EllipsoidTangentPlane(Ellipsoid.WGS84.cartographicToCartesian([0, 0, 0]));
  const firstOrigin = first.origin.clone();
  const firstNormal = first.plane.normal.clone();
  const firstDistance = first.plane.distance;

  new EllipsoidTangentPlane(Ellipsoid.WGS84.cartographicToCartesian([90, 0, 0]));

  tapeEquals(t, first.origin, firstOrigin);
  tapeEquals(t, first.plane.normal, firstNormal);
  t.equals(first.plane.distance, firstDistance);
  t.end();
});
