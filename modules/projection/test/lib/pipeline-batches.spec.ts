// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original tests of batch commit, intermediate validation and independent workload anchors.
import {beforeAll, expect, test} from 'vitest';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import type {PipelineStep} from '@math.gl/projection/pipeline';
import type {BenchmarkOptions} from '../live-bench-types';
import {
  PIPELINE_SCENARIOS,
  pipelineBenchmarkSource,
  pipelineScalarRunner,
  qualifyBenchmarkPipeline,
  validatePipelineRunner
} from '../pipeline-benchmark-workload';
import proj4 from 'proj4';
import {scalarRunner} from '../benchmark-workload';

let horizontal: ArrayBuffer;
beforeAll(async () => {
  const url = new URL('../fixtures/real-grids/BETA2007.gsb', import.meta.url);
  horizontal =
    url.protocol === 'file:'
      ? new Uint8Array(await (await import('node:fs/promises')).readFile(url)).buffer
      : await (await fetch(url)).arrayBuffer();
});
for (const scenario of PIPELINE_SCENARIOS)
  test('qualified seeded pipeline batch workload: ' + scenario.id, () => {
    const pipeline = qualifyBenchmarkPipeline({ProjectionPipeline}, scenario, horizontal);
    for (const precision of ['Float32', 'Float64'] as const)
      for (const dimension of [3, 4] as const)
        for (const direction of ['project', 'unproject'] as const) {
          const options: BenchmarkOptions = {precision, dimension, direction, points: 37};
          const {source, epochs} = pipelineBenchmarkSource(scenario, options);
          expect(source).toEqual(pipelineBenchmarkSource(scenario, options).source);
          const savedEpochs = typeof epochs === 'number' || !epochs ? epochs : epochs.slice();
          if (direction === 'unproject')
            pipelineScalarRunner(pipeline, {...options, direction: 'project'}, epochs)(source);
          const expected = source.slice();
          pipelineScalarRunner(pipeline, options, epochs)(expected);
          const operation =
            direction === 'project' ? pipeline.projectFlatSync : pipeline.unprojectFlatSync;
          validatePipelineRunner(
            source,
            expected,
            buffer => expect(operation(buffer, dimension, epochs)).toBe(buffer),
            dimension
          );
          if (typeof epochs !== 'number' && epochs) expect(epochs).toEqual(savedEpochs);
          if (scenario.classic) {
            const classic = proj4(scenario.classic.from, scenario.classic.to);
            const run = scalarRunner(
              point => classic[direction === 'project' ? 'forward' : 'inverse'](point, true),
              dimension
            );
            validatePipelineRunner(source, expected, run, dimension, 1e-4);
          }
        }
  });

test('empty-direction pipelines still validate inputs and preserve buffer views/tails', () => {
  const pipeline = new ProjectionPipeline({
    input: {space: 'projected', units: ['m', 'm', 'm']},
    steps: [{type: 'unitconvert', xy: {from: 'm', to: 'm'}, omitForward: true}]
  });
  expect(pipeline.project([1, 2, 3, NaN, Infinity, -0])).toEqual([1, 2, 3, NaN, Infinity, -0]);
  const storage = new Float64Array([99, 1, 2, 3, 8, 88]);
  const view = storage.subarray(1, 5);
  expect(pipeline.projectFlatSync(view, 4)).toBe(view);
  expect(Array.from(storage)).toEqual([99, 1, 2, 3, 8, 88]);
  expect(() => pipeline.project([NaN, 1])).toThrow('finite');
  expect(() => pipeline.projectFlat(new Float64Array([Infinity, 1]))).toThrow('finite');
});

test('short and long chains reject intermediate overflow even when a later stack restore would hide it', () => {
  for (const length of [3, 4, 5, 16]) {
    const steps: PipelineStep[] = [
      {type: 'push', components: [1, 2]},
      {type: 'helmert', translation: [Number.MAX_VALUE, 0, 0]},
      {type: 'pop', components: [1, 2]},
      ...Array.from(
        {length: length - 3},
        (): PipelineStep => ({type: 'unitconvert', xy: {from: 'm', to: 'm'}})
      )
    ];
    const pipeline = new ProjectionPipeline({
      input: {space: 'geocentric', units: ['m', 'm', 'm']},
      steps
    });
    const source = [1, 2, 3, 8, Number.MAX_VALUE, 2, 3, 9, 5, 6, 7, 10];
    const buffer = new Float64Array(source);
    expect(() => pipeline.projectFlatSync(buffer, 4)).toThrow('finite');
    expect(Array.from(buffer)).toEqual(source);
    expect(pipeline.project([1, 2, 3, 8])).toEqual([1, 2, 3, 8]);
  }
});

test('every record commits only after all steps and Float32 range checks succeed', () => {
  for (const count of [1, 2, 3, 4, 5, 16]) {
    const steps: PipelineStep[] = [
      {type: 'projection', name: 'testing'},
      ...Array.from(
        {length: count - 1},
        (): PipelineStep => ({type: 'unitconvert', xy: {from: 'm', to: 'm'}})
      )
    ];
    const plugin = {
      name: 'testing',
      parameters: [],
      create: () => ({
        forward: () => [0, 0] as [number, number],
        inverse: () => [0, 0] as [number, number],
        forwardInPlace(p: {x: number; y: number; z: number}) {
          p.x = p.x > 0.15 ? NaN : p.x + 1;
          p.y += 2;
        },
        inverseInPlace(p: {x: number; y: number; z: number}) {
          p.x -= 1;
          p.y -= 2;
        }
      })
    };
    const pipeline = new ProjectionPipeline({
      input: {space: 'geographic', units: ['rad', 'rad', 'm']},
      steps,
      projections: [plugin]
    });
    for (const ArrayType of [Float32Array, Float64Array]) {
      const source = new ArrayType([0.1, 0.2, 3, 8, 0.2, 0.3, 4, 9, 0.1, 0.4, 5, 10]);
      const buffer = source.slice();
      const first = new ArrayType(pipeline.project(Array.from(source.slice(0, 4))));
      expect(() => pipeline.projectFlat(buffer, 4)).toThrow('finite');
      expect(Array.from(buffer)).toEqual([...first, ...source.slice(4)]);
    }
  }
  const large = new ProjectionPipeline({
    input: {space: 'geocentric', units: ['m', 'm', 'm']},
    steps: [{type: 'helmert', translation: [0, 0, 0], scalePPM: 1e6}]
  });
  const buffer = new Float32Array([1, 2, 3, 8, 3e38, 1, 2, 9]);
  const source = buffer.slice();
  expect(() => large.projectFlat(buffer, 4)).toThrow('Float32 range');
  expect(Array.from(buffer)).toEqual([2, 4, 6, 8, ...source.slice(4)]);
});
