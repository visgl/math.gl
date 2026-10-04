// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original temporal qualification using independent Decimal/Newton expectations.
import {createTemporalDeformationModel} from '../src/temporal';
import type {TemporalDeformationOptions} from '../src/temporal';
import {authoredVelocityGrid, qualifyDeformationModel} from './deformation-stress-workload';
import reference from './fixtures/temporal-reference.json';
export {reference};
export function temporalOptions(a = 6378137, b = 6356752.314245179): TemporalDeformationOptions {
  const field = (scale: number) => ({
    sample(longitude: number, latitude: number, output: {x: number; y: number; z: number}) {
      const valid = grid.sample(longitude, latitude, output);
      output.x *= scale;
      output.y *= scale;
      output.z *= scale;
      return valid;
    }
  });
  const grid = authoredVelocityGrid();
  return {
    epochRange: [2000, 2030],
    ellipsoid: {semiMajorAxis: a, flattening: 1 - b / a},
    components: [
      {id: 'rate', field: field(1), units: 'm/year', timeFunction: {type: 'velocity'}},
      {
        id: 'acceleration',
        field: field(0.2),
        units: 'm/year^2',
        timeFunction: {type: 'acceleration', referenceEpoch: 2010}
      },
      {id: 'event', field: field(3), units: 'm', timeFunction: {type: 'step', epoch: 2015}},
      {
        id: 'relaxation',
        field: field(2),
        units: 'm',
        timeFunction: {type: 'exponential', epoch: 2015, timeConstantYears: 2}
      }
    ]
  };
}
export function qualifyTemporalModels() {
  let maximumError = 0;
  for (const row of reference.cases) {
    const result = qualifyDeformationModel(
      createTemporalDeformationModel(temporalOptions(row.a, row.b)),
      [row],
      reference.toleranceMeters
    );
    maximumError = Math.max(
      maximumError,
      result.maximumForwardError,
      result.maximumInverseError,
      result.maximumInverseClosure
    );
  }
  return {cases: reference.cases.length, maximumError, toleranceMeters: reference.toleranceMeters};
}
