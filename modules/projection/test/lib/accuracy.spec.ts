// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Independent accuracy and regressions for the proj4js-inspired projection API.
import {expect, test} from 'vitest';
import {Projection} from '@math.gl/projection';
import {qualifyAccuracy} from '../accuracy-workload';

test('seeded PROJ domain budgets: scalar and Float64 XYZM forward, inverse and roundtrip', () => {
  const rows = qualifyAccuracy();
  expect(rows.length).toBe(15);
  expect(rows.reduce((count, row) => count + row.points, 0)).toBe(4005);
});

for (const latitude of [-90, -89.99, -89.95, 89.95, 89.99, 90]) {
  test(`cylindrical equal-area inverse preserves latitude ${latitude}`, () => {
    const projection = new Projection({to: '+proj=cea +lat_ts=30 +ellps=WGS84'});
    const point = [12, latitude];
    const projected = projection.project(point);
    expect(Math.abs(projection.unproject(projected)[1] - latitude)).toBeLessThan(2e-8);
    const packed = new Float64Array([...projected, 123, 7]);
    projection.unprojectFlat(packed, 4);
    expect(Math.abs(packed[1] - latitude)).toBeLessThan(2e-8);
    expect(Array.from(packed.subarray(2))).toEqual([123, 7]);
  });
}

test('cylindrical equal-area rejects northings outside either pole', () => {
  const projection = new Projection({to: '+proj=cea +lat_ts=30 +ellps=WGS84'});
  for (const latitude of [-90, 90]) {
    const pole = projection.project([0, latitude]);
    expect(() => projection.unproject([0, pole[1] + Math.sign(latitude) * 1])).toThrow();
  }
});
