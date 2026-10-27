// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {createTerrainSkirt} from '@math.gl/geospatial/terrain';

const quad = () => ({
  positions: Float64Array.from([0, 0, 10, 1, 0, 10, 1, 1, 10, 0, 1, 10]),
  indices: Uint16Array.from([0, 1, 2, 0, 2, 3])
});
function outwardDots(
  positions: Float32Array | Float64Array,
  indices: Uint16Array | Uint32Array,
  start: number
) {
  const dots: number[] = [];
  for (let i = start * 3; i < indices.length; i += 3) {
    const [a, b, c] = [...indices.slice(i, i + 3)].map(id => 3 * id);
    const ux = positions[b] - positions[a],
      uy = positions[b + 1] - positions[a + 1],
      uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a],
      vy = positions[c + 1] - positions[a + 1],
      vz = positions[c + 2] - positions[a + 2];
    dots.push(
      (uy * vz - uz * vy) * ((positions[a] + positions[b] + positions[c]) / 3 - 0.5) +
        (uz * vx - ux * vz) * ((positions[a + 1] + positions[b + 1] + positions[c + 1]) / 3 - 0.5)
    );
  }
  return dots;
}

test('selected explicit edges use source winding regardless of supplied edge order', () => {
  const source = quad();
  const automatic = createTerrainSkirt(source, {height: 5});
  // Loaders.gl's west/north/east/south orientation used to make all eight faces inward.
  const explicit = createTerrainSkirt(source, {
    height: 5,
    edges: Uint16Array.from([0, 3, 3, 2, 2, 1, 1, 0])
  });
  for (const result of [automatic, explicit]) {
    expect(
      outwardDots(result.positions, result.indices, result.skirtTriangleOffset).every(
        dot => dot > 0
      )
    ).toBe(true);
    expect(result.skirtVertexOffset).toBe(4);
    expect(result.skirtTriangleOffset).toBe(2);
    expect(result.indices).toBeInstanceOf(Uint16Array);
    expect(result.triangleValidity).toEqual(Uint8Array.from([1, 1, 0, 0, 0, 0, 0, 0, 0, 0]));
    expect(result.bounds).toEqual([
      [0, 0, 5],
      [1, 1, 10]
    ]);
    for (let i = 0; i < result.sourceVertexIndices.length; i++) {
      const src = result.sourceVertexIndices[i],
        dest = result.skirtVertexOffset + i;
      expect(result.positions.slice(3 * dest, 3 * dest + 2)).toEqual(
        source.positions.slice(3 * src, 3 * src + 2)
      );
      expect(result.positions[3 * dest + 2]).toBe(source.positions[3 * src + 2] - 5);
    }
  }
  expect(source.positions).toEqual(quad().positions);
  expect(source.indices).toEqual(quad().indices);
});

test('16-bit index capacity promotes when new skirt vertices exceed 65535', () => {
  for (const [count, expected] of [
    [65530, Uint16Array],
    [65531, Uint32Array],
    [65536, Uint32Array]
  ] as const) {
    const positions = new Float32Array(count * 3);
    positions.set([0, 0, 1, 1, 0, 1, 0, 1, 1]);
    const mesh = createTerrainSkirt({positions, indices: Uint16Array.from([0, 1, 2])}, {height: 1});
    expect(mesh.indices).toBeInstanceOf(expected);
    expect(mesh.positions.length / 3).toBe(count + 6);
    expect(Math.max(...mesh.indices)).toBe(count + 5);
    expect(mesh.indices[4]).toBe(count + 1);
  }
  const source = quad();
  expect(
    createTerrainSkirt({...source, indices: Uint32Array.from(source.indices)}, {height: 1}).indices
  ).toBeInstanceOf(Uint32Array);
});

test('edge selection can omit holes or produce an empty skirt', () => {
  const source = quad();
  const one = createTerrainSkirt(source, {height: 1, edges: Uint32Array.from([1, 0])});
  expect(one.sourceVertexIndices).toEqual(Uint32Array.from([0, 1]));
  expect(one.indices.length).toBe(12);
  expect(one.bounds).toEqual([
    [0, 0, 9],
    [1, 1, 10]
  ]);
  const none = createTerrainSkirt(source, {height: 1, edges: new Uint16Array()});
  expect(none.positions).toEqual(source.positions);
  expect(none.indices).toEqual(source.indices);
  expect(none.triangleValidity).toEqual(Uint8Array.from([1, 1]));
});

test('invalid topology, capacities and unrepresentable heights fail without mutating input', () => {
  const source = quad();
  for (const options of [
    {height: 0},
    {height: -1},
    {height: NaN},
    {height: 1, maxVertices: 11},
    {height: 1, maxTriangles: 9},
    {height: 1, maxVertices: NaN},
    {height: 1, edges: Uint16Array.from([0])},
    {height: 1, edges: Uint16Array.from([0, 2])},
    {height: 1, edges: Uint16Array.from([0, 1, 1, 0])}
  ])
    expect(() => createTerrainSkirt(source, options)).toThrow();
  for (const bad of [
    {...source, indices: Uint16Array.from([0, 1, 4])},
    {...source, indices: Uint16Array.from([0, 2, 1])},
    {...source, indices: Uint16Array.from([0, 0, 1])},
    {...source, indices: Uint16Array.from([0, 1, 2, 0, 1, 2])},
    {...source, positions: Float64Array.from([0, 0, NaN])},
    {...source, indices: Uint16Array.from([0, 1])}
  ])
    expect(() => createTerrainSkirt(bad, {height: 1})).toThrow();
  const flat = {
    positions: Float32Array.from([0, 0, 1e20, 1, 0, 1e20, 0, 1, 1e20]),
    indices: Uint16Array.from([0, 1, 2])
  };
  expect(() => createTerrainSkirt(flat, {height: 1})).toThrow(/precision/);
  expect(source.positions).toEqual(quad().positions);
});

test('hole boundaries are included by default and may be selected independently', () => {
  const positions = Float64Array.from([
    0, 0, 0, 3, 0, 0, 3, 3, 0, 0, 3, 0, 1, 1, 0, 2, 1, 0, 2, 2, 0, 1, 2, 0
  ]);
  const indices = Uint16Array.from([
    0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7
  ]);
  const all = createTerrainSkirt({positions, indices}, {height: 2});
  const outer = createTerrainSkirt(
    {positions, indices},
    {height: 2, edges: Uint16Array.from([0, 1, 1, 2, 2, 3, 3, 0])}
  );
  expect(all.sourceVertexIndices).toHaveLength(16);
  expect(outer.sourceVertexIndices).toHaveLength(8);
  expect(all.indices.length).toBe(indices.length + 48);
  expect(outer.indices.length).toBe(indices.length + 24);
});

test('skirt validity integrates with terrain surface sampling', async () => {
  const {TerrainSurface} = await import('@math.gl/geospatial/terrain/surface');
  const result = createTerrainSkirt(quad(), {height: 5});
  const surface = new TerrainSurface(result);
  expect(surface.activeTriangleCount).toBe(2);
  expect(surface.sample(0.5, 0.5).height).toBe(10);
  expect(surface.sample(-0.1, 0.5).status).not.toBe(0);
});
