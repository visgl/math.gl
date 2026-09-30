// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original independent accuracy measurements for the proj4js-inspired API.
import {Projection} from '@math.gl/proj4';
import inputs from './fixtures/accuracy-cases.json';
import reference from './fixtures/accuracy-reference.json';

/** Observed component-wise error, never a bound on unsampled coordinates. */
export function measureAccuracy() {
  return inputs.cases.map((fixture, index) => {
    const projection = new Projection({
      from: '+proj=longlat +datum=none',
      to: fixture.definition
    });
    const rows = reference.cases[index].results;
    if (reference.cases[index].id !== fixture.id) throw new Error('Accuracy reference ID mismatch');
    const metric = () => ({maximum: 0, input: rows[0].input});
    const errors = {
      forward: metric(),
      inverse: metric(),
      roundtrip: metric(),
      flatForward: metric(),
      flatInverse: metric(),
      flatRoundtrip: metric()
    };
    const record = (
      key: keyof typeof errors,
      actual: ArrayLike<number>,
      expected: number[],
      input: number[]
    ) => {
      for (let ordinate = 0; ordinate < 2; ordinate++) {
        const error = Math.abs(actual[ordinate] - expected[ordinate]);
        if (!Number.isFinite(error)) throw new Error(`${fixture.id}: non-finite ${key}`);
        if (error > errors[key].maximum) errors[key] = {maximum: error, input};
      }
    };
    const forward = new Float64Array(rows.length * 4);
    const inverse = new Float64Array(rows.length * 4);
    rows.forEach((row, i) => {
      forward.set([...row.input, 123, 7], i * 4);
      inverse.set([...row.forward, 123, 7], i * 4);
    });
    projection.projectFlat(forward, 4);
    const roundtrip = forward.slice();
    projection.unprojectFlat(roundtrip, 4);
    projection.unprojectFlat(inverse, 4);
    rows.forEach((row, i) => {
      const projected = projection.project(row.input);
      record('forward', projected, row.forward, row.input);
      record('inverse', projection.unproject(row.forward), row.inverse, row.input);
      record('roundtrip', projection.unproject(projected), row.input, row.input);
      record('flatForward', forward.subarray(i * 4), row.forward, row.input);
      record('flatInverse', inverse.subarray(i * 4), row.inverse, row.input);
      record('flatRoundtrip', roundtrip.subarray(i * 4), row.input, row.input);
      for (const buffer of [forward, inverse, roundtrip]) {
        if (buffer[i * 4 + 2] !== 123 || buffer[i * 4 + 3] !== 7) {
          throw new Error(`${fixture.id}: trailing ordinate changed`);
        }
      }
    });
    return {id: fixture.id, bounds: fixture.bounds, points: rows.length, errors};
  });
}

export function qualifyAccuracy() {
  const measurements = measureAccuracy();
  for (const [index, row] of measurements.entries()) {
    const fixture = inputs.cases[index];
    const budgets = {
      forward: fixture.forwardTolerance,
      inverse: fixture.inverseTolerance,
      roundtrip: fixture.roundtripTolerance,
      flatForward: fixture.forwardTolerance,
      flatInverse: fixture.inverseTolerance,
      flatRoundtrip: fixture.roundtripTolerance
    };
    for (const key of Object.keys(budgets) as (keyof typeof budgets)[]) {
      if (row.errors[key].maximum > budgets[key]) {
        throw new Error(
          `${row.id} ${key}: ${row.errors[key].maximum} > ${budgets[key]} at ${row.errors[key].input}`
        );
      }
    }
  }
  return measurements;
}
