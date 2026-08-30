// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray, TypedArrayConstructor} from '@math.gl/types';

/**
 * Iterates over the fixed-size elements of a typed array.
 *
 * For performance, each iteration reuses the same typed-array view-sized value.
 */
export function* makeAttributeIterator(values: TypedArray, size: number): Iterable<TypedArray> {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error('Attribute size must be a positive integer');
  }
  if (values.length % size !== 0) {
    throw new Error('Attribute length must be divisible by its size');
  }

  const ArrayType = values.constructor as TypedArrayConstructor;
  const element = new ArrayType(size);
  for (let index = 0; index < values.length; index += size) {
    for (let componentIndex = 0; componentIndex < size; componentIndex++) {
      element[componentIndex] = values[index + componentIndex]!;
    }
    yield element;
  }
}
