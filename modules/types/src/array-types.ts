// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * TypeScript type covering all typed arrays
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

// TODO
// | BigInt64Array
// | BigUint64Array;

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
 * TypeScript type covering all typed arrays and classic arrays consisting of numbers
 */
export type NumericArray = TypedArray | number[];

/**
 * TypeScript type covering all typed arrays and classic arrays consisting of numbers
 * @note alias for NumericArray
 */
export type NumberArray = TypedArray | number[];

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
