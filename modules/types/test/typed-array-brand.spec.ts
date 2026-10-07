// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {isUint16Array, isFloat16Array} from '../src/index';
import {createForeignTypedArray} from '../../../test/utils/foreign-typed-array';

test('Uint16Array detection accepts foreign arrays and sliced columns', async () => {
  const foreign = (await createForeignTypedArray('Uint16Array', 16))!;
  expect(foreign instanceof Uint16Array).toBe(false);
  expect(isUint16Array(foreign)).toBe(true);
  expect(isUint16Array(foreign.subarray(2, 14))).toBe(true);
  expect(isFloat16Array(foreign)).toBe(false);
});

test('specific typed-array detection rejects incompatible and forged brands', async () => {
  const wrongType = new Int16Array(12);
  Object.defineProperty(wrongType, Symbol.toStringTag, {value: 'Uint16Array'});
  const wrongFloat = new Uint16Array(12);
  Object.defineProperty(wrongFloat, Symbol.toStringTag, {value: 'Float16Array'});
  for (const value of [
    null,
    undefined,
    {},
    [],
    new ArrayBuffer(24),
    new DataView(new ArrayBuffer(24)),
    new Float32Array(12),
    new Float64Array(12),
    new Uint8Array(12),
    wrongType,
    {[Symbol.toStringTag]: 'Uint16Array', length: 12},
    await createForeignTypedArray('Int16Array', 12)
  ]) {
    expect(isUint16Array(value)).toBe(false);
    expect(isFloat16Array(value)).toBe(false);
  }
  expect(isUint16Array(wrongFloat)).toBe(true);
  expect(isFloat16Array(wrongFloat)).toBe(false);
});

test('typed-array detection uses element brand even when public properties are overridden', () => {
  const values = new Uint16Array(12);
  Object.defineProperty(values, Symbol.toStringTag, {value: 'Float16Array'});
  Object.defineProperty(values, 'constructor', {value: Float32Array});
  expect(isUint16Array(values)).toBe(true);
  expect(isFloat16Array(values)).toBe(false);
});

test.skipIf(typeof globalThis.Float16Array !== 'function')(
  'Float16Array detection accepts native and foreign arrays without confusing integer samples',
  async () => {
    const local = new globalThis.Float16Array(12);
    const foreign = (await createForeignTypedArray('Float16Array', 12))!;
    expect(foreign instanceof globalThis.Float16Array).toBe(false);
    for (const values of [local, foreign, foreign.subarray(2)]) {
      expect(isFloat16Array(values)).toBe(true);
      expect(isUint16Array(values)).toBe(false);
    }
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'Float16Array')!;
    try {
      Object.defineProperty(globalThis, 'Float16Array', {...descriptor, value: undefined});
      expect(isFloat16Array(foreign)).toBe(true);
    } finally {
      Object.defineProperty(globalThis, 'Float16Array', descriptor);
    }
  }
);
