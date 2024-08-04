// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {
  // typed arrays
  TypedArray,
  TypedArrayConstructor,
  BigTypedArray,
  BigTypedArrayConstructor,
  // numeric arrays (sized number arrays)
  NumberArray,
  NumberArray1,
  NumberArray2,
  NumberArray3,
  NumberArray4,
  NumberArray6,
  NumberArray8,
  NumberArray9,
  NumberArray12,
  NumberArray16,
  // numeric arrays (sized number arrays or typed arrays)
  NumericArray,
  NumericArray1,
  NumericArray2,
  NumericArray3,
  NumericArray4,
  NumericArray6,
  NumericArray8,
  NumericArray9,
  NumericArray12,
  NumericArray16
} from './array-types';

export {isTypedArray, isNumberArray, isNumericArray} from './is-array';

export type {Bounds, Bounds2D, Bounds3D} from './bounds-types';
