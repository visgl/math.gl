// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import test from 'tape-promise/tape';
// import {tapeEquals} from 'test/utils/tape-assertions';

import {Vector3, _MathUtils} from '@math.gl/core';
import {Ray} from '@math.gl/culling';

test('Ray#constructs', (t) => {
  const ray = new Ray(new Vector3(1, 0, 0));
  t.ok(ray);
  t.end();
});

