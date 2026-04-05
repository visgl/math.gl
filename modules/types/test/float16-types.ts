// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumericArray, TypedArray, TypedArrayConstructor} from '@math.gl/types';

type GlobalFloat16ArrayConstructor = typeof globalThis extends {Float16Array: infer T} ? T : never;
type GlobalFloat16Array = typeof globalThis extends {Float16Array: {prototype: infer T}}
  ? T
  : never;

declare const float16Array: GlobalFloat16Array;
declare const float16ArrayConstructor: GlobalFloat16ArrayConstructor;

const typedArray: TypedArray = float16Array;
const numericArray: NumericArray = float16Array;
const typedArrayConstructor: TypedArrayConstructor = float16ArrayConstructor;

void typedArray;
void numericArray;
void typedArrayConstructor;
