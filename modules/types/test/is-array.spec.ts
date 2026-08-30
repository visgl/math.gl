// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {isTypedArray, isNumericArray} from '../src/index';
import type {TypedArray, TypedArrayConstructor} from '../src/index';

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

test('math.gl#isTypedArray', () => {
  for (const tc of TEST_CASES) {
    expect(
      Boolean(isTypedArray(tc.value)),
      `isTypedArray(${JSON.stringify(tc.value)}) => ${tc.isTypedArray}`
    ).toBe(tc.isTypedArray);
  }
});

test.skipIf(typeof globalThis.Float16Array !== 'function')(
  'math.gl#isTypedArray(Float16Array)',
  () => {
    // Float16Array is not yet available in every JavaScript runtime supported by math.gl.
    const Float16ArrayConstructor = globalThis.Float16Array!;

    const typedArrayConstructor: TypedArrayConstructor = Float16ArrayConstructor;
    const value: TypedArray = new Float16ArrayConstructor(1);
    expect(typedArrayConstructor, 'Float16ArrayConstructor is a typed array constructor').toBe(
      Float16ArrayConstructor
    );
    expect(isTypedArray(value), 'Float16Array is a typed array').toBe(true);
    expect(isNumericArray(value), 'Float16Array is a numeric array').toBe(true);
  }
);

test('math.gl#isNumericArray', () => {
  for (const tc of TEST_CASES) {
    expect(
      Boolean(isNumericArray(tc.value)),
      `isNumericArray(${JSON.stringify(tc.value)}) => ${tc.isNumericArray}`
    ).toBe(tc.isNumericArray);
  }
});
