// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArrayConstructor} from './array-types';

/**
 * The native `Float16Array` constructor exposed by the current JavaScript runtime.
 *
 * @remarks This is `undefined` when the runtime does not provide `Float16Array`.
 */
export const NativeFloat16ArrayConstructor: TypedArrayConstructor | undefined =
  globalThis.Float16Array;

/**
 * Returns a constructor suitable for storing 16-bit floating-point data.
 *
 * @returns The native `Float16Array` constructor when available, otherwise `Uint16Array`.
 * @remarks The `Uint16Array` fallback stores float16 bit patterns rather than numeric float16
 * values.
 */
export function getFloat16ArrayConstructor(): TypedArrayConstructor {
  return NativeFloat16ArrayConstructor ?? Uint16Array;
}

/**
 * Checks whether a value is the native `Float16Array` constructor for the current runtime.
 *
 * @param value The value to test.
 * @returns `true` when `value` is the native `Float16Array` constructor.
 */
export function isFloat16ArrayConstructor(value: unknown): boolean {
  return Boolean(NativeFloat16ArrayConstructor && value === NativeFloat16ArrayConstructor);
}
