// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/types';

export type PrimitiveTopology =
  | 'point-list'
  | 'line-list'
  | 'line-strip'
  | 'triangle-list'
  | 'triangle-strip';

export type GeometryAttribute = {
  size?: number;
  value: TypedArray;
  constant?: boolean;
  normalized?: boolean;
  [key: string]: unknown;
};

export type GeometryAttributeInput = GeometryAttribute | TypedArray;
export type GeometryAttributes = Record<string, GeometryAttribute | undefined> & {
  indices?: GeometryAttribute & {size: 1; value: Uint16Array | Uint32Array};
};

export type GeometryProps = {
  id?: string;
  topology: PrimitiveTopology;
  vertexCount?: number;
  attributes: Record<string, GeometryAttributeInput>;
  indices?: GeometryAttributeInput;
};

let geometryId = 0;

/** A renderer-independent, typed-array-backed geometry container. */
export class Geometry {
  readonly id: string;
  readonly topology: PrimitiveTopology;
  readonly vertexCount: number;
  readonly indices?: GeometryAttribute;
  readonly attributes: Record<string, GeometryAttribute>;
  userData: Record<string, unknown> = {};

  constructor(props: GeometryProps) {
    this.id = props.id || `geometry-${++geometryId}`;
    this.topology = props.topology;
    this.attributes = {};

    let indices = props.indices ? normalizeAttribute(props.indices) : undefined;
    for (const [name, input] of Object.entries(props.attributes || {})) {
      const attribute = normalizeAttribute(input);
      if (name === 'POSITION' || name === 'positions') {
        attribute.size ||= 3;
      }
      if (name === 'indices') {
        if (indices) throw new Error('Geometry has multiple index attributes');
        indices = attribute;
      } else {
        this.attributes[name] = attribute;
      }
    }

    if (indices) {
      if (!(indices.value instanceof Uint16Array || indices.value instanceof Uint32Array)) {
        throw new Error('Geometry indices must be a Uint16Array or Uint32Array');
      }
      indices.size = 1;
      this.indices = indices;
    }

    this.vertexCount = props.vertexCount ?? calculateVertexCount(this.attributes, this.indices);
    if (!Number.isInteger(this.vertexCount) || this.vertexCount < 0) {
      throw new Error('Geometry vertexCount must be a non-negative integer');
    }
  }

  getVertexCount(): number {
    return this.vertexCount;
  }

  getAttributes(): GeometryAttributes {
    return (
      this.indices ? {indices: this.indices, ...this.attributes} : this.attributes
    ) as GeometryAttributes;
  }
}

function normalizeAttribute(input: GeometryAttributeInput): GeometryAttribute {
  const attribute = isTypedArray(input) ? {value: input} : {...input};
  if (!isTypedArray(attribute.value)) {
    throw new Error('Geometry attributes must contain a typed-array value');
  }
  if (attribute.size !== undefined && (!Number.isInteger(attribute.size) || attribute.size < 1)) {
    throw new Error('Geometry attribute size must be a positive integer');
  }
  if (attribute.size && attribute.value.length % attribute.size !== 0) {
    throw new Error('Geometry attribute length must be divisible by its size');
  }
  return attribute;
}

function isTypedArray(value: unknown): value is TypedArray {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

function calculateVertexCount(
  attributes: Record<string, GeometryAttribute>,
  indices?: GeometryAttribute
): number {
  if (indices) return indices.value.length;
  let count = Infinity;
  for (const attribute of Object.values(attributes)) {
    if (!attribute.constant && attribute.size) {
      count = Math.min(count, attribute.value.length / attribute.size);
    }
  }
  if (!Number.isFinite(count)) throw new Error('Geometry has no countable attributes');
  return count;
}
