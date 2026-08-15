// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {
  NativeFloat16ArrayConstructor,
  getFloat16ArrayConstructor,
  isFloat16ArrayConstructor,
  isTypedArray
} from '@math.gl/types';

test('math.gl#Float16Array constructor', () => {
  const Float16ArrayConstructor = getFloat16ArrayConstructor();
  const value = new Float16ArrayConstructor(1);

  expect(isTypedArray(value), 'selected constructor creates a typed array').toBeTruthy();

  if (NativeFloat16ArrayConstructor) {
    expect(Float16ArrayConstructor, 'selects the native Float16Array constructor').toBe(
      NativeFloat16ArrayConstructor
    );
    expect(
      isFloat16ArrayConstructor(Float16ArrayConstructor),
      'identifies the native Float16Array constructor'
    ).toBeTruthy();
  } else {
    expect(Float16ArrayConstructor, 'falls back to Uint16Array').toBe(Uint16Array);
  }

  expect(
    isFloat16ArrayConstructor(Uint16Array),
    'does not identify the Uint16Array fallback as native Float16Array'
  ).toBeFalsy();
});
