// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray, NumericArray, NumberArray} from './array-types';

/**
 * Check is an array is a typed array
 * @param value value to be tested
 * @returns input with type narrowed to TypedArray, or null
 */
export function isTypedArray(value: unknown): value is TypedArray {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

/**
 * Check is an array is an array of numbers)
 * @param value value to be tested
 * @returns input with type narrowed to NumberArray, or null
 */
export function isNumberArray(value: unknown): value is NumberArray {
  if (Array.isArray(value)) {
    return value.length === 0 || typeof value[0] === 'number';
  }
  return false;
}

/**
 * Check is an array is a numeric array (typed array or array of numbers)
 * @param value value to be tested
 * @returns input with type narrowed to NumericArray, or null
 */
export function isNumericArray(value: unknown): value is NumericArray {
  return isTypedArray(value) || isNumberArray(value);
}
