// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TypedArrayConstructor} from './array-types';
import {getTypedArrayName} from './typed-array-brand';

/**
 * Checks for native Float16Array values, including arrays from other realms.
 * Does not identify Uint16Array binary16 storage as a decoded Float16Array.
 * Does not require a Float16Array constructor in the current realm.
 */
export function isFloat16Array(value: unknown): value is Float16Array {
  return getTypedArrayName(value) === 'Float16Array';
}

/**
 * The native `Float16Array` constructor exposed by the current JavaScript runtime.
 *
 * @remarks This is `undefined` when the runtime does not provide `Float16Array`. The value is
 * captured when this module is evaluated, so a polyfill must be installed before importing
 * `@math.gl/types`.
 */
export const NativeFloat16ArrayConstructor: TypedArrayConstructor | undefined =
  globalThis.Float16Array;

/**
 * Returns the typed array constructor used for half-precision storage.
 *
 * @returns The native `Float16Array` constructor when available, otherwise `Uint16Array`.
 * @remarks The `Uint16Array` fallback stores encoded IEEE 754 binary16 bit patterns. Unlike a
 * native `Float16Array`, it does not encode numeric assignments or decode values when read.
 */
export function getFloat16ArrayConstructor(): TypedArrayConstructor {
  return NativeFloat16ArrayConstructor ?? Uint16Array;
}

/**
 * Checks whether a value is the native `Float16Array` constructor for the current runtime.
 *
 * @param value The value to test.
 * @returns `true` when `value` matches `NativeFloat16ArrayConstructor`. Returns `false` for the
 * `Uint16Array` fallback.
 */
export function isFloat16ArrayConstructor(value: unknown): boolean {
  return Boolean(NativeFloat16ArrayConstructor && value === NativeFloat16ArrayConstructor);
}
