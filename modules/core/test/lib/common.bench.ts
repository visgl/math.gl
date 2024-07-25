// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2015 - 2017 Uber Technologies, Inc.

import {Vector3, toRadians, radians} from '@math.gl/core';
import {isArray} from '@math.gl/core';

const classicArray = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const float32Array = new Float32Array([1, 0, 0]);
const float64Array = new Float64Array([1, 0, 0]);
const vector3 = new Vector3();

export function commonBench(suite, addReferenceBenchmarks) {
  suite
    .group('@math.gl/core: Global Functions')
    .add('isArray(Vector3)', () => isArray(vector3))
    .add('isArray(Float32Array)', () => isArray(float32Array));

  if (addReferenceBenchmarks) {
    suite
      .add('isArray(array)', () => isArray(classicArray))
      .add('isArray(Float64Array)', () => isArray(float64Array));
  }

  suite
    .add('toRadians(Number)', () => toRadians(100))
    .add('radians(Vector3)', () => radians(vector3, vector3));

  if (addReferenceBenchmarks) {
    suite
      .add('toRadians(array)', () => toRadians(classicArray))
      .add('toRadians(Float32Array)', () => toRadians(float32Array))
      .add('toRadians(Float64Array)', () => toRadians(float64Array));
  }
}
