// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray, TypedArrayConstructor} from '@math.gl/types';
import type {GeometryAttribute} from './geometry';

type GeometryLike = {
  indices?: GeometryAttribute;
  attributes: Record<string, GeometryAttribute | undefined>;
};

/** Expands indexed attributes into a non-indexed geometry-like object. */
export function unpackIndexedGeometry<T extends GeometryLike>(geometry: T): GeometryLike {
  if (!geometry.indices) return geometry;
  const indices = geometry.indices.value;
  const attributes: Record<string, GeometryAttribute> = {};
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    if (!attribute) continue;
    if (attribute.constant || !attribute.size) {
      attributes[name] = attribute;
      continue;
    }
    const ArrayType = attribute.value.constructor as TypedArrayConstructor;
    const value = new ArrayType(indices.length * attribute.size) as TypedArray;
    for (let i = 0; i < indices.length; i++) {
      for (let component = 0; component < attribute.size; component++) {
        value[i * attribute.size + component] =
          attribute.value[Number(indices[i]) * attribute.size + component];
      }
    }
    attributes[name] = {...attribute, value};
  }
  return {attributes};
}
