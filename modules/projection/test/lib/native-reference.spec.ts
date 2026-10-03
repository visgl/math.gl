// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original qualification tests for the proj4js-inspired API, using native PROJ expectations.
import {expect, test} from 'vitest';
import * as native from '@math.gl/projection/experimental';
import type {ProjectionPlugin} from '@math.gl/projection/experimental';
import inputs from '../fixtures/native-proj-cases.json';
import reference from '../fixtures/native-proj-reference.json';
import inventory from '../fixtures/parity-inventory.json';

const projections = Object.values(native).filter((value): value is ProjectionPlugin =>
  Boolean(value && typeof value === 'object' && 'create' in value)
);
projections.push(native.obliqueTransformation(native.mollweide));

function close(actual: ArrayLike<number>, expected: number[], tolerance: number): void {
  expect(actual.length).toBe(expected.length);
  expected.forEach((value, index) =>
    expect(Math.abs(actual[index] - value), 'ordinate ' + index).toBeLessThanOrEqual(tolerance)
  );
}

test('native PROJ references cover every named projection, excluding the internal Gauss helper', () => {
  expect(reference.pyproj).toBe('3.7.2');
  expect(reference.proj).toBe('9.5.1');
  expect(reference.cases.map(row => row.id)).toEqual(inputs.cases.map(row => row.id));
  const names = new Set(inputs.cases.map(row => /\+proj=(\w+)/.exec(row.definition)![1]));
  expect([...names].sort()).toEqual(
    inventory.projections
      .map(row => row.id)
      .filter(name => name !== 'gauss')
      .sort()
  );
});

for (const [index, fixture] of inputs.cases.entries()) {
  test('independent PROJ forward/inverse and packed coordinates: ' + fixture.id, () => {
    const projection = new native.ProjectionEngine({
      from: '+proj=longlat +datum=none',
      to: fixture.definition,
      projections
    });
    const inverseTolerance = (input: number[]) =>
      'knotInverseTolerance' in fixture &&
      Math.abs(input[1]) < 90 &&
      Math.abs(input[1] / 5 - Math.round(input[1] / 5)) < 1e-12
        ? fixture.knotInverseTolerance!
        : fixture.inverseTolerance;
    const results = reference.cases[index].results;
    expect(results.map(row => row.input)).toEqual(fixture.points);
    const forward = new Float64Array(results.length * 4);
    const inverse = new Float64Array(results.length * 4);
    for (const [pointIndex, row] of results.entries()) {
      // Inverse starts from PROJ output, never from math.gl's own forward result.
      close(projection.project(row.input), row.forward, fixture.forwardTolerance);
      close(projection.unproject(row.forward), row.inverse, inverseTolerance(row.input));
      if (
        'knotInverseTolerance' in fixture &&
        inverseTolerance(row.input) !== fixture.inverseTolerance
      ) {
        close(projection.unproject(row.forward), row.input, 1e-8);
      }
      forward.set([row.input[0], row.input[1], row.input[2] ?? 123, 8], pointIndex * 4);
      inverse.set([row.forward[0], row.forward[1], row.forward[2] ?? 123, 8], pointIndex * 4);
    }
    expect(projection.projectFlat(forward, 4)).toBe(forward);
    expect(projection.unprojectFlat(inverse, 4)).toBe(inverse);
    for (const [pointIndex, row] of results.entries()) {
      close(
        forward.subarray(pointIndex * 4, pointIndex * 4 + 4),
        [row.forward[0], row.forward[1], row.forward[2] ?? 123, 8],
        fixture.forwardTolerance
      );
      close(
        inverse.subarray(pointIndex * 4, pointIndex * 4 + 4),
        [row.inverse[0], row.inverse[1], row.inverse[2] ?? 123, 8],
        inverseTolerance(row.input)
      );
    }
  });
}
