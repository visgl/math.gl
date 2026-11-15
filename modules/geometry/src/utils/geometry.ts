// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/core';
import type {PrimitiveTopology} from '../lib/geometry';

/** A typed geometry attribute with either loaders.gl-style `value` or legacy `values` storage. */
export type GeometryAttribute = {
  /** Attribute data in canonical storage. */
  value?: TypedArray;
  /** Alternate field for attribute data. */
  values?: TypedArray;
  /** Number of components per element. */
  size?: number;
};

/** Minimal geometry shape understood by the geometry utilities. */
export type GeometryInput = {
  /** Connectivity of the indexed or sequential vertices. */
  topology: PrimitiveTopology | 'line-loop' | 'triangle-fan';
  /** Optional vertex indices in a packed array. */
  indices?: GeometryAttribute | TypedArray;
  /** Vertex attributes keyed by semantic name. */
  attributes: Record<string, GeometryAttribute>;
};

/** Returns whether a value has the minimal geometry shape. */
export function isGeometry(value: unknown): value is GeometryInput {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const {topology, attributes} = value as Partial<GeometryInput>;
  if (
    !attributes ||
    typeof attributes !== 'object' ||
    Array.isArray(attributes) ||
    ArrayBuffer.isView(attributes)
  ) {
    return false;
  }
  switch (topology) {
    case 'point-list':
    case 'line-list':
    case 'line-strip':
    case 'line-loop':
    case 'triangle-list':
    case 'triangle-strip':
    case 'triangle-fan':
      return true;
    default:
      return false;
  }
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
export function getPositionAttribute(geometry: GeometryInput): GeometryAttribute {
  const position = geometry.attributes['POSITION'] || geometry.attributes['positions'];
  if (!position) {
    throw new Error('Geometry does not contain a position attribute');
  }
  return position;
}
