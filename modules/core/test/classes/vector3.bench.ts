// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2015 - 2017 Uber Technologies, Inc.

import {Vector3} from '@math.gl/core';

class ObjectVector {
  x: number;
  y: number;
  z: number;

  constructor(x = -0, y = -0, z = -0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

const array = [0, 0, 0];
const float32Array = new Float32Array([0, 0, 0]);
const objectVector = new ObjectVector();
const arrayVector = new Vector3();
const vector3 = new Vector3();

export function vector3Bench(suite, addReferenceBenchmarks) {
  suite
    .group('@math.gl/core: Vector3')
    .add('Vector3#new()', () => new Vector3(1, 2, 3))
    .add('Vector3#set()', () => vector3.set(1, 2, 3))
    .add('Vector3#copy()', () => vector3.copy([1, 2, 3]))
    .add('Vector3#from(Vector3)', () => vector3.from(arrayVector))
    .add('Vector3#to(Vector3)', () => vector3.to(arrayVector));

  if (addReferenceBenchmarks) {
    suite
      .group('Vector3 Type Conversion Cost')
      .add('Vector3#from(Object)', () => vector3.from(objectVector))
      .add('Vector3#to(Object)', () => vector3.to(objectVector))
      .add('Vector3.from#Array', () => vector3.from(array))
      .add('Vector3.from#Float32Array', () => vector3.from(float32Array))
      .add('Vector3.to#Array', () => vector3.to(array))
      .add('Vector3.to#Float32Array', () => vector3.to(float32Array));
  }

  return suite;
}
