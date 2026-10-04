// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independent Decimal/Newton references, original authored model stress and time-contract tests.
import {expect, test} from 'vitest';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import {createDeformationModel} from '@math.gl/projection/deformation';
import {
  reference,
  stressModel,
  qualifyDeformationModel,
  authoredVelocityGrid
} from '../deformation-stress-workload';
import type {DeformationStressCase} from '../deformation-stress-workload';

function pipeline(row: DeformationStressCase) {
  return new ProjectionPipeline({
    input: {space: 'geocentric', units: ['m', 'm', 'm']},
    steps: [
      {
        type: 'deformation',
        model: stressModel(row),
        sourceEpoch: 'coordinate',
        targetEpoch: row.targetEpoch
      }
    ]
  });
}
function close(actual: ArrayLike<number>, expected: readonly number[], tolerance: number) {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++)
    expect(Math.abs(actual[i] - expected[i])).toBeLessThanOrEqual(tolerance);
}
for (const row of reference.cases) {
  test('nonlinear spatial deformation vs independent Decimal/Newton: ' + row.id, () => {
    const result = qualifyDeformationModel(
      stressModel(row),
      [row],
      reference.forwardToleranceMeters
    );
    expect(result.results).toHaveLength(1);
    const p = pipeline(row),
      out = new Float64Array(4);
    expect(p.projectTo(row.input, out, row.sourceEpoch)).toBe(out);
    close(out, row.forward, reference.forwardToleranceMeters);
    expect(p.unprojectTo(row.inverseInput, out, row.sourceEpoch)).toBe(out);
    close(out, row.inverse, reference.inverseToleranceMeters);
    expect(out[3]).toBe(row.inverseInput[3]);
  });
}
const groups = new Map<string, DeformationStressCase[]>();
for (const row of reference.cases) {
  const key = row.shape + ':' + row.targetEpoch;
  const group = groups.get(key) || [];
  group.push(row);
  groups.set(key, group);
}
for (const [key, rows] of groups) {
  for (const ArrayType of [Float32Array, Float64Array]) {
    for (const dimension of [3, 4, 5]) {
      for (const inverse of [false, true]) {
        test(`nonlinear deformation views, mixed epochs, M and tails: ${key}/${ArrayType.name}/${dimension}/${inverse}`, () => {
          const p = pipeline(rows[0]);
          const source = rows.flatMap(row =>
            (inverse ? row.inverseInput : row.input)
              .slice(0, dimension)
              .concat(dimension === 5 ? [2025] : [])
          );
          const storage = new ArrayType(source.length + 4).fill(77),
            buffer = storage.subarray(2, -2);
          buffer.set(source);
          const epochs = new Float64Array(rows.map(row => row.sourceEpoch)),
            saved = epochs.slice();
          // Float32's rounded input is different from the independent Float64 oracle.
          // This secondary check qualifies scalar/bulk rounding and ownership only.
          const expected = new ArrayType(
            rows.flatMap((row, i) => {
              const point = Array.from(buffer.slice(i * dimension, (i + 1) * dimension));
              return (inverse ? p.unprojectSync : p.projectSync)(point, row.sourceEpoch);
            })
          );
          expect((inverse ? p.unprojectFlat : p.projectFlat)(buffer, dimension, epochs)).toBe(
            buffer
          );
          expect(buffer).toEqual(expected);
          if (ArrayType === Float64Array) {
            const oracle = rows.flatMap(row =>
              (inverse ? row.inverse : row.forward)
                .slice(0, dimension)
                .concat(dimension === 5 ? [2025] : [])
            );
            close(buffer, oracle, reference.forwardToleranceMeters);
          }
          expect(epochs).toEqual(saved);
          expect(Array.from(storage.slice(0, 2))).toEqual([77, 77]);
          expect(Array.from(storage.slice(-2))).toEqual([77, 77]);
        });
      }
    }
  }
}

test('qualification rejects mismatched, empty and non-finite references', () => {
  const row = reference.cases[0],
    model = stressModel(row);
  expect(() => qualifyDeformationModel(model, [], 1e-6)).toThrow('reference');
  expect(() => qualifyDeformationModel(model, [row], NaN)).toThrow('allowance');
  expect(() => qualifyDeformationModel(model, [{...row, sourceEpoch: NaN}], 1e-6)).toThrow(
    'epochs'
  );
  expect(() => qualifyDeformationModel(model, [{...row, forward: [NaN, 0, 0]}], 1e-6)).toThrow(
    'Finite'
  );
  expect(() => qualifyDeformationModel(model, [{...row, forward: [0, 0, 0]}], 1e-6)).toThrow(
    'mismatch'
  );
});

test('spatial velocity is sampled at the source: subdivision is not a trajectory integrator', () => {
  const row = reference.cases.find(
    row =>
      row.shape === 'sphere' && row.input[0] !== 0 && row.input[1] !== 0 && row.targetEpoch === 2020
  )!;
  const model = stressModel(row),
    whole = {x: row.input[0], y: row.input[1], z: row.input[2]},
    split = {...whole};
  model.forward(whole, 2010, 2020);
  model.forward(split, 2010, 2015);
  model.forward(split, 2015, 2020);
  expect(Math.hypot(whole.x - split.x, whole.y - split.y, whole.z - split.z)).toBeGreaterThan(1e-6);
  model.inverse(whole, 2010, 2020);
  close([whole.x, whole.y, whole.z], row.input.slice(0, 3), 1e-8);
});

test('time-varying or event displacement needs an explicitly reviewed model, not a static average', () => {
  // Analytic illustrative scalar law: v(t)=.01+.002*(t-2010), event +.1 at 2015.
  // The built-in time-invariant grid has no observation-time argument or event terms.
  const model = createDeformationModel({
    epochRange: [2010, 2020],
    ellipsoid: {semiMajorAxis: 10, flattening: 0},
    grid: {
      sample(_lon, _lat, out) {
        out.x = 0;
        out.y = 0;
        out.z = 0.01;
        return true;
      }
    }
  });
  const point = {x: 10, y: 0, z: 0};
  model.forward(point, 2010, 2020);
  expect(point.x - 10).toBeCloseTo(0.1, 12);
  const integrated = 0.01 * 10 + 0.001 * 10 * 10 + 0.1;
  expect(integrated).toBeCloseTo(0.3, 12);
  expect(Math.abs(point.x - 10 - integrated)).toBeGreaterThan(0.19);
  // Presence of an epoch is not a claim to execute the unsupported time law.
});

test('application sampler exceptions restore direct XYZ and preserve flat successors', () => {
  const normal = authoredVelocityGrid();
  const model = createDeformationModel({
    epochRange: [1900, 2100],
    ellipsoid: {semiMajorAxis: 10, flattening: 0},
    grid: {
      sample(lon, lat, out) {
        if (lon < 0) {
          out.x = NaN;
          out.y = 123;
          out.z = 456;
          throw new Error('Application coverage failure');
        }
        return normal.sample(lon, lat, out);
      }
    }
  });
  const p = new ProjectionPipeline({
    input: {space: 'geocentric', units: ['m', 'm', 'm']},
    steps: [{type: 'deformation', model, sourceEpoch: 2010, targetEpoch: 2020}]
  });
  const input = [10, 0, 0, 7, 0, -10, 0, 8, 0, 0, 10, 9];
  const buffer = new Float64Array(input);
  expect(() => p.projectFlat(buffer, 4)).toThrow('Application coverage');
  close(buffer.slice(0, 4), p.project(input.slice(0, 4)), 1e-12);
  expect(Array.from(buffer.slice(4))).toEqual(input.slice(4));
  const point = {x: 0, y: -10, z: 0};
  expect(() => model.inverse(point, 2010, 2020)).toThrow('Application coverage');
  expect(point).toEqual({x: 0, y: -10, z: 0});
  expect(() => model.forward(point, 1899, 2020)).toThrow('epochRange');
  expect(point).toEqual({x: 0, y: -10, z: 0});
});
