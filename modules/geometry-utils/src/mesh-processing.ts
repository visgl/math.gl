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
  // Factor out independent column scales before testing orientation/invertibility.
  // A raw determinant can underflow or overflow for finite invertible matrices.
  const columns = [0, 4, 8].map(offset => Array.from(matrix).slice(offset, offset + 3));
  const scales = columns.map(column => Math.max(...column.map(Math.abs)));
  const basis = columns.map((column, i) => column.map(v => (scales[i] ? v / scales[i] : 0)));
  const cofactors = [
    cross(basis[1], basis[2]),
    cross(basis[2], basis[0]),
    cross(basis[0], basis[1])
  ];
  const determinant = basis[0].reduce((sum, v, i) => sum + v * cofactors[0][i], 0);
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
    const output = new Float64Array(mesh.count * 3);
    for (let i = 0; i < mesh.count; i++) {
      const value = normalizedLinearCombination(
        cofactors,
        Array.from(input.value.slice(i * 3, i * 3 + 3)),
        scales.map(v => -Math.log(v))
      );
      output.set(
        value.map(v => (determinant < 0 ? -v : v)),
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
      const value = normalizedLinearCombination(
        basis,
        Array.from(input.value.slice(i * 4, i * 4 + 3)),
        scales.map(Math.log)
      );
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
    // Keep the common path in floating point, but use exact dyadic arithmetic
    // when normalization loses a component or cannot distinguish collinearity.
    const scaleAB = Math.max(...ab.map(Math.abs));
    const scaleAC = Math.max(...ac.map(Math.abs));
    const normalizedAB = ab.map(v => (scaleAB ? v / scaleAB : 0));
    const normalizedAC = ac.map(v => (scaleAC ? v / scaleAC : 0));
    const crossLength = Math.hypot(...cross(normalizedAB, normalizedAC));
    const lostComponent = [ab, ac].some((edge, i) =>
      edge.some((v, axis) => v !== 0 && (i ? normalizedAC : normalizedAB)[axis] === 0)
    );
    if (!Number.isFinite(crossLength) || crossLength === 0 || lostComponent) {
      if (exactAreaAtMost(positions, a, b, c, areaEpsilon)) result.push(i / 3);
    } else {
      const logArea = Math.log(crossLength) + Math.log(scaleAB) + Math.log(scaleAC) - Math.log(2);
      if (areaEpsilon > 0 && logArea <= Math.log(areaEpsilon)) result.push(i / 3);
    }
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

function cross(a: number[], b: number[]): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Direction-only multiplication, avoiding overflow in scale-weighted components. */
function normalizedLinearCombination(
  columns: number[][],
  vector: number[],
  logScales: number[]
): number[] {
  const logs = vector.map((v, i) => (v ? Math.log(Math.abs(v)) + logScales[i] : -Infinity));
  const largest = Math.max(...logs);
  if (largest === -Infinity) return [0, 0, 0];
  const weights = logs.map((v, i) => Math.sign(vector[i]) * Math.exp(v - largest));
  const result = [0, 1, 2].map(axis =>
    columns.reduce((sum, column, i) => sum + column[axis] * weights[i], 0)
  );
  const length = Math.hypot(...result);
  return result.map(v => (length ? v / length : 0));
}

// Every finite binary64 value is an integer times a power of two. The fallback
// compares squared cross lengths to 4*epsilon² without floating-point products.
type Dyadic = {n: bigint; exponent: number};
function exactAreaAtMost(
  positions: TypedArray,
  a: number,
  b: number,
  c: number,
  epsilon: number
): boolean {
  const edge = (end: number) =>
    [0, 1, 2].map(axis =>
      subtractDyadic(toDyadic(positions[end + axis]), toDyadic(positions[a + axis]))
    );
  const ab = edge(b),
    ac = edge(c);
  const components = [0, 1, 2].map(axis => {
    const j = (axis + 1) % 3,
      k = (axis + 2) % 3;
    return subtractDyadic(multiplyDyadic(ab[j], ac[k]), multiplyDyadic(ab[k], ac[j]));
  });
  if (epsilon === 0) return components.every(v => v.n === 0n);
  const squared = components.map(v => multiplyDyadic(v, v));
  const sum = squared.reduce((total, v) => subtractDyadic(total, {...v, n: -v.n}), {
    n: 0n,
    exponent: 0
  });
  const threshold = multiplyDyadic(toDyadic(epsilon), toDyadic(epsilon));
  threshold.exponent += 2;
  return subtractDyadic(sum, threshold).n <= 0n;
}
function toDyadic(value: number): Dyadic {
  const bits = new DataView(new ArrayBuffer(8));
  bits.setFloat64(0, value);
  const high = bits.getUint32(0),
    low = bits.getUint32(4);
  const exponentBits = (high >>> 20) & 0x7ff;
  const fraction = (BigInt(high & 0xfffff) << 32n) | BigInt(low);
  const n = exponentBits ? (1n << 52n) | fraction : fraction;
  return {n: high >>> 31 ? -n : n, exponent: exponentBits ? exponentBits - 1075 : -1074};
}
function subtractDyadic(a: Dyadic, b: Dyadic): Dyadic {
  const exponent = Math.min(a.exponent, b.exponent);
  return {
    n: (a.n << BigInt(a.exponent - exponent)) - (b.n << BigInt(b.exponent - exponent)),
    exponent
  };
}
function multiplyDyadic(a: Dyadic, b: Dyadic): Dyadic {
  return {n: a.n * b.n, exponent: a.exponent + b.exponent};
}
