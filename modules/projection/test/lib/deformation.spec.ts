// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original contracts/analytic tests; real grid references come from native PROJ.
import {beforeAll, expect, test} from 'vitest';
import {fromArrayBuffer} from 'geotiff';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import type {PipelineStep} from '@math.gl/projection/pipeline';
import {createDeformationModel} from '@math.gl/projection/deformation';
import {createVelocityGrid} from '@math.gl/projection/grids/velocity';
import type {VelocityGrid} from '@math.gl/projection/grids/velocity';
import {loadVelocityGeoTIFFGrid} from '@math.gl/projection/grids/velocity-geotiff';
import inputs from '../fixtures/deformation-cases.json';
import reference from '../fixtures/deformation-reference.json';
import {qualifyDeformationCase} from '../deformation-workload';
let real: VelocityGrid;
beforeAll(async () => {
  const url = new URL('../fixtures/deformation/linear-enu.tif', import.meta.url);
  const bytes =
    url.protocol === 'file:'
      ? new Uint8Array(await (await import('node:fs/promises')).readFile(url)).buffer
      : await (await fetch(url)).arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  expect(Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('')).toBe(
    reference.gridSHA256
  );
  real = await loadVelocityGeoTIFFGrid(await fromArrayBuffer(bytes));
});
for (const [index, fixture] of inputs.cases.entries())
  test('deformation vs independent PROJ: ' + fixture.id, () =>
    expect(qualifyDeformationCase(index, real)).toBe(4)
  );
const xyz = {space: 'geocentric', units: ['m', 'm', 'm']} as const;
const local = () =>
  createVelocityGrid({
    origin: [-1, -1],
    step: [1, 1],
    size: [3, 3],
    units: 'm/year',
    east: new Float64Array(9).fill(0.1),
    north: new Float64Array(9).fill(0.2),
    up: new Float64Array(9).fill(0.3)
  });
const model = () => createDeformationModel({grid: local(), epochRange: [2000, 2030]});
function pipeline(sourceEpoch: number | 'coordinate' = 2010) {
  return new ProjectionPipeline({
    input: xyz,
    steps: [{type: 'deformation', model: model(), sourceEpoch, targetEpoch: 2020}]
  });
}
test('ENU velocity moves ECEF coordinates with explicit decimal-year duration and mathematical inverse', () => {
  const p = pipeline();
  const source = [6378137, 0, 0, 7];
  expect(p.project(source)).toEqual([6378140, 1, 2, 7]);
  const result = p.unproject(p.project(source));
  result.forEach((n, i) => expect(n).toBeCloseTo(source[i], 8));
  // Reversing the epoch pair is physical propagation from the endpoint, not the inverse map.
  const reverse = new ProjectionPipeline({
    input: xyz,
    steps: [{type: 'deformation', model: model(), sourceEpoch: 2020, targetEpoch: 2010}]
  });
  expect(reverse.project(source)).toEqual([6378134, -1, -2, 7]);
  const same = new ProjectionPipeline({
    input: xyz,
    steps: [{type: 'deformation', model: model(), sourceEpoch: 2020, targetEpoch: 2020}]
  });
  expect(same.project(source)).toEqual(source);
});
test('coordinate epochs stay separate from M, support mixed batches, and require explicit input', () => {
  const p = pipeline('coordinate');
  expect(() => p.project([6378137, 0, 0, 2010])).toThrow('coordinate epoch');
  expect(p.project([6378137, 0, 0, 99], 2010)).toEqual([6378140, 1, 2, 99]);
  const buffer = new Float64Array([6378137, 0, 0, 4, 6378137, 0, 0, 5]);
  const epochs = new Float32Array([2010, 2020]);
  expect(p.projectFlat(buffer, 4, epochs)).toBe(buffer);
  expect(Array.from(buffer)).toEqual([6378140, 1, 2, 4, 6378137, 0, 0, 5]);
  p.unprojectFlat(buffer, 4, epochs);
  expect(buffer[0]).toBeCloseTo(6378137, 8);
  expect(Array.from(epochs)).toEqual([2010, 2020]);
});
test('validity, nodata and coverage failures preserve the failing flat record and its successors', () => {
  const p = pipeline('coordinate');
  const rows = [6378137, 0, 0, 7, 6378137, 0, 0, 8, 6378137, 0, 0, 9];
  const buffer = new Float64Array(rows);
  expect(() => p.projectFlat(buffer, 4, new Float64Array([2010, 1999, 2020]))).toThrow(
    'epochRange'
  );
  expect(Array.from(buffer)).toEqual([6378140, 1, 2, 7, ...rows.slice(4)]);
  const outside = new Float64Array([...rows.slice(0, 4), 0, 6378137, 0, 8]);
  expect(() => p.projectFlat(outside, 4, 2010)).toThrow('covers');
  expect(Array.from(outside)).toEqual([6378140, 1, 2, 7, 0, 6378137, 0, 8]);
  expect(() => p.projectFlat(new Float64Array(2), 2, 2010)).toThrow('stride');
  expect(() => p.project([0, 0, 0], 2010)).toThrow('Earth center');
});
test('models snapshot definitions, bind custom grids and restore direct point mutations on errors', () => {
  const range: [number, number] = [2000, 2030];
  const owned = local();
  const grid = {sample: owned.sample};
  const definition = {grid, epochRange: range, ellipsoid: {semiMajorAxis: 6378137, flattening: 0}};
  const prepared = createDeformationModel(definition);
  range[0] = 2021;
  definition.ellipsoid.semiMajorAxis = 1;
  grid.sample = () => false;
  const point = {x: 6378137, y: 0, z: 0};
  prepared.forward(point, 2010, 2020);
  expect(point).toEqual({x: 6378140, y: 1, z: 2});
  const outside = {x: 0, y: 6378137, z: 0};
  expect(() => prepared.forward(outside, 2010, 2020)).toThrow('covers');
  expect(outside).toEqual({x: 0, y: 6378137, z: 0});
  expect(Object.isFrozen(prepared)).toBe(true);
});
test('reject invalid model geometry, time ranges and pipeline operation contracts', () => {
  for (const range of [[2030, 2000], [NaN, 2020], [2000, Infinity], [2000]])
    expect(() =>
      createDeformationModel({grid: local(), epochRange: range as [number, number]})
    ).toThrow('epochRange');
  for (const ellipsoid of [
    {semiMajorAxis: 0, flattening: 0},
    {semiMajorAxis: 6378137, flattening: 1},
    {semiMajorAxis: Infinity, flattening: 0},
    {semiMajorAxis: 1, flattening: -0.1}
  ])
    expect(() =>
      createDeformationModel({grid: local(), epochRange: [2000, 2030], ellipsoid})
    ).toThrow('ellipsoid');
  const step = {type: 'deformation', model: model(), sourceEpoch: 2010, targetEpoch: 2020} as const;
  for (const invalid of [
    {...step, sourceEpoch: NaN},
    {...step, targetEpoch: Infinity},
    {...step, sourceEpoch: undefined},
    {...step, model: {}},
    {...step, referenceEpoch: 2000}
  ])
    expect(() => new ProjectionPipeline({input: xyz, steps: [invalid as PipelineStep]})).toThrow();
  expect(
    () =>
      new ProjectionPipeline({
        input: {space: 'geographic', units: ['rad', 'rad', 'm']},
        steps: [step]
      })
  ).toThrow('geocentric');
});
test('inverse non-convergence and custom non-finite velocities throw without modifying direct input', () => {
  const point = {x: 6378137, y: 0, z: 0};
  const bad = createDeformationModel({
    epochRange: [2000, 2030],
    grid: {
      sample: (_lon, _lat, output) => {
        output.x = NaN;
        output.y = 0;
        output.z = 0;
        return true;
      }
    }
  });
  expect(() => bad.forward(point, 2010, 2020)).toThrow('Non-finite');
  expect(point).toEqual({x: 6378137, y: 0, z: 0});
  const unstable = createDeformationModel({
    epochRange: [2000, 2030],
    grid: {
      sample: (lon, _lat, output) => {
        output.x = lon >= 0 ? 1000 : -1000;
        output.y = output.z = 0;
        return true;
      }
    }
  });
  expect(() => unstable.inverse(point, 2010, 2020)).toThrow('converge');
  expect(point).toEqual({x: 6378137, y: 0, z: 0});
});
