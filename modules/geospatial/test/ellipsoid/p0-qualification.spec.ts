// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original bounded-profile P0 accuracy and public ownership/unit/boundary regressions; no upstream fixtures copied.
import {eastNorthUpToFixedFrame, localFrameToFixedFrame} from '@math.gl/geospatial';
import {expect, test} from 'vitest';
import {config, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {qualifyP0} from '../../projection/test/ellipsoid-p0-entry';

for (const row of qualifyP0()) {
  test(`P0 ${row.family}: ${row.id}`, () => {
    expect(Number.isFinite(row.budgetUsage)).toBe(true);
    if (!('qualified' in row) || row.qualified !== false)
      expect(row.budgetUsage).toBeLessThanOrEqual(1);
    expect(row.ownership).toBe(true);
  });
}
function close(actual: ArrayLike<number>, expected: ArrayLike<number>, scale = 1) {
  for (let i = 0; i < expected.length; i++)
    expect(Math.abs(actual[i] - expected[i]) / scale).toBeLessThanOrEqual(2e-14);
}
for (const scale of [1e-300, 1e-60, 1, 1e60, 1e300]) {
  test(`P0 nonzero ray normals/radial scaling: ${scale}`, () => {
    const shape = new Ellipsoid(2, 3, 4),
      point = [scale, 2 * scale, -3 * scale];
    const length = Math.hypot(1, 2, -3);
    close(shape.geocentricSurfaceNormal(point), [1 / length, 2 / length, -3 / length]);
    const norm = Math.hypot(1 / 4, 2 / 9, -3 / 16);
    close(shape.geodeticSurfaceNormal(point), [1 / 4 / norm, 2 / 9 / norm, -3 / 16 / norm]);
    const radial = Math.hypot(1 / 2, 2 / 3, -3 / 4);
    close(shape.scaleToGeocentricSurface(point), [1 / radial, 2 / radial, -3 / radial], 4);
  });
}
for (const scale of [1e-60, 1, 1e60]) {
  test(`P0 surface frame direction is independent of unit: ${scale}`, () => {
    const shape = new Ellipsoid(2 * scale, 2 * scale, scale);
    const p = [2 * scale, 0, 0];
    const frame = eastNorthUpToFixedFrame(shape, p);
    close(frame.slice(0, 12), [0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0]);
    close(frame.slice(12, 15), p, scale);
  });
}
const methods: Array<{
  name: string;
  input: number[];
  run: (e: Ellipsoid, p: number[], out?: number[]) => number[];
}> = [
  {name: 'forward', input: [30, 40, 2], run: (e, p, o) => e.cartographicToCartesian(p, o)},
  {name: 'inverse', input: [4, 5, 6], run: (e, p, o) => e.cartesianToCartographic(p, o)},
  {name: 'nearest', input: [4, 5, 6], run: (e, p, o) => e.scaleToGeodeticSurface(p, o)},
  {name: 'radial', input: [4, 5, 6], run: (e, p, o) => e.scaleToGeocentricSurface(p, o)},
  {name: 'geocentric normal', input: [4, 5, 6], run: (e, p, o) => e.geocentricSurfaceNormal(p, o)},
  {name: 'geodetic normal', input: [4, 5, 6], run: (e, p, o) => e.geodeticSurfaceNormal(p, o)},
  {
    name: 'angular normal',
    input: [30, 40, 2],
    run: (e, p, o) => e.geodeticSurfaceNormalCartographic(p, o)
  },
  {name: 'to scaled', input: [4, 5, 6], run: (e, p, o) => e.transformPositionToScaledSpace(p, o)},
  {
    name: 'from scaled',
    input: [4, 5, 6],
    run: (e, p, o) => e.transformPositionFromScaledSpace(p, o)
  },
  {
    name: 'normal intersection',
    input: [1, 2, 0.1],
    run: (e, p, o) => e.getSurfaceNormalIntersectionWithZAxis(p, 0, o)
  }
];
for (const shape of [
  [3, 2, 1],
  [2, 2, 1],
  [2, 2, 2]
])
  for (const method of methods) {
    if (method.name === 'normal intersection' && shape[0] !== shape[1]) continue;
    test(`P0 ${method.name} ownership and nested setters: ${shape}`, () => {
      const e = new Ellipsoid(...(shape as [number, number, number]));
      const p = [...method.input],
        expected = method.run(e, p);
      expect(expected).toBeDefined();
      expect(p).toEqual(method.input);
      expect(method.run(e, p)).not.toBe(expected);
      const aliased = [...p, 42];
      expect(method.run(e, aliased, aliased)).toBe(aliased);
      close(aliased.slice(0, 3), expected);
      expect(aliased[3]).toBe(42);
      for (const Type of [Array, Float32Array, Float64Array]) {
        const buffer = Type === Array ? [7, 8, 9, 42] : new Type([7, 8, 9, 42]);
        expect(method.run(e, p, buffer as number[])).toBe(buffer);
        for (let i = 0; i < 3; i++)
          expect(buffer[i]).toBe(Type === Float32Array ? Math.fround(expected[i]) : expected[i]);
        expect(buffer[3]).toBe(42);
      }
      const object = {x: 7, y: 8, z: 9};
      Object.defineProperty(object, 'x', {
        get: () => 7,
        set: () => {
          e.scaleToGeodeticSurface([10, 20, 30]);
        }
      });
      expect(method.run(e, p, object as unknown as number[])).toBe(object);
      expect(object.y).toBe(expected[1]);
      expect(object.z).toBe(expected[2]);
      const nested = [7, 8, 9];
      const proxy = new Proxy(nested, {
        set(target, key, value) {
          if (key === '0') e.cartesianToCartographic([40, 50, 60]);
          return Reflect.set(target, key, value);
        }
      });
      expect(method.run(e, p, proxy)).toBe(proxy);
      close(nested, expected);
    });
  }
test('P0 radians/degrees and forward outputs retain physical coordinates', () => {
  const previous = config._cartographicRadians;
  try {
    const e = new Ellipsoid(2, 3, 4),
      degrees = [30, 40, 2];
    config._cartographicRadians = false;
    const expected = e.cartographicToCartesian(degrees);
    config._cartographicRadians = true;
    close(e.cartographicToCartesian([Math.PI / 6, (40 * Math.PI) / 180, 2]), expected);
    const actual = e.cartesianToCartographic(expected);
    close(actual, [Math.PI / 6, (40 * Math.PI) / 180, 2]);
  } finally {
    config._cartographicRadians = previous;
  }
});
test('P0 finite geometry snapshots and adapter restrictions', () => {
  for (const bad of [NaN, Infinity, -Infinity, -1])
    for (let axis = 0; axis < 3; axis++) {
      const shape = [1, 1, 1];
      shape[axis] = bad;
      expect(() => new Ellipsoid(...(shape as [number, number, number]))).toThrow();
    }
  expect(new Ellipsoid().radii).toEqual(new Vector3(0, 0, 0));
  const e = Ellipsoid.fromSpheroid({semiMajorAxis: 2, semiMinorAxis: 1});
  for (const field of [
    'radii',
    'radiiSquared',
    'radiiToTheFourth',
    'oneOverRadii',
    'oneOverRadiiSquared'
  ] as const)
    expect(Object.isFrozen(e[field])).toBe(true);
  const snapshot = e.toSpheroid();
  expect(Object.isFrozen(snapshot)).toBe(true);
  expect(snapshot).not.toBe(e.toSpheroid());
  expect(() => new Ellipsoid(1, 1, 2).toSpheroid()).toThrow();
  expect(() => new Ellipsoid(1, 2, 3).toSpheroid()).toThrow();
  expect(e.equals(new Ellipsoid(2, 2, 1))).toBe(true);
  expect(e.toString()).toBe('[2, 2, 1]');
});
for (const shape of [
  [3, 2, 1],
  [2, 2, 1],
  [2, 2, 2]
])
  test(`P0 invalid conversions are atomic: ${shape}`, () => {
    const e = new Ellipsoid(...(shape as [number, number, number]));
    const out = [7, 8, 9, 42];
    for (const bad of [NaN, Infinity, -Infinity])
      for (const call of [
        () => e.cartographicToCartesian([bad, 0, 0], out),
        () => e.cartesianToCartographic([0, bad, 0], out),
        () => e.scaleToGeodeticSurface([0, 0, bad], out),
        () => e.scaleToGeocentricSurface([bad, 0, 0], out),
        () => e.geocentricSurfaceNormal([0, bad, 0], out),
        () => e.geodeticSurfaceNormal([0, 0, bad], out)
      ]) {
        expect(call()).toBeUndefined();
        expect(out).toEqual([7, 8, 9, 42]);
      }
    expect(e.scaleToGeodeticSurface([0, 0, 0], out)).toBeUndefined();
    expect(out).toEqual([7, 8, 9, 42]);
  });

test('P0 normal intersection invalid numbers and frame failures preserve outputs', () => {
  const shape = new Ellipsoid(2, 2, 1);
  const previous = config.debug;
  try {
    for (const debug of [false, true]) {
      config.debug = debug;
      for (const bad of [NaN, Infinity, -Infinity]) {
        const out = [7, 8, 9, 42];
        expect(shape.getSurfaceNormalIntersectionWithZAxis([0, 0, bad], 0, out)).toBeUndefined();
        expect(shape.getSurfaceNormalIntersectionWithZAxis([0, 0, 0], bad, out)).toBeUndefined();
        expect(out).toEqual([7, 8, 9, 42]);
        const matrix = Array(16).fill(42);
        expect(() => eastNorthUpToFixedFrame(shape, [bad, 0, 0], matrix)).toThrow();
        expect(matrix).toEqual(Array(16).fill(42));
      }
    }
    const short = new Float64Array(15).fill(42);
    expect(() => eastNorthUpToFixedFrame(shape, [2, 0, 0], short as unknown as number[])).toThrow();
    expect([...short]).toEqual(Array(15).fill(42));
    const matrix = Array(16).fill(42);
    expect(() => localFrameToFixedFrame(shape, 'east', 'east', 'up', [2, 0, 0], matrix)).toThrow();
    expect(matrix).toEqual(Array(16).fill(42));
  } finally {
    config.debug = previous;
  }
});

test('P0 normal intersection requires revolution geometry in every unit', () => {
  expect(() => new Ellipsoid(0, 0, 1).getSurfaceNormalIntersectionWithZAxis([0, 0, 0])).toThrow();
  for (const scale of [1e-60, 1, 1e60]) {
    const shape = new Ellipsoid(3 * scale, 2 * scale, scale);
    const out = [7, 8, 9, 42];
    expect(() => shape.getSurfaceNormalIntersectionWithZAxis([0, 0, 0], 0, out)).toThrow();
    expect(out).toEqual([7, 8, 9, 42]);
  }
});

test('P0 polar forward coordinates retain axes with subnormal squared radii', () => {
  const previousDebug = config.debug;
  const previousRadians = config._cartographicRadians;
  config.debug = false;
  config._cartographicRadians = false;
  try {
    for (const radius of [1e-160, 1e-200, 1e-300]) {
      const polar = radius / 10;
      const shape = new Ellipsoid(radius, radius, polar);
      const oblate = new Ellipsoid(radius, radius, radius * 0.9);
      const ratio = oblate.radii.z / radius;
      const norm = Math.sqrt(1 + ratio * ratio);
      const midpoint = oblate.cartographicToCartesian([0, 45, 0]);
      expect(Math.abs(midpoint[0] / radius - 1 / norm)).toBeLessThanOrEqual(2e-14);
      expect(Math.abs(midpoint[2] / radius - (ratio * ratio) / norm)).toBeLessThanOrEqual(2e-14);
      const intersection = oblate.getSurfaceNormalIntersectionWithZAxis([0, 0, radius * 0.001]);
      expect(intersection).toBeDefined();
      expect(
        Math.abs(intersection[2] / radius - 0.001 * (1 - (1 / ratio) ** 2))
      ).toBeLessThanOrEqual(2e-14);

      for (const sign of [-1, 1]) {
        const out = shape.cartographicToCartesian([0, sign * 90, 0]);
        expect(out).toBeDefined();
        expect(out[0]).toBe(0);
        expect(out[1]).toBe(0);
        expect(Math.abs(out[2] / polar - sign)).toBeLessThanOrEqual(2e-14);
      }
    }
  } finally {
    config.debug = previousDebug;
    config._cartographicRadians = previousRadians;
  }
});

test('P0 weighted normal preserves valid extreme axis directions', () => {
  close(new Ellipsoid(1e70, 1e70, 1e-100).geodeticSurfaceNormal([1e140, 0, 0]), [1, 0, 0]);
  const axes = [2 ** 250, 2 ** -500, 2 ** -200];
  const point = [2 ** 500, 2 ** -1000, -(2 ** -400)];
  const expected = [1 / Math.sqrt(3), 1 / Math.sqrt(3), -1 / Math.sqrt(3)];
  // Each exact dyadic coordinate is its squared radius times a signed unit
  // coefficient, so the normalized gradient is independent of axis magnitude.
  for (let rotation = 0; rotation < 3; rotation++) {
    const shape = new Ellipsoid(axes[0], axes[1], axes[2]);
    for (const scale of [0.5, 1, 2]) {
      const alias = point.map(x => x * scale);
      expect(shape.geodeticSurfaceNormal(alias, alias)).toBe(alias);
      close(alias, expected);
    }
    axes.push(axes[0]);
    axes.shift();
    point.push(point[0]);
    point.shift();
    expected.push(expected[0]);
    expected.shift();
  }
});

test('P0 weighted normal does not depend on overflowing derived caches', () => {
  const previousDebug = config.debug;
  config.debug = false;
  try {
    const shape = new Ellipsoid(Number.MIN_VALUE, 1, 2 ** 1023);
    expect(shape.geodeticSurfaceNormal([Number.MIN_VALUE, 1, 2 ** 1023])).toEqual([
      1,
      Number.MIN_VALUE,
      0
    ]);
  } finally {
    config.debug = previousDebug;
  }
});
