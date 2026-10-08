// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original buffer ownership, independent reference and reusable scratch tests.
import {expect, test} from 'vitest';
import {
  projectionEngine,
  ProjectionTransform,
  ProjectionPipeline,
  mercator
} from '@math.gl/projection';
import {ProjectionBuffer} from '../../src/bulk';
import type {BulkProjection} from '../../src/bulk';
import {lazyProjectionEngine} from '@math.gl/projection/projections/lazy';
import {ProjectionScratch} from '../../src/experimental/projection-scratch';
import {qualifyBulkLayouts} from '../bulk-workload';
import {
  PIPELINE_SCENARIOS,
  qualifyBenchmarkPipeline,
  pipelineBenchmarkSource
} from '../pipeline-benchmark-workload';

const engine = () => new ProjectionTransform({to: 'EPSG:3857', projections: [mercator]});
const identity = () =>
  new ProjectionPipeline({
    input: {space: 'projected', units: ['m', 'm', 'm']},
    steps: [{type: 'unitconvert', xy: {from: 'm', to: 'm'}}]
  });
test('bulk layouts against independent projection and kinematic references', () => {
  const qualification = qualifyBulkLayouts();
  expect(qualification.configurations).toBeGreaterThan(42);
  expect(qualification.records).toBeGreaterThan(1000);
});

for (const Input of [Float32Array, Float64Array])
  for (const Output of [Float32Array, Float64Array]) {
    test(`separate strided XYZM views/chunks ${Input.name} → ${Output.name}`, () => {
      const projection = engine();
      const inputStorage = new Input(23).fill(71),
        outputStorage = new Output(30).fill(89);
      const input = inputStorage.subarray(1, 22),
        output = outputStorage.subarray(2, 29);
      input.set([12, 40, 123, 7], 1);
      input.set([-3, -25, -200, NaN], 7);
      input.set([0, 0, 0, -0], 13);
      const saved = inputStorage.slice();
      const transform = new ProjectionBuffer({
        projection,
        dimension: 4,
        inputOffset: 1,
        outputOffset: 2,
        inputStride: 6,
        outputStride: 7
      });
      transform.projectFlatTo(input, output, 1, 1);
      expect(output.slice(2, 6)).toEqual(new Output(4).fill(89));
      transform.projectFlatTo(input, output, 1, 0);
      transform.projectFlatTo(input, output, 1, 2);
      for (let row = 0; row < 3; row++) {
        const expected = projection.projectToSync(
          input.subarray(1 + row * 6, 5 + row * 6),
          new Output(4)
        );
        expect(output.slice(2 + row * 7, 6 + row * 7)).toEqual(expected);
      }
      expect(inputStorage).toEqual(saved);
      for (let i = 0; i < outputStorage.length; i++)
        if (![4, 5, 6, 7, 11, 12, 13, 14, 18, 19, 20, 21].includes(i))
          expect(outputStorage[i]).toBe(89);
      const restored = new Float64Array(12);
      new ProjectionBuffer({
        projection,
        dimension: 4,
        inputOffset: 2,
        inputStride: 7
      }).unprojectFlatTo(output, restored, 3);
      expect(restored[0]).toBeCloseTo(12, 5);
      expect(restored[1]).toBeCloseTo(40, 5);
      expect(restored[3]).toBe(7);
      expect(restored[7]).toBeNaN();
    });
  }

test('column strides, gaps, exact in-place swaps and mixed precision payload', () => {
  const projection = identity();
  const transform = new ProjectionBuffer({
    projection,
    dimension: 4,
    inputOffset: 1,
    outputOffset: 1,
    inputStride: 2,
    outputStride: 2
  });
  const x = new Float64Array([99, 1, 99, 2, 99]),
    y = new Float64Array([88, 3, 88, 4, 88]);
  const z = new Float32Array([77, 5, 77, 6, 77]),
    m = new Float64Array([66, NaN, 66, -0, 66]);
  const output = [y, x, z, m] as const;
  expect(transform.projectColumnsTo([x, y, z, m], output)).toBe(output);
  expect([...x]).toEqual([99, 3, 99, 4, 99]);
  expect([...y]).toEqual([88, 1, 88, 2, 88]);
  expect([...z]).toEqual([77, 5, 77, 6, 77]);
  expect(m[1]).toBeNaN();
  expect(Object.is(m[3], -0)).toBe(true);
});

test('overlapping storage validation precedes all writes', () => {
  const transform = new ProjectionBuffer({projection: identity()});
  const storage = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]),
    saved = storage.slice();
  expect(() => transform.projectFlatTo(storage.subarray(0, 4), storage.subarray(1, 5))).toThrow(
    'overlap'
  );
  expect(storage).toEqual(saved);
  expect(transform.projectFlatTo(storage.subarray(0, 4), storage.subarray(4, 8))).toEqual(
    saved.subarray(0, 4)
  );
  const columns = [new Float64Array([1, 2]), new Float64Array([3, 4])];
  const output = new Float64Array(2).fill(9);
  expect(() => transform.projectColumnsTo(columns, [output, output])).toThrow('overlap');
  expect([...output]).toEqual([9, 9]);
  expect(() =>
    transform.projectFlatTo(new Float64Array(4), new Float64Array(4), 2, 0, new Float64Array(1))
  ).toThrow('Epoch');
  const epochsAndOutput = new Float64Array([2020, 2021, 9, 9]);
  expect(() =>
    transform.projectFlatTo(new Float64Array(4), epochsAndOutput, 2, 0, epochsAndOutput)
  ).toThrow('Epoch');
  expect([...epochsAndOutput]).toEqual([2020, 2021, 9, 9]);
  const bytes = new ArrayBuffer(32);
  expect(() =>
    transform.projectFlatTo(new Float32Array(bytes, 0, 4), new Float64Array(bytes, 0, 4))
  ).toThrow('overlap');
});

test('failure commits the prefix and leaves failed XYZM record and tail intact', () => {
  const transform = new ProjectionBuffer({
    projection: identity(),
    dimension: 4
  });
  const input = new Float64Array([1, 2, 3, 7, 4, NaN, 6, 8, 7, 8, 9, 10]);
  const output = new Float64Array(12).fill(99);
  expect(() => transform.projectFlatTo(input, output)).toThrow('finite');
  expect([...output]).toEqual([1, 2, 3, 7, 99, 99, 99, 99, 99, 99, 99, 99]);
  input[5] = 5;
  transform.projectFlatTo(input, output, 2, 1);
  expect(output).toEqual(input);
  const epochs = new Float64Array([2020, NaN, 2022]),
    before = epochs.slice();
  output.fill(99);
  expect(() => transform.projectFlatTo(input, output, 3, 0, epochs)).toThrow('epoch');
  expect([...output]).toEqual([1, 2, 3, 7, 99, 99, 99, 99, 99, 99, 99, 99]);
  expect(epochs).toEqual(before);
});

for (const ordinate of [0, 1, 2, 3])
  test('Float32 overflow is atomic at ordinate ' + ordinate, () => {
    const input = new Float64Array([1, 2, 3, 4]);
    input[ordinate] = 1e40;
    const transform = new ProjectionBuffer({
      projection: identity(),
      dimension: 4
    });
    const flat = new Float32Array(4).fill(91);
    expect(() => transform.projectFlatTo(input, flat)).toThrow('Float32');
    expect([...flat]).toEqual([91, 91, 91, 91]);
    const columns = Array.from(input, value => new Float64Array([value]));
    const outputs = Array.from({length: 4}, () => new Float32Array([81]));
    expect(() => transform.projectColumnsTo(columns, outputs)).toThrow('Float32');
    expect(outputs.map(a => a[0])).toEqual([81, 81, 81, 81]);
  });

test('layout/range errors and no-op chunks', () => {
  for (const options of [
    {dimension: 1},
    {dimension: 2.1},
    {inputOffset: -1},
    {outputOffset: NaN},
    {inputStride: 0}
  ])
    expect(() => new ProjectionBuffer({projection: identity(), ...options})).toThrow('layout');
  const transform = new ProjectionBuffer({projection: identity()});
  const input = new Float64Array([1, 2, 3, 4]),
    output = new Float64Array(4).fill(8);
  for (const [count, start] of [
    [-1, 0],
    [1, -1],
    [3, 0],
    [1, 2],
    [0, 3],
    [NaN, 0]
  ])
    expect(() => transform.projectFlatTo(input, output, count, start)).toThrow('range');
  expect(() => transform.projectFlatTo(input, new Float64Array(2))).toThrow('short');
  expect(() =>
    new ProjectionBuffer({
      projection: identity(),
      inputStride: 1
    }).projectFlatTo(input, output)
  ).toThrow('stride');
  expect(() => transform.projectColumnsTo([input], [output])).toThrow('dimension');
  expect(transform.projectFlatTo(input, output, 0, 2)).toBe(output);
  expect([...output]).toEqual([8, 8, 8, 8]);
});

test('preloaded lazy and compatibility projections keep synchronous behavior', async () => {
  const wrapper = projectionEngine.createProjection({to: 'EPSG:3857'}),
    input = new Float64Array([12, 40]);
  expect(
    new ProjectionBuffer({projection: wrapper}).projectFlatTo(input, new Float64Array(2))
  ).toEqual(new Float64Array(wrapper.project(input)));
  const lazy = lazyProjectionEngine.createProjection({to: 'EPSG:32631'}),
    transform = new ProjectionBuffer({projection: lazy});
  const output = new Float64Array([91, 92]);
  expect(() => transform.projectFlatTo(input, output)).toThrow('preload');
  expect([...output]).toEqual([91, 92]);
  await lazy.preload();
  transform.projectFlatTo(input, output);
  expect(output).toEqual(new Float64Array(lazy.projectSync(input)));
});

test('nested buffer calls use two scratch pairs and reuse them after failure', () => {
  const sources = new Set<object>(),
    results = new Set<object>();
  let nested = false,
    fail = false;
  const project: BulkProjection['projectToSync'] = (input, output) => {
    sources.add(input);
    results.add(output);
    const x = input[0],
      y = input[1];
    if (!nested) {
      nested = true;
      try {
        expect(transform.projectFlatTo(new Float64Array([10, 20]), new Float64Array(2))).toEqual(
          new Float64Array([11, 22])
        );
      } finally {
        nested = false;
      }
    }
    expect(input[0]).toBe(x);
    if (fail && !nested) throw new Error('failure');
    output[0] = x + 1;
    output[1] = y + 2;
    return output;
  };
  const transform = new ProjectionBuffer({
    projection: {projectToSync: project, unprojectToSync: project}
  });
  for (let i = 0; i < 10; i++)
    expect(transform.projectFlatTo(new Float64Array([1, 2, 3, 4]), new Float64Array(4))).toEqual(
      new Float64Array([2, 4, 4, 6])
    );
  expect(sources.size).toBe(2);
  expect(results.size).toBe(2);
  fail = true;
  expect(() => transform.projectFlatTo(new Float64Array([1, 2]), new Float64Array(2))).toThrow(
    'failure'
  );
  fail = false;
  transform.projectFlatTo(new Float64Array([1, 2]), new Float64Array(2));
  expect(sources.size).toBe(2);
});

test('point scratch pools retain independent nested leases', () => {
  const pool = new ProjectionScratch();
  const first = pool.acquire(),
    second = pool.acquire(),
    third = pool.acquire();
  expect(pool.depth).toBe(3);
  expect(first).not.toBe(second);
  expect(second).not.toBe(third);
  pool.release(third);
  pool.release(second);
  pool.release(first);
  for (let i = 0; i < 10; i++) {
    expect(pool.acquire()).toBe(first);
    expect(pool.acquire()).toBe(second);
    expect(pool.acquire()).toBe(third);
    pool.release(third);
    pool.release(second);
    pool.release(first);
  }
  expect(pool.depth).toBe(0);
});

test('all mixed pipeline workloads preserve strided bulk results and epochs', async () => {
  const url = new URL('../fixtures/real-grids/BETA2007.gsb', import.meta.url);
  const horizontal =
    url.protocol === 'file:'
      ? new Uint8Array(await (await import('node:fs/promises')).readFile(url)).buffer
      : await (await fetch(url)).arrayBuffer();
  for (const scenario of PIPELINE_SCENARIOS) {
    const pipeline = qualifyBenchmarkPipeline({ProjectionPipeline}, scenario, horizontal);
    for (const direction of ['project', 'unproject'] as const) {
      const {source, epochs} = pipelineBenchmarkSource(scenario, {
        precision: 'Float64',
        dimension: 4,
        direction,
        points: 11
      });
      if (direction === 'unproject') pipeline.projectFlatSync(source, 4, epochs);
      const expected = source.slice();
      pipeline[direction === 'project' ? 'projectFlatSync' : 'unprojectFlatSync'](
        expected,
        4,
        epochs
      );
      const input = new Float64Array(11 * 6).fill(77),
        output = new Float64Array(11 * 7).fill(88);
      for (let i = 0; i < 11; i++) input.set(source.subarray(i * 4, i * 4 + 4), i * 6);
      const transform = new ProjectionBuffer({
        projection: pipeline,
        dimension: 4,
        inputStride: 6,
        outputStride: 7
      });
      transform[direction === 'project' ? 'projectFlatTo' : 'unprojectFlatTo'](
        input,
        output,
        11,
        0,
        epochs
      );
      for (let i = 0; i < 11; i++) {
        expect(output.slice(i * 7, i * 7 + 4), scenario.id).toEqual(
          expected.slice(i * 4, i * 4 + 4)
        );
        expect(output[i * 7 + 4]).toBe(88);
      }
    }
  }
});
