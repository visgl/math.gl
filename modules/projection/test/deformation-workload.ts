// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Independent PROJ 9.5.1 qualification, shared by tests and browser benchmarks.
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import type {PipelineStep} from '@math.gl/projection/pipeline';
import {createDeformationModel} from '@math.gl/projection/deformation';
import type {VelocityGrid} from '@math.gl/projection/grids/velocity';
import inputs from './fixtures/deformation-cases.json';
import reference from './fixtures/deformation-reference.json';
function close(actual: ArrayLike<number>, expected: readonly number[], tolerance: number): void {
  if (actual.length !== expected.length) throw new Error('Deformation coordinate length mismatch');
  for (let i = 0; i < actual.length; i++)
    if (!Number.isFinite(actual[i]) || Math.abs(actual[i] - expected[i]) > tolerance)
      throw new Error(`Deformation mismatch at ordinate ${i}: ${actual[i]} vs ${expected[i]}`);
}
export function qualifyDeformationCase(index: number, grid: VelocityGrid): number {
  const fixture = inputs.cases[index];
  const model = createDeformationModel({
    grid,
    epochRange: [2010, 2030],
    ellipsoid: inputs.model.ellipsoid
  });
  const pipeline = new ProjectionPipeline({
    input: {
      ...fixture.input,
      space: fixture.input.space as 'geographic' | 'geocentric',
      units: fixture.input.units as ['deg', 'deg', 'm'] | ['m', 'm', 'm']
    },
    steps: fixture.steps.map(step =>
      step.type === 'deformation' ? {...step, model} : step
    ) as PipelineStep[]
  });
  const rows = reference.cases[index].results;
  for (const row of rows) {
    // The legacy PROJ reverse iteration is not the mathematical inverse. Keep an
    // explicit compatibility envelope in addition to the tighter forward-oracle roots.
    close(row.forward, row.projForward, 0.0001);
    close(row.inverse, row.projInverse, 0.0001);
    close(pipeline.project(row.input, row.epoch), row.forward, fixture.forwardTolerance);
    close(pipeline.unproject(row.forward, row.epoch), row.inverse, fixture.inverseTolerance);
    close(
      pipeline.unproject(pipeline.project(row.input, row.epoch), row.epoch),
      row.input,
      0.00000002
    );
  }
  for (const ArrayType of [Float32Array, Float64Array])
    for (const dimension of [3, 4, 5])
      for (const inverse of [false, true]) {
        const source = rows.flatMap(row =>
          (inverse ? row.forward : row.input).slice(0, dimension).concat(dimension === 5 ? [9] : [])
        );
        const buffer = new ArrayType(source);
        const expected = new ArrayType(
          rows.flatMap((row, i) => {
            const point = Array.from(buffer.slice(i * dimension, (i + 1) * dimension));
            return (inverse ? pipeline.unprojectSync : pipeline.projectSync)(point, row.epoch);
          })
        );
        const epochs = new Float64Array(rows.map(row => row.epoch));
        const result = inverse
          ? pipeline.unprojectFlat(buffer, dimension, epochs)
          : pipeline.projectFlat(buffer, dimension, epochs);
        if (result !== buffer) throw new Error('Deformation flat did not retain input view');
        close(buffer, Array.from(expected), ArrayType === Float32Array ? 0 : 1e-9);
      }
  return rows.length;
}
export function qualifyDeformations(grid: VelocityGrid): {configurations: number; points: number} {
  let points = 0;
  for (let i = 0; i < inputs.cases.length; i++) points += qualifyDeformationCase(i, grid);
  return {configurations: inputs.cases.length, points};
}
