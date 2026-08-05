// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {test, expect} from 'vitest';
import {toRadians} from '@math.gl/core';
import {
  isWGS84,
  fromCartographicToRadians,
  fromCartographicToDegrees,
  toCartographicFromRadians,
  toCartographicFromDegrees
} from '@math.gl/geospatial/type-utils';

const radianVector = [toRadians(45), toRadians(45), 10];

test('type-utils#fromCartographic', () => {
  let result;
  result = fromCartographicToDegrees([45, 45, 10], [0, 0, 0]);
  expect(result).toEqual([45, 45, 10]);
  result = fromCartographicToDegrees({x: 45, y: 45, z: 10}, [0, 0, 0]);
  expect(result).toEqual([45, 45, 10]);
  result = fromCartographicToDegrees({longitude: 45, latitude: 45, height: 10}, [0, 0, 0]);
  expect(result).toEqual([45, 45, 10]);

  result = fromCartographicToRadians([45, 45, 10], [0, 0, 0]);
  expect(result).toEqual(radianVector);
  result = fromCartographicToRadians({x: 45, y: 45, z: 10}, [0, 0, 0]);
  expect(result).toEqual(radianVector);
  result = fromCartographicToRadians({longitude: 45, latitude: 45, height: 10}, [0, 0, 0]);
  expect(result).toEqual(radianVector);
});

test('type-utils#toCartographic', () => {
  let result;
  result = toCartographicFromDegrees([45, 45, 10], [0, 0, 0]);
  expect(result).toEqual([45, 45, 10]);
  result = toCartographicFromDegrees([45, 45, 10], {x: 0, y: 0, z: 0});
  expect(result).toEqual({x: 45, y: 45, z: 10});
  result = toCartographicFromDegrees([45, 45, 10], {longitude: 0, latitude: 0, height: 0});
  expect(result).toEqual({longitude: 45, latitude: 45, height: 10});

  result = toCartographicFromRadians(radianVector, [0, 0, 0]);
  expect(result).toEqual([45, 45, 10]);
  result = toCartographicFromRadians(radianVector, {x: 0, y: 0, z: 0});
  expect(result).toEqual({x: 45, y: 45, z: 10});
  result = toCartographicFromRadians(radianVector, {longitude: 0, latitude: 0, height: 0});
  expect(result).toEqual({longitude: 45, latitude: 45, height: 10});
});

test('type-utils#isWGS84', () => {
  expect(isWGS84([1215010.375, -4736313.5, 4081601.75])).toBeTruthy();
  expect(isWGS84([0, 0, 0])).toBeFalsy();
  expect(isWGS84([1, 2, 3])).toBeFalsy();
  expect(isWGS84([-1, -2, -3])).toBeFalsy();
});
