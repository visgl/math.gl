// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently authored normal-support/cardinal anchors; no third-party reference implementation or model data.
import {expect, test} from 'vitest';
import {config} from '@math.gl/core';
import {
  spheroidToCartesian as forwardKernel,
  cartesianToSpheroid as inverseKernel
} from '@math.gl/core/spheroid';
import {Ellipsoid} from '@math.gl/geospatial';
import {ProjectionEngine} from '@math.gl/projection/core';
import {geocentric} from '@math.gl/projection/projections/geocent';

// Adapt authored array anchors to the low-level point contract, outside benchmarks.
function spheroidToCartesian(
  lon: number,
  lat: number,
  height: number,
  a: number,
  b: number,
  es: number,
  result: {[index: number]: number}
): boolean {
  const point = {x: lon, y: lat, z: height};
  if (!forwardKernel(point, {semiMajorAxis: a, semiMinorAxis: b, eccentricitySquared: es}))
    return false;
  result[0] = point.x;
  result[1] = point.y;
  result[2] = point.z;
  return true;
}
function cartesianToSpheroid(
  x: number,
  y: number,
  z: number,
  a: number,
  b: number,
  es: number,
  result: {[index: number]: number}
): boolean {
  const point = {x, y, z};
  if (!inverseKernel(point, {semiMajorAxis: a, semiMinorAxis: b, eccentricitySquared: es}))
    return false;
  result[0] = point.x;
  result[1] = point.y;
  result[2] = point.z;
  return true;
}

function close(actual: ArrayLike<number>, expected: ArrayLike<number>, tolerance: number) {
  for (let i = 0; i < 3; i++)
    expect(Math.abs(actual[i] - expected[i]), 'axis ' + i).toBeLessThanOrEqual(tolerance);
}
function geometry(a: number, b: number) {
  const axes = `+a=${a} +b=${b}`;
  return new ProjectionEngine({
    from: '+proj=longlat ' + axes,
    to: '+proj=geocent ' + axes,
    projections: [geocentric]
  });
}
function inDegrees(callback: () => void) {
  const previous = config._cartographicRadians;
  config._cartographicRadians = false;
  try {
    callback();
  } finally {
    config._cartographicRadians = previous;
  }
}

// A known unit normal determines the unique support point. Exterior offsets remain
// on that normal; this is independent of the conversion/inverse equations under test.
function anchor(a: number, b: number, nx: number, ny: number, nz: number, height: number) {
  const support = Math.hypot(a * nx, a * ny, b * nz);
  return {
    xyz: [
      a * ((a * nx) / support) + height * nx,
      a * ((a * ny) / support) + height * ny,
      b * ((b * nz) / support) + height * nz
    ],
    llh: [
      (Math.atan2(ny, nx) * 180) / Math.PI,
      (Math.atan2(nz, Math.hypot(nx, ny)) * 180) / Math.PI,
      height
    ]
  };
}

for (const ratio of [1, 0.9966471893352525, 0.5, 0.1, 0.01, 0.001, 0.000001]) {
  test('independent surface/exterior anchors for b/a=' + ratio, () =>
    inDegrees(() => {
      for (const a of [10, 6378137]) {
        const b = a * ratio,
          es = 1 - ratio * ratio;
        const ellipsoid = Ellipsoid.fromSpheroid({
          semiMajorAxis: a,
          semiMinorAxis: b
        });
        const engine = geometry(a, b);
        const result = new Float64Array([7, 8, 9]);
        for (const normal of [
          [1, 0, 0],
          [0.6, 0, 0.8],
          [-0.36, 0.48, -0.8],
          [1e-8, 0, Math.sqrt(1 - 1e-16)],
          [0, 0, -1]
        ]) {
          for (const height of [0, a * 0.01, a * 6]) {
            const {xyz, llh} = anchor(a, b, ...(normal as [number, number, number]), height);
            expect(
              cartesianToSpheroid(...(xyz as [number, number, number]), a, b, es, result)
            ).toBe(true);
            // At exact poles longitude has no geometric meaning.
            if (normal[0] !== 0 || normal[1] !== 0)
              expect(Math.abs((result[0] * 180) / Math.PI - llh[0])).toBeLessThan(1e-9);
            expect(Math.abs((result[1] * 180) / Math.PI - llh[1])).toBeLessThan(1e-9);
            expect(Math.abs(result[2] - height)).toBeLessThan(1e-5);
            const expected = llh.slice();
            if (normal[0] === 0 && normal[1] === 0) expected[0] = 0;
            close(engine.unproject(xyz), expected, 1e-5);
            close(ellipsoid.cartesianToCartographic(xyz), expected, 1e-5);
            // Highly flattened cardinal near-poles may amplify trigonometric rounding;
            // the unit-normal anchor above remains the inverse oracle.
            expect(
              spheroidToCartesian(
                (llh[0] * Math.PI) / 180,
                (llh[1] * Math.PI) / 180,
                height,
                a,
                b,
                es,
                result
              )
            ).toBe(true);
            close(
              [result[0], result[1], result[2]],
              xyz,
              Math.max(1e-12, a * 2e-15, (a * 4e-16) / ratio)
            );
            close(engine.project(llh), xyz, Math.max(1e-12, a * 2e-15, (a * 4e-16) / ratio));
            close(
              ellipsoid.cartographicToCartesian(llh),
              xyz,
              Math.max(1e-12, a * 2e-15, (a * 4e-16) / ratio)
            );
          }
        }
      }
    })
  );
}

test('deep interior: nearest-normal inversion and ambiguous equatorial rejection', () =>
  inDegrees(() => {
    const ellipsoid = new Ellipsoid(10, 10, 5),
      engine = geometry(10, 5);
    // Reject the equally near north/south normal pair instead of selecting an equatorial branch.
    expect(() => engine.unproject([1, 0, 0])).toThrow(/did not converge/);
    const output = [7, 8, 9];
    expect(ellipsoid.cartesianToCartographic([1, 0, 0], output)).toBeUndefined();
    expect(output).toEqual([7, 8, 9]);
    const xyz = [0.1, 0.2, 0.3];
    const llh = ellipsoid.cartesianToCartographic(xyz);
    close(ellipsoid.cartographicToCartesian(llh), xyz, 1e-12);
    expect(cartesianToSpheroid(0.01, 0, 0.0001, 10, 0.1, 0.9999, new Float64Array([7, 8, 9]))).toBe(
      true
    );
  }));

test('numeric leaf fails atomically on nonfinite, center and overflow', () => {
  const geometry = {semiMajorAxis: 1, semiMinorAxis: 0.5, eccentricitySquared: 0.75};
  for (const xyz of [
    [0, 0, 0],
    [NaN, 1, 2],
    [1, Infinity, 2],
    [1.2e308, 1.2e308, 1.2e308]
  ]) {
    const point = {x: xyz[0], y: xyz[1], z: xyz[2]},
      output = {x: 7, y: 8, z: 9};
    expect(inverseKernel(point, geometry, output)).toBe(false);
    expect(output).toEqual({x: 7, y: 8, z: 9});
    expect(point).toEqual({x: xyz[0], y: xyz[1], z: xyz[2]});
    expect(inverseKernel(point, geometry)).toBe(false);
    expect(point).toEqual({x: xyz[0], y: xyz[1], z: xyz[2]});
  }
  const point = {x: 0, y: 0, z: Infinity},
    output = {x: 7, y: 8, z: 9};
  expect(forwardKernel(point, geometry, output)).toBe(false);
  expect(output).toEqual({x: 7, y: 8, z: 9});
  expect(inverseKernel({x: 1, y: 0, z: 0}, geometry, output)).toBe(true);
  expect(output).toEqual({x: 0, y: 0, z: 0});
});

test('shared forward and inverse capture numeric results before recursive application setters', () =>
  inDegrees(() => {
    const geometry = {semiMajorAxis: 10, semiMinorAxis: 5, eccentricitySquared: 0.75};
    const input = {x: 0.7, y: 0.9, z: 3};
    const expected = {...input};
    forwardKernel(expected, geometry);
    const snapshot = [expected.x, expected.y, expected.z];
    let x = 0;
    let writes = 0;
    const output = {
      get x() {
        return x;
      },
      set x(value: number) {
        x = value;
        writes++;
        forwardKernel({x: -1, y: -0.5, z: 2}, geometry, expected);
      },
      y: 0,
      z: 0
    };
    expect(forwardKernel(input, geometry, output)).toBe(true);
    expect(writes).toBe(1);
    close([output.x, output.y, output.z], snapshot, 0);
    expect(input).toEqual({x: 0.7, y: 0.9, z: 3});
    const ellipsoid = new Ellipsoid(10, 10, 5);
    const xyz = ellipsoid.cartographicToCartesian([40, 50, 3]);
    const geo = {
      get x() {
        return x;
      },
      set x(value: number) {
        x = value;
        ellipsoid.cartographicToCartesian([-20, -30, 1]);
      },
      y: 0,
      z: 0
    };
    ellipsoid.cartographicToCartesian([40, 50, 3], geo as unknown as number[]);
    close([geo.x, geo.y, geo.z], xyz, 0);
    const inverse = {
      get x() {
        return x;
      },
      set x(value: number) {
        x = value;
        inverseKernel({x: 0, y: 0, z: 20}, geometry, expected);
      },
      y: 0,
      z: 0
    };
    expect(inverseKernel({x: xyz[0], y: xyz[1], z: xyz[2]}, geometry, inverse)).toBe(true);
    close(
      [inverse.x, inverse.y, inverse.z],
      [(40 * Math.PI) / 180, (50 * Math.PI) / 180, 3],
      1e-11
    );
  }));

for (const ArrayType of [Float32Array, Float64Array]) {
  test('flattened exterior inverse flat views/tails/M: ' + ArrayType.name, () => {
    const engine = geometry(10, 0.1);
    const sources = [
      [3, 4, 5, 42],
      [-3, 4, -5, NaN]
    ];
    const buffer = new ArrayType([999, ...sources.flat(), 888]);
    const view = buffer.subarray(1, 9);
    const expected = sources.flatMap(xyz => engine.unproject(Array.from(new ArrayType(xyz))));
    expect(engine.unprojectFlat(view, 4)).toBe(view);
    expect(Array.from(view)).toEqual(Array.from(new ArrayType(expected)));
    expect(buffer[0]).toBe(999);
    expect(buffer[9]).toBe(888);
    expect(view[3]).toBe(42);
    expect(Number.isNaN(view[7])).toBe(true);
  });
}

// These shallow/interior offsets remain well outside the oblate evolute and have
// an authored geodetic-normal representation. Geometry retains its legacy kernel.
test('ordinary oblate interior offsets qualify independently on both paths', () =>
  inDegrees(() => {
    const a = 6378137,
      b = 6356752.314245179;
    const ellipsoid = new Ellipsoid(a, a, b),
      engine = geometry(a, b);
    for (const height of [-1, -1000, -a * 0.25, -a * 0.5]) {
      const {xyz, llh} = anchor(a, b, -0.36, 0.48, -0.8, height);
      for (const inverse of [engine.unproject(xyz), ellipsoid.cartesianToCartographic(xyz)]) {
        expect(Math.abs(inverse[0] - llh[0])).toBeLessThan(1e-9);
        expect(Math.abs(inverse[1] - llh[1])).toBeLessThan(1e-9);
        expect(Math.abs(inverse[2] - llh[2])).toBeLessThan(1e-5);
      }
      close(ellipsoid.cartographicToCartesian(llh), xyz, 1e-5);
    }
  }));
