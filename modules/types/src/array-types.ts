// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Type covering all non-big typed arrays
 */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

/**
 * Type covering constructors for all non-big typed arrays
 */
export type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

/**
 * Type covering all big typed arrays
 */
export type BigTypedArray = BigInt64Array | BigUint64Array;

/**
 * Type covering constructors for all big typed arrays
 */
export type BigTypedArrayConstructor = BigInt64ArrayConstructor | BigUint64ArrayConstructor;

/**
 * Type for classic arrays consisting of numbers
 * @note Included for completeness / orthogonality, prefer `number[]` in actual use
 */
export type NumberArray = number[];

/** Array with exactly 1 number */
export type NumberArray1 = [number];

/** Array with exactly 2 numbers */
export type NumberArray2 = [number, number];

/** Array with exactly 3 numbers */
export type NumberArray3 = [number, number, number];

/** Array with exactly 4 numbers */
export type NumberArray4 = [number, number, number, number];

/** Array with exactly 6 numbers */
export type NumberArray6 = [number, number, number, number, number, number];

/** Array with exactly 8 numbers */
export type NumberArray8 = [number, number, number, number, number, number, number, number];

/** Array with exactly 9 numbers */
export type NumberArray9 = [number, number, number, number, number, number, number, number, number];

/** Array with exactly 12 numbers */
export type NumberArray12 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

/** Array with exactly 16 numbers */
export type NumberArray16 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

/**
 * Type covering classic arrays consisting of numbers as well as typed arrays
 */
export type NumericArray = TypedArray | number[];

/** Array with exactly 1 number, or a typed array */
export type NumericArray1 = NumberArray1 | TypedArray;

/** Array with exactly 2 numbers, or a typed array */
export type NumericArray2 = NumberArray2 | TypedArray;

/** Array with exactly 3 numbers, or a typed array */
export type NumericArray3 = NumberArray3 | TypedArray;

/** Array with exactly 4 numbers, or a typed array */
export type NumericArray4 = NumberArray4 | TypedArray;

/** Array with exactly 6 numbers, or a typed array */
export type NumericArray6 = NumberArray6 | TypedArray;

/** Array with exactly 8 numbers, or a typed array */
export type NumericArray8 = NumberArray8 | TypedArray;

/** Array with exactly 9 numbers, or a typed array */
export type NumericArray9 = NumberArray9 | TypedArray;

/** Array with exactly 12 numbers, or a typed array */
export type NumericArray12 = NumberArray12 | TypedArray;

/** Array with exactly 16 numbers, or a typed array */
export type NumericArray16 = NumberArray16 | TypedArray;
