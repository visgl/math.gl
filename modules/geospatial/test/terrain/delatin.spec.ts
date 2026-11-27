// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField} from '@math.gl/geospatial/terrain';
import {createDelatinTerrainMesh} from '@math.gl/geospatial/terrain';
import {createMartiniTerrainMesh} from '@math.gl/geospatial/terrain';
import {measureTerrainMeshError} from '@math.gl/geospatial/terrain';
import {TerrainSurface} from '@math.gl/geospatial/terrain';

function field(width: number, height: number, fn: (x: number, y: number) => number) {
  return new HeightField({
    width,
    height,
    heights: Float64Array.from({length: width * height}, (_, i) =>
      fn(i % width, Math.floor(i / width))
    )
  });
}

test('Delatin supports rectangular grids and detached plain mesh data', () => {
  for (const [width, height] of [
    [2, 2],
    [5, 9],
    [17, 7]
  ]) {
    const source = field(width, height, (x, y) => 2 * x - 3 * y + 10);
    const mesh = createDelatinTerrainMesh(source, {maxError: 1e-12});
    expect(mesh.indices.length).toBe(6);
    expect(mesh.positions.length).toBe(12);
    expect(mesh.tessellator).toBe('delatin');
    expect(mesh.error.coveredSampleCount).toBe(width * height);
    expect(mesh.error.maxSampleError).toBeLessThanOrEqual(1e-12);
    expect(mesh).not.toHaveProperty('sample');
    mesh.positions.fill(0);
    expect(source.getHeight(0, 0)).toBe(10);
  }
});

test('Delatin ridge meshes cover the domain and meet independently queried sample error', () => {
  const width = 17,
    height = 11;
  const source = field(width, height, (x, y) => Math.sin(x) * Math.cos(y) + (x === 8 ? 5 : 0));
  for (const maxError of [0, 0.1, 1, 10]) {
    const mesh = createDelatinTerrainMesh(source, {maxError});
    expect(mesh.error.uncoveredSampleCount).toBe(0);
    expect(mesh.error.maxSampleError).toBeLessThanOrEqual(maxError);
    expect(measureTerrainMeshError(source, mesh)).toEqual(mesh.error);
    const surface = new TerrainSurface(mesh);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const sample = surface.sample(x, y);
        expect(sample.status).toBe(0);
        expect(Math.abs(sample.height - source.getHeight(x, y)!)).toBeLessThanOrEqual(
          maxError + 1e-12
        );
      }
    let area = 0;
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const [a, b, c] = mesh.indices.subarray(i, i + 3);
      const p = mesh.positions;
      const twice =
        (p[3 * b] - p[3 * a]) * (p[3 * c + 1] - p[3 * a + 1]) -
        (p[3 * b + 1] - p[3 * a + 1]) * (p[3 * c] - p[3 * a]);
      expect(twice).toBeGreaterThan(0);
      area += twice / 2;
    }
    expect(area).toBe((width - 1) * (height - 1));
  }
});

test('loaders-style padded rasters preserve world positions, north-down rows and UV coordinates', () => {
  // The decoder owns padding. This fixture repeats the right/bottom edge as MARTINI does.
  const heights = Float32Array.from([0, 2, 2, 3, 5, 5, 3, 5, 5]);
  const source = new HeightField({
    width: 3,
    height: 3,
    heights,
    origin: [100, 200],
    columnStep: [2, 0],
    rowStep: [0, -3]
  });
  for (const create of [createMartiniTerrainMesh, createDelatinTerrainMesh]) {
    const mesh = create(source, {maxError: 0, origin: [0, 0, 0]});
    expect(mesh.error.maxSampleError).toBe(0);
    for (let i = 0; i < mesh.gridCoordinates.length / 2; i++) {
      const x = mesh.gridCoordinates[2 * i],
        y = mesh.gridCoordinates[2 * i + 1];
      expect(Array.from(mesh.positions.subarray(3 * i, 3 * i + 3))).toEqual([
        100 + 2 * x,
        200 - 3 * y,
        heights[3 * y + x]
      ]);
      expect(x / 2).toBeGreaterThanOrEqual(0);
      expect(y / 2).toBeLessThanOrEqual(1);
    }
    expect(new TerrainSurface(mesh).sample(102, 197).height).toBe(5);
  }
});

test('Delatin rejects missing data, unsupported edge constraints and exhausted budgets', () => {
  const source = field(5, 3, (x, y) => (x === 2 && y === 1 ? 10 : 0));
  for (const maxError of [-1, Infinity, NaN])
    expect(() => createDelatinTerrainMesh(source, {maxError})).toThrow(/maxError/);
  for (const options of [
    {maxSamples: 14},
    {maxTriangles: 1},
    {maxTriangles: 2},
    {maxRefinements: 0},
    {maxRefinements: -1},
    {maxSampleTests: 0}
  ])
    expect(() => createDelatinTerrainMesh(source, {maxError: 0, ...options})).toThrow();
  expect(() => createDelatinTerrainMesh(source, {maxError: 0, fullEdges: []} as never)).toThrow(
    /fullEdges/
  );
  expect(() =>
    createDelatinTerrainMesh(
      field(3, 3, () => NaN),
      {maxError: 1}
    )
  ).toThrow(/complete/);
});

test('Delatin independently detects rounded estimates and reports its regular fallback', () => {
  const source = field(5, 3, (x, y) => 0.1 + x * 0.1 + y * 0.2);
  const mesh = createDelatinTerrainMesh(source, {maxError: 0});
  expect(mesh.refinementPasses).toBe(9);
  expect(mesh.tessellator).toBe('regular');
  expect(mesh.indices.length / 3).toBe(16);
  expect(mesh.error.maxSampleError).toBe(0);
  expect(() => createDelatinTerrainMesh(source, {maxError: 0, maxTriangles: 15})).toThrow(
    /fallback triangle capacity/
  );
});

test('adaptive builders reject origins that cannot represent the requested height accuracy', () => {
  const source = field(2, 2, x => x);
  for (const create of [createMartiniTerrainMesh, createDelatinTerrainMesh]) {
    expect(() => create(source, {maxError: 0, origin: [0, 0, 2 ** 54]})).toThrow(/could not meet/);
    const mesh = create(source, {maxError: 1, origin: [0, 0, 2 ** 54]});
    expect(mesh.error.maxSampleError).toBe(1);
  }
});

test('adaptive meshes reject XY origins that alias source nodes', () => {
  const source = new HeightField({
    width: 4,
    height: 2,
    heights: Float64Array.from([0, 1, 2, 3, 0, 1, 2, 3]),
    columnStep: [0.1, 0]
  });
  expect(() => createDelatinTerrainMesh(source, {maxError: 0, origin: [-(2 ** 50), 0, 0]})).toThrow(
    /XY precision/
  );
  const square = new HeightField({
    width: 3,
    height: 3,
    heights: Float64Array.from([0, 1, 2, 0, 1, 2, 0, 1, 2]),
    columnStep: [0.1, 0]
  });
  expect(() => createMartiniTerrainMesh(square, {maxError: 0, origin: [-(2 ** 50), 0, 0]})).toThrow(
    /XY precision/
  );
  // Ordinary non-binary spacing and a local frame remain supported.
  expect(
    createDelatinTerrainMesh(source, {maxError: 1e-12}).error.maxSampleError
  ).toBeLessThanOrEqual(1e-12);
});

test('adaptive error reports account for smaller stored-XY distortions', () => {
  const source = new HeightField({
    width: 3,
    height: 3,
    columnStep: [0.1, 0],
    heights: Float64Array.from([0, 1, 2, 0, 1, 2, 0, 1, 2])
  });
  for (const create of [createMartiniTerrainMesh, createDelatinTerrainMesh]) {
    const mesh = create(source, {maxError: 1e-6, origin: [-(2 ** 20), 0, 0]});
    const surface = new TerrainSurface(mesh);
    let maximum = 0;
    for (let row = 0; row < 3; row++)
      for (let column = 0; column < 3; column++)
        maximum = Math.max(maximum, Math.abs(surface.sample(column * 0.1, row).height - column));
    expect(maximum).toBeGreaterThan(0);
    expect(mesh.error.maxSampleError).toBeCloseTo(maximum, 14);
    const exact = create(source, {maxError: 0, origin: [-(2 ** 20), 0, 0]});
    expect(exact.error.maxSampleError).toBe(0);
    expect(exact.refinementPasses).toBeGreaterThan(1);
  }
});
