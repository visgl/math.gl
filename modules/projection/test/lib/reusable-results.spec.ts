// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original reusable-output ownership, precision, lazy and recursion tests.
import {beforeAll, expect, test} from 'vitest';
import {
  Projection,
  ProjectionEngine,
  ProjectionPipeline,
  mercator,
  geocentric,
  createProjectionDescriptor
} from '@math.gl/projection';
import type {ProjectionOutput, ProjectionPlugin, ProjectionPoint} from '@math.gl/projection/core';
import {LazyProjection} from '@math.gl/projection/projections/lazy';
import {pipelineOptions} from '../pipeline-workload';
import {kinematicOptions} from '../kinematic-workload';
import inputs from '../fixtures/operation-pipeline-cases.json';
import reference from '../fixtures/operation-pipeline-reference.json';
import movingInputs from '../fixtures/kinematic-pipeline-cases.json';
import movingReference from '../fixtures/kinematic-pipeline-reference.json';

let horizontal: ArrayBuffer;
beforeAll(async () => {
  const url = new URL('../fixtures/real-grids/BETA2007.gsb', import.meta.url);
  horizontal =
    url.protocol === 'file:'
      ? new Uint8Array(await (await import('node:fs/promises')).readFile(url)).buffer
      : await (await fetch(url)).arrayBuffer();
});

for (const outputKind of ['array', 'Float32', 'Float64']) {
  test(
    'reusable scalar output identity, precision, tails, spare capacity and bound methods: ' +
      outputKind,
    () => {
      const output: ProjectionOutput =
        outputKind === 'array'
          ? Array(8).fill(77)
          : outputKind === 'Float32'
            ? new Float32Array(8).fill(77)
            : new Float64Array(8).fill(77);
      const projection = new Projection({to: 'EPSG:3857'});
      const {projectTo, unprojectToSync} = projection;
      for (const point of [
        [11, 41],
        [12, 42, 100],
        [13, 43, 200, 8, NaN, Infinity, -0]
      ]) {
        const input = Object.freeze(point);
        const expected = projection.project(input);
        expect(projectTo(input, output)).toBe(output);
        expect(Array.from(output).slice(0, point.length)).toEqual(
          output instanceof Float32Array ? Array.from(new Float32Array(expected)) : expected
        );
        expect(output[7]).toBe(77);
        const inverse = projection.unproject(Array.from(output).slice(0, point.length));
        const view =
          output instanceof Float32Array || output instanceof Float64Array
            ? output.subarray(0, point.length)
            : output.slice(0, point.length);
        expect(unprojectToSync(view, view)).toBe(view);
        expect(Array.from(view)).toEqual(
          view instanceof Float32Array ? Array.from(new Float32Array(inverse)) : inverse
        );
        expect(input).toEqual(point);
      }
    }
  );
}

test('same-view in-place writes and disjoint backing views are supported; overlaps reject before mutation', () => {
  const projection = new ProjectionEngine();
  for (const ArrayType of [Float32Array, Float64Array]) {
    const storage = new ArrayType([11, 41, 100, 8, 77, 77, 77, 77]);
    const input = storage.subarray(0, 4),
      output = storage.subarray(4);
    expect(projection.projectTo(input, output)).toBe(output);
    expect(Array.from(output)).toEqual([11, 41, 100, 8]);
    expect(projection.unprojectToSync(output, output)).toBe(output);
    const before = storage.slice();
    expect(() => projection.projectTo(input, storage.subarray(1, 5))).toThrow('overlap');
    expect(Array.from(storage)).toEqual(Array.from(before));
  }
  const storage = new ArrayBuffer(64),
    input = new Float64Array(storage, 0, 4),
    output = new Float32Array(storage, 16, 4);
  input.set([11, 41, 100, 8]);
  const before = new Uint8Array(storage).slice();
  expect(() => projection.projectTo(input, output)).toThrow('overlap');
  expect(new Uint8Array(storage)).toEqual(before);
});

test.skipIf(typeof SharedArrayBuffer === 'undefined')(
  'shared/cloned overlap is conservatively rejected, disjoint storage is accepted',
  () => {
    const projection = new ProjectionEngine();
    const buffer = new SharedArrayBuffer(64),
      clone = structuredClone(buffer);
    const input = new Float64Array(buffer, 0, 4);
    input.set([11, 41, 100, 8]);
    expect(() => projection.projectTo(input, new Float64Array(clone, 8, 4))).toThrow('overlap');
    const result = new Float64Array(clone, 32, 4);
    expect(projection.projectTo(input, result)).toBe(result);
    expect(Array.from(result)).toEqual(Array.from(input));
  }
);

test('geocentric output appends generated Z only with sufficient caller capacity', () => {
  const projection = new ProjectionEngine({
    to: '+proj=geocent +datum=WGS84',
    projections: [geocentric]
  });
  const output = new Float64Array(4).fill(77);
  expect(projection.projectTo([0, 0], output)).toBe(output);
  expect(Array.from(output)).toEqual([6378137, 0, 0, 77]);
  const short = new Float64Array([88, 99]);
  expect(() => projection.projectTo([0, 0], short)).toThrow('capacity');
  expect(Array.from(short)).toEqual([88, 99]);
  expect(() => projection.unprojectTo(short, output)).toThrow('three ordinates');
});

test('layout, domain and Float32 overflow failures leave caller outputs untouched', () => {
  const projection = new Projection({to: 'EPSG:3857'});
  for (const output of [new Int32Array(4), new Float64Array(1), [], undefined, null, {}])
    expect(() => projection.projectTo([1, 2, 3, 4], output as ProjectionOutput)).toThrow();
  const result = new Float32Array([77, 77, 77, 77]);
  for (const point of [
    [NaN, 0, 10, 9],
    [0, 91, 10, 9],
    [0, 0, Infinity, 9],
    [0, 0, 10, 1e40]
  ]) {
    expect(() => projection.projectTo(point, result)).toThrow();
    expect(Array.from(result)).toEqual([77, 77, 77, 77]);
  }
  const huge = new ProjectionEngine({to: '+proj=merc +a=1e40 +b=1e40', projections: [mercator]});
  expect(() => huge.projectTo([45, 45, 10, 9], result)).toThrow('Float32');
  expect(Array.from(result)).toEqual([77, 77, 77, 77]);
  expect(projection.projectTo([0, 0, 10, 9], result)).toBe(result);
});

test('reusable scratch isolates nested calls and recovers after callbacks and input getters throw', () => {
  const points = new Set<ProjectionPoint>();
  let nested = false,
    fail = false;
  let projection: ProjectionEngine;
  const inner = new Float64Array(4),
    output = new Float64Array(4).fill(77);
  const plugin: ProjectionPlugin = {
    name: 'scratch_output',
    parameters: [],
    create: () => ({
      forward: (x, y) => [x + 1, y - 1],
      inverse: (x, y) => [x - 1, y + 1],
      forwardInPlace(point) {
        points.add(point);
        if (nested) {
          nested = false;
          expect(projection.projectTo([0, 0, 200, 8], inner)).toBe(inner);
          expect(Array.from(inner)).toEqual([1, -1, 200, 8]);
        }
        point.x += 1;
        point.y -= 1;
        if (fail) throw new Error('callback failed');
      }
    })
  };
  projection = new ProjectionEngine({to: '+proj=scratch_output', projections: [plugin]});
  nested = true;
  projection.projectTo([10, 20, 100, 9], output);
  expect(Array.from(output)).toEqual([(10 * Math.PI) / 180 + 1, (20 * Math.PI) / 180 - 1, 100, 9]);
  expect(points.size).toBe(2);
  const before = output.slice();
  fail = true;
  expect(() => projection.projectTo([10, 20, 100, 9], output)).toThrow('callback failed');
  expect(output).toEqual(before);
  fail = false;
  const bad = [0, 0];
  Object.defineProperty(bad, '0', {
    get() {
      throw new Error('input getter failed');
    }
  });
  expect(() => projection.projectTo(bad, output)).toThrow('input getter failed');
  projection.projectTo([10, 20, 100, 9], output);
  expect(points.size).toBe(2);
  expect(output).toEqual(before);
});

test('descriptor-backed result APIs snapshot input, defer writes and retain explicit sync preload semantics', async () => {
  let release: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const descriptor = createProjectionDescriptor({name: 'merc'}, async () => {
    await gate;
    return mercator;
  });
  const engine = new ProjectionEngine({to: 'EPSG:3857', projections: [descriptor]});
  const pipeline = new ProjectionPipeline({
    input: {space: 'geographic', units: ['deg', 'deg', 'm']},
    projections: [descriptor],
    steps: [
      {type: 'unitconvert', xy: {from: 'deg', to: 'rad'}},
      {type: 'projection', name: 'merc', parameters: {a: '6378137', b: '6378137'}}
    ]
  });
  const input = new Float64Array([11, 41, 100, 8]);
  const expected = new Projection({to: 'EPSG:3857'}).project(Array.from(input));
  for (const api of [engine, pipeline])
    expect(() => api.projectToSync(input, new Float64Array(4))).toThrow('preload');
  const a = new Float64Array(4).fill(77),
    b = a.slice();
  const first = engine.projectTo(input, a),
    second = pipeline.projectTo(input, b);
  expect(Array.from(a)).toEqual([77, 77, 77, 77]);
  expect(b).toEqual(a);
  input.fill(0);
  release!();
  expect(await first).toBe(a);
  expect(await second).toBe(b);
  expect(Array.from(a)).toEqual(expected);
  expect(Array.from(b)).toEqual(expected);
  expect(engine.unprojectToSync(a, a)).toBe(a);
  expect(pipeline.unprojectToSync(b, b)).toBe(b);
  expect(a[0]).toBeCloseTo(11, 10);
  expect(b[1]).toBeCloseTo(41, 10);
  const lazy = new LazyProjection({to: 'EPSG:3857'}),
    result = new Float64Array(4);
  expect(await lazy.projectTo([0, 0, 10, 8], result)).toBe(result);
  expect(lazy.unprojectToSync(result, result)).toBe(result);
  expect(Array.from(result)).toEqual([0, 0, 10, 8]);
});

for (const [index, fixture] of inputs.cases.entries())
  test('caller outputs vs independent static pipeline anchors: ' + fixture.id, () => {
    const pipeline = new ProjectionPipeline(pipelineOptions(index, horizontal));
    for (const row of reference.cases[index].results) {
      const output = new Float64Array(row.input.length);
      pipeline.projectToSync(row.input, output);
      row.forward.forEach((value, axis) =>
        expect(Math.abs(output[axis] - value)).toBeLessThanOrEqual(fixture.forwardTolerance)
      );
      pipeline.unprojectToSync(row.forward, output);
      row.inverse.forEach((value, axis) =>
        expect(Math.abs(output[axis] - value)).toBeLessThanOrEqual(fixture.inverseTolerance)
      );
    }
  });
for (const [index, fixture] of movingInputs.cases.entries())
  test('caller outputs vs independent kinematic pipeline anchors: ' + fixture.id, () => {
    const pipeline = new ProjectionPipeline(kinematicOptions(index));
    for (const row of movingReference.cases[index].results) {
      const output = new Float64Array(row.input.length);
      pipeline.projectTo(row.input, output, row.epoch);
      row.forward.forEach((value, axis) =>
        expect(Math.abs(output[axis] - value)).toBeLessThanOrEqual(fixture.forwardTolerance)
      );
      pipeline.unprojectTo(row.forward, output, row.epoch);
      row.inverse.forEach((value, axis) =>
        expect(Math.abs(output[axis] - value)).toBeLessThanOrEqual(fixture.inverseTolerance)
      );
      expect(() => pipeline.projectTo(row.input, output)).toThrow('epoch');
    }
  });
