// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original independent cartographic factors and domain contract tests.
import {expect, test} from 'vitest';
import {
  ProjectionAnalysis,
  createProjectionFactors,
  createProjectionHessian,
  createProjectionJacobian
} from '@math.gl/projection/analysis';
import type {
  ProjectionFactors,
  ProjectionHessian,
  ProjectionJacobian
} from '@math.gl/projection/analysis';
import {normalizeCRS} from '@math.gl/projection/core';
import * as catalogue from '@math.gl/projection/experimental';
import {mercator} from '@math.gl/projection/projections/merc';
import reference from '../fixtures/factors-reference.json';
const rad = Math.PI / 180;
const domain = {west: -Math.PI, east: Math.PI, south: -80 * rad, north: 80 * rad};
function analysis(definition: string, bounds = domain, hessianStep?: number) {
  const crs = normalizeCRS(definition);
  const plugin = Object.values(catalogue).find(
    value => typeof value === 'object' && value && 'name' in value && value.name === crs.projection
  ) as catalogue.ProjectionPlugin;
  return new ProjectionAnalysis({
    projection: plugin,
    context: {...crs.ellipsoid, parameters: crs.parameters},
    domain: bounds,
    hessianStep
  });
}
for (const row of reference.cases) {
  test('independent PROJ factors and derivatives: ' + row.definition, () => {
    const projection = analysis(row.definition);
    const result = createProjectionFactors();
    for (const fixture of row.results) {
      expect(projection.factors(fixture.input[0] * rad, fixture.input[1] * rad, result)).toBe(true);
      for (const key of Object.keys(fixture.factors) as (keyof ProjectionFactors)[]) {
        const expected = fixture.factors[key];
        const tolerance =
          key.startsWith('dxD') || key.startsWith('dyD')
            ? 0.2
            : 2e-7 * Math.max(1, Math.abs(expected));
        expect(Math.abs(result[key] - expected), `${key} at ${fixture.input}`).toBeLessThanOrEqual(
          tolerance
        );
      }
    }
  });
}
test('analytic spherical Mercator scales, Jacobian and convergence', () => {
  const a = 10;
  const projection = analysis('+proj=merc +R=10');
  const factors = createProjectionFactors();
  const jacobian = createProjectionJacobian();
  for (const latitude of [-1, -0.5, 0, 0.5, 1]) {
    expect(projection.factors(0.2, latitude, factors)).toBe(true);
    expect(projection.jacobian(0.2, latitude, jacobian)).toBe(true);
    const scale = 1 / Math.cos(latitude);
    for (const key of ['meridionalScale', 'parallelScale', 'maximumScale', 'minimumScale'] as const)
      expect(Math.abs(factors[key] - scale)).toBeLessThan(2e-11);
    expect(Math.abs(factors.arealScale - scale * scale)).toBeLessThan(5e-11);
    expect(Math.abs(jacobian.dxDLongitude - a)).toBeLessThan(1e-10);
    expect(Math.abs(jacobian.dyDLatitude - a * scale)).toBeLessThan(2e-10);
    expect(Math.abs(factors.meridianConvergence)).toBeLessThan(1e-10);
    expect(Math.abs(factors.angularDistortion)).toBeLessThan(1e-10);
  }
});
test('closed domain applies to both directions; boundary derivatives fail atomically', () => {
  const bounds = {west: -1, east: 1, south: -0.5, north: 0.5};
  const projection = analysis('+proj=merc +R=10', bounds);
  bounds.west = -2; // Captured domain does not follow application mutations.
  const output = {x: 7, y: 8, z: 99};
  expect(projection.projectTo(1, 0, output)).toBe(true);
  expect(output).toEqual({x: 10, y: 0, z: 99});
  expect(projection.unprojectTo(10, 0, output)).toBe(true);
  expect(output).toEqual({x: 1, y: 0, z: 99});
  const snapshot = {...output};
  for (const point of [
    [1.1, 0],
    [-1.1, 0],
    [0, 0.6],
    [NaN, 0]
  ]) {
    expect(projection.projectTo(point[0], point[1], output)).toBe(false);
    expect(output).toEqual(snapshot);
  }
  expect(projection.unprojectTo(11, 0, output)).toBe(false);
  expect(output).toEqual(snapshot);
  const result = createProjectionFactors();
  const original = {...result};
  expect(projection.factors(1, 0, result)).toBe(false);
  expect(result).toEqual(original);
  expect(projection.factors(0, 0, result)).toBe(true);
});
test('poles, wrap seams, invalid geometry and unsupported hook interfaces fail observably', () => {
  const projection = analysis('+proj=merc +R=10 +lon_0=10');
  const result = createProjectionFactors(),
    snapshot = {...result};
  expect(projection.factors(-170 * rad, 0, result)).toBe(false);
  expect(projection.factors(0, Math.PI / 2, result)).toBe(false);
  expect(result).toEqual(snapshot);
  const context = {semiMajorAxis: 10, eccentricitySquared: 0, parameters: {}};
  for (const step of [0, NaN, Infinity, -1])
    expect(() => new ProjectionAnalysis({projection: mercator, context, domain, step})).toThrow();
  expect(
    () =>
      new ProjectionAnalysis({
        projection: mercator,
        context: {...context, eccentricitySquared: 1},
        domain
      })
  ).toThrow();
  expect(
    () =>
      new ProjectionAnalysis({
        projection: {...mercator, create: () => ({forward: () => [0, 0], inverse: () => [0, 0]})},
        context,
        domain
      })
  ).toThrow(/mutable/);
});
test('plugin reentry is rejected and output setters can reenter without corrupting snapshots', () => {
  let projection: ProjectionAnalysis;
  const nested = createProjectionFactors();
  const plugin = {
    ...mercator,
    create: (context: catalogue.ProjectionContext) => {
      const implementation = mercator.create(context);
      return {
        ...implementation,
        forwardInPlace: (point: catalogue.ProjectionPoint) => {
          expect(projection.factors(0, 0, nested)).toBe(false);
          implementation.forwardInPlace!(point);
        }
      };
    }
  };
  projection = new ProjectionAnalysis({
    projection: plugin,
    context: {semiMajorAxis: 10, eccentricitySquared: 0, parameters: {}},
    domain
  });
  const result = createProjectionFactors();
  expect(projection.factors(0, 0.5, result)).toBe(true);
  let writes = 0;
  const expected = {...result};
  const target = createProjectionFactors();
  Object.defineProperty(target, 'dxDLongitude', {
    set(value: number) {
      writes++;
      expect(projection.factors(0, -0.5, nested)).toBe(true);
      expect(value).toBe(expected.dxDLongitude);
    }
  });
  expect(projection.factors(0, 0.5, target)).toBe(true);
  expect(writes).toBe(1);
  for (const key of Object.keys(expected) as (keyof ProjectionFactors)[])
    if (key !== 'dxDLongitude') expect(target[key]).toBe(expected[key]);
});

const HESSIAN_KEYS = [
  'd2xDLongitude2',
  'd2xDLongitudeDLatitude',
  'd2xDLatitude2',
  'd2yDLongitude2',
  'd2yDLongitudeDLatitude',
  'd2yDLatitude2'
] as const;
/**
 * Worst-case binary64 rounding contribution to a Richardson-extrapolated second difference.
 * Each sample carries up to `ulps` relative error of the largest coordinate magnitude. The
 * fourth-order stencil's absolute weights sum to 64/12 (pure) or 18 * 18 / 144 (mixed), the
 * half-step estimate divides by (step / 2)^2 and extrapolation weights it by 16/15 (plus 1/15
 * of the full-step estimate). Truncation after extrapolation is O(step^6) and negligible here.
 */
function hessianRoundingBound(magnitude: number, step = 1e-3, ulps = 4): number {
  const sample = ulps * Number.EPSILON * magnitude;
  return (sample * (64 / 12) * (16 * 4 + 1)) / 15 / (step * step);
}
function expectHessian(
  actual: ProjectionHessian,
  expected: Partial<ProjectionHessian>,
  tolerance: number,
  label: string
) {
  for (const key of HESSIAN_KEYS) {
    const error = Math.abs(actual[key] - (expected[key] ?? 0));
    expect(error, `${key} at ${label}`).toBeLessThanOrEqual(tolerance);
  }
}
test('analytic spherical Web Mercator Hessian', () => {
  const R = 6378137;
  const projection = analysis('+proj=merc +a=6378137 +b=6378137');
  const hessian = createProjectionHessian();
  // Largest |y| sampled: the stencil reaches latitude 1.2 + 2e-3 radians.
  const tolerance = hessianRoundingBound(R * Math.log(Math.tan(Math.PI / 4 + 0.601)));
  for (const longitude of [-2, 0, 0.3])
    for (const latitude of [-1.2, -0.5, 0, 0.5, 1.2]) {
      expect(projection.hessian(longitude, latitude, hessian)).toBe(true);
      const curvature = (R * Math.sin(latitude)) / Math.cos(latitude) ** 2;
      expectHessian(hessian, {d2yDLatitude2: curvature}, tolerance, `${longitude},${latitude}`);
    }
});
test('equirectangular Hessian is zero', () => {
  const R = 6371000;
  const projection = analysis('+proj=eqc +R=6371000 +lat_ts=30 +x_0=500000 +y_0=1000000');
  const hessian = createProjectionHessian();
  const tolerance = hessianRoundingBound(500000 + R * Math.PI);
  for (const longitude of [-3, 0, 1.5])
    for (const latitude of [-1.3, 0, 0.7]) {
      expect(projection.hessian(longitude, latitude, hessian)).toBe(true);
      expectHessian(hessian, {}, tolerance, `${longitude},${latitude}`);
    }
});
test('analytic spherical sinusoidal Hessian, including the mixed term', () => {
  const R = 6371000;
  const longitudeOrigin = 10 * rad;
  const projection = analysis('+proj=sinu +R=6371000 +lon_0=10');
  const hessian = createProjectionHessian();
  const tolerance = hessianRoundingBound(R * Math.PI);
  for (const longitude of [-2, 0.1, 2.5])
    for (const latitude of [-1.2, -0.4, 0, 0.9]) {
      expect(projection.hessian(longitude, latitude, hessian)).toBe(true);
      const dLongitude = longitude - longitudeOrigin;
      expectHessian(
        hessian,
        {
          d2xDLongitudeDLatitude: -R * Math.sin(latitude),
          d2xDLatitude2: -R * dLongitude * Math.cos(latitude)
        },
        tolerance,
        `${longitude},${latitude}`
      );
    }
});
/**
 * Second derivatives from a fourth-order central difference of `jacobian()` at +/-delta,
 * +/-2 delta. The mixed term is checked in both orders (d/dLatitude of dx/dLongitude and
 * d/dLongitude of dx/dLatitude).
 */
function jacobianDerivatives(
  projection: ProjectionAnalysis,
  longitude: number,
  latitude: number,
  delta: number
) {
  const offsets = [-2, -1, 1, 2],
    weights = [1, -8, 8, -1];
  const jacobian = createProjectionJacobian();
  const along = (axis: 0 | 1, key: keyof ProjectionJacobian): number => {
    let sum = 0;
    for (let i = 0; i < 4; i++) {
      const lon = longitude + (axis === 0 ? offsets[i] * delta : 0);
      const lat = latitude + (axis === 1 ? offsets[i] * delta : 0);
      expect(projection.jacobian(lon, lat, jacobian)).toBe(true);
      sum += weights[i] * jacobian[key];
    }
    return sum / (12 * delta);
  };
  return {
    d2xDLongitude2: along(0, 'dxDLongitude'),
    d2xDLongitudeDLatitude: along(1, 'dxDLongitude'),
    d2xDLatitudeDLongitude: along(0, 'dxDLatitude'),
    d2xDLatitude2: along(1, 'dxDLatitude'),
    d2yDLongitude2: along(0, 'dyDLongitude'),
    d2yDLongitudeDLatitude: along(1, 'dyDLongitude'),
    d2yDLatitudeDLongitude: along(0, 'dyDLatitude'),
    d2yDLatitude2: along(1, 'dyDLatitude')
  };
}
for (const {definition, bounds, points} of [
  {
    // Conformal; zone 18 central meridian -75 degrees.
    definition: '+proj=utm +zone=18 +datum=WGS84',
    bounds: {west: -82 * rad, east: -68 * rad, south: 0, north: 70 * rad},
    points: [
      [-75, 0.5],
      [-78, 25],
      [-72, 41],
      [-80.5, 60],
      [-69.5, 10]
    ]
  },
  {
    // Conformal, southern hemisphere: 10,000 km false northing stresses rounding.
    definition: '+proj=utm +zone=18 +south +datum=WGS84',
    bounds: {west: -82 * rad, east: -68 * rad, south: -70 * rad, north: 0},
    points: [
      [-76, -5],
      [-70, -45]
    ]
  },
  {
    // Non-conformal (equal-area), conterminous United States parameters.
    definition: '+proj=aea +lat_0=23 +lon_0=-96 +lat_1=29.5 +lat_2=45.5 +x_0=0 +y_0=0 +ellps=GRS80',
    bounds: {west: -130 * rad, east: -60 * rad, south: 20 * rad, north: 55 * rad},
    points: [
      [-96, 23],
      [-120, 47],
      [-70, 30],
      [-85, 52]
    ]
  },
  {
    // Non-conformal, ellipsoidal meridian arc.
    definition: '+proj=sinu +ellps=WGS84',
    bounds: domain,
    points: [
      [0, 0],
      [-150, 60],
      [100, -35],
      [45, 75]
    ]
  }
]) {
  test('Hessian is the derivative of jacobian(): ' + definition, () => {
    const projection = analysis(definition, bounds);
    const hessian = createProjectionHessian();
    // jacobian() rounding: 4 ulps of a 1e7 m coordinate through its stencil (|weights| 18/12)
    // at step/2 = 5e-5 with Richardson weights (16 * 2 + 1) / 15. Differencing that again at
    // delta = 2e-3 multiplies by 18/12/delta. The Hessian's own rounding bound is added, and
    // O(delta^4) truncation of the outer stencil (< 1e-12 a) is negligible.
    const delta = 2e-3;
    const jacobianError = (4 * Number.EPSILON * 1e7 * (18 / 12) * (16 * 2 + 1)) / 15 / 5e-5;
    const tolerance = (jacobianError * (18 / 12)) / delta + hessianRoundingBound(1e7);
    for (const [longitude, latitude] of points) {
      expect(projection.hessian(longitude * rad, latitude * rad, hessian)).toBe(true);
      const reference = jacobianDerivatives(projection, longitude * rad, latitude * rad, delta);
      expectHessian(hessian, reference, tolerance, `${longitude},${latitude}`);
      expect(
        Math.abs(hessian.d2xDLongitudeDLatitude - reference.d2xDLatitudeDLongitude)
      ).toBeLessThanOrEqual(tolerance);
      expect(
        Math.abs(hessian.d2yDLongitudeDLatitude - reference.d2yDLatitudeDLongitude)
      ).toBeLessThanOrEqual(tolerance);
    }
  });
}
test('Hessian domain, pole and option failures leave outputs untouched', () => {
  const bounds = {west: -1, east: 1, south: -0.5, north: 0.5};
  const projection = analysis('+proj=merc +R=10', bounds);
  const result = createProjectionHessian();
  const snapshot = {...result};
  // Default Hessian step is 1e-3 and its stencil spans +/-2e-3.
  for (const point of [
    [1, 0],
    [1 - 1.5e-3, 0],
    [0, -0.5 + 1e-3],
    [NaN, 0]
  ]) {
    expect(projection.hessian(point[0], point[1], result)).toBe(false);
    expect(result).toEqual(snapshot);
  }
  expect(projection.hessian(1 - 2e-3, 0, result)).toBe(true);
  // The outermost latitude sample lands on the pole, where Mercator is singular.
  const pole = analysis('+proj=merc +R=10', {...domain, north: Math.PI / 2});
  const written = {...result};
  expect(pole.hessian(0, Math.PI / 2 - 2e-3, result)).toBe(false);
  expect(result).toEqual(written);
  const context = {semiMajorAxis: 10, eccentricitySquared: 0, parameters: {}};
  for (const hessianStep of [0, NaN, Infinity, -1, 0.1])
    expect(
      () => new ProjectionAnalysis({projection: mercator, context, domain, hessianStep})
    ).toThrow();
});
test('Hessian step is independent of the Jacobian step', () => {
  const coarse = analysis('+proj=merc +R=10', domain, 1e-2);
  const result = createProjectionHessian();
  const bounds = {west: -1, east: 1, south: -0.5, north: 0.5};
  // A 1e-2 stencil spans +/-2e-2: rejected 1.5e-2 inside the edge, where 1e-3 succeeds.
  expect(analysis('+proj=merc +R=10', bounds, 1e-2).hessian(1 - 1.5e-2, 0, result)).toBe(false);
  expect(analysis('+proj=merc +R=10', bounds).hessian(1 - 1.5e-2, 0, result)).toBe(true);
  // Without extrapolation, the fourth-order stencil's step^4 truncation at 1e-2 is ~1e-7 here;
  // after it, the O(step^6) remainder is ~1e-10 for these unit-scale (R = 10) maps.
  expect(coarse.hessian(0.2, 0.6, result)).toBe(true);
  const mercatorCurvature = (10 * Math.sin(0.6)) / Math.cos(0.6) ** 2;
  expectHessian(result, {d2yDLatitude2: mercatorCurvature}, 1e-9, 'coarse Mercator');
  const sinusoidal = analysis('+proj=sinu +R=10', domain, 1e-2);
  expect(sinusoidal.hessian(0.7, 0.6, result)).toBe(true);
  expectHessian(
    result,
    {d2xDLongitudeDLatitude: -10 * Math.sin(0.6), d2xDLatitude2: -7 * Math.cos(0.6)},
    1e-9,
    'coarse sinusoidal'
  );
});
test('Hessian rejects stencils whose step and half-step estimates disagree', () => {
  // x = 10 |longitude| has a kink at 0: the second-difference estimates grow as 1/step.
  const plugin = {
    ...mercator,
    create: (context: catalogue.ProjectionContext) => {
      const implementation = mercator.create(context);
      return {
        ...implementation,
        forwardInPlace: (point: catalogue.ProjectionPoint) => {
          const longitude = point.x;
          implementation.forwardInPlace!(point);
          point.x = 10 * Math.abs(longitude);
        }
      };
    }
  };
  const projection = new ProjectionAnalysis({
    projection: plugin,
    context: {semiMajorAxis: 10, eccentricitySquared: 0, parameters: {}},
    domain
  });
  const result = createProjectionHessian();
  const snapshot = {...result};
  expect(projection.hessian(0, 0.3, result)).toBe(false);
  expect(result).toEqual(snapshot);
  expect(projection.hessian(0.1, 0.3, result)).toBe(true);
  expect(Math.abs(result.d2xDLongitude2)).toBeLessThan(1e-6);
});
test('Hessian rejects plugin reentry and snapshots before output setters', () => {
  let projection: ProjectionAnalysis;
  const nested = createProjectionHessian();
  let reentered = 0;
  const plugin = {
    ...mercator,
    create: (context: catalogue.ProjectionContext) => {
      const implementation = mercator.create(context);
      return {
        ...implementation,
        forwardInPlace: (point: catalogue.ProjectionPoint) => {
          reentered++;
          expect(projection.hessian(0, 0, nested)).toBe(false);
          implementation.forwardInPlace!(point);
        }
      };
    }
  };
  projection = new ProjectionAnalysis({
    projection: plugin,
    context: {semiMajorAxis: 10, eccentricitySquared: 0, parameters: {}},
    domain
  });
  const result = createProjectionHessian();
  expect(projection.hessian(0, 0.5, result)).toBe(true);
  expect(reentered).toBe(52);
  const expected = {...result};
  let writes = 0;
  const target = createProjectionHessian();
  Object.defineProperty(target, 'd2xDLongitude2', {
    set(value: number) {
      writes++;
      expect(projection.hessian(0, -0.5, nested)).toBe(true);
      expect(value).toBe(expected.d2xDLongitude2);
    }
  });
  expect(projection.hessian(0, 0.5, target)).toBe(true);
  expect(writes).toBe(1);
  for (const key of HESSIAN_KEYS)
    if (key !== 'd2xDLongitude2') expect(target[key]).toBe(expected[key]);
});
