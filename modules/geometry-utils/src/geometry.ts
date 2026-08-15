// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/types';

/** A typed geometry attribute with either loaders.gl-style `value` or legacy `values` storage. */
export type GeometryAttribute = {
  value?: TypedArray;
  values?: TypedArray;
  size?: number;
};

/** Minimal geometry shape understood by the geometry utilities. */
export type Geometry = {
  mode: number;
  indices?: GeometryAttribute | TypedArray;
  attributes: Record<string, GeometryAttribute>;
};

/** Returns whether a value has the minimal geometry shape. */
export function isGeometry(value: unknown): value is Geometry {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const geometry = value as Partial<Geometry>;
  return typeof geometry.mode === 'number' && Boolean(geometry.attributes);
}

/** Returns the typed array stored in a geometry attribute. */
export function getAttributeValues(attribute: GeometryAttribute | TypedArray): TypedArray {
  if (ArrayBuffer.isView(attribute)) {
    return attribute as TypedArray;
  }
  const values = attribute.value || attribute.values;
  if (!values) {
    throw new Error('Geometry attribute does not contain typed-array values');
  }
  return values;
}

/** Returns a geometry's position attribute. */
export function getPositionAttribute(geometry: Geometry): GeometryAttribute {
  const position = geometry.attributes['POSITION'] || geometry.attributes['positions'];
  if (!position) {
    throw new Error('Geometry does not contain a position attribute');
  }
  return position;
}
