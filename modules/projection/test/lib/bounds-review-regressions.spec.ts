// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {projectionEngine} from '@math.gl/projection';
import {projectedJSON} from '../fixtures/crs-datums';

const cases = [
  {
    name: 'Krovak regional interval division',
    definition: '+proj=krovak +ellps=bessel',
    coverage: [14.409951699199155, 46.13317811163142, 15.540994721231982, 48.961649623233825],
    input: [15.101447747491434, 46.15607736217888]
  },
  {
    name: 'Transverse Mercator backside equator',
    definition: '+proj=tmerc +R=6371000 +approx',
    coverage: [100, -60, 150, 30],
    input: [120, -1]
  },
  {
    name: 'Gauss-Schreiber one-sided branch limit',
    definition: '+proj=gstmerc +R=6371000',
    coverage: [80, 30, 100, 60],
    input: [91, 40]
  },
  {
    name: 'Cassini backside northing',
    definition: '+proj=cass +R=6371000',
    coverage: [-110, -50, 100, 15],
    input: [-100, 10]
  },
  {
    name: 'NZMG normalized longitude branch',
    definition: '+proj=nzmg +ellps=intl +lon_0=173 +lat_0=-41 +x_0=2510000 +y_0=6023150',
    coverage: [-10, -42, 0, -40],
    input: [-10, -41]
  }
];
for (const c of cases)
  test(c.name, async () => {
    const projection = await projectionEngine.createProjectionAsync({
      to: c.definition
    });
    const profile = projection.getTargetRenderingProfile(
      c.coverage as [number, number, number, number]
    )!;
    const point = {x: c.input[0], y: c.input[1], z: 0};
    profile.normalize!(point);
    const output = projection.project([point.x, point.y]);
    for (let axis = 0; axis < 2; axis++) {
      expect(output[axis]).toBeGreaterThanOrEqual(profile.bounds[0][axis] - 0.001);
      expect(output[axis]).toBeLessThanOrEqual(profile.bounds[1][axis] + 0.001);
    }
  });
test.each(['ortho', 'gnom', 'stere'])('%s normalization is idempotent', async name => {
  const projection = await projectionEngine.createProjectionAsync({
    to: '+proj=' + name + ' +R=6371000'
  });
  const profile = projection.getTargetRenderingProfile([10, -50, -30, 70])!;
  const point = {x: 180, y: -60, z: 0};
  profile.normalize!(point);
  const again = {...point};
  profile.normalize!(again);
  expect(again.x).toBeCloseTo(point.x, 10);
  expect(again.y).toBeCloseTo(point.y, 10);
});

test('transverse fallback retains declared metadata and leaves conversion unrestricted', async () => {
  const crs = await projectionEngine.getCRS({
    ...projectedJSON,
    conversion: {
      name: 'Regional transverse Mercator',
      method: {name: 'Transverse Mercator'},
      parameters: []
    },
    bbox: {
      west_longitude: 10,
      south_latitude: -10,
      east_longitude: 120,
      north_latitude: 10
    }
  });
  expect(crs.areaOfUse).toEqual([10, -10, 120, 10]);
  const normalized = crs.converter.WGS84.normalize([120, -1, 123]);
  expect(normalized[0]).toBeCloseTo(30, 10);
  expect(normalized.slice(1)).toEqual([-1, 123]);
  expect(crs.converter.WGS84.from([120, -1]).every(Number.isFinite)).toBe(true);
  const converted = crs.converter.WGS84.from(normalized);
  for (let axis = 0; axis < 2; axis++) {
    expect(converted[axis]).toBeGreaterThanOrEqual(crs.renderingBounds[0][axis] - 0.001);
    expect(converted[axis]).toBeLessThanOrEqual(crs.renderingBounds[1][axis] + 0.001);
  }
});

test.each(['', ' +czech'])(
  'Krovak bounds enclose a regional grid with either axis sign%s',
  async flags => {
    const projection = await projectionEngine.createProjectionAsync({
      to: '+proj=krovak +ellps=bessel' + flags
    });
    const coverage = [14.4, 46.1, 15.6, 49] as const;
    const profile = projection.getTargetRenderingProfile(coverage)!;
    for (let x = 14.4; x <= 15.6; x += 0.1) {
      for (let y = 46.1; y <= 49; y += 0.1) {
        const projected = projection.project([x, y]);
        for (let axis = 0; axis < 2; axis++) {
          expect(projected[axis]).toBeGreaterThanOrEqual(profile.bounds[0][axis] - 0.001);
          expect(projected[axis]).toBeLessThanOrEqual(profile.bounds[1][axis] + 0.001);
        }
      }
    }
  }
);
