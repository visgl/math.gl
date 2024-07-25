// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2015 - 2017 Uber Technologies, Inc.

import {Vector2} from '@math.gl/core';

const array = [0, 0];
const float32Array = new Float32Array([0, 0]);
const vector2 = new Vector2();

export function vector2Bench(suite, addReferenceBenchmarks) {
  suite
    .group('@math.gl/core: Vector2')
    .add('Vector2#new()', () => new Vector2(1, 2))
    .add('Vector2#set()', () => vector2.set(1, 2))
    .add('Vector2#copy()', () => vector2.copy([1, 2]));
  // .add('Vector2#from(Vector2)', () => vector2.from(arrayVector))
  // .add('Vector2#to(Vector2)', () => vector2.to(arrayVector))

  if (addReferenceBenchmarks) {
    suite
      .group('Vector2 Type Conversion Cost')
      .add('Vector2.from#Array', () => vector2.from(array))
      .add('Vector2.from#Float32Array', () => vector2.from(float32Array))
      .add('Vector2.to#Array', () => vector2.to(array))
      .add('Vector2.to#Float32Array', () => vector2.to(float32Array));
  }

  return suite;
}
