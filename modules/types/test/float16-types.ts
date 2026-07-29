// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumericArray, TypedArray, TypedArrayConstructor} from '@math.gl/types';

declare const float16Array: Float16Array;
declare const float16ArrayConstructor: Float16ArrayConstructor;

const typedArray: TypedArray = float16Array;
const numericArray: NumericArray = float16Array;
const typedArrayConstructor: TypedArrayConstructor = float16ArrayConstructor;

void typedArray;
void numericArray;
void typedArrayConstructor;
