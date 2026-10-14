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

test('rotated torus caps have outward flat normals and preserve grid inheritance', () => {
  const properties = {majorSegments: 8, minorSegments: 8, startAngle: 0.4, arc: Math.PI / 2};
  const open = new TorusGeometry(properties);
  const capped = new TorusGeometry({...properties, cap: true, id: 'capped'});
  expect(capped).toBeInstanceOf(ParametricGeometry);
  expect(capped.id).toBe('capped');
  expect(capped.indices!.value.length - open.indices!.value.length).toBe(48);
  expect(capped.getVertexCount()).toBe(capped.indices!.value.length);
  expect(capped.getAttributes().indices).toBe(capped.indices);
  const positions = capped.attributes.POSITION.value;
  const normals = capped.attributes.NORMAL.value;
  expect(positions[0]).toBeCloseTo(1.3 * Math.cos(0.4), 6);
  expect(positions[2]).toBeCloseTo(-1.3 * Math.sin(0.4), 6);
  const originalVertexCount = open.attributes.POSITION.value.length / 3;
  for (let end = 0; end < 2; end++) {
    const angle = properties.startAngle + end * properties.arc;
    const direction = end === 0 ? -1 : 1;
    for (let vertex = 0; vertex < 10; vertex++) {
      const offset = (originalVertexCount + end * 10 + vertex) * 3;
      expect(normals[offset]).toBeCloseTo(-Math.sin(angle) * direction, 6);
      expect(normals[offset + 1]).toBe(0);
      expect(normals[offset + 2]).toBeCloseTo(-Math.cos(angle) * direction, 6);
    }
  }
  for (let index = 0; index < capped.indices!.value.length; index += 3) {
    const offsets = Array.from(capped.indices!.value.slice(index, index + 3), vertex => vertex * 3);
    const firstEdge = [0, 1, 2].map(
      axis => positions[offsets[1] + axis] - positions[offsets[0] + axis]
    );
    const secondEdge = [0, 1, 2].map(
      axis => positions[offsets[2] + axis] - positions[offsets[0] + axis]
    );
    const cross = [
      firstEdge[1] * secondEdge[2] - firstEdge[2] * secondEdge[1],
      firstEdge[2] * secondEdge[0] - firstEdge[0] * secondEdge[2],
      firstEdge[0] * secondEdge[1] - firstEdge[1] * secondEdge[0]
    ];
    expect(Math.hypot(...cross)).toBeGreaterThan(1e-8);
    expect(
      cross.reduce((sum, component, axis) => sum + component * normals[offsets[0] + axis], 0)
    ).toBeGreaterThan(0);
  }
  const full = new TorusGeometry({cap: true});
  expect(full.indices!.value.length).toBe(new TorusGeometry().indices!.value.length);
  expect(() => new TorusGeometry({startAngle: Infinity})).toThrow();
});

test('capped torus edges close and constructor metadata retains custom attributes', () => {
  const custom = {size: 1, value: new Float32Array([7]), constant: true};
  const geometry = new TorusGeometry({
    arc: 1.7,
    startAngle: -2,
    cap: true,
    majorSegments: 8,
    minorSegments: 8,
    attributes: {custom}
  });
  expect(geometry.attributes.custom.value).toBe(custom.value);
  const positions = geometry.attributes.POSITION.value;
  const indices = geometry.indices!.value;
  const vertices: string[] = [];
  for (let index = 0; index < positions.length; index += 3) {
    vertices.push(Array.from(positions.slice(index, index + 3)).join(','));
  }
  const edges = new Map<string, number>();
  for (let index = 0; index < indices.length; index += 3) {
    for (let corner = 0; corner < 3; corner++) {
      const edge = [
        vertices[indices[index + corner]],
        vertices[indices[index + ((corner + 1) % 3)]]
      ]
        .sort()
        .join('|');
      edges.set(edge, (edges.get(edge) ?? 0) + 1);
    }
  }
  expect(Array.from(edges.values()).every(count => count === 2)).toBe(true);
  const large = new TorusGeometry({arc: 1, cap: true, majorSegments: 256, minorSegments: 256});
  expect(large.indices!.value).toBeInstanceOf(Uint32Array);
  expect(large.getVertexCount()).toBe(256 * 256 * 6 + 256 * 6);
});
