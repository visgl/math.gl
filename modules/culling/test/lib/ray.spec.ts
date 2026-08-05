// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {test, expect} from 'vitest';

import {Vector3, equals} from '@math.gl/core';
import {Ray} from '@math.gl/culling';

test('Ray#constructor uses zero-vector defaults', () => {
  const ray = new Ray();
  expect(equals(ray.origin, [0, 0, 0])).toBe(true);
  expect(equals(ray.direction, [0, 0, 0])).toBe(true);
});

test('Ray#constructor clones the origin and normalizes the direction', () => {
  const origin = new Vector3(1, 2, 3);
  const direction = new Vector3(0, 4, 0);
  const ray = new Ray(origin, direction);

  expect(equals(ray.origin, [1, 2, 3])).toBe(true);
  expect(equals(ray.direction, [0, 1, 0])).toBe(true);
  expect(ray.origin).not.toBe(origin);
  expect(ray.direction).not.toBe(direction);

  origin.set(4, 5, 6);
  direction.set(1, 0, 0);
  expect(equals(ray.origin, [1, 2, 3]), 'origin is independent from constructor input').toBe(true);
  expect(equals(ray.direction, [0, 1, 0]), 'direction is independent from constructor input').toBe(
    true
  );
});
