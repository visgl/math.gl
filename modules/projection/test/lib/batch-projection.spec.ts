// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import * as native from '@math.gl/projection/experimental';
import type {
  ProjectionPlugin,
  ProjectionPoint,
  ProjectionEngineOptions
} from '@math.gl/projection/experimental';
import {commonProjectionCases} from '../fixtures/common-projections';
import {catalogueProjectionCases} from '../fixtures/catalogue-projections';
import {makeNTv2, makeGeoTIFF} from '../fixtures/datum-grids';

const {ProjectionEngine, mercator, geocentric, parseNTv2Grid, loadGeoTIFFGrid} = native;
const projections = Object.values(native).filter(
  (value): value is ProjectionPlugin => typeof value === 'object' && 'create' in value
);
// Fail if a built-in accidentally falls back to allocating scalar coordinate tuples.
const mutableOnly = projections.map(
  plugin =>
    ({
      ...plugin,
      create(context) {
        const implementation = plugin.create(context);
        expect(implementation.forwardInPlace).toBeTypeOf('function');
        expect(implementation.inverseInPlace).toBeTypeOf('function');
        return {
          ...implementation,
          forward() {
            throw new Error('Unexpected scalar forward');
          },
          inverse() {
            throw new Error('Unexpected scalar inverse');
          }
        };
      }
    }) satisfies ProjectionPlugin
);

function compare(projection: native.ProjectionEngine, points: number[][]): void {
  for (const ArrayType of [Float32Array, Float64Array]) {
    const dimension = points[0].length;
    const input = new ArrayType(points.flat());
    const expected = new ArrayType(input.length);
    for (let offset = 0; offset < input.length; offset += dimension) {
      expected.set(
        projection.project(Array.from(input.subarray(offset, offset + dimension))),
        offset
      );
    }
    expect(projection.projectFlat(input, dimension)).toBe(input);
    expect(input).toEqual(expected);
    for (let offset = 0; offset < input.length; offset += dimension) {
      expected.set(
        projection.unproject(Array.from(input.subarray(offset, offset + dimension))),
        offset
      );
    }
    expect(projection.unprojectFlat(input, dimension)).toBe(input);
    expect(input).toEqual(expected);
  }
}
for (const fixture of [...commonProjectionCases, ...catalogueProjectionCases]) {
  test('batch/scalar parity with mutable hooks: ' + fixture.id, () => {
    const [lon, lat] = fixture.center;
    const projection = new ProjectionEngine({to: fixture.definition, projections: mutableOnly});
    compare(projection, [
      [lon, lat],
      [lon + 0.1, lat - 0.1]
    ]);
    compare(projection, [
      [lon, lat, 123, 7],
      [lon + 0.1, lat - 0.1, -12, 9]
    ]);
  });
}

test('batch Mercator/eqc/oblique composition, stride and view boundaries', () => {
  const oblique = native.obliqueTransformation(native.mollweide);
  for (const to of [
    'EPSG:3857',
    '+proj=merc +ellps=WGS84',
    '+proj=eqc +lat_ts=30',
    '+proj=ob_tran +o_lat_p=45 +o_lon_p=0'
  ]) {
    const projection = new ProjectionEngine({to, projections: [...mutableOnly, oblique]});
    compare(projection, [
      [12, 48, 100, NaN, 9],
      [-10, -35, -10, Infinity, 1]
    ]);
    const backing = new Float64Array([999, 12, 48, 100, 7, -999]);
    const view = backing.subarray(1, 5);
    const {projectFlat, unprojectFlat} = projection;
    expect(projectFlat(view, 4)).toBe(view);
    expect(backing[0]).toBe(999);
    expect(backing[5]).toBe(-999);
    expect(view[3]).toBe(7);
    unprojectFlat(view, 4);
    expect(view[0]).toBeCloseTo(12, 8);
    expect(view[1]).toBeCloseTo(48, 8);
  }
});

test('batch axes, prime meridians, units, datum chains and geocentric coordinates', () => {
  const cases: ProjectionEngineOptions[] = [
    {to: 'EPSG:3857'},
    {to: 'EPSG:4978'},
    {
      from: '+proj=longlat +axis=neu +pm=paris',
      to: '+proj=merc +units=us-ft +vunits=ft +axis=wsd',
      enforceAxis: true
    },
    {
      from: '+proj=longlat +ellps=clrk66 +towgs84=1,2,3',
      to: '+proj=longlat +ellps=GRS80 +towgs84=2,3,4,0.1,0.2,0.3,1'
    },
    {from: '+proj=longlat +axis=uen', to: '+proj=longlat +axis=dsw', enforceAxis: true}
  ];
  for (const options of cases) {
    compare(new ProjectionEngine({...options, projections: [mercator, geocentric]}), [
      [12, 48, 10, 77],
      [15, 40, -5, 88]
    ]);
  }
});

test('prepared grids use mutable interpolation, including fallback and inverse', async () => {
  for (const grid of [parseNTv2Grid(makeNTv2()), await loadGeoTIFFGrid(makeGeoTIFF())]) {
    const projection = new ProjectionEngine({
      from: '+proj=longlat +nadgrids=local,@null',
      to: 'EPSG:3857',
      projections: [mercator],
      datumGrids: {
        local: {
          ...grid,
          shift() {
            throw new Error('Unexpected allocating grid call');
          }
        }
      }
    });
    compare(projection, [
      [-1, 1, 12],
      [-2, 2, 99],
      [-10, 10, 7]
    ]);
    const outside = {x: -1, y: 1, z: 10};
    expect(grid.shiftInPlace!(outside, false)).toBe(false);
    expect(outside).toEqual({x: -1, y: 1, z: 10});
  }
  const legacy = new ProjectionEngine({
    from: '+proj=longlat +nadgrids=legacy',
    datumGrids: {
      legacy: {subgridCount: 1, shift: (x, y, inverse) => [x + (inverse ? -0.001 : 0.001), y]}
    }
  });
  compare(legacy, [
    [-1, 1, 12],
    [-2, 2, 99]
  ]);
});

test('batch rejects malformed layouts before writing and accepts empty buffers', () => {
  const projection = new ProjectionEngine({to: 'EPSG:3857', projections: [mercator]});
  for (const dimension of [0, 1, -2, 2.5, NaN, Infinity, 3]) {
    const buffer = new Float64Array([1, 2, 3, 4]);
    expect(() => projection.projectFlat(buffer, dimension)).toThrow('Dimension');
    expect(buffer).toEqual(new Float64Array([1, 2, 3, 4]));
  }
  for (const buffer of [[1, 2], new Int32Array([1, 2]), new DataView(new ArrayBuffer(16))]) {
    // @ts-expect-error Runtime validation for JavaScript callers.
    expect(() => projection.projectFlat(buffer)).toThrow('Float32Array or Float64Array');
  }
  const empty = new Float32Array();
  expect(projection.projectFlat(empty)).toBe(empty);
  const geocentricProjection = new ProjectionEngine({
    to: 'EPSG:4978',
    projections: [geocentric]
  });
  const pair = new Float64Array([1, 2]);
  expect(() => geocentricProjection.projectFlat(pair)).toThrow('at least 3');
  expect(() => geocentricProjection.unprojectFlat(pair)).toThrow('at least 3');
  expect(pair).toEqual(new Float64Array([1, 2]));
});

test('batch commits whole records and stops at invalid coordinates', () => {
  const projection = new ProjectionEngine({to: 'EPSG:3857', projections: [mercator]});
  for (const invalid of [NaN, Infinity, 90, 91]) {
    const buffer = new Float64Array([1, 2, 3, 0, invalid, 4, 5, 6, 7]);
    expect(() => projection.projectFlat(buffer, 3)).toThrow();
    expect(Array.from(buffer.subarray(0, 3))).toEqual(projection.project([1, 2, 3]));
    expect(Array.from(buffer.subarray(3))).toEqual([0, invalid, 4, 5, 6, 7]);
  }
  const overflow: ProjectionPlugin = {
    name: 'overflow',
    parameters: [],
    create: () => ({forward: () => [1e100, 0], inverse: () => [0, 0]})
  };
  const native = new ProjectionEngine({to: '+proj=overflow', projections: [overflow]});
  const buffer = new Float32Array([1, 2]);
  expect(() => native.projectFlat(buffer)).toThrow('Float32 range');
  expect(buffer).toEqual(new Float32Array([1, 2]));
});

test('custom plugins retain scalar fallback or reuse a caller-owned scratch point', () => {
  const points = new Set<ProjectionPoint>();
  let nested = false;
  let projection: native.ProjectionEngine;
  const plugin: ProjectionPlugin = {
    name: 'custom',
    parameters: [],
    create: () => ({
      forward: (x, y) => [x + 1, y - 1],
      inverse: (x, y) => [x - 1, y + 1],
      forwardInPlace(point) {
        points.add(point);
        if (!nested) {
          nested = true;
          projection.projectFlat(new Float64Array([0, 0]));
        }
        point.x += 1;
        point.y -= 1;
      },
      inverseInPlace(point) {
        point.x -= 1;
        point.y += 1;
      }
    })
  };
  projection = new ProjectionEngine({to: '+proj=custom', projections: [plugin]});
  const buffer = new Float64Array([0, 0, 10, 0, 0, 20]);
  projection.projectFlat(buffer, 3);
  expect(points.size).toBe(2); // One outer scratch point plus one reentrant call's scratch point.
  expect(Array.from(buffer)).toEqual([1, -1, 10, 1, -1, 20]);
  projection.unprojectFlat(buffer, 3);
  expect(Array.from(buffer)).toEqual([0, 0, 10, 0, 0, 20]);
  compare(
    new ProjectionEngine({
      to: '+proj=custom',
      projections: [
        {
          ...plugin,
          create(context) {
            const {forward, inverse} = plugin.create(context);
            return {forward, inverse};
          }
        }
      ]
    }),
    [
      [12, 48, 10],
      [-15, -30, 20]
    ]
  );
});
