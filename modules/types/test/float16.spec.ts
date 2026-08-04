// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  NativeFloat16ArrayConstructor,
  getFloat16ArrayConstructor,
  isFloat16ArrayConstructor,
  isTypedArray
} from '@math.gl/types';

test('math.gl#Float16Array constructor', t => {
  const Float16ArrayConstructor = getFloat16ArrayConstructor();
  const value = new Float16ArrayConstructor(1);

  t.ok(isTypedArray(value), 'selected constructor creates a typed array');

  if (NativeFloat16ArrayConstructor) {
    t.equal(
      Float16ArrayConstructor,
      NativeFloat16ArrayConstructor,
      'selects the native Float16Array constructor'
    );
    t.ok(
      isFloat16ArrayConstructor(Float16ArrayConstructor),
      'identifies the native Float16Array constructor'
    );
  } else {
    t.equal(Float16ArrayConstructor, Uint16Array, 'falls back to Uint16Array');
  }

  t.notOk(
    isFloat16ArrayConstructor(Uint16Array),
    'does not identify the Uint16Array fallback as native Float16Array'
  );
  t.end();
});
