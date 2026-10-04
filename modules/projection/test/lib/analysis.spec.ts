// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original independent cartographic factors and domain contract tests.
import {expect, test} from 'vitest';
import {
  ProjectionAnalysis,
  createProjectionFactors,
  createProjectionJacobian
} from '@math.gl/projection/analysis';
import type {ProjectionFactors} from '@math.gl/projection/analysis';
import {normalizeCRS} from '@math.gl/projection/core';
import * as catalogue from '@math.gl/projection/experimental';
import {mercator} from '@math.gl/projection/projections/merc';
import reference from '../fixtures/factors-reference.json';
const rad = Math.PI / 180;
const domain = {west: -Math.PI, east: Math.PI, south: -80 * rad, north: 80 * rad};
function analysis(definition: string, bounds = domain) {
  const crs = normalizeCRS(definition);
  const plugin = Object.values(catalogue).find(
    value => typeof value === 'object' && value && 'name' in value && value.name === crs.projection
  ) as catalogue.ProjectionPlugin;
  return new ProjectionAnalysis({
    projection: plugin,
    context: {...crs.ellipsoid, parameters: crs.parameters},
    domain: bounds
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
