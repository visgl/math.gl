// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original qualification workload; numeric expectations are independent PROJ results.
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import type {ProjectionPipelineOptions} from '@math.gl/projection/pipeline';
import {obliqueTransformation, mollweide} from '@math.gl/projection';
import {mercator} from '@math.gl/projection/projections/merc';
import {universalTransverseMercator} from '@math.gl/projection/projections/utm';
import {parseNTv2Grid} from '@math.gl/projection/grids/ntv2';
import {parseGTXGrid} from '@math.gl/projection/grids/gtx';
import inputs from './fixtures/operation-pipeline-cases.json';
import reference from './fixtures/operation-pipeline-reference.json';
import verticalReference from './fixtures/vertical-grid-reference.json';

export function pipelineOptions(index: number, horizontal: ArrayBuffer): ProjectionPipelineOptions {
  const fixture = inputs.cases[index];
  return {
    input: fixture.input as ProjectionPipelineOptions['input'],
    steps: fixture.steps.map(step =>
      step.type === 'projection'
        ? {
            ...step,
            parameters: Object.fromEntries(
              Object.entries(step.parameters).map(([key, value]) => [
                key,
                value === null ? undefined : value
              ])
            )
          }
        : step
    ) as ProjectionPipelineOptions['steps'],
    projections: [
      mercator,
      universalTransverseMercator,
      obliqueTransformation(
        fixture.steps.some(step => step.type === 'projection' && step.parameters?.o_proj === 'moll')
          ? mollweide
          : 'longlat'
      )
    ],
    datumGrids: {horizontal: parseNTv2Grid(horizontal)},
    verticalGrids: {
      local: parseGTXGrid(new Uint8Array(verticalReference.gridBytes).buffer),
      directional: parseGTXGrid(new Uint8Array(reference.additionalVerticalGridBytes).buffer)
    }
  };
}
function close(actual: ArrayLike<number>, expected: ArrayLike<number>, tolerance: number): void {
  if (actual.length !== expected.length) throw new Error('Pipeline coordinate length mismatch');
  for (let i = 0; i < actual.length; i++)
    if (!Number.isFinite(actual[i]) || Math.abs(actual[i] - expected[i]) > tolerance)
      throw new Error(
        'Pipeline reference mismatch: ' + Array.from(actual) + ' vs ' + Array.from(expected)
      );
}
export function qualifyPipelineCase(index: number, horizontal: ArrayBuffer): number {
  const fixture = inputs.cases[index],
    expected = reference.cases[index];
  if (
    fixture.id !== expected.id ||
    JSON.stringify(fixture.points) !== JSON.stringify(expected.results.map(row => row.input))
  )
    throw new Error('Pipeline fixture mismatch');
  const pipeline = new ProjectionPipeline(pipelineOptions(index, horizontal));
  for (const row of expected.results) {
    close(pipeline.project(row.input), row.forward, fixture.forwardTolerance);
    close(pipeline.unproject(row.forward), row.inverse, fixture.inverseTolerance);
  }
  for (const ArrayType of [Float64Array, Float32Array]) {
    for (const inverse of [false, true]) {
      const buffer = new ArrayType(
        expected.results.flatMap(row => (inverse ? row.forward : row.input))
      );
      const rounded = Array.from(buffer);
      const scalar = expected.results.flatMap((_, i) =>
        (inverse ? pipeline.unproject : pipeline.project)(rounded.slice(i * 4, i * 4 + 4))
      );
      const returned = inverse
        ? pipeline.unprojectFlat(buffer, 4)
        : pipeline.projectFlat(buffer, 4);
      if (returned !== buffer) throw new Error('Pipeline must return input buffer');
      close(buffer, new ArrayType(scalar), ArrayType === Float64Array ? 1e-9 : 0);
      if (ArrayType === Float64Array)
        close(
          buffer,
          expected.results.flatMap(row => (inverse ? row.inverse : row.forward)),
          inverse ? fixture.inverseTolerance : fixture.forwardTolerance
        );
    }
  }
  return expected.results.length;
}
export function qualifyPipelines(horizontal: ArrayBuffer): {
  configurations: number;
  points: number;
} {
  const points = inputs.cases.reduce(
    (sum, _, index) => sum + qualifyPipelineCase(index, horizontal),
    0
  );
  return {configurations: inputs.cases.length, points};
}
