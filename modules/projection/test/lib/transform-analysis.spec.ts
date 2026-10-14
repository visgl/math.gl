// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {createProjectionTransformAnalysis} from '@math.gl/projection/analysis/transform';
import {createProjectionJacobian, createProjectionFactors} from '@math.gl/projection/analysis';
import {ProjectionTransform} from '@math.gl/projection/core';
import {mercator} from '@math.gl/projection/projections/merc';

const domain = {west: -1, east: 1, south: -1, north: 1};
const projections = [mercator];

test('composed projected-source analysis recovers analytic Mercator derivatives', async () => {
  const analysis = await createProjectionTransformAnalysis({
    from: '+proj=merc +datum=WGS84 +units=ft',
    to: 'EPSG:3857',
    geographicFrom: 'EPSG:4326',
    projections,
    domain
  });
  const result = createProjectionJacobian();
  expect(analysis.jacobian(0.3, 0.5, result)).toBe(true);
  expect(result.dxDLongitude).toBeCloseTo(6378137, 2);
  expect(result.dyDLatitude).toBeCloseTo(6378137 / Math.cos(0.5), 2);
  expect(Math.abs(result.dxDLatitude)).toBeLessThan(0.01);
  expect(Math.abs(result.dyDLongitude)).toBeLessThan(0.01);
});

test('declared nondefault axes and target feet yield canonical physical derivatives', async () => {
  const analysis = await createProjectionTransformAnalysis({
    from: '+proj=longlat +datum=WGS84 +axis=neu',
    to: '+proj=merc +datum=WGS84 +units=ft +axis=wnu',
    projections,
    domain
  });
  const result = createProjectionJacobian();
  expect(analysis.jacobian(0.3, 0.5, result)).toBe(true);
  const es = 0.0066943799901413165;
  expect(result.dxDLongitude).toBeCloseTo(6378137, 2);
  expect(result.dyDLatitude).toBeCloseTo(
    (6378137 * (1 - es)) / ((1 - es * Math.sin(0.5) ** 2) * Math.cos(0.5)),
    2
  );
});

test('fixed anchor height participates in a height-dependent datum pipeline', async () => {
  const from = '+proj=longlat +ellps=intl +towgs84=120,-230,340,0.1,-0.2,0.3,2';
  const to = 'EPSG:3857';
  const transform = await ProjectionTransform.create({from, to, projections});
  const results = [];
  for (const height of [0, 100000]) {
    const analysis = await createProjectionTransformAnalysis({
      from,
      to,
      projections,
      domain,
      height
    });
    const result = createProjectionJacobian();
    expect(analysis.jacobian(0.3, 0.5, result)).toBe(true);
    const h = 1e-5;
    const plus = transform.projectSync([
      ((0.3 + h) * 180) / Math.PI,
      (0.5 * 180) / Math.PI,
      height
    ]);
    const minus = transform.projectSync([
      ((0.3 - h) * 180) / Math.PI,
      (0.5 * 180) / Math.PI,
      height
    ]);
    expect(Math.abs(result.dxDLongitude - (plus[0] - minus[0]) / (2 * h))).toBeLessThan(0.1);
    results.push(result.dxDLongitude);
  }
  expect(Math.abs(results[0] - results[1])).toBeGreaterThan(0.01);
});

test('construction and derivative failures reject or leave output untouched', async () => {
  await expect(
    createProjectionTransformAnalysis({from: 'EPSG:3857', to: 'EPSG:3857', projections, domain})
  ).rejects.toThrow('geographicFrom');
  await expect(createProjectionTransformAnalysis({to: 'EPSG:4326', domain})).rejects.toThrow(
    'planar'
  );
  await expect(
    createProjectionTransformAnalysis({to: 'EPSG:3857', projections, domain, height: NaN})
  ).rejects.toThrow('finite');
  await expect(
    createProjectionTransformAnalysis({
      to: 'EPSG:3857',
      projections,
      domain,
      groundEllipsoid: {semiMajorAxis: -1, eccentricitySquared: 0}
    })
  ).rejects.toThrow();
  const analysis = await createProjectionTransformAnalysis({to: 'EPSG:3857', projections, domain});
  const factors = createProjectionFactors();
  const original = {...factors};
  expect(analysis.factors(1, 0.5, factors)).toBe(false);
  expect(factors).toEqual(original);
  expect(analysis.factors(0.3, 0.5, factors)).toBe(true);
});
