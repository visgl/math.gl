// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {isTypedArray, type TypedArray} from '@math.gl/core/types';
import type {
  GeometryAttribute as CanonicalGeometryAttribute,
  PrimitiveTopology
} from '../lib/geometry';

/**
 * Geometry attributes accepted by processing utilities. The canonical `value`
 * field takes precedence when legacy `values` is also supplied.
 */
export type GeometryAttribute = Pick<CanonicalGeometryAttribute, 'size'> &
  ({value: TypedArray; values?: TypedArray} | {value?: undefined; values: TypedArray});

/** Minimal geometry shape understood by the geometry utilities. */
export type GeometryInput = {
  /** Connectivity of the indexed or sequential vertices. */
  topology: PrimitiveTopology | 'line-loop' | 'triangle-fan';
  /** Optional vertex indices in a packed array. */
  indices?: GeometryAttribute | TypedArray;
  /** Vertex attributes keyed by semantic name. */
  attributes: Record<string, GeometryAttribute>;
};

/**
 * Checks topology and attribute storage, including optional indices.
 * Individual operations validate their required attributes and element counts.
 */
export function isGeometry(value: unknown): value is GeometryInput {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const {topology, attributes, indices} = value as Partial<GeometryInput>;
  if (
    !attributes ||
    typeof attributes !== 'object' ||
    Array.isArray(attributes) ||
    ArrayBuffer.isView(attributes) ||
    !Object.values(attributes).every(isGeometryAttribute) ||
    (indices !== undefined && !isTypedArray(indices) && !isGeometryAttribute(indices))
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

/** Checks attribute storage and optional element size without modifying the input. */
function isGeometryAttribute(attribute: unknown): attribute is GeometryAttribute {
  if (!attribute || typeof attribute !== 'object') return false;
  const {value, values, size} = attribute as Partial<GeometryAttribute>;
  return (
    (value === undefined || isTypedArray(value)) &&
    (values === undefined || isTypedArray(values)) &&
    isTypedArray(value ?? values) &&
    (size === undefined || (Number.isInteger(size) && size > 0))
  );
}

/** Returns the typed array stored in a geometry attribute. */
export function getAttributeValues(attribute: unknown): TypedArray {
  if (isTypedArray(attribute)) return attribute;
  if (isGeometryAttribute(attribute)) return attribute.value ?? attribute.values;
  throw new TypeError('Geometry attribute does not contain valid typed-array values');
}

/** Returns a geometry's position attribute. */
export function getPositionAttribute(geometry: GeometryInput): GeometryAttribute {
  const position = geometry.attributes['POSITION'] || geometry.attributes['positions'];
  if (!position) {
    throw new Error('Geometry does not contain a position attribute');
  }
  return position;
}
