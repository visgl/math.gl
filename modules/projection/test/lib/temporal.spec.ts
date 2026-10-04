// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original independent temporal, bulk, event boundary and failure/reentry tests.
import {expect, test} from 'vitest';
import {createTemporalDeformationModel} from '../../src/temporal';
import type {TemporalDeformationComponent} from '../../src/temporal';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import {ProjectionBuffer} from '../../src/bulk';
import {reference, temporalOptions, qualifyTemporalModels} from '../temporal-workload';
const field = (up: number) => ({
  sample(_longitude: number, _latitude: number, p: {x: number; y: number; z: number}) {
    p.x = 0;
    p.y = 0;
    p.z = up;
    return true;
  }
});
const options = (components: TemporalDeformationComponent[]) => ({
  components,
  epochRange: [2000, 2030] as const,
  ellipsoid: {semiMajorAxis: 10, flattening: 0}
});
const close = (
  actual: ArrayLike<number>,
  expected: readonly number[],
  tolerance = reference.toleranceMeters
) => {
  for (let i = 0; i < 3; i++)
    expect(Math.abs(actual[i] - expected[i])).toBeLessThanOrEqual(tolerance);
};
for (const row of reference.cases)
  test('temporal Decimal/Newton: ' + row.id, () => {
    const model = createTemporalDeformationModel(temporalOptions(row.a, row.b));
    const pipeline = new ProjectionPipeline({
      input: {space: 'geocentric', units: ['m', 'm', 'm']},
      steps: [{type: 'deformation', model, sourceEpoch: 'coordinate', targetEpoch: row.targetEpoch}]
    });
    close(pipeline.project([...row.input, 7], row.sourceEpoch), row.forward);
    close(pipeline.unproject([...row.inverseInput, 7], row.sourceEpoch), row.inverse);
    for (const Type of [Float32Array, Float64Array]) {
      const input = new Type([...row.input, 7, ...row.input, NaN]);
      const epochs = new Float64Array([row.sourceEpoch, row.sourceEpoch]);
      const saved = epochs.slice();
      const expected = new Type([
        ...pipeline.project(input.subarray(0, 4), row.sourceEpoch),
        ...pipeline.project(input.subarray(4), row.sourceEpoch)
      ]);
      const out = new Type(8);
      new ProjectionBuffer({projection: pipeline, dimension: 4}).projectFlatTo(
        input,
        out,
        2,
        0,
        epochs
      );
      expect(out).toEqual(expected);
      expect(epochs).toEqual(saved);
      pipeline.unprojectFlatSync(out, 4, epochs);
      expect(out[3]).toBe(7);
      expect(out[7]).toBeNaN();
    }
  });
test('temporal aggregate qualification', () => expect(qualifyTemporalModels().cases).toBe(96));
test('velocity, acceleration and event sum analytic displacement with right-continuous endpoints', () => {
  const model = createTemporalDeformationModel(
    options([
      {id: 'v', field: field(0.01), units: 'm/year', timeFunction: {type: 'velocity'}},
      {
        id: 'a',
        field: field(0.002),
        units: 'm/year^2',
        timeFunction: {type: 'acceleration', referenceEpoch: 2010}
      },
      {id: 'step', field: field(0.1), units: 'm', timeFunction: {type: 'step', epoch: 2015}}
    ])
  );
  const point = {x: 10, y: 0, z: 0};
  model.forward(point, 2010, 2020);
  expect(point.x).toBeCloseTo(10.3, 14);
  model.inverse(point, 2010, 2020);
  expect(point.x).toBe(10);
  const step = createTemporalDeformationModel(
    options([{id: 'event', field: field(1), units: 'm', timeFunction: {type: 'step', epoch: 2015}}])
  );
  for (const [source, target, delta] of [
    [2014, 2015, 1],
    [2015, 2016, 0],
    [2015, 2014, -1],
    [2015, 2015, 0]
  ]) {
    point.x = 10;
    step.forward(point, source, target);
    expect(point.x).toBe(10 + delta);
  }
});
test('relaxation tiny intervals, reverse time and long saturation remain finite', () => {
  const model = createTemporalDeformationModel(
    options([
      {
        id: 'relax',
        field: field(1),
        units: 'm',
        timeFunction: {type: 'exponential', epoch: 2015, timeConstantYears: 2}
      }
    ])
  );
  const point = {x: 10, y: 0, z: 0};
  model.forward(point, 2015, 2017);
  expect(point.x).toBeCloseTo(11 - Math.exp(-1), 14);
  model.inverse(point, 2015, 2017);
  expect(point.x).toBeCloseTo(10, 14);
  model.forward(point, 2017, 2015);
  expect(point.x).toBeCloseTo(9 + Math.exp(-1), 14);
  point.x = 10;
  model.forward(point, 2015, 2015 + 1e-8);
  expect(point.x).toBeCloseTo(10 - Math.expm1(-(2015 + 1e-8 - 2015) / 2), 14);
});
test('snapshot functions, unit validation, finite ranges and duplicate identifiers', () => {
  const component: TemporalDeformationComponent = {
    id: 'v',
    field: field(1),
    units: 'm/year',
    timeFunction: {type: 'velocity'}
  };
  const list = [component],
    definition = options(list),
    model = createTemporalDeformationModel(definition);
  list.length = 0;
  const point = {x: 10, y: 0, z: 0};
  model.forward(point, 2010, 2011);
  expect(point.x).toBe(11);
  for (const invalid of [
    [],
    [component, component],
    [{...component, units: 'm'}],
    [{...component, timeFunction: {type: 'step', epoch: NaN}}],
    [
      {
        ...component,
        units: 'm',
        timeFunction: {type: 'exponential', epoch: 2015, timeConstantYears: 0}
      }
    ]
  ])
    expect(() =>
      createTemporalDeformationModel(options(invalid as TemporalDeformationComponent[]))
    ).toThrow();
  for (const [source, target] of [
    [1999, 2020],
    [2020, 2031],
    [NaN, 2020]
  ]) {
    const original = {...point};
    expect(() => model.forward(point, source, target)).toThrow('epoch');
    expect(point).toEqual(original);
  }
});
test('failed component restores XYZ, zero intervals still require coverage and recursion stays isolated', () => {
  let fail = false,
    recurse = false;
  let model: ReturnType<typeof createTemporalDeformationModel>;
  const custom = {
    sample(_longitude: number, _latitude: number, p: {x: number; y: number; z: number}) {
      if (recurse) {
        recurse = false;
        const inner = {x: 10, y: 0, z: 0};
        model.forward(inner, 2010, 2011);
        expect(inner.x).toBe(11);
      }
      p.x = 0;
      p.y = 0;
      p.z = 1;
      return !fail;
    }
  };
  model = createTemporalDeformationModel(
    options([{id: 'v', field: custom, units: 'm/year', timeFunction: {type: 'velocity'}}])
  );
  const point = {x: 10, y: 0, z: 0};
  recurse = true;
  model.forward(point, 2010, 2012);
  expect(point.x).toBe(12);
  fail = true;
  const saved = {...point};
  expect(() => model.forward(point, 2010, 2010)).toThrow('covers');
  expect(point).toEqual(saved);
  fail = false;
  model.inverse(point, 2010, 2012);
  expect(point.x).toBe(10);
});

test('overflow and a temporal map without an inverse restore caller XYZ', () => {
  const overflow = createTemporalDeformationModel(
    options([{id: 'rate', field: field(1e308), units: 'm/year', timeFunction: {type: 'velocity'}}])
  );
  const point = {x: 10, y: 0, z: 0};
  expect(() => overflow.forward(point, 2000, 2030)).toThrow();
  expect(point).toEqual({x: 10, y: 0, z: 0});
  const unreachable = createTemporalDeformationModel(
    options([
      {id: 'event', field: field(20), units: 'm', timeFunction: {type: 'step', epoch: 2015}}
    ])
  );
  expect(() => unreachable.inverse(point, 2010, 2020)).toThrow();
  expect(point).toEqual({x: 10, y: 0, z: 0});
});

test('event-law parameters and sampler methods are captured before application mutation', () => {
  const law = {type: 'step' as const, epoch: 2015};
  const sampler = field(1);
  const model = createTemporalDeformationModel(
    options([{id: 'event', field: sampler, units: 'm', timeFunction: law}])
  );
  law.epoch = 2025;
  sampler.sample = () => {
    throw new Error('replacement should not run');
  };
  const point = {x: 10, y: 0, z: 0};
  model.forward(point, 2010, 2020);
  expect(point.x).toBe(11);
  model.inverse(point, 2010, 2020);
  expect(point.x).toBe(10);
});

test('partial and asynchronous field results cannot become displacement amplitudes', () => {
  const point = {x: 10, y: 0, z: 0};
  for (const sample of [
    (_lon, _lat, out) => {
      out.x = 1;
      return true;
    },
    (_lon, _lat, out) => {
      out.x = out.y = out.z = 1;
      return Promise.resolve(true);
    }
  ]) {
    const model = createTemporalDeformationModel(
      options([
        {
          id: 'field',
          field: {sample} as TemporalDeformationComponent['field'],
          units: 'm/year',
          timeFunction: {type: 'velocity'}
        }
      ])
    );
    expect(() => model.forward(point, 2010, 2020)).toThrow();
    expect(point).toEqual({x: 10, y: 0, z: 0});
  }
});
