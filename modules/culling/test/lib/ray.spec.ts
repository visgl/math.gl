// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {tapeEquals} from 'test/utils/tape-assertions';

import {Vector3} from '@math.gl/core';
import {Ray} from '@math.gl/culling';

test('Ray#constructor uses zero-vector defaults', (t) => {
  const ray = new Ray();
  tapeEquals(t, ray.origin, [0, 0, 0]);
  tapeEquals(t, ray.direction, [0, 0, 0]);
  t.end();
});

test('Ray#constructor clones the origin and normalizes the direction', (t) => {
  const origin = new Vector3(1, 2, 3);
  const direction = new Vector3(0, 4, 0);
  const ray = new Ray(origin, direction);

  tapeEquals(t, ray.origin, [1, 2, 3]);
  tapeEquals(t, ray.direction, [0, 1, 0]);
  t.notEquals(ray.origin, origin);
  t.notEquals(ray.direction, direction);

  origin.set(4, 5, 6);
  direction.set(1, 0, 0);
  tapeEquals(t, ray.origin, [1, 2, 3], 'origin is independent from constructor input');
  tapeEquals(t, ray.direction, [0, 1, 0], 'direction is independent from constructor input');
  t.end();
});
