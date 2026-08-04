// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {isTypedArray, isNumericArray} from '@math.gl/types';
import type {TypedArray, TypedArrayConstructor} from '@math.gl/types';

const TEST_CASES: {value: unknown; isTypedArray: boolean; isNumericArray: boolean}[] = [
  {value: new Float32Array(1), isTypedArray: true, isNumericArray: true},
  {value: new Uint8Array(2), isTypedArray: true, isNumericArray: true},
  {value: [], isTypedArray: false, isNumericArray: true},
  {value: [100, 100], isTypedArray: false, isNumericArray: true},
  {value: ['a'], isTypedArray: false, isNumericArray: false},
  {value: new ArrayBuffer(4), isTypedArray: false, isNumericArray: false},
  {value: new DataView(new ArrayBuffer(16)), isTypedArray: false, isNumericArray: false},
  {value: undefined, isTypedArray: false, isNumericArray: false},
  {value: null, isTypedArray: false, isNumericArray: false},
  {value: {}, isTypedArray: false, isNumericArray: false},
  {value: {length: 0}, isTypedArray: false, isNumericArray: false},
  {value: 1, isTypedArray: false, isNumericArray: false},
  {value: NaN, isTypedArray: false, isNumericArray: false},
  {value: 'NaN', isTypedArray: false, isNumericArray: false},
  {value: '', isTypedArray: false, isNumericArray: false}
];

test('math.gl#isTypedArray', t => {
  for (const tc of TEST_CASES) {
    t.equal(
      Boolean(isTypedArray(tc.value)),
      tc.isTypedArray,
      `isTypedArray(${JSON.stringify(tc.value)}) => ${tc.isTypedArray}`
    );
  }
  t.end();
});

test('math.gl#isTypedArray(Float16Array)', t => {
  // Float16Array is not yet available in every JavaScript runtime supported by math.gl.
  const Float16ArrayConstructor = globalThis.Float16Array;
  if (typeof Float16ArrayConstructor !== 'function') {
    t.skip('Float16Array is not available in this runtime');
    t.end();
    return;
  }

  const typedArrayConstructor: TypedArrayConstructor = Float16ArrayConstructor;
  const value: TypedArray = new Float16ArrayConstructor(1);
  t.equal(
    typedArrayConstructor,
    Float16ArrayConstructor,
    'Float16ArrayConstructor is a typed array constructor'
  );
  t.equal(isTypedArray(value), true, 'Float16Array is a typed array');
  t.equal(isNumericArray(value), true, 'Float16Array is a numeric array');
  t.end();
});

test('math.gl#isNumericArray', t => {
  for (const tc of TEST_CASES) {
    t.equal(
      Boolean(isNumericArray(tc.value)),
      tc.isNumericArray,
      `isNumericArray(${JSON.stringify(tc.value)}) => ${tc.isNumericArray}`
    );
  }
  t.end();
});
