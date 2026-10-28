// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField} from '@math.gl/geospatial/terrain';
import {HeightFieldGeometry} from '@math.gl/geospatial/terrain';
import {createTerrainMesh} from '@math.gl/geospatial/terrain';
import {measureTerrainMeshError} from '@math.gl/geospatial/terrain';
import {getTerrainMeshEdge} from '@math.gl/geospatial/terrain';

test('plain regular meshes match renderer geometry across frames, diagonals, registration and holes', () => {
  for (const diagonal of ['00-11', '10-01'] as const)
    for (const registration of ['vertex', 'cell'] as const)
      for (const handedness of [-1, 1]) {
        const field = new HeightField({
          width: 5,
          height: 3,
          heights: Float64Array.from({length: 15}, (_, i) => i * i),
          validity: Uint8Array.from({length: 15}, (_, i) => (i === 7 ? 0 : 1)),
          diagonal,
          registration,
          origin: [1e12, -1e12],
          columnStep: [2 * handedness, 1],
          rowStep: [0, 3],
          heightReference: 'survey'
        });
        const options = {origin: [1e12, -1e12, 100] as const};
        const mesh = createTerrainMesh(field, options);
        const old = new HeightFieldGeometry(field, {...options, precision: 'float64'});
        expect(mesh.positions).toEqual(old.attributes['POSITION'].value);
        expect([...mesh.indices]).toEqual([...old.indices!.value]);
        expect(mesh.heightReference).toBe('survey');
        expect(mesh.gridCoordinates.length).toBe(30);
        expect(measureTerrainMeshError(field, mesh).maxSampleError).toBe(0);
        expect(measureTerrainMeshError(field, mesh).uncoveredSampleCount).toBe(0);
      }
});

test('mesh error reports independent nodal residuals, holes and coverage without hiding them', () => {
  const field = new HeightField({width: 3, height: 3, heights: new Float64Array(9)});
  const mesh = createTerrainMesh(field);
  mesh.positions[3 * 4 + 2] = 3;
  const error = measureTerrainMeshError(field, mesh);
  expect(error.maxSampleError).toBe(3);
  expect(error.rmsSampleError).toBe(1);
  expect(error.coveredSampleCount).toBe(9);
  expect(error.uncoveredSampleCount).toBe(0);
  expect(() =>
    measureTerrainMeshError(field, mesh, {maxSampleTests: error.sampleTests - 1})
  ).toThrow(/budget/);
  expect(measureTerrainMeshError(field, mesh, {maxSampleTests: error.sampleTests})).toEqual(error);
  mesh.indices = new Uint32Array();
  expect(measureTerrainMeshError(field, mesh, {maxSampleTests: 0})).toMatchObject({
    coveredSampleCount: 0,
    uncoveredSampleCount: 9,
    maxSampleError: 0
  });
  const sparse = new HeightField({
    width: 3,
    height: 3,
    heights: new Float64Array(9),
    validity: Uint8Array.from([0, 0, 0, 0, 1, 0, 0, 0, 0])
  });
  expect(measureTerrainMeshError(sparse, createTerrainMesh(sparse)).uncoveredSampleCount).toBe(1);
});

test('mesh edge extraction orders only referenced vertices and leaves source arrays unchanged', () => {
  const field = new HeightField({width: 4, height: 3, heights: new Float64Array(12)});
  const mesh = createTerrainMesh(field);
  expect([...getTerrainMeshEdge(mesh, 'minColumn')]).toEqual([0, 4, 8]);
  expect([...getTerrainMeshEdge(mesh, 'maxColumn')]).toEqual([3, 7, 11]);
  expect([...getTerrainMeshEdge(mesh, 'minRow')]).toEqual([0, 1, 2, 3]);
  expect([...getTerrainMeshEdge(mesh, 'maxRow')]).toEqual([8, 9, 10, 11]);
  const edge = getTerrainMeshEdge(mesh, 'minColumn');
  edge.fill(99);
  expect(getTerrainMeshEdge(mesh, 'minColumn')[0]).toBe(0);
  mesh.indices = new Uint32Array([0, 1, 5]);
  expect([...getTerrainMeshEdge(mesh, 'minColumn')]).toEqual([0]);
  expect(() => getTerrainMeshEdge(mesh, 'north' as never)).toThrow();
});

test('mesh inspection validates caller-owned arrays, frames, metadata and arithmetic', () => {
  const field = new HeightField({width: 2, height: 2, heights: new Float64Array(4)});
  for (const mutate of [
    (m: ReturnType<typeof createTerrainMesh>) => {
      m.indices[0] = 99;
    },
    (m: ReturnType<typeof createTerrainMesh>) => {
      m.gridCoordinates[0] = 99;
    },
    (m: ReturnType<typeof createTerrainMesh>) => {
      m.positions[0] = Infinity;
    },
    (m: ReturnType<typeof createTerrainMesh>) => {
      m.width = 0;
    },
    (m: ReturnType<typeof createTerrainMesh>) => {
      m.origin = [NaN, 0, 0];
    }
  ]) {
    const mesh = createTerrainMesh(field);
    mutate(mesh);
    expect(() => measureTerrainMeshError(field, mesh)).toThrow();
    expect(() => getTerrainMeshEdge(mesh, 'minRow')).toThrow();
  }
  const frame = createTerrainMesh(field);
  frame.positions[0] += 1;
  expect(() => measureTerrainMeshError(field, frame)).toThrow(/frame/);
  const degenerate = createTerrainMesh(field);
  degenerate.indices.fill(0);
  expect(() => measureTerrainMeshError(field, degenerate)).toThrow(/Degenerate/);
  const metadata = createTerrainMesh(field);
  metadata.heightReference = 'other';
  expect(() => measureTerrainMeshError(field, metadata)).toThrow(/metadata/);
  expect(() =>
    measureTerrainMeshError(field, createTerrainMesh(field), {maxSampleTests: -1})
  ).toThrow();
  expect(() => createTerrainMesh(field, {origin: [0, 0, NaN]})).toThrow();
  expect(() => createTerrainMesh(field, {origin: [1e30, 1e30, 0]})).toThrow(/degenerate/);
});

test('mesh error includes height precision lost to a distant Z origin', () => {
  const field = new HeightField({width: 2, height: 2, heights: Float64Array.from([0, 1, 0, 1])});
  for (const z of [2 ** 54, -(2 ** 54)]) {
    const mesh = createTerrainMesh(field, {origin: [0, 0, z]});
    expect(mesh.positions[5] + z).toBe(0);
    const report = measureTerrainMeshError(field, mesh);
    expect(report.maxSampleError).toBe(1);
    expect(report.rmsSampleError).toBeCloseTo(Math.SQRT1_2, 14);
    expect(report.coveredSampleCount).toBe(4);
  }
});
