// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original independent native PROJ and analytic sphere tests; no upstream test data copied.
import {expect, test} from 'vitest';
import {EllipsoidGeodesic} from '../../src/ellipsoid-geodesic';
import reference from './geodesic-reference.json';

test('shared ellipsoid geodesics match native PROJ including poles and antipodes', () => {
  for (const row of reference.cases) {
    const solver = new EllipsoidGeodesic(row.axes);
    const inverse = solver.inverse(row.start[0], row.start[1], row.end[0], row.end[1]);
    expect(Math.abs(inverse.s12 - row.distance)).toBeLessThan(1e-7);
    if (row.distance > 0) {
      expect(Math.abs(inverse.azi1 - row.azimuth)).toBeLessThan(1e-10);
    }
    const direct = solver.direct(row.start[0], row.start[1], row.azimuth, row.distance);
    expect(Math.abs(direct.lat2 - row.end[0])).toBeLessThan(1e-10);
    // Longitude is undefined at a pole and coincident antipodes can have multiple shortest paths.
    if (Math.abs(row.end[0]) < 90) {
      const delta = ((direct.lon2 - row.end[1] + 540) % 360) - 180;
      expect(Math.abs(delta)).toBeLessThan(1e-9);
    }
  }
});

test('geodesic reduced length and scale agree with the analytic sphere', () => {
  const solver = new EllipsoidGeodesic({semiMajorAxis: 2, semiMinorAxis: 2});
  const line = solver.line(30, 40, 25);
  for (const distance of [0, 0.1, 1, 3, 5]) {
    const point = line.position(distance);
    expect(Math.abs(point.m12 - 2 * Math.sin(distance / 2))).toBeLessThan(1e-14);
    expect(Math.abs(point.M12 - Math.cos(distance / 2))).toBeLessThan(1e-14);
    expect(Math.abs(point.M21 - point.M12)).toBeLessThan(1e-14);
  }
  expect(() => new EllipsoidGeodesic({semiMajorAxis: 1, semiMinorAxis: 0})).toThrow();
  expect(() => solver.inverse(91, 0, 0, 0)).toThrow();
  expect(() => line.position(Infinity)).toThrow();
});
