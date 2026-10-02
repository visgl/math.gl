// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original lifecycle, unit-state and ownership tests for typed pipeline extensions.
import {expect, test} from 'vitest';
import {ProjectionPipeline} from '@math.gl/proj4/pipeline';
import type {PipelineStep, PipelineProjectionOutput} from '@math.gl/proj4/pipeline';
import {createProjectionDescriptor} from '@math.gl/proj4/core';
import {obliqueTransformation} from '@math.gl/proj4/projections/ob_tran';
import {mercator} from '@math.gl/proj4/projections/merc';

const geo = {space: 'geographic', units: ['rad', 'rad', 'm']} as const;
const xyz = {space: 'geocentric', units: ['m', 'm', 'm']} as const;
const shift: PipelineStep = {type: 'helmert', translation: [1, 2, 3]};
const rotate: PipelineStep = {
  type: 'projection',
  name: 'ob_tran',
  parameters: {o_proj: 'longlat', o_lon_p: '-90', o_lat_p: '45'},
  output: {space: 'geographic', unit: 'rad'}
};

test('ordinate stacks are nested, snapshotted and preserve measures/tails in buffer views', () => {
  const components: (1 | 2 | 3)[] = [1, 3];
  const pipeline = new ProjectionPipeline({
    input: xyz,
    steps: [
      {type: 'push', components},
      {type: 'push', components: [1]},
      shift,
      {type: 'pop', components: [1]},
      {type: 'pop', components: [1, 3]}
    ]
  });
  components.splice(0, 2, 2);
  for (const ArrayType of [Float32Array, Float64Array]) {
    for (const dimension of [3, 4, 5, 6]) {
      const point = [100, 200, -0, NaN, Infinity, -0].slice(0, dimension);
      const storage = new ArrayType([77, ...point, ...point, 88]);
      const view = storage.subarray(1, 1 + dimension * 2);
      expect(pipeline.projectFlat(view, dimension)).toBe(view);
      expect(Array.from(view)).toEqual([
        100,
        202,
        -0,
        ...point.slice(3),
        100,
        202,
        -0,
        ...point.slice(3)
      ]);
      pipeline.unprojectFlat(view, dimension);
      expect(Array.from(view)).toEqual([...point, ...point]);
      expect(storage[0]).toBe(77);
      expect(storage.at(-1)).toBe(88);
    }
  }
  expect(pipeline.projectFlat(new Float64Array(0), 3)).toHaveLength(0);
  expect(() => pipeline.project([1, 2])).toThrow('XYZ');
});

test('stack scratch is isolated across reentrant callbacks, records, and failed calls', () => {
  let entered = false;
  const pipeline = new ProjectionPipeline({
    input: geo,
    steps: [
      {type: 'push', components: [1, 2]},
      {type: 'hgridshift', grids: 'offset'},
      {type: 'vgridshift', grids: 'height', multiplier: 1},
      {type: 'pop', components: [1, 2]}
    ],
    datumGrids: {
      offset: {
        subgridCount: 1,
        shift(longitude, latitude, inverse) {
          if (longitude === 2) throw new Error('outside');
          return [longitude + (inverse ? -0.1 : 0.1), latitude];
        }
      }
    },
    verticalGrids: {
      height: {
        getOffset(longitude) {
          if (!entered) {
            entered = true;
            expect(pipeline.project([0.4, 0.5, 20, 9])).toEqual([0.4, 0.5, 20.5, 9]);
          }
          return longitude;
        }
      }
    }
  });
  expect(pipeline.project([0.2, 0.3, 10, 8])).toEqual([0.2, 0.3, 10.3, 8]);
  const data = new Float64Array([0.2, 0.3, 10, 8, 2, 0.3, 20, 9, 0.4, 0.5, 30, 10]);
  const original = Array.from(data);
  expect(() => pipeline.projectFlat(data, 4)).toThrow('outside');
  expect(Array.from(data.slice(0, 4))).toEqual([0.2, 0.3, 10.3, 8]);
  expect(Array.from(data.slice(4))).toEqual(original.slice(4));
  expect(pipeline.project([0.4, 0.5, 30, 10])).toEqual([0.4, 0.5, 30.5, 10]);
});

test('stack and directional metadata reject invalid or ambiguous programs at construction', () => {
  const bad = (steps: unknown) => () =>
    new ProjectionPipeline({input: xyz, steps: steps as PipelineStep[]});
  for (const components of [[], [0], [4], [1, 1], [1.5], NaN, null])
    expect(bad([{type: 'push', components}])).toThrow('Stack components');
  expect(bad([{type: 'pop', components: [1]}])).toThrow('underflow');
  expect(bad([{type: 'push', components: [1]}])).toThrow('unbalanced');
  expect(
    bad([
      {type: 'push', components: [1]},
      {type: 'pop', components: [2]}
    ])
  ).toThrow('underflow');
  expect(
    bad([
      {type: 'push', components: [1], omitInverse: true},
      {type: 'pop', components: [1]}
    ])
  ).toThrow('unbalanced');
  for (const key of ['omitForward', 'omitInverse'])
    expect(bad([{...shift, [key]: 'yes'}])).toThrow(key + ' flag');
  expect(bad([{...shift, omitForward: true, omitInverse: true}])).toThrow('both directions');
  expect(bad([{type: 'unitconvert', xy: {from: 'm', to: 'ft'}, omitInverse: true}])).toThrow(
    'Inverse pipeline output'
  );
  const mixed = () =>
    new ProjectionPipeline({
      input: geo,
      projections: [mercator],
      steps: [
        {type: 'push', components: [1]},
        {type: 'projection', name: 'merc'},
        {type: 'pop', components: [1]}
      ]
    });
  expect(mixed).toThrow('mix horizontal coordinate spaces');
});

test('restoring both horizontal ordinates restores their coordinate space and units', () => {
  const pipeline = new ProjectionPipeline({
    input: geo,
    projections: [mercator],
    steps: [
      {type: 'push', components: [1, 2]},
      {type: 'projection', name: 'merc', omitInverse: true},
      {type: 'pop', components: [1, 2]}
    ]
  });
  const point = [0.2, 0.3, 10, 8];
  expect(pipeline.output).toEqual(geo);
  expect(pipeline.project(point)).toEqual(point);
  expect(pipeline.unproject(point)).toEqual(point);
  const xy = new Float64Array(point.slice(0, 2));
  pipeline.projectFlat(xy);
  expect(Array.from(xy)).toEqual(point.slice(0, 2));
});

test('direction-specific grids preserve horizontal coordinates and use the interpolation location', () => {
  const pipeline = new ProjectionPipeline({
    input: geo,
    steps: [
      {type: 'push', components: [1, 2]},
      {type: 'hgridshift', grids: 'offset', omitInverse: true},
      {type: 'vgridshift', grids: 'height', multiplier: 1},
      {type: 'hgridshift', grids: 'offset', inverse: true, omitForward: true},
      {type: 'pop', components: [1, 2]}
    ],
    datumGrids: {
      offset: {
        subgridCount: 1,
        shift(x, y, inverse) {
          return [x + (inverse ? -0.1 : 0.1), y];
        }
      }
    },
    verticalGrids: {
      height: {
        getOffset(x) {
          return x;
        }
      }
    }
  });
  const point = [0.2, 0.3, 10, 8];
  const result = pipeline.project(point);
  expect(result).toEqual([0.2, 0.3, 10.3, 8]);
  expect(pipeline.unproject(result)).toEqual(point);
});

test('exact rotation differs from approximate equations, snapshots parameters and inverts finite rotations', () => {
  const translation: [number, number, number] = [100, -200, 30];
  const rotation: [number, number, number] = [15000, -7000, 3000];
  const step: PipelineStep = {
    type: 'helmert',
    translation,
    rotation,
    convention: 'coordinate_frame',
    scalePPM: 25,
    exact: true
  };
  const pipeline = new ProjectionPipeline({input: xyz, steps: [step]});
  const point = [4000000, 1000000, 4800000, 8];
  const result = pipeline.project(point);
  const approximate = new ProjectionPipeline({
    input: xyz,
    steps: [{...step, exact: false}]
  }).project(point);
  expect(Math.abs(result[0] - approximate[0])).toBeGreaterThan(1);
  translation[0] = rotation[0] = 0;
  expect(pipeline.project(point)).toEqual(result);
  pipeline
    .unproject(result)
    .slice(0, 3)
    .forEach((value, index) => expect(value).toBeCloseTo(point[index], 8));
  expect(
    () =>
      new ProjectionPipeline({
        input: xyz,
        steps: [{...shift, exact: 'yes'} as unknown as PipelineStep]
      })
  ).toThrow('exact Helmert flag');
});

test('rotated helper output contracts validate algorithms and remain lazy', async () => {
  let loaded = 0,
    created = 0;
  const plugin = obliqueTransformation('longlat');
  const descriptor = createProjectionDescriptor({name: 'ob_tran'}, async () => {
    loaded++;
    return {
      ...plugin,
      create(context) {
        created++;
        return plugin.create(context);
      }
    };
  });
  const output: PipelineProjectionOutput = {space: 'geographic', unit: 'rad'};
  const pipeline = new ProjectionPipeline({
    input: geo,
    projections: [descriptor],
    steps: [{...rotate, type: 'projection', name: 'ob_tran', output}]
  });
  expect(loaded).toBe(0);
  expect(() => pipeline.projectSync([0.2, 0.7, 123, 8])).toThrow('preload');
  (output as {unit: string}).unit = 'deg';
  const point = [0.2, 0.7, 123, 8];
  const result = await pipeline.project(point);
  expect(loaded).toBe(1);
  expect(created).toBe(1);
  expect(pipeline.output.units).toEqual(['rad', 'rad', 'm']);
  const restored = pipeline.unprojectSync(result);
  expect(restored[0]).toBeCloseTo(point[0], 12);
  expect(restored[1]).toBeCloseTo(point[1], 12);
  expect(created).toBe(1);
  expect(() => pipeline.projectSync([0, Math.PI, 10])).toThrow('latitude');
  expect(() => pipeline.unprojectSync([0, Math.PI, 10])).toThrow('latitude');
  expect(await pipeline.preload()).toBe(pipeline);
  for (const output of [
    {space: 'geographic', unit: 'm'},
    {space: 'projected', unit: 'rad'},
    {space: 'projected', unit: 'm'}
  ])
    expect(
      () =>
        new ProjectionPipeline({
          input: geo,
          projections: [plugin],
          steps: [{...rotate, output} as PipelineStep]
        })
    ).toThrow('contract');
});
