// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original normal-support and gradient frame references; no upstream code or model data.
import {expect, test} from 'vitest';
import {config} from '@math.gl/core';
import {
  createLocalFrameBasis,
  eastNorthUpBasis,
  localFrameToMatrix
} from '@math.gl/core/local-frame';
import {Ellipsoid} from '@math.gl/geospatial';
import {createDeformationModel} from '@math.gl/projection/deformation';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';

function close(actual: ArrayLike<number>, expected: ArrayLike<number>, tolerance = 2e-14) {
  for (let i = 0; i < expected.length; i++)
    expect(Math.abs(actual[i] - expected[i]), 'component ' + i).toBeLessThanOrEqual(tolerance);
}
function cross(a: readonly number[], b: readonly number[]) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function frameAt(origin: readonly number[], radii: readonly number[]) {
  if (Math.abs(origin[0]) <= 1e-14 && Math.abs(origin[1]) <= 1e-14) {
    const sign = Math.sign(origin[2]);
    return {east: [0, 1, 0], north: [-sign, 0, 0], up: [0, 0, sign]};
  }
  const horizontal = Math.hypot(origin[0], origin[1]);
  const east = [-origin[1] / horizontal, origin[0] / horizontal, 0];
  const gradient = origin.map((value, i) => value / (radii[i] * radii[i]));
  const norm = Math.hypot(...gradient),
    up = gradient.map(value => value / norm);
  return {east, north: cross(up, east), up};
}
function support(radii: readonly number[], normal: readonly number[], height = 0) {
  const gamma = Math.hypot(...radii.map((value, i) => value * normal[i]));
  return radii.map((value, i) => (value * value * normal[i]) / gamma + height * normal[i]);
}
function model(radii: readonly number[], velocity: readonly number[] = [0.1, 0.2, 0.3]) {
  return createDeformationModel({
    ellipsoid: {semiMajorAxis: radii[0], flattening: 1 - radii[2] / radii[0]},
    epochRange: [2000, 2030],
    grid: {
      sample: (longitude, latitude, out) => {
        expect(Math.abs(longitude)).toBeLessThanOrEqual(Math.PI);
        expect(Math.abs(latitude)).toBeLessThanOrEqual(Math.PI / 2);
        out.x = velocity[0];
        out.y = velocity[1];
        out.z = velocity[2];
        return true;
      }
    }
  });
}
const shapes = [
  [6378137, 6378137, 6356752.314245179],
  [10, 10, 5],
  [10, 10, 10]
];
for (const radii of shapes)
  for (const normal of [
    [1, 0, 0],
    [0, 1, 0],
    [-1, 0, 0],
    [0, -1, 0],
    [0.36, 0.48, 0.8],
    [-0.36, 0.48, -0.8],
    [1e-8, 0, Math.sqrt(1 - 1e-16)],
    [0, 0, 1],
    [0, 0, -1]
  ]) {
    test(`surface ENU/NED and deformation independent frame: radii=${radii},normal=${normal}`, () => {
      const origin = support(radii, normal),
        ellipsoid = new Ellipsoid(...(radii as [number, number, number]));
      const expected = frameAt(origin, radii);
      const basis = createLocalFrameBasis(),
        angular = new Float64Array(16);
      const longitude = normal[0] === 0 && normal[1] === 0 ? 0 : Math.atan2(normal[1], normal[0]);
      eastNorthUpBasis(longitude, Math.atan2(normal[2], Math.hypot(normal[0], normal[1])), basis);
      localFrameToMatrix(
        basis,
        {x: origin[0], y: origin[1], z: origin[2]},
        'east',
        'north',
        'up',
        angular
      );
      close(angular, [...expected.east, 0, ...expected.north, 0, ...expected.up, 0, ...origin, 1]);
      for (const radians of [false, true]) {
        const previous = config._cartographicRadians;
        config._cartographicRadians = radians;
        try {
          close(ellipsoid.eastNorthUpToFixedFrame(origin), angular);
          close(ellipsoid.localFrameToFixedFrame('north', 'east', 'down', origin), [
            ...expected.north,
            0,
            ...expected.east,
            0,
            ...expected.up.map(value => -value),
            0,
            ...origin,
            1
          ]);
        } finally {
          config._cartographicRadians = previous;
        }
      }
      const point = {x: origin[0], y: origin[1], z: origin[2]},
        velocity = [0.1, 0.2, 0.3];
      model(radii, velocity).forward(point, 2010, 2011);
      close(
        [point.x, point.y, point.z],
        origin.map(
          (value, i) =>
            value +
            velocity[0] * expected.east[i] +
            velocity[1] * expected.north[i] +
            velocity[2] * expected.up[i]
        ),
        1e-8
      );
    });
  }

test('at height, Cartesian-gradient and geodetic-footpoint up remain intentionally different', () => {
  const radii = shapes[0],
    normal = [0.36, 0.48, 0.8],
    origin = support(radii, normal, 1e6);
  const ellipsoid = new Ellipsoid(...(radii as [number, number, number])),
    expected = frameAt(origin, radii);
  const matrix = ellipsoid.eastNorthUpToFixedFrame(origin);
  close(matrix, [...expected.east, 0, ...expected.north, 0, ...expected.up, 0, ...origin, 1]);
  expect(Math.hypot(...expected.up.map((value, i) => value - normal[i]))).toBeGreaterThan(1e-4);
  const point = {x: origin[0], y: origin[1], z: origin[2]};
  model(radii, [0, 0, 1]).forward(point, 2010, 2011);
  close(
    [point.x, point.y, point.z],
    origin.map((value, i) => value + normal[i]),
    1e-8
  );
});

for (const radii of [
  [10, 10, 15],
  [10, 12, 15]
]) {
  test('three-radius/prolate frames retain their Cartesian-gradient convention: ' + radii, () => {
    const origin = [3, 4, 5],
      ellipsoid = new Ellipsoid(...(radii as [number, number, number]));
    const expected = frameAt(origin, radii);
    close(ellipsoid.eastNorthUpToFixedFrame(origin), [
      ...expected.east,
      0,
      ...expected.north,
      0,
      ...expected.up,
      0,
      ...origin,
      1
    ]);
  });
}

test('Cartesian poles, near-pole threshold and center keep historical orientations', () => {
  const ellipsoid = new Ellipsoid(10, 10, 5);
  for (const origin of [
    [0, 0, 5],
    [-0, -0, -5],
    [1e-15, -1e-15, 5],
    [2e-14, 0, 5],
    [0, 0, 0]
  ]) {
    const expected = frameAt(origin, [10, 10, 5]);
    close(ellipsoid.eastNorthUpToFixedFrame(origin), [
      ...expected.east,
      0,
      ...expected.north,
      0,
      ...expected.up,
      0,
      ...origin,
      1
    ]);
  }
  const point = {x: 0, y: 0, z: 0};
  expect(() => model([10, 10, 5]).forward(point, 2010, 2011)).toThrow(/center/);
  expect(point).toEqual({x: 0, y: 0, z: 0});
});

for (const ArrayType of [Float32Array, Float64Array]) {
  test(
    'deformation flat epochs/views/M and inverse retain scalar rounding: ' + ArrayType.name,
    () => {
      const p = new ProjectionPipeline({
        input: {space: 'geocentric', units: ['m', 'm', 'm']},
        steps: [
          {
            type: 'deformation',
            model: model(shapes[0]),
            sourceEpoch: 'coordinate',
            targetEpoch: 2020
          }
        ]
      });
      const source = new ArrayType([
        888,
        ...support(shapes[0], [0.36, 0.48, 0.8]),
        42,
        ...support(shapes[0], [-0.36, 0.48, -0.8]),
        NaN,
        999
      ]);
      const data = source.slice(),
        view = data.subarray(1, 9),
        epochs = new Float64Array([2010, 2015]);
      const expected = new ArrayType([
        ...(p.project(Array.from(view.slice(0, 4)), 2010) as number[]),
        ...(p.project(Array.from(view.slice(4)), 2015) as number[])
      ]);
      expect(p.projectFlat(view, 4, epochs)).toBe(view);
      expect(Array.from(view)).toEqual(Array.from(expected));
      expect(view[3]).toBe(42);
      expect(Number.isNaN(view[7])).toBe(true);
      expect(data[0]).toBe(888);
      expect(data[9]).toBe(999);
      const inverse = new ArrayType([
        ...(p.unproject(Array.from(view.slice(0, 4)), 2010) as number[]),
        ...(p.unproject(Array.from(view.slice(4)), 2015) as number[])
      ]);
      expect(p.unprojectFlat(view, 4, epochs)).toBe(view);
      expect(Array.from(view)).toEqual(Array.from(inverse));
      expect(Array.from(epochs)).toEqual([2010, 2015]);
    }
  );
}

test('recursive custom sampling and frame output setters cannot replace outer scratch', () => {
  const radii = shapes[0],
    outer = support(radii, [0.36, 0.48, 0.8]),
    inner = support(radii, [-0.36, 0.48, -0.8]);
  const nested = {x: inner[0], y: inner[1], z: inner[2]};
  let active = false,
    calls = 0;
  const prepared = createDeformationModel({
    epochRange: [2000, 2030],
    grid: {
      sample: (_lon, _lat, out) => {
        if (!active) {
          active = true;
          prepared.forward(nested, 2010, 2011);
          active = false;
          calls++;
        }
        out.x = 0;
        out.y = 0;
        out.z = 1;
        return true;
      }
    }
  });
  const point = {x: outer[0], y: outer[1], z: outer[2]};
  prepared.forward(point, 2010, 2011);
  close(
    [point.x, point.y, point.z],
    outer.map((value, i) => value + [0.36, 0.48, 0.8][i]),
    1e-8
  );
  close(
    [nested.x, nested.y, nested.z],
    inner.map((value, i) => value + [-0.36, 0.48, -0.8][i]),
    1e-8
  );
  expect(calls).toBe(1);
  for (const radii of [shapes[0], [10, 12, 15], [10, 10, 15]]) {
    const ellipsoid = new Ellipsoid(...(radii as [number, number, number])),
      origin = [3, 4, 5],
      expected = ellipsoid.eastNorthUpToFixedFrame(origin);
    let first = 0;
    const output = new Array(16).fill(0);
    Object.defineProperty(output, 0, {
      get() {
        return first;
      },
      set(value: number) {
        first = value;
        ellipsoid.localFrameToFixedFrame('north', 'east', 'down', [6, 7, -8]);
      }
    });
    expect(ellipsoid.eastNorthUpToFixedFrame(origin, output)).toBe(output);
    close(output, expected);
    const aliased = [3, 4, 5];
    expect(ellipsoid.eastNorthUpToFixedFrame(aliased, aliased)).toBe(aliased);
    close(aliased, expected);
  }
});
