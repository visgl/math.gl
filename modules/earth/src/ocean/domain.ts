// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/**
 * Throws a `RangeError` when `value` is not finite or is outside `[min, max]`.
 * @param name - Parameter name for the error message.
 * @param value - Value to check.
 * @param min - Smallest permitted value.
 * @param max - Largest permitted value.
 * @returns The value, unchanged.
 */
export function checkRange(name: string, value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be a finite number from ${min} to ${max}, got ${value}`);
  }
  return value;
}

/**
 * Throws a `RangeError` when `value` is not finite.
 * @param name - Parameter name for the error message.
 * @param value - Value to check.
 * @returns The value, unchanged.
 */
export function checkFinite(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number, got ${value}`);
  }
  return value;
}
