// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {GL, transformGeometry, mergeGeometries, weldGeometry, getDegenerateTriangles} from '../src';
import type {Geometry} from '../src';
const triangle = (): Geometry => ({
  mode: GL.TRIANGLES,
  attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}}
});
function values(geometry: Geometry, name = 'POSITION'): number[] {
  return Array.from(geometry.attributes[name].value);
}

test('affine transformations copy inputs and preserve fractional coordinates from integer sources', () => {
  const input = triangle(),
    before = values(input);
  const output = transformGeometry(input, new Matrix4().translate([2, 3, 4]).scale([2, 3, 4]));
  expect(values(output)).toEqual([2, 3, 4, 4, 3, 4, 2, 6, 4]);
  expect(values(input)).toEqual(before);
  expect(output.indices).toEqual(new Uint32Array([0, 1, 2]));
  input.attributes.POSITION.value = new Int16Array(before);
  expect(values(transformGeometry(input, new Matrix4().translate([0.5, 0, 0])))[0]).toBe(0.5);
});

test('nonuniform normal transforms, tangent orthogonalization and reflections are consistent', () => {
  const input = triangle();
  input.attributes.NORMAL = {size: 3, value: new Float32Array([1, 1, 0, 1, 1, 0, 1, 1, 0])};
  input.attributes.TANGENT = {
    size: 4,
    value: new Float32Array([1, -1, 0, 1, 1, -1, 0, 1, 1, -1, 0, 1])
  };
  const scaled = transformGeometry(input, new Matrix4().scale([2, 1, 1]));
  const normals = values(scaled, 'NORMAL'),
    tangents = values(scaled, 'TANGENT');
  expect(normals[0]).toBeCloseTo(1 / Math.sqrt(5));
  expect(normals[1]).toBeCloseTo(2 / Math.sqrt(5));
  expect(normals[0] * tangents[0] + normals[1] * tangents[1]).toBeCloseTo(0);
  const reflected = transformGeometry(input, new Matrix4().scale([-1, 1, 1]));
  expect(reflected.indices).toEqual(new Uint32Array([0, 2, 1]));
  expect(values(reflected, 'TANGENT')[3]).toBe(-1);
  expect(() => transformGeometry(input, new Matrix4().scale([0, 1, 1]))).toThrow(/invertible/);
});

test('merging offsets indices, retains attribute types, and supports legacy values', () => {
  const a = triangle(),
    b = triangle();
  b.attributes.POSITION = {size: 3, values: b.attributes.POSITION.value};
  const output = mergeGeometries([a, b]);
  expect(output.indices).toEqual(new Uint32Array([0, 1, 2, 3, 4, 5]));
  expect(output.attributes.POSITION.value).toBeInstanceOf(Float32Array);
  expect(values(output)).toEqual([...values(a), ...values(a)]);
  expect(() => mergeGeometries([])).toThrow();
  b.attributes.COLOR = {size: 3, value: new Float32Array(9)};
  expect(() => mergeGeometries([a, b])).toThrow(/names/);
});

test('welding preserves UV seams and normal discontinuities while returning provenance', () => {
  const input: Geometry = {
    mode: GL.TRIANGLES,
    attributes: {
      POSITION: {
        size: 3,
        value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0])
      },
      TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])}
    }
  };
  const result = weldGeometry(input);
  expect(result.removedVertices).toBe(3);
  expect(result.vertexMap).toEqual(new Uint32Array([0, 1, 2, 0, 1, 2]));
  expect(result.geometry.indices).toEqual(new Uint32Array([0, 1, 2, 0, 1, 2]));
  input.attributes.TEXCOORD_0.value[6] = 0.5;
  expect(weldGeometry(input).removedVertices).toBe(2);
  input.attributes.NORMAL = {
    size: 3,
    value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1])
  };
  expect(weldGeometry(input).removedVertices).toBe(0);
});

test('position-grid welding is opt-in and preserves the first tuple', () => {
  const input: Geometry = {
    mode: GL.TRIANGLES,
    attributes: {POSITION: {size: 3, value: new Float64Array([0.01, 0, 0, 0.02, 0, 0, 1, 0, 0])}}
  };
  expect(weldGeometry(input).removedVertices).toBe(0);
  const output = weldGeometry(input, {positionGridSize: 0.1});
  expect(output.removedVertices).toBe(1);
  expect(values(output.geometry)[0]).toBe(0.01);
  expect(getDegenerateTriangles(output.geometry)).toEqual(new Uint32Array([0]));
});

test('degenerate detection uses filled area and returns original triangle numbers', () => {
  const input = triangle();
  input.indices = new Uint32Array([0, 1, 2, 0, 0, 1]);
  expect(getDegenerateTriangles(input)).toEqual(new Uint32Array([1]));
  expect(getDegenerateTriangles(input, 0.5)).toEqual(new Uint32Array([0, 1]));
  expect(
    getDegenerateTriangles(transformGeometry(triangle(), new Matrix4().scale([0, 1, 1])))
  ).toEqual(new Uint32Array([0]));
});

test('invalid topology, attribute layouts, indices and transforms are rejected', () => {
  const bad = triangle();
  bad.mode = GL.TRIANGLE_STRIP;
  expect(() => weldGeometry(bad)).toThrow();
  const input = triangle();
  input.indices = new Uint32Array([0, 1, 3]);
  expect(() => getDegenerateTriangles(input)).toThrow();
  delete input.indices;
  input.attributes.NORMAL = {size: 3, value: new Float32Array(6)};
  expect(() => mergeGeometries([input])).toThrow();
  expect(() => transformGeometry(triangle(), new Matrix4().perspective({fovy: 1}))).toThrow(
    /affine/
  );
  expect(() => weldGeometry(triangle(), {positionGridSize: -1})).toThrow();
  expect(() => getDegenerateTriangles(triangle(), NaN)).toThrow();
});

test('extreme invertible scales preserve normals, tangents and reflection winding', () => {
  const input = triangle();
  input.attributes.NORMAL = {size: 3, value: new Float64Array([1, 1, 1, 1, 1, 1, 1, 1, 1])};
  input.attributes.TANGENT = {
    size: 4,
    value: new Float64Array([1, -1, 0, 1, 1, -1, 0, 1, 1, -1, 0, 1])
  };
  for (const scale of [
    [1e-200, 1e-200, 1e200],
    [1e200, 1e200, 1e-200],
    [-1e-200, 1e-200, 1e200]
  ]) {
    const output = transformGeometry(input, new Matrix4().scale(scale));
    const n = values(output, 'NORMAL').slice(0, 3);
    const t = values(output, 'TANGENT').slice(0, 3);
    expect(n.every(Number.isFinite)).toBe(true);
    expect(Math.hypot(...n)).toBeCloseTo(1);
    expect(Math.hypot(...t)).toBeCloseTo(1);
    expect(n.reduce((sum, v, i) => sum + v * t[i], 0)).toBeCloseTo(0);
    if (scale[0] < 0) {
      expect(n[0]).toBeCloseTo(-1 / Math.sqrt(2));
      expect(output.indices).toEqual(new Uint32Array([0, 2, 1]));
      expect(values(output, 'TANGENT')[3]).toBe(-1);
    }
  }
});

test('degenerate area checks avoid cross-product overflow and underflow', () => {
  const mesh = (positions: number[]): Geometry => ({
    mode: GL.TRIANGLES,
    attributes: {POSITION: {size: 3, value: new Float64Array(positions)}}
  });
  expect(getDegenerateTriangles(mesh([0, 0, 0, 1e155, 1e155, 0, 2e155, 2e155, 0]))).toEqual(
    new Uint32Array([0])
  );
  expect(getDegenerateTriangles(mesh([0, 0, 0, 1e155, 0, 0, 0, 1e155, 0]))).toEqual(
    new Uint32Array()
  );
  expect(getDegenerateTriangles(mesh([-1e308, 0, 0, 1e308, 0, 0, 0, 0, 0]))).toEqual(
    new Uint32Array([0])
  );
  const tiny = mesh([0, 0, 0, 1e-200, 0, 0, 0, 1e-200, 0]);
  expect(getDegenerateTriangles(tiny)).toEqual(new Uint32Array());
  expect(getDegenerateTriangles(tiny, 1e-300)).toEqual(new Uint32Array([0]));
});
