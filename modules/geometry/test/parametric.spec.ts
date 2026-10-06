// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {ParametricGeometry, TorusGeometry, LatheGeometry} from '../src/parametric';

test('sampled plane normals and triangle winding agree with analytic surface', () => {
  const mesh = new ParametricGeometry({
    uSegments: 4,
    vSegments: 3,
    sample: (u, v) => [u, v, u * 2 + v * 3]
  });
  expect(mesh.attributes['POSITION'].value.length).toBe(20 * 3);
  expect(mesh.indices.value.length).toBe(4 * 3 * 6);
  const expected = [-2, -3, 1].map(v => v / Math.sqrt(14));
  for (let i = 0; i < 20; i++)
    for (let axis = 0; axis < 3; axis++)
      expect(mesh.attributes['NORMAL'].value[i * 3 + axis]).toBeCloseTo(expected[axis], 5);
  const p = mesh.attributes['POSITION'].value,
    n = mesh.attributes['NORMAL'].value;
  for (let i = 0; i < mesh.indices.value.length; i += 3) {
    const [a, b, c] = Array.from(mesh.indices.value.slice(i, i + 3), v => v * 3);
    const ab = [0, 1, 2].map(k => p[b + k] - p[a + k]),
      ac = [0, 1, 2].map(k => p[c + k] - p[a + k]);
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0]
    ];
    expect(cross.reduce((sum, v, k) => sum + v * n[a + k], 0)).toBeGreaterThan(0);
  }
});

test('torus lies on its implicit surface and duplicates positions at UV seams', () => {
  const mesh = new TorusGeometry({
    majorRadius: 2,
    minorRadius: 0.5,
    majorSegments: 16,
    minorSegments: 8
  });
  const p = mesh.attributes['POSITION'].value,
    n = mesh.attributes['NORMAL'].value,
    uv = mesh.attributes['TEXCOORD_0'].value;
  for (let i = 0; i < p.length; i += 3) {
    expect((Math.hypot(p[i], p[i + 2]) - 2) ** 2 + p[i + 1] ** 2).toBeCloseTo(0.25, 5);
    expect(Math.hypot(...n.slice(i, i + 3))).toBeCloseTo(1, 6);
  }
  for (let j = 0; j <= 8; j++) {
    const a = j * 17,
      b = a + 16;
    expect(p.slice(a * 3, a * 3 + 3)).toEqual(p.slice(b * 3, b * 3 + 3));
    expect(uv[a * 2]).toBe(0);
    expect(uv[b * 2]).toBe(1);
  }
  const partial = new TorusGeometry({arc: Math.PI});
  expect(partial.attributes['POSITION'].value[0]).toBeCloseTo(1.3);
  expect(partial.attributes['POSITION'].value[48 * 3]).toBeCloseTo(-1.3);
});

test('lathe cylinder has radial normals and retains the profile', () => {
  const points: [number, number][] = [
    [2, -1],
    [2, 1]
  ];
  const mesh = new LatheGeometry({points, segments: 8});
  points[0][0] = 100;
  const p = mesh.attributes['POSITION'].value,
    n = mesh.attributes['NORMAL'].value;
  for (let i = 0; i < p.length; i += 3) {
    expect(Math.hypot(p[i], p[i + 2])).toBeCloseTo(2, 6);
    expect(Math.abs(p[i + 1])).toBe(1);
    expect(n[i]).toBeCloseTo(p[i] / 2, 6);
    expect(n[i + 1]).toBe(0);
    expect(n[i + 2]).toBeCloseTo(p[i + 2] / 2, 6);
  }
});

test('normal callbacks, singular samples, Uint32 promotion and validation', () => {
  const mesh = new ParametricGeometry({
    uSegments: 256,
    vSegments: 256,
    sample: (u, v) => [u, v, 0],
    normal: () => [0, 0, 10]
  });
  expect(mesh.indices.value).toBeInstanceOf(Uint32Array);
  expect(mesh.indices.value.length).toBe(256 * 256 * 6);
  expect(Array.from(mesh.indices.value.slice(0, 6))).toEqual([0, 1, 258, 0, 258, 257]);
  expect(Array.from(mesh.indices.value.slice(-6))).toEqual([
    65790, 65791, 66048, 65790, 66048, 66047
  ]);
  expect(
    new ParametricGeometry({uSegments: 1, vSegments: 1, sample: () => [0, 0, 0]}).attributes[
      'NORMAL'
    ].value
  ).toEqual(new Float32Array(12));
  expect(() => new TorusGeometry({minorRadius: 2})).toThrow();
  expect(
    () =>
      new LatheGeometry({
        points: [
          [1, 0],
          [1, 0]
        ]
      })
  ).toThrow();
  expect(() => new ParametricGeometry({uSegments: 0, sample: () => [0, 0, 0]})).toThrow();
  expect(() => new ParametricGeometry({sample: () => [NaN, 0, 0]})).toThrow();
  expect(() => new ParametricGeometry({sample: () => [1e40, 0, 0]})).toThrow();
});

test('estimated normals and positions match exactly across periodic UV seams', () => {
  const mesh = new ParametricGeometry({
    uSegments: 16,
    vSegments: 3,
    periodicU: true,
    sample: (u, v) => [Math.cos(u * Math.PI * 2), v, -Math.sin(u * Math.PI * 2)]
  });
  for (const name of ['POSITION', 'NORMAL'])
    for (let j = 0; j <= 3; j++) {
      const values = mesh.attributes[name].value;
      expect(values.slice(j * 17 * 3, j * 17 * 3 + 3)).toEqual(
        values.slice((j * 17 + 16) * 3, (j * 17 + 16) * 3 + 3)
      );
    }
});
