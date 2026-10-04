// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original analytic sphere/normal anchors and boundary qualification. No external model or conversion code is copied.
import {expect, test} from 'vitest';
import {config, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {ProjectionEngine} from '@math.gl/projection/core';
import {geocentric} from '@math.gl/projection/projections/geocent';

function sphere(radius: number) {
  const crs = `+R=${radius} +proj=`;
  return new ProjectionEngine({
    from: crs + 'longlat',
    to: crs + 'geocent',
    projections: [geocentric]
  });
}
function close(actual: ArrayLike<number>, expected: ArrayLike<number>, tolerance: number) {
  for (let i = 0; i < 3; i++)
    expect(Math.abs(actual[i] - expected[i])).toBeLessThanOrEqual(tolerance);
}
function degrees(callback: () => void) {
  const previous = config._cartographicRadians;
  config._cartographicRadians = false;
  try {
    callback();
  } finally {
    config._cartographicRadians = previous;
  }
}

test('analytic spherical inverse preserves near-center and near-axis directions', () => {
  for (const radius of [2, 6371000]) {
    const engine = sphere(radius);
    for (const scale of [1e-13, 1, radius, radius * 10]) {
      for (const [point, angles] of [
        [
          [scale, scale, 0],
          [45, 0]
        ],
        [
          [-scale, scale, 0],
          [135, 0]
        ],
        [
          [scale, 0, scale],
          [0, 45]
        ],
        [
          [scale, scale, -scale * Math.SQRT2],
          [45, -45]
        ],
        [
          [0, 0, scale],
          [0, 90]
        ],
        [
          [-0, -0, -scale],
          [0, -90]
        ]
      ]) {
        const expected = [...angles, Math.hypot(...point) - radius];
        close(engine.unproject(point), expected, 1e-12);
        for (const ArrayType of [Float32Array, Float64Array]) {
          const data = new ArrayType([...point, NaN]);
          const scalar = engine.unproject(Array.from(data));
          engine.unprojectFlat(data, 4);
          expect(Array.from(data)).toEqual(Array.from(new ArrayType(scalar)));
          expect(Number.isNaN(data[3])).toBe(true);
        }
      }
    }
  }
});

test('analytic spherical inverse rejects center and overflowing radius before output commit', () => {
  const engine = sphere(2),
    output = [7, 8, 9, 10];
  for (const point of [
    [0, 0, 0, 4],
    [1.2e308, 1.2e308, 1.2e308, 4]
  ]) {
    expect(() => engine.unprojectTo(point, output)).toThrow(/center|radius/);
    expect(output).toEqual([7, 8, 9, 10]);
  }
  const points = new Float64Array([2, 0, 0, 99, 1.2e308, 1.2e308, 1.2e308, 88]);
  expect(() => engine.unprojectFlat(points, 4)).toThrow(/radius/);
  expect(Array.from(points)).toEqual([0, 0, 0, 99, 1.2e308, 1.2e308, 1.2e308, 88]);
});

test('surface normals independently qualify flattened, prolate and triaxial ellipsoids', () =>
  degrees(() => {
    for (const radii of [
      [10, 10, 5],
      [10, 10, 15],
      [10, 12, 15]
    ]) {
      const ellipsoid = new Ellipsoid(...(radii as [number, number, number]));
      // Pythagorean normal with longitude zero: the support point is r_i² n_i / sqrt(sum(r_i² n_i²)).
      const normal = [0.6, 0, 0.8];
      const gamma = Math.hypot(radii[0] * normal[0], radii[2] * normal[2]);
      for (const height of [-0.1, 0, 5]) {
        const point = [
          (radii[0] ** 2 * normal[0]) / gamma + height * normal[0],
          0,
          (radii[2] ** 2 * normal[2]) / gamma + height * normal[2]
        ];
        const expected = [0, (Math.atan2(4, 3) * 180) / Math.PI, height];
        close(ellipsoid.cartesianToCartographic(point), expected, 1e-9);
        close(ellipsoid.cartographicToCartesian(expected), point, 1e-12);
      }
    }
  }));

test('bounded surface inverse leaves outputs untouched for unrepresentable inputs and recovers', () =>
  degrees(() => {
    const ellipsoid = Ellipsoid.WGS84;
    for (const point of [
      [0, 0, 0],
      [NaN, 1, 2],
      [Infinity, 1, 2],
      [1e200, 1, 2]
    ]) {
      for (const result of [[7, 8, 9], new Vector3(7, 8, 9)]) {
        expect(ellipsoid.scaleToGeodeticSurface(point, result)).toBeUndefined();
        expect(Array.from(result)).toEqual([7, 8, 9]);
        expect(ellipsoid.cartesianToCartographic(point, result)).toBeUndefined();
        expect(Array.from(result)).toEqual([7, 8, 9]);
      }
      const xyz = ellipsoid.cartographicToCartesian([45, 89.999999, 100]);
      close(ellipsoid.cartesianToCartographic(xyz), [45, 89.999999, 100], 1e-8);
    }
  }));

test('surface radial fallback remains separate from safeguarded cartographic inversion', () =>
  degrees(() => {
    const ellipsoid = Ellipsoid.fromSpheroid({semiMajorAxis: 10, semiMinorAxis: 5});
    const source = [0.1, 0.2, 0.3];
    const factor = 1 / Math.hypot(source[0] / 10, source[1] / 10, source[2] / 5);
    const expected = source.map(value => value * factor);
    const result = source.slice();
    expect(ellipsoid.scaleToGeodeticSurface(result, result)).toBe(result);
    close(result, expected, 1e-14);
    // The retained radial approximation is not the normal footpoint for deep interior points.
    const llh = ellipsoid.cartesianToCartographic(source);
    const roundtrip = ellipsoid.cartographicToCartesian(llh);
    close(roundtrip, source, 1e-12);
  }));

test('numeric cartographic and surface commits survive recursive output setters', () =>
  degrees(() => {
    const ellipsoid = Ellipsoid.WGS84;
    const input = ellipsoid.cartographicToCartesian([123, 89.999999, 1234]);
    const expected = ellipsoid.cartesianToCartographic(input);
    let longitude = 0;
    const result = {
      get longitude() {
        return longitude;
      },
      set longitude(value: number) {
        longitude = value;
        ellipsoid.cartesianToCartographic(ellipsoid.cartographicToCartesian([-17, -45, -100]));
      },
      latitude: 0,
      height: 0
    };
    expect(ellipsoid.cartesianToCartographic(input, result as unknown as number[])).toBe(result);
    close([result.longitude, result.latitude, result.height], expected, 0);
    const expectedSurface = ellipsoid.scaleToGeodeticSurface(input);
    let x = 0;
    const surface = {
      get x() {
        return x;
      },
      set x(value: number) {
        x = value;
        ellipsoid.scaleToGeodeticSurface([7000000, 8000000, 9000000]);
      },
      y: 0,
      z: 0
    };
    expect(ellipsoid.scaleToGeodeticSurface(input, surface as unknown as number[])).toBe(surface);
    close([surface.x, surface.y, surface.z], expectedSurface, 0);
  }));

test('deep-interior singular Newton updates leave outputs untouched', () => {
  const ellipsoid = new Ellipsoid(1, 1, 0.5);
  // Authored interior coordinate outside the radial-fallback region; Newton
  // reaches a singular update rather than a supported normal footpoint.
  const point = [0.7343026178423315, 0, 0.037234249800657836];
  const result = [7, 8, 9];
  expect(ellipsoid.scaleToGeodeticSurface(point, result)).toBeUndefined();
  expect(result).toEqual([7, 8, 9]);
  // The independent nearest-normal solve succeeds where legacy surface Newton fails.
  expect(ellipsoid.cartesianToCartographic(point, result)).toBe(result);
  close(ellipsoid.cartographicToCartesian(result), point, 1e-12);
  expect(ellipsoid.scaleToGeodeticSurface([2, 0, 0], result)).toBe(result);
  close(result, [1, 0, 0], 1e-14);
});
