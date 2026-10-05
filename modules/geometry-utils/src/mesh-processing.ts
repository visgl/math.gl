// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {TypedArray, TypedArrayConstructor} from '@math.gl/types';
import {GL} from './constants';
import {getAttributeValues, type Geometry, type GeometryAttribute} from './geometry';

type MeshData = {
  attributes: Record<string, {value: TypedArray; size: number}>;
  position: string;
  count: number;
  indices: Uint32Array;
};

/** Fresh, indexed triangle-list geometry. No input buffers are changed. */
export function transformGeometry(
  geometry: Geometry,
  matrix: Readonly<ArrayLike<number>>
): Geometry {
  const mesh = readMesh(geometry);
  if (
    matrix.length !== 16 ||
    Array.from(matrix).some(v => !Number.isFinite(v)) ||
    matrix[3] !== 0 ||
    matrix[7] !== 0 ||
    matrix[11] !== 0 ||
    matrix[15] !== 1
  ) {
    throw new RangeError('Transform must be a finite affine column-major matrix');
  }
  const transform = new Matrix4(Array.from(matrix));
  const determinant = transform.determinant();
  const attributes = copyAttributes(mesh.attributes);
  const normalName = attributes['NORMAL'] ? 'NORMAL' : attributes['normals'] ? 'normals' : null;
  const tangentName = attributes['TANGENT'] ? 'TANGENT' : null;
  if ((normalName || tangentName) && (!Number.isFinite(determinant) || determinant === 0))
    throw new RangeError('Normals and tangents require an invertible transform');
  const positions = new Float64Array(mesh.count * 3);
  const source = mesh.attributes[mesh.position].value;
  for (let i = 0; i < mesh.count; i++) {
    const point = transform.transformAsPoint([source[i * 3], source[i * 3 + 1], source[i * 3 + 2]]);
    positions.set(point, i * 3);
  }
  attributes[mesh.position] = {size: 3, value: positions};
  if (normalName) {
    const input = mesh.attributes[normalName];
    if (input.size !== 3) throw new RangeError('Normals must have size 3');
    const inverseTranspose = transform.clone().invert().transpose();
    const output = new Float64Array(mesh.count * 3);
    for (let i = 0; i < mesh.count; i++) {
      const value = inverseTranspose.transformAsVector(
        Array.from(input.value.slice(i * 3, i * 3 + 3))
      );
      const length = Math.hypot(...value);
      output.set(
        value.map(v => (length ? v / length : 0)),
        i * 3
      );
    }
    attributes[normalName] = {size: 3, value: output};
  }
  if (tangentName) {
    const input = mesh.attributes[tangentName];
    if (input.size !== 4) throw new RangeError('Tangents must have size 4');
    const output = new Float64Array(mesh.count * 4);
    for (let i = 0; i < mesh.count; i++) {
      const value = transform.transformAsVector(Array.from(input.value.slice(i * 4, i * 4 + 3)));
      if (normalName) {
        const n = attributes[normalName].value.slice(i * 3, i * 3 + 3);
        const projection = value[0] * n[0] + value[1] * n[1] + value[2] * n[2];
        for (let axis = 0; axis < 3; axis++) value[axis] -= projection * n[axis];
      }
      const length = Math.hypot(...value);
      output.set(
        value.map(v => (length ? v / length : 0)),
        i * 4
      );
      output[i * 4 + 3] = input.value[i * 4 + 3] * (determinant < 0 ? -1 : 1);
    }
    attributes[tangentName] = {size: 4, value: output};
  }
  const indices = mesh.indices.slice();
  if (determinant < 0)
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  return {mode: GL.TRIANGLES, attributes, indices};
}

/** Concatenates compatible triangle meshes and offsets vertex indices. */
export function mergeGeometries(geometries: readonly Geometry[]): Geometry {
  if (!geometries.length) throw new RangeError('At least one geometry is required');
  const meshes = geometries.map(readMesh),
    first = meshes[0],
    names = Object.keys(first.attributes).sort();
  let count = 0,
    indexCount = 0;
  for (const mesh of meshes) {
    if (
      mesh.position !== first.position ||
      Object.keys(mesh.attributes).length !== names.length ||
      names.some(name => !Object.prototype.hasOwnProperty.call(mesh.attributes, name))
    )
      throw new RangeError('Attribute names must match');
    for (const name of names) {
      if (
        mesh.attributes[name].size !== first.attributes[name].size ||
        mesh.attributes[name].value.constructor !== first.attributes[name].value.constructor
      ) {
        throw new RangeError('Attribute sizes and storage types must match');
      }
    }
    count += mesh.count;
    indexCount += mesh.indices.length;
  }
  if (count > 0xffffffff) throw new RangeError('Geometry exceeds 32-bit indexing');
  const attributes: Record<string, GeometryAttribute> = {};
  for (const name of names) {
    const attribute = first.attributes[name],
      Constructor = attribute.value.constructor as TypedArrayConstructor;
    const value = new Constructor(count * attribute.size);
    let offset = 0;
    for (const mesh of meshes) {
      value.set(mesh.attributes[name].value, offset);
      offset += mesh.attributes[name].value.length;
    }
    attributes[name] = {size: attribute.size, value};
  }
  const indices = new Uint32Array(indexCount);
  let vertexOffset = 0,
    indexOffset = 0;
  for (const mesh of meshes) {
    for (const index of mesh.indices) indices[indexOffset++] = index + vertexOffset;
    vertexOffset += mesh.count;
  }
  return {mode: GL.TRIANGLES, attributes, indices};
}

export type WeldGeometryOptions = {
  /** Position quantization step; zero means exact matching. */ positionGridSize?: number;
};
export type WeldGeometryResult = {
  geometry: Geometry;
  vertexMap: Uint32Array;
  removedVertices: number;
};

/** Welds full attribute tuples, preserving UV seams and hard normal edges. */
export function weldGeometry(
  geometry: Geometry,
  options: WeldGeometryOptions = {}
): WeldGeometryResult {
  const mesh = readMesh(geometry),
    grid = options.positionGridSize ?? 0;
  if (!Number.isFinite(grid) || grid < 0)
    throw new RangeError('positionGridSize must be finite and nonnegative');
  const names = Object.keys(mesh.attributes).sort(),
    keys = new Map<string, number>(),
    rows: number[] = [],
    vertexMap = new Uint32Array(mesh.count);
  for (let i = 0; i < mesh.count; i++) {
    const tuple: number[] = [];
    for (const name of names) {
      const attribute = mesh.attributes[name];
      for (let component = 0; component < attribute.size; component++) {
        const value = attribute.value[i * attribute.size + component];
        const quantized = name === mesh.position && grid ? Math.round(value / grid) : value;
        if (!Number.isFinite(quantized)) throw new RangeError('Position quantization overflow');
        tuple.push(quantized);
      }
    }
    const key = tuple.join(',');
    let row = keys.get(key);
    if (row === undefined) {
      row = rows.length;
      keys.set(key, row);
      rows.push(i);
    }
    vertexMap[i] = row;
  }
  const attributes: Record<string, GeometryAttribute> = {};
  for (const name of names) {
    const attribute = mesh.attributes[name],
      Constructor = attribute.value.constructor as TypedArrayConstructor;
    const value = new Constructor(rows.length * attribute.size);
    rows.forEach((row, i) =>
      value.set(
        attribute.value.subarray(row * attribute.size, (row + 1) * attribute.size),
        i * attribute.size
      )
    );
    attributes[name] = {size: attribute.size, value};
  }
  return {
    geometry: {
      mode: GL.TRIANGLES,
      attributes,
      indices: Uint32Array.from(mesh.indices, index => vertexMap[index])
    },
    vertexMap,
    removedVertices: mesh.count - rows.length
  };
}

/** Returns triangle numbers with area <= areaEpsilon, in original draw order. */
export function getDegenerateTriangles(geometry: Geometry, areaEpsilon = 0): Uint32Array {
  if (!Number.isFinite(areaEpsilon) || areaEpsilon < 0)
    throw new RangeError('Area epsilon must be finite and nonnegative');
  const mesh = readMesh(geometry),
    positions = mesh.attributes[mesh.position].value,
    result: number[] = [];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = Array.from(mesh.indices.subarray(i, i + 3), index => index * 3);
    const ab = [
      positions[b] - positions[a],
      positions[b + 1] - positions[a + 1],
      positions[b + 2] - positions[a + 2]
    ];
    const ac = [
      positions[c] - positions[a],
      positions[c + 1] - positions[a + 1],
      positions[c + 2] - positions[a + 2]
    ];
    const area =
      Math.hypot(
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0]
      ) / 2;
    if (area <= areaEpsilon) result.push(i / 3);
  }
  return Uint32Array.from(result);
}

function readMesh(geometry: Geometry): MeshData {
  if (geometry.mode !== GL.TRIANGLES)
    throw new RangeError('Packed triangle-list geometry is required');
  const position = geometry.attributes['POSITION']
    ? 'POSITION'
    : geometry.attributes['positions']
      ? 'positions'
      : null;
  if (!position) throw new RangeError('POSITION or positions is required');
  const attributes: MeshData['attributes'] = {};
  let count: number;
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const value = getAttributeValues(attribute),
      size = attribute.size ?? (name === position ? 3 : undefined);
    if (!Number.isSafeInteger(size) || size < 1 || value.length % size)
      throw new RangeError('Attributes need explicit packed sizes');
    const length = value.length / size;
    if (name === position) {
      if (size !== 3) throw new RangeError('Positions must have size 3');
      count = length;
    }
    for (const component of value)
      if (!Number.isFinite(component)) throw new RangeError('Attributes must be finite');
    attributes[name] = {value, size};
  }
  for (const attribute of Object.values(attributes))
    if (attribute.value.length / attribute.size !== count)
      throw new RangeError('Attribute vertex counts must match');
  if (count > 0xffffffff) throw new RangeError('Geometry exceeds 32-bit indexing');
  const input = geometry.indices
    ? getAttributeValues(geometry.indices)
    : Uint32Array.from({length: count}, (_, i) => i);
  if (input.length % 3) throw new RangeError('Indices must form triangles');
  for (const index of input)
    if (!Number.isSafeInteger(index) || index < 0 || index >= count)
      throw new RangeError('Vertex index is out of bounds');
  return {attributes, position, count, indices: Uint32Array.from(input)};
}
function copyAttributes(attributes: MeshData['attributes']): Record<string, GeometryAttribute> {
  return Object.fromEntries(
    Object.entries(attributes).map(([name, attribute]) => [
      name,
      {size: attribute.size, value: attribute.value.slice()}
    ])
  );
}
