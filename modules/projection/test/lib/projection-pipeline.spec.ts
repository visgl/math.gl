// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original tests of explicit composition and independent PROJ pipeline fixtures.
import {beforeAll, expect, test} from 'vitest';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import type {PipelineStep, ProjectionPipelineOptions} from '@math.gl/projection/pipeline';
import {createProjectionDescriptor} from '@math.gl/projection/core';
import {obliqueTransformation} from '@math.gl/projection';
import {mercator} from '@math.gl/projection/projections/merc';
import {makeNTv2} from '../fixtures/datum-grids';
import {parseNTv2Grid} from '@math.gl/projection/grids/ntv2';
import inputs from '../fixtures/operation-pipeline-cases.json';
import {qualifyPipelineCase} from '../pipeline-workload';

let horizontal: ArrayBuffer;
beforeAll(async () => {
  const url = new URL('../fixtures/real-grids/BETA2007.gsb', import.meta.url);
  horizontal =
    url.protocol === 'file:'
      ? new Uint8Array(await (await import('node:fs/promises')).readFile(url)).buffer
      : await (await fetch(url)).arrayBuffer();
});
for (const [index, fixture] of inputs.cases.entries())
  test('typed pipeline vs independent PROJ: ' + fixture.id, () => {
    expect(qualifyPipelineCase(index, horizontal)).toBe(fixture.points.length);
  });
const input: ProjectionPipelineOptions['input'] = {space: 'geographic', units: ['deg', 'deg', 'm']};
const radians: PipelineStep = {type: 'unitconvert', xy: {from: 'deg', to: 'rad'}};
const projection: PipelineStep = {
  type: 'projection',
  name: 'merc',
  parameters: {a: '6378137', b: '6378137'}
};
const options: ProjectionPipelineOptions = {
  input,
  steps: [radians, projection],
  projections: [mercator]
};

test('pipeline preserves M/tails, supports XY/XYZ strides and bound methods', () => {
  const pipeline = new ProjectionPipeline(options);
  const {project, unproject, projectFlatSync, unprojectFlatSync} = pipeline;
  expect(project([0, 0])).toEqual([0, 0]);
  expect(project([0, 0, 10, NaN, Infinity])).toEqual([0, 0, 10, NaN, Infinity]);
  expect(unproject(project([11, 41, 123, 8]))[0]).toBeCloseTo(11, 10);
  for (const dimension of [2, 3, 4, 5]) {
    const data = new Float64Array([11, 41, 123, 8, 12].slice(0, dimension));
    const expected = pipeline.project(Array.from(data));
    expect(projectFlatSync(data, dimension)).toBe(data);
    expect(Array.from(data)).toEqual(expected);
    unprojectFlatSync(data, dimension);
    expect(data[0]).toBeCloseTo(11, 10);
  }
  expect(pipeline.projectFlat(new Float32Array(0))).toHaveLength(0);
});

test('pipeline snapshots definitions, parameters, units and grid registrations', () => {
  const units: ['deg', 'deg', 'm'] = ['deg', 'deg', 'm'];
  const parameters = {a: '6378137', b: '6378137'};
  const steps: PipelineStep[] = [
    radians,
    {...projection, type: 'projection', name: 'merc', parameters}
  ];
  const configured = {input: {space: 'geographic' as const, units}, steps, projections: [mercator]};
  const pipeline = new ProjectionPipeline(configured);
  const before = pipeline.project([11, 41, 123]);
  units[0] = 'rad' as 'deg';
  parameters.a = '1';
  steps.length = 0;
  configured.projections.length = 0;
  expect(pipeline.project([11, 41, 123])).toEqual(before);
  expect(pipeline.input.units).toEqual(['deg', 'deg', 'm']);
  expect(pipeline.output).toEqual({space: 'projected', units: ['m', 'm', 'm']});
  expect(Object.isFrozen(pipeline.output.units)).toBe(true);
  const grids = {local: {getOffset: () => 15}};
  const height = new ProjectionPipeline({
    input,
    steps: [radians, {type: 'vgridshift', grids: 'local'}],
    verticalGrids: grids
  });
  grids.local = {getOffset: () => 20};
  expect(height.project([11, 41, 100])[2]).toBe(85);
});

test('lazy pipelines import only used descriptors, cache across instances and expose sync methods after preload', async () => {
  let calls = 0,
    unused = 0;
  const lazy = createProjectionDescriptor({name: 'merc'}, async () => {
    calls++;
    return mercator;
  });
  const other = createProjectionDescriptor({name: 'unused'}, async () => {
    unused++;
    throw new Error('unused');
  });
  const create = () => new ProjectionPipeline({...options, projections: [lazy, other]});
  const a = create(),
    b = create();
  expect(calls).toBe(0);
  expect(() => a.projectSync([0, 0])).toThrow('preload');
  expect(() => a.projectFlatSync(new Float64Array([0, 0]))).toThrow('preload');
  await Promise.all([a.preload(), b.preload(), a.project([0, 0])]);
  expect(calls).toBe(1);
  expect(unused).toBe(0);
  expect(a.projectSync([0, 0])).toEqual([0, 0]);
  expect(await b.unproject([0, 0])).toEqual([0, 0]);
  const data = new Float64Array([0, 0, 12, 8]);
  expect(await a.projectFlat(data, 4)).toBe(data);
  expect(await a.unprojectFlat(data, 4)).toBe(data);
  expect(b.unprojectFlatSync(data, 4)).toBe(data);
});

test('failed descriptor imports retry; direct descriptor preload unlocks pipeline sync methods', async () => {
  let attempts = 0;
  const lazy = createProjectionDescriptor({name: 'merc'}, async () => {
    if (++attempts === 1) throw new Error('retry');
    return mercator;
  });
  const pipeline = new ProjectionPipeline({...options, projections: [lazy]});
  await expect(pipeline.project([0, 0])).rejects.toThrow('retry');
  await lazy.preload();
  expect(pipeline.projectSync([0, 0])).toEqual([0, 0]);
  expect(await pipeline.preload()).toBe(pipeline);
  expect(attempts).toBe(2);
});

test('typed operations reject unsupported metadata, units, operator names and missing plugins', () => {
  const bad =
    (steps: unknown, extra = {}) =>
    () =>
      new ProjectionPipeline({...options, steps: steps as PipelineStep[], ...extra});
  expect(bad([])).toThrow('at least');
  expect(bad([{type: 'push'}])).toThrow('Stack components');
  expect(bad([{type: 'affine'}])).toThrow('Unsupported pipeline operation');
  expect(bad([{type: 'unitconvert', xy: {from: 'deg', to: 'm'}}])).toThrow('Incompatible');
  expect(bad([{type: 'unitconvert', xy: {from: 'rad', to: 'deg'}}])).toThrow('mismatch');
  expect(bad([projection])).toThrow('requires geographic');
  expect(bad([radians, projection], {projections: []})).toThrow('not registered');
  expect(bad([{type: 'unitconvert'}])).toThrow('Empty');
  expect(bad([{type: 'unitconvert', z: {from: 'm', to: 'm', extra: 2}}])).toThrow('parameter');
  expect(bad([{type: 'axisswap', order: [1, 1]}])).toThrow('permutation');
  expect(bad([{type: 'axisswap', order: [4, 2, 1]}])).toThrow('permutation');
  expect(bad([{type: 'axisswap', order: [1.5, 2]}])).toThrow('permutation');
  expect(bad([{type: 'axisswap', order: [1]}])).toThrow('permutation');
  expect(bad([{type: 'axisswap', order: [1, 2], inverse: 'yes'}])).toThrow('inverse flag');
  expect(bad([radians, {type: 'cart', ellipsoid: {datum: 'WGS84'}}])).toThrow('parameter');
  for (const parameters of [
    {units: 'ft'},
    {towgs84: '1,2,3'},
    {geoidgrids: 'local'},
    {axis: 'neu'},
    {proj: 'merc'},
    {bad: '1'}
  ])
    expect(bad([radians, {...projection, parameters}])).toThrow('parameter');
  expect(bad([radians, {...projection, name: 'not a name'}])).toThrow();
  expect(bad([radians, {...projection, parameters: {a: '1 +units=ft'}}])).toThrow('parameter');
  expect(bad([radians, {...projection, parameters: {a: undefined}}])).toThrow('parameter');
  expect(bad([radians, {...projection, parameters: {over: 'true'}}])).toThrow(
    'flag without a value'
  );
  expect(
    bad([radians, {type: 'projection', name: 'geocent'}], {
      projections: [{...mercator, name: 'geocent'}]
    })
  ).toThrow('cart step');
  expect(
    bad([radians, {type: 'cart'}, {type: 'helmert', translation: [1, 2, 3], epoch: 2020}])
  ).toThrow('parameter');
  expect(bad([radians, {type: 'cart'}, {type: 'helmert', translation: [1, 2]}])).toThrow(
    'three finite'
  );
  expect(
    bad([radians, {type: 'cart'}, {type: 'helmert', translation: [0, 0, 0], rotation: [1, 2, 3]}])
  ).toThrow('convention');
  expect(
    bad([radians, {type: 'cart'}, {type: 'helmert', translation: [0, 0, 0], convention: 'bad'}])
  ).toThrow('convention');
  for (const scalePPM of [-1e6, NaN])
    expect(
      bad([radians, {type: 'cart'}, {type: 'helmert', translation: [0, 0, 0], scalePPM}])
    ).toThrow('scale');
  expect(bad([radians, {type: 'hgridshift', grids: 'missing'}])).toThrow('not registered');
  expect(bad([radians, {type: 'vgridshift', grids: 'missing'}])).toThrow('not registered');
  expect(bad([radians, {type: 'hgridshift'}])).toThrow('names required');
  expect(bad([radians, {type: 'vgridshift'}])).toThrow('names required');
  expect(bad([radians, {type: 'hgridshift', grids: 'local'}], {datumGrids: {local: {}}})).toThrow(
    'Invalid datum grid'
  );
  expect(bad([radians, {type: 'vgridshift', grids: 'null', multiplier: Infinity}])).toThrow(
    'finite'
  );
  expect(bad([radians], {input: {...input, units: ['deg', 'deg', 'deg']}})).toThrow('input');
  expect(bad([radians], {input: {...input, units: ['bad', 'deg', 'm']}})).toThrow('input');
  expect(bad([radians], {epoch: 2020})).toThrow('parameter');
  expect(
    bad([radians, {type: 'projection', name: 'ob_tran', parameters: {o_lat_p: '45'}}], {
      projections: [obliqueTransformation('longlat')]
    })
  ).toThrow('output-unit contract');
});

test('pipeline validates dimensions and numeric inputs; failed records remain untouched', () => {
  const pipeline = new ProjectionPipeline(options);
  for (const stride of [1, 2.5, NaN, 5])
    expect(() => pipeline.projectFlat(new Float64Array(4), stride)).toThrow('stride');
  expect(() => pipeline.projectFlat(new Int32Array(2) as unknown as Float32Array)).toThrow(
    'Float32Array'
  );
  expect(() => pipeline.project([0])).toThrow('XY');
  expect(() => pipeline.project([NaN, 0])).toThrow('finite');
  expect(() => pipeline.project([0, 0, Infinity])).toThrow('finite');
  const cart = new ProjectionPipeline({input, steps: [radians, {type: 'cart'}]});
  expect(() => cart.project([0, 0])).toThrow('XYZ');
  expect(() => cart.projectFlat(new Float64Array([0, 0]), 2)).toThrow('stride');
  const data = new Float64Array([11, 41, 1, 8, 0, 90, 2, 9, 12, 42, 3, 10]);
  const original = Array.from(data);
  expect(() => pipeline.projectFlat(data, 4)).toThrow();
  expect(Array.from(data.slice(0, 4))).toEqual(pipeline.project(original.slice(0, 4)));
  expect(Array.from(data.slice(4))).toEqual(original.slice(4));
});

test('Float32 pipeline rounds only final outputs and rejects overflow without committing the record', () => {
  const input = {space: 'geocentric' as const, units: ['m', 'm', 'm'] as const};
  const scale: PipelineStep = {type: 'helmert', translation: [0, 0, 0], scalePPM: 1e6};
  const safe = new ProjectionPipeline({input, steps: [scale, {...scale, inverse: true}]});
  const data = new Float32Array([3e38, 0, 0, 8]);
  const original = Array.from(data);
  safe.projectFlat(data, 4);
  expect(Array.from(data)).toEqual(original);
  const overflow = new ProjectionPipeline({input, steps: [scale]});
  expect(() => overflow.projectFlat(data, 4)).toThrow('Float32 range');
  expect(Array.from(data)).toEqual(original);
});

for (const grids of ['null', '@null'])
  for (const inverse of [false, true])
    test(`sole ${grids} horizontal-grid fallback is a no-op (inverse=${inverse})`, () => {
      const pipeline = new ProjectionPipeline({
        input: {space: 'geographic', units: ['rad', 'rad', 'm']},
        steps: [{type: 'hgridshift', grids, inverse}]
      });
      const point = [0.2, 0.7, 123, NaN, Infinity];
      expect(pipeline.project(point)).toEqual(point);
      expect(pipeline.unproject(point)).toEqual(point);
      for (const ArrayType of [Float32Array, Float64Array]) {
        for (const dimension of [2, 3, 4, 5]) {
          const buffer = new ArrayType([
            ...point.slice(0, dimension),
            ...point.slice(0, dimension)
          ]);
          const original = Array.from(buffer);
          expect(pipeline.projectFlat(buffer, dimension)).toBe(buffer);
          expect(Array.from(buffer)).toEqual(original);
          expect(pipeline.unprojectFlat(buffer, dimension)).toBe(buffer);
          expect(Array.from(buffer)).toEqual(original);
        }
      }
    });

test('grid callbacks are reentrant and horizontal legacy/mutable hooks preserve height', () => {
  let entered = false;
  const grid = {
    getOffset() {
      if (!entered) {
        entered = true;
        expect(pipeline.project([12, 42, 100, 9])[2]).toBe(85);
      }
      return 15;
    }
  };
  const pipeline = new ProjectionPipeline({
    input,
    steps: [radians, {type: 'vgridshift', grids: 'local'}],
    verticalGrids: {local: grid}
  });
  expect(pipeline.project([11, 41, 50, 8])[2]).toBe(35);
  const local = parseNTv2Grid(makeNTv2());
  for (const grid of [local, {subgridCount: 1, shift: local.shift.bind(local)}]) {
    const horizontal = new ProjectionPipeline({
      input,
      steps: [
        radians,
        {type: 'hgridshift', grids: '@missing,local,null'},
        {type: 'unitconvert', xy: {from: 'rad', to: 'deg'}}
      ],
      datumGrids: {local: grid}
    });
    const point = [-1, 1, 50, NaN];
    const output = horizontal.project(point);
    expect(output[0]).toBeCloseTo(-1 - 6 / 3600, 10);
    expect(output[2]).toBe(50);
    expect(output[3]).toBeNaN();
    expect(horizontal.unproject(output)[0]).toBeCloseTo(point[0], 10);
    expect(horizontal.project([10, 40, 50])).toEqual([10, 40, 50]);
  }
});

test('legacy custom projections remain pluggable and unknown lazy parameters reject at preload', async () => {
  const plugin = {
    ...mercator,
    name: 'custom',
    parameters: [],
    create: () => ({
      forward: (x: number, y: number): [number, number] => [x * 100, y * 100],
      inverse: (x: number, y: number): [number, number] => [x / 100, y / 100]
    })
  };
  const custom = new ProjectionPipeline({
    input,
    steps: [radians, {type: 'projection', name: 'custom'}],
    projections: [plugin]
  });
  const roundtrip = custom.unproject(custom.project([10, 40]));
  expect(roundtrip[0]).toBeCloseTo(10, 10);
  expect(roundtrip[1]).toBeCloseTo(40, 10);
  const lazy = createProjectionDescriptor({name: 'merc'}, async () => mercator);
  const invalid = new ProjectionPipeline({
    ...options,
    steps: [radians, {...projection, parameters: {unsupported: '1'}}],
    projections: [lazy]
  });
  await expect(invalid.preload()).rejects.toThrow('Unsupported pipeline parameter');
});

test('lazy helper aliases cannot bypass the projected-metre contract', async () => {
  const plugin = obliqueTransformation('longlat');
  const lazy = createProjectionDescriptor(
    {name: 'General_Oblique_Transformation'},
    async () => plugin
  );
  const pipeline = new ProjectionPipeline({
    input,
    steps: [radians, {type: 'projection', name: lazy.name, parameters: {o_lat_p: '45'}}],
    projections: [lazy]
  });
  await expect(pipeline.preload()).rejects.toThrow('projected-metre output contract');
});
