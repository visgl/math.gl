// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeometryAttributeInput} from '../lib/geometry';

export type PrimitiveGeometryProps = {
  id?: string;
  attributes?: Record<string, GeometryAttributeInput>;
};

export function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be greater than zero`);
}

export function assertNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be non-negative`);
}

export function assertSegments(value: number, name: string, minimum = 1): void {
  if (!Number.isInteger(value) || value < minimum)
    throw new Error(`${name} must be an integer >= ${minimum}`);
}

export function makeIndices(vertexCount: number, values: number[]): Uint16Array | Uint32Array {
  return vertexCount > 0xffff ? new Uint32Array(values) : new Uint16Array(values);
}

export type MeshData = {
  positions: number[];
  normals: number[];
  texCoords: number[];
  indices: number[];
};
