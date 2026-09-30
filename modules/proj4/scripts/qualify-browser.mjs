// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Independent PROJ fixtures, exercised in the same engines as browser benchmarks.
import * as native from '@math.gl/proj4/native';
const projections = Object.values(native).filter(
  value => value && typeof value === 'object' && 'create' in value
);
projections.push(native.obliqueTransformation(native.mollweide));
function close(actual, expected, tolerance) {
  if (actual.length !== expected.length) throw new Error('Coordinate length mismatch');
  for (let j = 0; j < actual.length; j++)
    if (!Number.isFinite(actual[j]) || Math.abs(actual[j] - expected[j]) > tolerance)
      throw new Error(`Independent reference mismatch: ${actual} vs ${expected}`);
}
export function qualify(inputs, reference) {
  let points = 0;
  for (const [index, fixture] of inputs.cases.entries()) {
    const projection = new native.TypeScriptProjection({
      from: '+proj=longlat +datum=none',
      to: fixture.definition,
      projections
    });
    if (reference.cases[index].id !== fixture.id) throw new Error('Reference ID mismatch');
    for (const row of reference.cases[index].results) {
      const knot =
        fixture.knotInverseTolerance &&
        Math.abs(row.input[1]) < 90 &&
        Math.abs(row.input[1] / 5 - Math.round(row.input[1] / 5)) < 1e-12;
      const inverseTolerance = knot ? fixture.knotInverseTolerance : fixture.inverseTolerance;
      close(projection.project(row.input), row.forward, fixture.forwardTolerance);
      close(projection.unproject(row.forward), row.inverse, inverseTolerance);
      if (knot) close(projection.unproject(row.forward), row.input, 1e-8);
      const forward = new Float64Array([row.input[0], row.input[1], row.input[2] ?? 123, 7]);
      const inverse = new Float64Array([row.forward[0], row.forward[1], row.forward[2] ?? 123, 7]);
      projection.projectFlat(forward, 4);
      projection.unprojectFlat(inverse, 4);
      close(
        forward,
        [row.forward[0], row.forward[1], row.forward[2] ?? 123, 7],
        fixture.forwardTolerance
      );
      close(inverse, [row.inverse[0], row.inverse[1], row.inverse[2] ?? 123, 7], inverseTolerance);
      points++;
    }
  }
  return {configurations: inputs.cases.length, points};
}
