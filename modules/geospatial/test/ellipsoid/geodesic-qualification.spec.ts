// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original all-output qualification against independently compiled native PROJ 9.9.0, with analytic winding and contract checks.
import {expect, test} from 'vitest';
import {EllipsoidGeodesic, type GeodesicResult} from '../../src/ellipsoid-geodesic';
import reference from './geodesic-qualification.json';

function check(
  actual: GeodesicResult,
  expected: (typeof reference.cases)[number]['expected'],
  a: number
) {
  expect(Math.abs(actual.lat2 - expected.lat2), 'lat2').toBeLessThanOrEqual(2e-11);
  expect(Math.abs(actual.a12 - expected.a12), 'a12').toBeLessThanOrEqual(2e-11);
  const radians = Math.PI / 180;
  const angle = (a: number, b: number) => (((a - b + 540) % 360) - 180) * radians;
  // Longitude and bearing coordinates are ill-conditioned at poles and when
  // reduced length vanishes (coincident/antipodal sphere). Bound the physical
  // displacement instead of demanding meaningless scalar angle agreement.
  expect(
    Math.abs(angle(actual.lon2, expected.lon2) * Math.cos(expected.lat2 * radians)),
    'longitude displacement'
  ).toBeLessThanOrEqual(5e-14);
  for (const key of ['azi1', 'azi2'] as const) {
    expect(
      Math.abs(angle(actual[key], expected[key]) * expected.m12),
      key + ' transverse displacement'
    ).toBeLessThanOrEqual(5e-14 * a);
  }
  for (const key of ['s12', 'm12'] as const)
    expect(Math.abs(actual[key] - expected[key]), key).toBeLessThanOrEqual(5e-14 * a);
  for (const key of ['M12', 'M21'] as const)
    expect(Math.abs(actual[key] - expected[key]), key).toBeLessThanOrEqual(5e-14);
}

for (const [index, row] of reference.cases.entries()) {
  test(`PROJ 9.9 geodesic ${index}: ${row.mode}, axes ${row.axes}`, () => {
    const [a, b] = row.axes;
    const solver = new EllipsoidGeodesic({semiMajorAxis: a, semiMinorAxis: b});
    const [lat, lon, third, fourth] = row.input;
    const actual =
      row.mode === 'I'
        ? solver.inverse(lat, lon, third, fourth)
        : solver.direct(lat, lon, third, fourth);
    check(actual, row.expected, a);
    // Arc mode and reusable lines are independently checked against native
    // coordinates; inverse does not imply that direct is the shortest path.
    if (row.mode === 'D') {
      check(solver.line(lat, lon, third).position(fourth), row.expected, a);
      check(solver.arcDirect(lat, lon, third, row.expected.a12), row.expected, a);
    }
  });
}

test('unrolled longitude preserves signed multiple circuits and options are snapshotted', () => {
  const solver = new EllipsoidGeodesic({semiMajorAxis: 2, semiMinorAxis: 2});
  const options = {unrollLongitude: true};
  const line = solver.line(0, 170, 90, options);
  options.unrollLongitude = false;
  for (const turns of [-4, -1, 0, 1, 4]) {
    const result = line.position(turns * 4 * Math.PI);
    expect(Math.abs(result.lon2 - (170 + turns * 360))).toBeLessThan(1e-12);
    expect(Math.abs(result.lat2)).toBeLessThan(1e-12);
    expect(Math.abs(line.arcPosition(turns * 360).lon2 - result.lon2)).toBeLessThan(1e-12);
  }
  expect(solver.direct(0, 170, 90, 4 * Math.PI).lon2).toBe(170);
  expect(() => line.arcPosition(NaN)).toThrow('arc');
  for (const value of [NaN, Infinity, -1, 0]) {
    expect(() => new EllipsoidGeodesic({semiMajorAxis: value, semiMinorAxis: 1})).toThrow();
    expect(() => new EllipsoidGeodesic({semiMajorAxis: 1, semiMinorAxis: value})).toThrow();
  }
});
