// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original cross-runtime buffer qualification using existing independent references.
import {Projection, ProjectionPipeline} from '@math.gl/projection';
import {ProjectionBuffer} from '../src/bulk';
import cases from './fixtures/accuracy-cases.json';
import reference from './fixtures/accuracy-reference.json';
import kinematicCases from './fixtures/kinematic-pipeline-cases.json';
import kinematicReference from './fixtures/kinematic-pipeline-reference.json';
import {kinematicOptions} from './kinematic-workload';

export function qualifyBulkLayouts(): {configurations: number; records: number} {
  let records = 0;
  const close = (actual: number, expected: number, tolerance: number) => {
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance)
      throw new Error(`Bulk reference mismatch ${actual} vs ${expected}`);
  };
  for (let index = 0; index < cases.cases.length; index++) {
    const fixture = cases.cases[index],
      rows = reference.cases[index].results;
    const projection = new Projection({from: '+proj=longlat +datum=none', to: fixture.definition});
    const transform = new ProjectionBuffer({
      projection,
      dimension: 4,
      inputOffset: 1,
      outputOffset: 2,
      inputStride: 6,
      outputStride: 7
    });
    // Independent points include fixed boundary probes and seeded interior samples.
    const selected = rows.filter((_, i) => i < 4 || i % 23 === 0);
    for (const inverse of [false, true]) {
      const input = new Float64Array(selected.length * 6),
        output = new Float64Array(selected.length * 7 + 2).fill(99);
      selected.forEach((row, i) =>
        input.set([...(inverse ? row.forward : row.input), 123, 7], 1 + i * 6)
      );
      const saved = input.slice();
      transform[inverse ? 'unprojectFlatTo' : 'projectFlatTo'](input, output, selected.length);
      selected.forEach((row, i) => {
        const expected = inverse ? row.inverse : row.forward;
        for (let j = 0; j < 2; j++)
          close(
            output[2 + i * 7 + j],
            expected[j],
            inverse ? fixture.inverseTolerance : fixture.forwardTolerance
          );
        if (output[4 + i * 7] !== 123 || output[5 + i * 7] !== 7 || output[6 + i * 7] !== 99)
          throw new Error('Bulk payload/gap write');
      });
      if (input.some((v, i) => v !== saved[i])) throw new Error('Bulk input write');
      const columns = [
        new Float64Array(selected.length),
        new Float64Array(selected.length),
        new Float64Array(selected.length).fill(123),
        new Float64Array(selected.length).fill(7)
      ];
      selected.forEach((row, i) => {
        const point = inverse ? row.forward : row.input;
        columns[0][i] = point[0];
        columns[1][i] = point[1];
      });
      const target = columns.map(() => new Float64Array(selected.length));
      new ProjectionBuffer({projection, dimension: 4})[
        inverse ? 'unprojectColumnsTo' : 'projectColumnsTo'
      ](columns, target);
      selected.forEach((row, i) => {
        const expected = inverse ? row.inverse : row.forward;
        for (let j = 0; j < 2; j++)
          close(
            target[j][i],
            expected[j],
            inverse ? fixture.inverseTolerance : fixture.forwardTolerance
          );
      });
      records += selected.length * 2;
    }
  }
  for (let index = 0; index < kinematicCases.cases.length; index++) {
    const fixture = kinematicCases.cases[index],
      rows = kinematicReference.cases[index].results;
    const projection = new ProjectionPipeline(kinematicOptions(index)),
      transform = new ProjectionBuffer({projection, dimension: 4});
    const epochs = new Float64Array(rows.map(row => row.epoch));
    for (const inverse of [false, true]) {
      const input = new Float64Array(rows.flatMap(row => (inverse ? row.forward : row.input))),
        output = new Float64Array(input.length);
      transform[inverse ? 'unprojectFlatTo' : 'projectFlatTo'](
        input,
        output,
        rows.length,
        0,
        epochs
      );
      rows.forEach((row, i) => {
        const expected = inverse ? row.inverse : row.forward;
        for (let j = 0; j < 4; j++)
          close(
            output[i * 4 + j],
            expected[j],
            inverse ? fixture.inverseTolerance : fixture.forwardTolerance
          );
      });
      records += rows.length;
    }
  }
  return {configurations: cases.cases.length + kinematicCases.cases.length, records};
}
