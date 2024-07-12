import {TypedArray, NumericArray} from './array-types';

/**
 * Check is an array is a typed array
 * @param value value to be tested
 * @returns input as TypedArray, or null
 */
export function isTypedArray(value: unknown): value is TypedArray {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

/**
 * Check is an array is a numeric array (typed array or array of numbers)
 * @param value value to be tested
 * @returns input as NumericArray, or null
 */
export function isNumericArray(value: unknown): value is NumericArray {
  if (Array.isArray(value)) {
    return value.length === 0 || typeof value[0] === 'number';
  }
  return isTypedArray(value);
}
