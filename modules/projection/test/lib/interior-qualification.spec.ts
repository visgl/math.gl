// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original independently referenced interior qualification; no upstream fixtures.
import {expect, test} from 'vitest';
import {config, Vector3} from '@math.gl/core';
import {cartesianToSpheroid, spheroidToCartesian} from '@math.gl/core/spheroid';
import {Ellipsoid} from '@math.gl/geospatial';
import {ProjectionEngine} from '@math.gl/projection/core';
import {geocentric} from '@math.gl/projection/projections/geocent';
import {cases, evaluateInterior, type InteriorPath} from '../spheroid-interior-entry';

for (const row of cases) {
  const paths: InteriorPath[] = ['geospatial'];
  if (row.radii[0] === row.radii[1] && row.radii[2] <= row.radii[0])
    paths.push('projection', 'leaf');
  for (const path of paths) {
    const qualified = row.qualified[path === 'leaf' ? 'projection' : path];
    test(`${qualified ? 'accuracy' : 'bounded behavior only'}: ${path} ${row.id}`, () => {
      const result = evaluateInterior(row, path);
      expect(result.finite).toBe(true);
      expect(result.inputUnchanged).toBe(true);
      expect(result.failureAtomic).toBe(true);
      if (qualified) expect(result.status).toBe('matches-reference');
      // Non-qualified probes must not be mistaken for successful accuracy checks.
      // The retained report records rejection and errors for every such probe.
    });
  }
}

test('the independent oracle fixture retains qualified and unsupported probes', () => {
  expect(cases.length).toBe(198);
  expect(cases.some(row => row.qualified.geospatial)).toBe(true);
  expect(cases.some(row => row.qualified.projection)).toBe(true);
  expect(cases.some(row => row.id.startsWith('cusp/'))).toBe(true);
  for (const row of cases) {
    expect(row.reference.surfaceResidual).toBeLessThan(1e-60);
    const scale = Math.max(...row.radii);
    expect(row.reference.multiplierOverMaxRadiusSquared).toBeGreaterThan(
      -((Math.min(...row.radii) / scale) ** 2)
    );
    expect(
      Math.abs(Math.hypot(...row.reference.footpoint.map((value, i) => value / row.radii[i])) - 1)
    ).toBeLessThan(2e-15);
    for (let i = 0; i < 3; i++) {
      const reconstructed =
        row.reference.footpoint[i] + row.reference.height * row.reference.normal[i];
      expect(Math.abs((reconstructed - row.xyz[i]) / scale)).toBeLessThan(1e-15);
    }
    expect(Math.abs(Math.hypot(...row.reference.normal) - 1)).toBeLessThan(1e-15);
  }
});

// These boundaries use analytic constructions rather than the fixture solver.
function engine(a: number, b: number) {
  const axes = `+a=${a} +b=${b}`;
  return new ProjectionEngine({
    from: '+proj=longlat ' + axes,
    to: '+proj=geocent ' + axes,
    projections: [geocentric]
  });
}
function close(actual: ArrayLike<number>, expected: ArrayLike<number>, tolerance: number) {
  for (let i = 0; i < expected.length; i++)
    expect(Math.abs(actual[i] - expected[i])).toBeLessThanOrEqual(tolerance);
}

test('equatorial interior has multiple normal representations, including two nearest footpoints', () => {
  const shape = {semiMajorAxis: 1, semiMinorAxis: 0.5, eccentricitySquared: 0.75};
  const x = 0.5;
  const qx = x / 0.75;
  const qz = 0.5 * Math.sqrt(1 - qx * qx);
  const gradient = Math.hypot(qx, qz / 0.25);
  const nearestHeight = -0.25 * gradient;
  const nearestLatitude = Math.atan2(qz / 0.25, qx);
  const branches = [
    [0, 0, x - 1],
    [0, nearestLatitude, nearestHeight],
    [0, -nearestLatitude, nearestHeight]
  ];
  for (const [longitude, latitude, height] of branches) {
    const point = {x: longitude, y: latitude, z: height};
    expect(spheroidToCartesian(point, shape)).toBe(true);
    close([point.x, point.y, point.z], [x, 0, 0], 1e-15);
  }
  expect(Math.abs(nearestHeight)).toBeLessThan(1 - x);
  // Preserve the historical cardinal branch; a defined inverse is not a promise
  // to choose the closest of these representations.
  close(engine(1, 0.5).unproject([x, 0, 0]), [0, 0, x - 1], 1e-15);
});

test('flattened non-cardinal interiors reject atomically, including aliased and flat outputs', () => {
  const row = cases.find(row => row.id === 'flat/1/.5/north')!;
  const shape = {semiMajorAxis: 1, semiMinorAxis: 0.1, eccentricitySquared: 0.99};
  const point = {x: row.xyz[0], y: row.xyz[1], z: row.xyz[2]};
  const snapshot = {...point};
  expect(cartesianToSpheroid(point, shape)).toBe(false);
  expect(point).toEqual(snapshot);
  const projection = engine(1, 0.1);
  const output = [7, 8, 9, 42];
  expect(() => projection.unprojectTo([...row.xyz, 99], output)).toThrow(/did not converge/);
  expect(output).toEqual([7, 8, 9, 42]);
  for (const ArrayType of [Float32Array, Float64Array]) {
    const data = new ArrayType([888, 1, 0, 0, 11, ...row.xyz, 22, 999]);
    const view = data.subarray(1, 9);
    const rejectedRecord = Array.from(view.slice(4));
    expect(() => projection.unprojectFlat(view, 4)).toThrow(/did not converge/);
    expect(Array.from(view.slice(0, 4))).toEqual([0, 0, 0, 11]);
    expect(Array.from(view.slice(4))).toEqual(rejectedRecord);
    expect(data[0]).toBe(888);
    expect(data[9]).toBe(999);
  }
  // A failed row leaves the engine usable, without modifying the failed record.
  close(projection.unproject([1, 0, 0]), [0, 0, 0], 0);
});

test('qualified interior references exercise flat views and preserved M', () => {
  for (const row of cases.filter(row => row.qualified.projection)) {
    const projection = engine(row.radii[0], row.radii[2]);
    const normal = row.reference.normal;
    const expected = [
      (Math.atan2(normal[1], normal[0]) * 180) / Math.PI,
      (Math.atan2(normal[2], Math.hypot(normal[0], normal[1])) * 180) / Math.PI,
      row.reference.height
    ];
    const data = new Float64Array([888, ...row.xyz, 42, ...row.xyz, NaN, 999]);
    const view = data.subarray(1, 9);
    expect(projection.unprojectFlat(view, 4)).toBe(view);
    for (const offset of [0, 4]) {
      close(view.subarray(offset, offset + 2), expected.slice(0, 2), 1e-9);
      expect(Math.abs(view[offset + 2] - expected[2])).toBeLessThanOrEqual(
        Math.max(1e-12, row.radii[0] * 2e-12)
      );
    }
    expect(view[3]).toBe(42);
    expect(Number.isNaN(view[7])).toBe(true);
    expect(data[0]).toBe(888);
    expect(data[9]).toBe(999);
  }
});

test('extreme finite axis magnitudes preserve distinct leaf and geometry limits', () => {
  const previous = config._cartographicRadians;
  const previousDebug = config.debug;
  config._cartographicRadians = false;
  try {
    for (const a of [1e-160, 1e160]) {
      const shape = {semiMajorAxis: a, semiMinorAxis: a, eccentricitySquared: 0};
      const point = {x: a * 0.3, y: 0, z: a * 0.4};
      const output = {x: 7, y: 8, z: 9};
      expect(cartesianToSpheroid(point, shape, output)).toBe(true);
      expect(Math.abs(output.y - Math.atan2(4, 3))).toBeLessThan(1e-15);
      expect(Math.abs(output.z / a + 0.5)).toBeLessThan(1e-15);
      config.debug = true;
      expect(() => new Ellipsoid(a, a, a)).toThrow(/Invalid number/);
      config.debug = false;
      const ellipsoid = new Ellipsoid(a, a, a);
      for (const target of [[7, 8, 9], new Vector3(7, 8, 9)]) {
        expect(
          ellipsoid.cartesianToCartographic([point.x, point.y, point.z], target)
        ).toBeUndefined();
        expect(Array.from(target)).toEqual([7, 8, 9]);
      }
    }
  } finally {
    config._cartographicRadians = previous;
    config.debug = previousDebug;
  }
});

test('axis-ratio underflow is an explicit unsupported non-cardinal inverse', () => {
  const shape = {semiMajorAxis: 1, semiMinorAxis: 1e-170, eccentricitySquared: 1};
  const input = {x: 1, y: 0, z: 1e-170};
  const output = {x: 7, y: 8, z: 9};
  expect(cartesianToSpheroid(input, shape, output)).toBe(false);
  expect(output).toEqual({x: 7, y: 8, z: 9});
  expect(cartesianToSpheroid(input, shape)).toBe(false);
  expect(input).toEqual({x: 1, y: 0, z: 1e-170});
  // The exact pole has an analytic representation even at this extreme ratio.
  expect(cartesianToSpheroid({x: 0, y: 0, z: 1e-170}, shape, output)).toBe(true);
  expect(output).toEqual({x: 0, y: Math.PI / 2, z: 0});
});

for (const scale of [1e-60, 1e60]) {
  for (const ratios of [
    [1, 1, 1.5],
    [1, 1.2, 1.5]
  ]) {
    test(`independent unusual-axis interior anchor: scale=${scale}, ratios=${ratios}`, () => {
      const previous = config._cartographicRadians;
      config._cartographicRadians = true;
      try {
        const radii = ratios.map(value => value * scale);
        const normal = [0.36, 0.48, 0.8];
        const support = Math.hypot(...radii.map((value, i) => value * normal[i]));
        const multiplier = -0.01 * Math.min(...radii) ** 2;
        const height = multiplier / support;
        const xyz = radii.map((value, i) => ((value * value + multiplier) * normal[i]) / support);
        const expected = [Math.atan2(normal[1], normal[0]), Math.atan2(normal[2], 0.6), height];
        const ellipsoid = new Ellipsoid(...(radii as [number, number, number]));
        for (const output of [[7, 8, 9], new Vector3(7, 8, 9)]) {
          expect(ellipsoid.cartesianToCartographic(xyz, output)).toBe(output);
          close(output.slice(0, 2), expected.slice(0, 2), 1e-11);
          expect(Math.abs((output[2] - height) / scale)).toBeLessThan(2e-12);
        }
        const aliased = xyz.slice();
        expect(ellipsoid.cartesianToCartographic(aliased, aliased)).toBe(aliased);
        close(aliased.slice(0, 2), expected.slice(0, 2), 1e-11);
        const forward = ellipsoid.cartographicToCartesian(expected);
        close(
          forward.map(value => value / scale),
          xyz.map(value => value / scale),
          2e-12
        );
      } finally {
        config._cartographicRadians = previous;
      }
    });
  }
}
