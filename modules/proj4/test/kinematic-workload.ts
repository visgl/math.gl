// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original qualification workload using independent PROJ spatial/time expectations.
import {ProjectionPipeline} from '@math.gl/proj4/pipeline';
import type {ProjectionPipelineOptions} from '@math.gl/proj4/pipeline';
import {universalTransverseMercator} from '@math.gl/proj4/projections/utm';
import inputs from './fixtures/kinematic-pipeline-cases.json';
import reference from './fixtures/kinematic-pipeline-reference.json';

export function kinematicOptions(index: number): ProjectionPipelineOptions {
  const fixture = inputs.cases[index];
  return {
    input: fixture.input as ProjectionPipelineOptions['input'],
    steps: fixture.steps as ProjectionPipelineOptions['steps'],
    projections: [universalTransverseMercator]
  };
}
function close(actual: ArrayLike<number>, expected: ArrayLike<number>, tolerance: number): void {
  if (actual.length !== expected.length) throw new Error('Kinematic coordinate length mismatch');
  for (let i = 0; i < actual.length; i++)
    if (!Number.isFinite(actual[i]) || Math.abs(actual[i] - expected[i]) > tolerance)
      throw new Error(
        'Kinematic reference mismatch: ' + Array.from(actual) + ' vs ' + Array.from(expected)
      );
}
export function qualifyKinematicCase(index: number): number {
  const fixture = inputs.cases[index],
    expected = reference.cases[index];
  if (fixture.id !== expected.id) throw new Error('Kinematic fixture ID mismatch');
  const pipeline = new ProjectionPipeline(kinematicOptions(index));
  for (const row of expected.results) {
    close(pipeline.project(row.input, row.epoch), row.forward, fixture.forwardTolerance);
    close(pipeline.unproject(row.forward, row.epoch), row.inverse, fixture.inverseTolerance);
    const flat = new Float64Array(row.input);
    pipeline.projectFlat(flat, 4, row.epoch);
    close(flat, row.forward, fixture.forwardTolerance);
  }
  for (const ArrayType of [Float64Array, Float32Array]) {
    for (const inverse of [false, true]) {
      const epochs = new ArrayType(fixture.epochs);
      const savedEpochs = Array.from(epochs);
      const flat = new ArrayType(
        expected.results.flatMap(row => (inverse ? row.forward : row.input))
      );
      const scalar = expected.results.flatMap((_, i) => {
        const point = Array.from(flat.slice(i * 4, i * 4 + 4));
        return (inverse ? pipeline.unproject : pipeline.project)(point, epochs[i]);
      });
      const returned = inverse
        ? pipeline.unprojectFlat(flat, 4, epochs)
        : pipeline.projectFlat(flat, 4, epochs);
      if (returned !== flat || epochs.some((value, i) => value !== savedEpochs[i]))
        throw new Error('Kinematic flat ownership failure');
      close(flat, new ArrayType(scalar), ArrayType === Float32Array ? 0 : 1e-9);
      if (ArrayType === Float64Array)
        close(
          flat,
          expected.results.flatMap(row => (inverse ? row.inverse : row.forward)),
          inverse ? fixture.inverseTolerance : fixture.forwardTolerance
        );
    }
  }
  return expected.results.length;
}
export function qualifyKinematicPipelines(): {configurations: number; points: number} {
  return {
    configurations: inputs.cases.length,
    points: inputs.cases.reduce((sum, _, i) => sum + qualifyKinematicCase(i), 0)
  };
}
