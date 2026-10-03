// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original bounded performance workload. Qualification anchors are pinned PROJ results.
import type {ProjectionPipeline, PipelineEpochs} from '@math.gl/projection/pipeline';
import type {BenchmarkOptions} from './live-bench-types';
import {BENCHMARK_SEED} from './live-bench-types';
import {pipelineOptions} from './pipeline-workload';
import {kinematicOptions} from './kinematic-workload';
import staticInputs from './fixtures/operation-pipeline-cases.json';
import staticReference from './fixtures/operation-pipeline-reference.json';
import kinematicInputs from './fixtures/kinematic-pipeline-cases.json';
import kinematicReference from './fixtures/kinematic-pipeline-reference.json';

export type PipelineBenchmarkScenario = {
  id: string;
  fixture: string;
  epoch?: 'batch' | 'mixed';
  classic?: {from: string; to: string};
};
export const PIPELINE_SCENARIOS: readonly PipelineBenchmarkScenario[] = [
  {id: 'Mercator', fixture: 'mercator', classic: {from: 'WGS84', to: 'EPSG:3857'}},
  {id: 'UTM and height units', fixture: 'utm-height-us-feet'},
  {id: 'Signed axes and Mercator', fixture: 'signed-geographic-axis'},
  {
    id: 'Mercator to UTM',
    fixture: 'mercator-to-utm',
    classic: {from: 'EPSG:3857', to: 'EPSG:32631'}
  },
  {id: 'Projected units and signed axes', fixture: 'projected-units-signed-axes'},
  {id: 'XYZ axis cycle', fixture: 'xyz-axis-cycle'},
  {id: 'Inverse axis cycle', fixture: 'inverse-axis-cycle'},
  {id: 'Inverse angular units', fixture: 'inverse-unit-step'},
  {id: 'Static Helmert', fixture: 'helmert-position_vector'},
  {id: 'Exact Helmert', fixture: 'exact-position_vector-20'},
  {
    id: 'Datum to Mercator',
    fixture: 'datum-to-projection',
    classic: {
      from: '+proj=longlat +ellps=intl +towgs84=1.2,-2.3,3.4,.12,-.25,.31,1.7',
      to: 'EPSG:3857'
    }
  },
  {id: 'Vertical grid', fixture: 'vertical-default'},
  {id: 'Horizontal grid to UTM', fixture: 'horizontal-to-utm'},
  {id: 'Height stack and datum', fixture: 'height-stack-around-datum'},
  {id: 'Batch epoch Helmert', fixture: 'exact-position_vector', epoch: 'batch'},
  {id: 'Mixed epoch Helmert', fixture: 'exact-position_vector', epoch: 'mixed'},
  {
    id: 'Mixed epochs with height stack and UTM',
    fixture: 'geographic-height-stack-to-utm',
    epoch: 'mixed'
  }
];
export type PipelineBuffer = Float32Array | Float64Array;
export type PipelineRuntime = {
  ProjectionPipeline: typeof ProjectionPipeline;
};
function fixture(scenario: PipelineBenchmarkScenario) {
  const inputs = scenario.epoch ? kinematicInputs : staticInputs;
  const index = inputs.cases.findIndex(row => row.id === scenario.fixture);
  if (index < 0) throw new Error('Unknown pipeline benchmark fixture: ' + scenario.fixture);
  return {index, input: inputs.cases[index]};
}
export function benchmarkPipelineOptions(
  scenario: PipelineBenchmarkScenario,
  horizontal: ArrayBuffer
) {
  const {index} = fixture(scenario);
  return scenario.epoch ? kinematicOptions(index) : pipelineOptions(index, horizontal);
}
/** Verify both historical and candidate runtimes against the same independent anchors. */
export function qualifyBenchmarkPipeline(
  runtime: PipelineRuntime,
  scenario: PipelineBenchmarkScenario,
  horizontal: ArrayBuffer
) {
  const {index, input} = fixture(scenario);
  const reference = scenario.epoch ? kinematicReference : staticReference;
  const pipeline = new runtime.ProjectionPipeline(benchmarkPipelineOptions(scenario, horizontal));
  for (const row of reference.cases[index].results) {
    const epoch = 'epoch' in row ? row.epoch : undefined;
    for (const inverse of [false, true]) {
      const point = inverse ? row.forward : row.input;
      const expected = inverse ? row.inverse : row.forward;
      const tolerance = inverse ? input.inverseTolerance : input.forwardTolerance;
      const scalar = (inverse ? pipeline.unprojectSync : pipeline.projectSync)(point, epoch);
      const flat = new Float64Array(point);
      (inverse ? pipeline.unprojectFlatSync : pipeline.projectFlatSync)(flat, 4, epoch);
      for (let i = 0; i < point.length; i++)
        if (
          !Number.isFinite(flat[i]) ||
          Math.abs(flat[i] - expected[i]) > tolerance ||
          !Number.isFinite(scalar[i]) ||
          Math.abs(scalar[i] - expected[i]) > tolerance
        )
          throw new Error('Independent pipeline anchor mismatch: ' + scenario.id);
    }
  }
  return pipeline;
}
/** Seeded bounded jitter around independent fixtures; M deliberately varies by record. */
export function pipelineBenchmarkSource(
  scenario: PipelineBenchmarkScenario,
  options: BenchmarkOptions
) {
  const {input} = fixture(scenario);
  const ArrayType = options.precision === 'Float32' ? Float32Array : Float64Array;
  const source = new ArrayType(options.points * options.dimension);
  const epochs =
    scenario.epoch === 'mixed' ? new ArrayType(options.points) : scenario.epoch ? 2020 : undefined;
  let seed = BENCHMARK_SEED;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296 - 0.5;
  };
  const jitter =
    input.input.space === 'geographic' ? (input.input.units[0] === 'deg' ? 0.01 : 0.0001) : 100;
  for (let i = 0; i < options.points; i++) {
    const point = input.points[i % input.points.length],
      offset = i * options.dimension;
    source[offset] = point[0] + random() * jitter;
    source[offset + 1] = point[1] + random() * jitter;
    source[offset + 2] = point[2] + random() * 5;
    if (options.dimension === 4) source[offset + 3] = i + 0.25;
    if (epochs instanceof Float32Array || epochs instanceof Float64Array)
      epochs[i] = 1990 + (i % 61) + random();
  }
  return {source, epochs};
}
export function pipelineScalarRunner(
  pipeline: ProjectionPipeline,
  options: BenchmarkOptions,
  epochs?: PipelineEpochs
) {
  const operation = options.direction === 'project' ? pipeline.projectSync : pipeline.unprojectSync;
  const point = Array<number>(options.dimension).fill(0);
  return (buffer: PipelineBuffer) => {
    for (let i = 0, record = 0; i < buffer.length; i += options.dimension, record++) {
      for (let axis = 0; axis < options.dimension; axis++) point[axis] = buffer[i + axis];
      const result = operation(point, typeof epochs === 'number' ? epochs : epochs?.[record]);
      for (let axis = 0; axis < options.dimension; axis++) buffer[i + axis] = result[axis];
    }
  };
}
/** All ordinates are checked, including exact M preservation. Float32 rounds only at storage. */
export function validatePipelineRunner(
  source: PipelineBuffer,
  expected: PipelineBuffer,
  run: (buffer: PipelineBuffer) => unknown,
  dimension: number,
  absoluteTolerance = 1e-8
) {
  const output = source.slice();
  run(output);
  for (let i = 0; i < output.length; i++) {
    const tolerance =
      i % dimension >= 3
        ? 0
        : Math.max(
            absoluteTolerance,
            Math.abs(expected[i]) * (source instanceof Float32Array ? 2e-7 : 2e-14)
          );
    if (
      !Number.isFinite(output[i]) ||
      !Number.isFinite(expected[i]) ||
      Math.abs(output[i] - expected[i]) > tolerance
    )
      throw new Error(
        'Pipeline benchmark coordinate mismatch at ' + i + ': ' + output[i] + ' vs ' + expected[i]
      );
  }
}
