// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2015 - 2017 Uber Technologies, Inc.

import {Vector4} from '@math.gl/core';

const array = [0, 0, 0, 0];
const float32Array = new Float32Array([0, 0, 0, 0]);
const vector4 = new Vector4();

export function vector4Bench(suite, addReferenceBenchmarks) {
  suite
    .group('@math.gl/core: Vector4')
    .add('Vector4#new()', () => new Vector4(1, 2, 3, 4))
    .add('Vector4#set()', () => vector4.set(1, 2, 3, 4))
    .add('Vector4#copy()', () => vector4.copy([1, 2, 3, 4]));
  // .add('Vector4#from(Vector4)', () => vector4.from(arrayVector))
  // .add('Vector4#to(Vector4)', () => vector4.to(arrayVector))

  if (addReferenceBenchmarks) {
    suite
      .group('Vector4 Type Conversion Cost')
      .add('Vector4.from#Array', () => vector4.from(array))
      .add('Vector4.from#Float32Array', () => vector4.from(float32Array))
      .add('Vector4.to#Array', () => vector4.to(array))
      .add('Vector4.to#Float32Array', () => vector4.to(float32Array));
  }

  return suite;
}
