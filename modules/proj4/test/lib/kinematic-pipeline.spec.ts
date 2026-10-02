// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original explicit-epoch contracts, ownership and independent reference tests.
import {expect, test} from 'vitest';
import {ProjectionPipeline} from '@math.gl/proj4/pipeline';
import type {PipelineStep, PipelineEpochs} from '@math.gl/proj4/pipeline';
import {createProjectionDescriptor} from '@math.gl/proj4/core';
import {universalTransverseMercator} from '@math.gl/proj4/projections/utm';
import inputs from '../fixtures/kinematic-pipeline-cases.json';
import {kinematicOptions, qualifyKinematicCase} from '../kinematic-workload';

const xyz = {space: 'geocentric', units: ['m', 'm', 'm']} as const;
const step: PipelineStep = {
  type: 'helmert',
  translation: [1, 2, 3],
  referenceEpoch: 2000,
  rates: {translation: [0.1, -0.2, 0.3]}
};
for (const [i, fixture] of inputs.cases.entries())
  test('kinematic pipeline vs independent PROJ: ' + fixture.id, () =>
    expect(qualifyKinematicCase(i)).toBe(fixture.points.length)
  );

test('epochs are required explicitly and never inferred from XYZM', () => {
  const pipeline = new ProjectionPipeline({input: xyz, steps: [step]});
  for (const point of [
    [10, 20, 30],
    [10, 20, 30, 2020]
  ])
    expect(() => pipeline.project(point)).toThrow('explicit coordinate epoch');
  expect(() => pipeline.unproject([10, 20, 30, 2020])).toThrow('epoch');
  for (const epoch of [NaN, Infinity, -Infinity, null, '2020'])
    expect(() => pipeline.project([10, 20, 30, 8], epoch as number)).toThrow('epoch');
  const point = [10, 20, 30, NaN, Infinity, -0];
  const {project, unproject} = pipeline;
  const result = project(point, 2020);
  expect(result).toEqual([13, 18, 39, NaN, Infinity, -0]);
  expect(unproject(result, 2020)).toEqual(point);
  expect(point).toEqual([10, 20, 30, NaN, Infinity, -0]);
});

test('flat epoch buffers enforce shape, non-overlap and per-record partial errors', () => {
  const pipeline = new ProjectionPipeline({input: xyz, steps: [step]});
  const source = [10, 20, 30, 8, 40, 50, 60, 9, 70, 80, 90, 10];
  for (const epochs of [
    undefined,
    [2020, 2020, 2020],
    new Int32Array(3),
    new Float64Array(2),
    NaN
  ]) {
    const buffer = new Float64Array(source);
    expect(() => pipeline.projectFlat(buffer, 4, epochs as PipelineEpochs)).toThrow();
    expect(Array.from(buffer)).toEqual(source);
  }
  const buffer = new Float64Array(source);
  expect(() => pipeline.projectFlat(buffer, 4, buffer.subarray(0, 3))).toThrow('overlap');
  expect(() => pipeline.unprojectFlat(buffer, 4, buffer.subarray(9))).toThrow('overlap');
  const epochs = new Float64Array([2020, NaN, 2000]);
  expect(() => pipeline.projectFlat(buffer, 4, epochs)).toThrow('finite decimal year');
  expect(Array.from(buffer.slice(0, 4))).toEqual([13, 18, 39, 8]);
  expect(Array.from(buffer.slice(4))).toEqual(source.slice(4));
  expect(Array.from(epochs)).toEqual([2020, NaN, 2000]);
  expect(pipeline.project([10, 20, 30], 2000)).toEqual([11, 22, 33]);
  expect(pipeline.projectFlat(new Float64Array(0), 3, new Float64Array(0))).toHaveLength(0);
});

test('epoch views, shared non-overlapping storage, strides and both buffer precisions preserve ownership', () => {
  const pipeline = new ProjectionPipeline({input: xyz, steps: [step]});
  for (const ArrayType of [Float32Array, Float64Array])
    for (const dimension of [3, 4, 5, 6]) {
      const point = [10, 20, 30, NaN, Infinity, -0].slice(0, dimension);
      const storage = new ArrayType([77, ...point, ...point, 88, 2000, 2020, 99]);
      const view = storage.subarray(1, 1 + dimension * 2);
      const epochs = storage.subarray(2 + dimension * 2, 4 + dimension * 2);
      const expected = [...pipeline.project(point, 2000), ...pipeline.project(point, 2020)];
      expect(pipeline.projectFlatSync(view, dimension, epochs)).toBe(view);
      expect(Array.from(view)).toEqual(Array.from(new ArrayType(expected)));
      pipeline.unprojectFlatSync(view, dimension, epochs);
      expect(Array.from(view)).toEqual([...point, ...point]);
      expect(Array.from(epochs)).toEqual([2000, 2020]);
      expect(storage[0]).toBe(77);
      expect(storage.at(-1)).toBe(99);
    }
});

test('rate definitions and reference epoch validate and snapshot; failing coefficient updates are reusable', () => {
  const bad = (extra: object) => () =>
    new ProjectionPipeline({input: xyz, steps: [{...step, ...extra} as PipelineStep]});
  for (const rates of [
    {},
    {translation: undefined},
    {unknown: 1},
    {translation: [1, 2]},
    {rotation: [0, NaN, 1]},
    {scalePPM: Infinity},
    null
  ])
    expect(bad({rates})).toThrow();
  for (const referenceEpoch of [undefined, NaN, Infinity, '2000'])
    expect(bad({referenceEpoch})).toThrow('referenceEpoch');
  expect(bad({rates: undefined})).toThrow('requires rates');
  expect(bad({rates: {rotation: [1, 2, 3]}})).toThrow('convention');
  const translation: [number, number, number] = [0.1, -0.2, 0.3];
  const rates = {translation, scalePPM: -500000};
  const configured = {
    type: 'helmert' as const,
    translation: [1, 2, 3] as const,
    referenceEpoch: 2000,
    rates,
    exact: true
  };
  const pipeline = new ProjectionPipeline({input: xyz, steps: [configured]});
  const point = [10, 20, 30];
  const saved = pipeline.project(point, 2001);
  translation[0] = 100;
  rates.scalePPM = 0;
  configured.referenceEpoch = 1990;
  expect(pipeline.project(point, 2001)).toEqual(saved);
  expect(() => pipeline.project(point, 2002)).toThrow('epoch-adjusted');
  expect(pipeline.project(point, 2001)).toEqual(saved);
  const flat = new Float64Array([...point, ...point]);
  expect(() => pipeline.projectFlat(flat, 3, new Float64Array([2001, 2002]))).toThrow(
    'epoch-adjusted'
  );
  expect(Array.from(flat)).toEqual([...saved, ...point]);
});

test('reentrant grid callbacks cannot leak prepared epochs across steps or calls', () => {
  let entered = false;
  const pipeline = new ProjectionPipeline({
    input: {space: 'geographic', units: ['rad', 'rad', 'm']},
    verticalGrids: {
      local: {
        getOffset() {
          if (!entered) {
            entered = true;
            pipeline.project([0.1, 0.3, 10], 2020);
          }
          return 1;
        }
      }
    },
    steps: [
      {type: 'cart'},
      step,
      {type: 'cart', inverse: true},
      {type: 'vgridshift', grids: 'local'},
      {type: 'cart'},
      step,
      {type: 'cart', inverse: true}
    ]
  });
  const point = [0.1, 0.3, 10, 8];
  const first = pipeline.project(point, 2000);
  expect(pipeline.project(point, 2000)).toEqual(first);
  expect(pipeline.project(point, 2020)).not.toEqual(first);
});

test('lazy scalar/flat and sync APIs carry coordinate epochs through preload', async () => {
  let calls = 0;
  const descriptor = createProjectionDescriptor({name: 'utm'}, async () => {
    calls++;
    return universalTransverseMercator;
  });
  const options = kinematicOptions(inputs.cases.length - 1);
  const eager = new ProjectionPipeline(options);
  const pipeline = new ProjectionPipeline({...options, projections: [descriptor]});
  const point = [3, 52, 100, 8];
  expect(() => pipeline.projectSync(point, 2020)).toThrow('preload');
  expect(calls).toBe(0);
  expect(await pipeline.project(point, 2020)).toEqual(eager.project(point, 2020));
  expect(calls).toBe(1);
  const flat = new Float64Array([...point, ...point]);
  const epochs = new Float64Array([2000, 2020]);
  expect(await pipeline.projectFlat(flat, 4, epochs)).toBe(flat);
  expect(Array.from(flat)).toEqual([...eager.project(point, 2000), ...eager.project(point, 2020)]);
  expect(await pipeline.unprojectFlat(flat, 4, epochs)).toBe(flat);
  Array.from(flat).forEach((value, i) => expect(value).toBeCloseTo(point[i % 4], 8));
  expect(await pipeline.unproject(eager.project(point, 2020), 2020)).toEqual(
    eager.unproject(eager.project(point, 2020), 2020)
  );
  await expect(pipeline.project(point)).rejects.toThrow('epoch');
});

test('zero rates equal static equations and static pipelines do not require epochs', () => {
  for (const exact of [false, true])
    for (const convention of ['coordinate_frame', 'position_vector'] as const) {
      const fixed: PipelineStep = {
        type: 'helmert',
        translation: [1, 2, 3],
        rotation: [1, 2, 3],
        scalePPM: 2,
        convention,
        exact
      };
      const stat = new ProjectionPipeline({input: xyz, steps: [fixed]});
      const dynamic = new ProjectionPipeline({
        input: xyz,
        steps: [{...fixed, type: 'helmert', referenceEpoch: 2000, rates: {translation: [0, 0, 0]}}]
      });
      const point = [4000000, 1000000, 4800000, 8];
      const result = stat.project(point);
      expect(stat.project(point, 2020)).toEqual(result);
      expect(dynamic.project(point, 2020)).toEqual(result);
      expect(dynamic.unproject(result, 2020)).toEqual(stat.unproject(result));
    }
});
