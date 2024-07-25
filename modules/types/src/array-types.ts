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
export type NumberArrray4 = [number, number, number, number];

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
 interface IndexedCollection extends Iterable<number> {
  readonly length: number;
  [index: number]: number;
}

// prettier-ignore
declare type mat2 =
  | [number, number, 
     number, number]
  | IndexedCollection;

// prettier-ignore
declare type mat2d =
  | [number, number, 
     number, number, 
     number, number]
  | IndexedCollection;

// prettier-ignore
declare type mat3 =
  | [number, number, number, 
     number, number, number, 
     number, number, number]
  | IndexedCollection;

// prettier-ignore
declare type mat4 =
  | [number, number, number, number,
     number, number, number, number,
     number, number, number, number,
     number, number, number, number]
  | IndexedCollection;

declare type quat = [number, number, number, number] | IndexedCollection;

// prettier-ignore
declare type quat2 =
  | [number, number, number, number, 
    number, number, number, number]
  | IndexedCollection;

declare type vec2 = [number, number] | IndexedCollection;
declare type vec3 = [number, number, number] | IndexedCollection;
declare type vec4 = [number, number, number, number] | IndexedCollection;

// prettier-ignore
declare type ReadonlyMat2 =
  | readonly [
      number, number,
      number, number
    ]
  | IndexedCollection;

// prettier-ignore
declare type ReadonlyMat2d =
  | readonly [
      number, number,
      number, number,
      number, number
    ]
  | IndexedCollection;

// prettier-ignore
declare type ReadonlyMat3 =
  | readonly [
      number, number, number,
      number, number, number,
      number, number, number
    ]
  | IndexedCollection;

// prettier-ignore
declare type ReadonlyMat4 =
  | readonly [
      number, number, number, number,
      number, number, number, number,
      number, number, number, number,
      number, number, number, number
    ]
  | IndexedCollection;

declare type ReadonlyQuat = readonly [number, number, number, number] | IndexedCollection;

declare type ReadonlyQuat2 =
  | readonly [number, number, number, number, number, number, number, number]
  | IndexedCollection;

declare type ReadonlyVec2 = readonly [number, number] | IndexedCollection;
declare type ReadonlyVec3 = readonly [number, number, number] | IndexedCollection;
declare type ReadonlyVec4 = readonly [number, number, number, number] | IndexedCollection;
 */
