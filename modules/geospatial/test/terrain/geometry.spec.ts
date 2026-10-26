// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField, TerrainSampleStatus as Status} from '@math.gl/geospatial/terrain';
import {HeightFieldGeometry} from '@math.gl/geospatial/terrain/geometry';

test('mesh centroids and geometric normals agree with triangle sampling for both diagonals and handedness', () => {
  for (const diagonal of ['00-11', '10-01'] as const) {
    for (const rowStep of [
      [-1, 3],
      [-1, -3]
    ] as const) {
      const field = new HeightField({
        width: 3,
        height: 2,
        heights: new Float64Array([1, 2, 8, -1, 5, 2]),
        diagonal,
        origin: [100, 200],
        columnStep: [2, 1],
        rowStep
      });
      const mesh = new HeightFieldGeometry(field, {precision: 'float64', origin: [100, 200, 5]});
      expect(mesh.topology).toBe('triangle-list');
      expect(mesh.getVertexCount()).toBe(12);
      const positions = mesh.attributes.POSITION.value;
      const indices = mesh.indices!.value;
      for (let i = 0; i < indices.length; i += 3) {
        const a = Number(indices[i]) * 3;
        const b = Number(indices[i + 1]) * 3;
        const c = Number(indices[i + 2]) * 3;
        const p = (j: number) => Number(positions[j]);
        const x = (p(a) + p(b) + p(c)) / 3 + mesh.origin[0];
        const y = (p(a + 1) + p(b + 1) + p(c + 1)) / 3 + mesh.origin[1];
        const z = (p(a + 2) + p(b + 2) + p(c + 2)) / 3 + mesh.origin[2];
        const sample = field.sample(x, y, {interpolation: 'triangle'});
        expect(sample.status).toBe(Status.VALID);
        expect(sample.height).toBeCloseTo(z, 11);
        const ab = [p(b) - p(a), p(b + 1) - p(a + 1), p(b + 2) - p(a + 2)];
        const ac = [p(c) - p(a), p(c + 1) - p(a + 1), p(c + 2) - p(a + 2)];
        const cross = [
          ab[1] * ac[2] - ab[2] * ac[1],
          ab[2] * ac[0] - ab[0] * ac[2],
          ab[0] * ac[1] - ab[1] * ac[0]
        ];
        expect(cross[2]).toBeGreaterThan(0);
        const length = Math.hypot(...cross);
        expect(sample.normalX).toBeCloseTo(cross[0] / length, 12);
        expect(sample.normalY).toBeCloseTo(cross[1] / length, 12);
        expect(sample.normalZ).toBeCloseTo(cross[2] / length, 12);
      }
    }
  }
});

test('mesh holes exclude only affected triangles and preserve finite attributes', () => {
  const field = new HeightField({width: 2, height: 2, heights: new Float32Array([1, 2, NaN, 4])});
  const mesh = new HeightFieldGeometry(field);
  expect(Array.from(mesh.indices!.value)).toEqual([0, 1, 3]);
  for (const attribute of Object.values(mesh.attributes)) {
    expect(Array.from(attribute.value).every(Number.isFinite)).toBe(true);
  }
  const empty = new HeightFieldGeometry(
    new HeightField({
      width: 2,
      height: 2,
      heights: new Float32Array(4),
      validity: new Uint8Array(4)
    })
  );
  expect(empty.getVertexCount()).toBe(0);
  expect(empty.indices!.value.length).toBe(0);
});

test('local mesh positions retain small spacings at large world origins', () => {
  const field = new HeightField({
    width: 2,
    height: 2,
    heights: new Float64Array([4, 4, 4, 4]),
    origin: [1e9, -1e9],
    columnStep: [0.01, 0],
    rowStep: [0, 0.01]
  });
  const mesh = new HeightFieldGeometry(field);
  expect(mesh.origin).toEqual([1e9, -1e9, 0]);
  expect(mesh.attributes.POSITION.value).toBeInstanceOf(Float32Array);
  expect(Number(mesh.attributes.POSITION.value[3])).toBeCloseTo(0.01, 8);
  expect(Array.from(mesh.attributes.NORMAL.value)).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  expect(() => new HeightFieldGeometry(field, {origin: [0, 0, 0]})).toThrow(/degenerates/);
});

test('mesh UVs reflect center versus vertex registration', () => {
  const props = {width: 2, height: 2, heights: new Float32Array(4)};
  const vertex = new HeightFieldGeometry(new HeightField(props));
  expect(Array.from(vertex.attributes.TEXCOORD_0.value)).toEqual([0, 0, 1, 0, 0, 1, 1, 1]);
  const cell = new HeightFieldGeometry(new HeightField({...props, registration: 'cell'}));
  expect(Array.from(cell.attributes.TEXCOORD_0.value)).toEqual([
    0.25, 0.25, 0.75, 0.25, 0.25, 0.75, 0.75, 0.75
  ]);
  expect(Array.from(cell.attributes.POSITION.value.slice(0, 3))).toEqual([0.5, 0.5, 0]);
});

test('large grids use Uint32 indices and all indices reference existing vertices', () => {
  const field = new HeightField({width: 257, height: 257, heights: new Float32Array(257 * 257)});
  const mesh = new HeightFieldGeometry(field);
  expect(mesh.indices!.value).toBeInstanceOf(Uint32Array);
  expect(mesh.getVertexCount()).toBe(256 * 256 * 6);
  let max = 0;
  for (const index of mesh.indices!.value) max = Math.max(max, Number(index));
  expect(max).toBe(257 * 257 - 1);
});

test('mesh conversion rejects nonfinite origins and overflowing output precision', () => {
  const field = new HeightField({width: 2, height: 2, heights: new Float64Array(4).fill(1e40)});
  expect(() => new HeightFieldGeometry(field)).toThrow(/overflow/);
  expect(() => new HeightFieldGeometry(field, {origin: [0, 0, 1e40]})).not.toThrow();
  expect(() => new HeightFieldGeometry(field, {origin: [0, 0, NaN]})).toThrow(/origin/);
});
