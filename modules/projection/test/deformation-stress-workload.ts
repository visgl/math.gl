// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original authored spatial velocity field and independent-reference qualification, not model data from an external authority.
import {createDeformationModel} from '@math.gl/projection/deformation';
import type {DeformationModel} from '@math.gl/projection/deformation';
import type {VelocityGrid} from '@math.gl/projection/grids/velocity';
import reference from './fixtures/deformation-stress-reference.json';
export {reference};
export type DeformationStressCase = (typeof reference.cases)[number];

/** Setup-time sampler. Its spatial field matches the documented polynomial only;
 * reference normals and inverses are computed independently by Decimal/Newton.
 */
export function authoredVelocityGrid(): VelocityGrid {
  return {
    sample(longitude, latitude, output) {
      const sl = Math.sin(longitude),
        cl = Math.cos(longitude);
      const sp = Math.sin(latitude),
        cp = Math.cos(latitude);
      const nx = cp * cl,
        ny = cp * sl,
        nz = sp;
      const vx = 0.03 * nx + 0.004 * (1 + ny * nz);
      const vy = 0.03 * ny + 0.003 * nx * nz;
      const vz = 0.03 * nz + 0.002 * nx * ny;
      output.x = -sl * vx + cl * vy;
      output.y = -sp * cl * vx - sp * sl * vy + cp * vz;
      output.z = nx * vx + ny * vy + nz * vz;
      return true;
    }
  };
}

export function stressModel(fixture: DeformationStressCase, grid = authoredVelocityGrid()) {
  return createDeformationModel({
    grid,
    epochRange: [1900, 2100],
    ellipsoid: {semiMajorAxis: fixture.a, flattening: 1 - fixture.b / fixture.a}
  });
}

function error(actual: ArrayLike<number>, expected: readonly number[]): number {
  if (actual.length !== expected.length) throw new Error('Reference coordinate length mismatch');
  let maximum = 0;
  for (let i = 0; i < actual.length; i++) {
    if (!Number.isFinite(actual[i]) || !Number.isFinite(expected[i]))
      throw new Error('Non-finite qualification coordinate');
    maximum = Math.max(maximum, Math.abs(actual[i] - expected[i]));
  }
  return maximum;
}

/** Test/development harness, not a production export or an accuracy certificate.
 * Application-owned models can supply their own independently reviewed expected XYZ.
 */
export function qualifyDeformationModel(
  model: DeformationModel,
  cases: readonly Pick<
    DeformationStressCase,
    'id' | 'input' | 'forward' | 'inverseInput' | 'inverse' | 'sourceEpoch' | 'targetEpoch'
  >[],
  toleranceMeters: number
) {
  if (typeof model?.forward !== 'function' || typeof model?.inverse !== 'function')
    throw new Error('Prepared forward/inverse model required');
  if (!Number.isFinite(toleranceMeters) || toleranceMeters <= 0 || !cases.length)
    throw new Error('Positive finite allowance and independent reference cases required');
  const point = {x: 0, y: 0, z: 0};
  let maximumForwardError = 0,
    maximumInverseError = 0,
    maximumInverseClosure = 0;
  const results = [];
  for (const row of cases) {
    if (!Number.isFinite(row.sourceEpoch) || !Number.isFinite(row.targetEpoch))
      throw new Error('Finite reference epochs required');
    for (const value of [row.input, row.forward, row.inverseInput, row.inverse])
      if (!Array.isArray(value) || value.length < 3 || !value.every(Number.isFinite))
        throw new Error('Finite reference XYZ required');
    point.x = row.input[0];
    point.y = row.input[1];
    point.z = row.input[2];
    model.forward(point, row.sourceEpoch, row.targetEpoch);
    const forwardError = error([point.x, point.y, point.z], row.forward.slice(0, 3));
    point.x = row.inverseInput[0];
    point.y = row.inverseInput[1];
    point.z = row.inverseInput[2];
    model.inverse(point, row.sourceEpoch, row.targetEpoch);
    const inverseError = error([point.x, point.y, point.z], row.inverse.slice(0, 3));
    model.forward(point, row.sourceEpoch, row.targetEpoch);
    const inverseClosure = error([point.x, point.y, point.z], row.inverseInput.slice(0, 3));
    maximumForwardError = Math.max(maximumForwardError, forwardError);
    maximumInverseError = Math.max(maximumInverseError, inverseError);
    maximumInverseClosure = Math.max(maximumInverseClosure, inverseClosure);
    if (Math.max(forwardError, inverseError, inverseClosure) > toleranceMeters)
      throw new Error(
        `Deformation reference mismatch: ${row.id}, forward=${forwardError}, inverse=${inverseError}, closure=${inverseClosure}`
      );
    results.push({id: row.id, forwardError, inverseError, inverseClosure});
  }
  return {maximumForwardError, maximumInverseError, maximumInverseClosure, results};
}

export function qualifyAuthoredDeformations() {
  const groups = reference.cases.reduce((result, row) => {
    const group = result.get(row.shape) || [];
    group.push(row);
    result.set(row.shape, group);
    return result;
  }, new Map<string, DeformationStressCase[]>());
  return [...groups.entries()].map(([shape, rows]) => ({
    shape,
    ...qualifyDeformationModel(stressModel(rows[0]), rows, reference.forwardToleranceMeters)
  }));
}
