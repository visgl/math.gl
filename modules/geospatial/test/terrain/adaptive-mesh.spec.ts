// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField} from '@math.gl/geospatial/terrain';
import {createMartiniTerrainMesh} from '@math.gl/geospatial/terrain';
import {measureTerrainMeshError} from '@math.gl/geospatial/terrain';
import {getTerrainMeshEdge} from '@math.gl/geospatial/terrain';
import {TerrainSurface} from '@math.gl/geospatial/terrain';

function field(size: number, fn: (x: number, y: number) => number): HeightField {
  return new HeightField({
    width: size,
    height: size,
    heights: Float64Array.from({length: size * size}, (_, i) => fn(i % size, Math.floor(i / size)))
  });
}

test('adaptive planes reduce to two triangles without adding renderer or query state', () => {
  for (const size of [2, 3, 9, 33, 257]) {
    const source = field(size, (x, y) => 2 * x - 3 * y + 100);
    const mesh = createMartiniTerrainMesh(source, {maxError: 0});
    expect(mesh.indices.length).toBe(6);
    expect(mesh.positions.length).toBe(12);
    expect(mesh.error.maxSampleError).toBe(0);
    expect(mesh.error.coveredSampleCount).toBe(size * size);
    expect(mesh.error.uncoveredSampleCount).toBe(0);
    expect(mesh.refinementPasses).toBe(1);
    expect(mesh).not.toHaveProperty('sample');
    expect(mesh).not.toHaveProperty('normals');
    expect(mesh).not.toHaveProperty('bvh');
  }
});

test('adaptive surfaces meet independently sampled nodal error and retain conforming topology', () => {
  const size = 17;
  const source = field(
    size,
    (x, y) => 3 * Math.sin(x * 0.7) * Math.cos(y * 0.4) + (x === 8 ? 5 : 0)
  );
  for (const maxError of [0, 0.25, 1, 5]) {
    const mesh = createMartiniTerrainMesh(source, {maxError});
    const surface = new TerrainSurface(mesh);
    let maximum = 0,
      area = 0;
    const edges = new Map<string, number>();
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const [a, b, c] = Array.from(mesh.indices.subarray(i, i + 3));
      const x = (j: number) => mesh.gridCoordinates[j * 2];
      const y = (j: number) => mesh.gridCoordinates[j * 2 + 1];
      const determinant = (x(b) - x(a)) * (y(c) - y(a)) - (y(b) - y(a)) * (x(c) - x(a));
      expect(determinant).toBeGreaterThan(0);
      area += determinant / 2;
      for (const [u, v] of [
        [a, b],
        [b, c],
        [c, a]
      ]) {
        const key = u < v ? `${u}/${v}` : `${v}/${u}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
    }
    expect(area).toBe((size - 1) ** 2);
    for (const [key, count] of edges) {
      expect(count).toBeLessThanOrEqual(2);
      if (count === 1) {
        const [a, b] = key.split('/').map(Number);
        const outer = [0, 1].some(
          axis =>
            mesh.gridCoordinates[a * 2 + axis] === mesh.gridCoordinates[b * 2 + axis] &&
            [0, size - 1].includes(mesh.gridCoordinates[a * 2 + axis])
        );
        expect(outer).toBe(true); // No interior unpaired edges / RTIN T-junctions.
      }
    }
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const sample = surface.sample(x, y);
        expect(sample.status).toBe(0);
        maximum = Math.max(maximum, Math.abs(sample.height - source.getHeight(x, y)!));
      }
    expect(maximum).toBeLessThanOrEqual(maxError + 1e-12);
    expect(mesh.error.maxSampleError).toBeLessThanOrEqual(maxError);
    expect(measureTerrainMeshError(source, mesh)).toEqual(mesh.error);
  }
});

test('fully refined shared edges match across independent tile LOD choices', () => {
  const size = 9;
  const make = (offset: number) =>
    new HeightField({
      width: size,
      height: size,
      origin: [offset, 0],
      heights: Float64Array.from(
        {length: size * size},
        (_, i) => Math.sin((offset + (i % size)) * 0.2) + Math.sin(Math.floor(i / size) * 0.3)
      )
    });
  const left = createMartiniTerrainMesh(make(0), {maxError: 0.01, fullEdges: ['maxColumn']});
  const right = createMartiniTerrainMesh(make(8), {maxError: 10, fullEdges: ['minColumn']});
  const a = getTerrainMeshEdge(left, 'maxColumn'),
    b = getTerrainMeshEdge(right, 'minColumn');
  expect(a.length).toBe(size);
  expect(b.length).toBe(size);
  for (let i = 0; i < size; i++)
    for (let axis = 0; axis < 3; axis++)
      expect(left.positions[a[i] * 3 + axis] + left.origin[axis]).toBe(
        right.positions[b[i] * 3 + axis] + right.origin[axis]
      );
  const all = createMartiniTerrainMesh(
    field(size, () => 0),
    {maxError: 10, fullEdges: ['minRow', 'maxRow', 'minColumn', 'maxColumn']}
  );
  for (const edge of ['minRow', 'maxRow', 'minColumn', 'maxColumn'] as const)
    expect(getTerrainMeshEdge(all, edge).length).toBe(size);
});

test('independent verification catches rounded backend estimates and forces full refinement on underflow', () => {
  const rounded = field(3, (x, y) => (x === 1 && y === 1 ? 1 + 2 ** -25 : 0));
  const mesh = createMartiniTerrainMesh(rounded, {maxError: 1});
  expect(mesh.refinementPasses).toBe(2);
  expect(mesh.error.maxSampleError).toBeLessThanOrEqual(1);
  const tiny = field(3, (x, y) => (x === 1 && y === 1 ? 1e-50 : 0));
  const full = createMartiniTerrainMesh(tiny, {maxError: 0});
  expect(full.refinementPasses).toBe(9);
  expect(full.indices.length / 3).toBe(8);
  expect(full.error.maxSampleError).toBe(0);
  expect(() => createMartiniTerrainMesh(tiny, {maxError: 0, maxTriangles: 2})).toThrow(
    /triangle capacity/
  );
});

test('adaptive meshes preserve local affine frames and distinguish nodal from continuous error', () => {
  const source = new HeightField({
    width: 3,
    height: 3,
    origin: [1e12, -1e12],
    columnStep: [-2, 1],
    rowStep: [1, 3],
    registration: 'cell',
    heights: Float64Array.from({length: 9}, (_, i) => i),
    heightReference: 'survey'
  });
  const mesh = createMartiniTerrainMesh(source, {maxError: 0, origin: [1e12, -1e12, 2]});
  expect(mesh.heightReference).toBe('survey');
  expect(measureTerrainMeshError(source, mesh).maxSampleError).toBe(0);
  expect(() => new TerrainSurface(mesh)).not.toThrow();
  const saddle = field(2, (x, y) => x * y);
  const linear = createMartiniTerrainMesh(saddle, {maxError: 0});
  expect(linear.error.maxSampleError).toBe(0);
  expect(new TerrainSurface(linear).sample(0.5, 0.5).height).toBe(0.5);
  expect(saddle.sample(0.5, 0.5).height).toBe(0.25);
});

test('adaptive mesh admission and certification budgets fail explicitly', () => {
  const source = field(9, (x, y) => Math.sin(x) * Math.cos(y));
  for (const maxError of [-1, NaN, Infinity])
    expect(() => createMartiniTerrainMesh(source, {maxError})).toThrow();
  expect(() =>
    createMartiniTerrainMesh(
      field(4, () => 0),
      {maxError: 1}
    )
  ).toThrow(/square/);
  expect(() =>
    createMartiniTerrainMesh(
      new HeightField({width: 3, height: 5, heights: new Float64Array(15)}),
      {maxError: 1}
    )
  ).toThrow(/square/);
  const missing = new HeightField({
    width: 3,
    height: 3,
    heights: Float64Array.from([0, 0, 0, 0, NaN, 0, 0, 0, 0])
  });
  expect(() => createMartiniTerrainMesh(missing, {maxError: 1})).toThrow(/complete/);
  expect(() => createMartiniTerrainMesh(source, {maxError: 0, maxSamples: 80})).toThrow(
    /sample capacity/
  );
  expect(() => createMartiniTerrainMesh(source, {maxError: 0, maxTriangles: 2})).toThrow(
    /triangle capacity/
  );
  expect(() => createMartiniTerrainMesh(source, {maxError: 1, maxSampleTests: 0})).toThrow(
    /budget/
  );
  expect(() => createMartiniTerrainMesh(source, {maxError: 1, maxSamples: -1})).toThrow(/capacity/);
  expect(() => createMartiniTerrainMesh(source, {maxError: 1, maxTriangles: 0.5})).toThrow(
    /capacity/
  );
  expect(() =>
    createMartiniTerrainMesh(source, {maxError: 1, fullEdges: ['north' as never]})
  ).toThrow(/edge/);
});
