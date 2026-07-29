// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArrayConstructor} from './array-types';

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
