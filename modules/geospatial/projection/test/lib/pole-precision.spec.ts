// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original independent high-precision pole accuracy tests.
import {expect, test} from 'vitest';
import {projectionEngine} from '@math.gl/geospatial/projection';
import reference from '../fixtures/pole-precision-reference.json';

for (const [index, row] of reference.cases.entries()) {
  test(`80-digit pole equations ${index}: ${row.definition} ${row.input}`, () => {
    const transform = projectionEngine.createProjection({
      from: '+proj=longlat +datum=none',
      to: row.definition
    });
    if (!('inverseOnly' in row)) {
      const actual = transform.project(row.input);
      expect(Math.abs(actual[0] - row.forward[0])).toBeLessThan(row.forwardTolerance);
      expect(Math.abs(actual[1] - row.forward[1])).toBeLessThan(row.forwardTolerance);
    }
    if ('inverse' in row) {
      const actual = transform.unproject(row.forward);
      expect(Math.abs(actual[1] - row.inverse![1])).toBeLessThan(row.inverseTolerance!);
      // Longitude is indeterminate at an exact collapsed pole. For near poles,
      // compare its physical horizontal contribution instead of its raw angle.
      const delta = Math.abs(((actual[0] - row.inverse![0] + 540) % 360) - 180);
      expect(delta * Math.abs(Math.cos((row.inverse![1] * Math.PI) / 180))).toBeLessThan(
        row.inverseTolerance!
      );
      const flat = new Float64Array([...row.forward, 123, 7]);
      transform.unprojectFlat(flat, 4);
      expect(flat[1]).toBe(actual[1]);
      expect([...flat.slice(2)]).toEqual([123, 7]);
    }
  });
}

for (const centre of [0, 90, 180, -90]) {
  test(`QSC equatorial face ${centre} preserves offsets near its centre`, () => {
    const transform = projectionEngine.createProjection({
      from: '+proj=longlat +datum=none',
      to: `+proj=qsc +lat_0=0 +lon_0=${centre} +ellps=WGS84`
    });
    const es = (1 / 298.257223563) * (2 - 1 / 298.257223563);
    for (const offset of [-0.000001, 0.000001]) {
      const angle = (offset * Math.PI) / 180;
      const x = (6378137 * Math.sin(angle / 2)) / Math.sin(Math.PI / 8);
      const beta = Math.atan2((1 - es) * Math.sin(angle), Math.cos(angle));
      const y = (6378137 * Math.sin(beta / 2)) / Math.sin(Math.PI / 8);
      for (const [point, expected] of [
        [
          [centre + offset, 0],
          [x, 0]
        ],
        [
          [centre, offset],
          [0, y]
        ]
      ]) {
        const projected = transform.project(point);
        expect(Math.abs(projected[0] - expected[0])).toBeLessThan(1e-7);
        expect(Math.abs(projected[1] - expected[1])).toBeLessThan(1e-7);
        const result = transform.unproject(projected);
        expect(Math.abs(result[1] - point[1])).toBeLessThan(1e-10);
        expect(Math.abs(((result[0] - point[0] + 540) % 360) - 180)).toBeLessThan(1e-10);
      }
    }
  });
}

test('Mollweide rejects projected points beyond its ellipse and retains nearby pole offsets', () => {
  const transform = projectionEngine.createProjection({to: '+proj=moll +R=6371000'});
  expect(() => transform.unproject([0, 1e8])).toThrow();
  expect(() => transform.unproject([1e8, 0])).toThrow();
  expect(() => transform.unproject([1, Math.SQRT2 * 6371000])).toThrow();
  const near = transform.project([30, 89.999999]);
  const pole = transform.project([30, 90]);
  expect(near[0]).toBeGreaterThan(0.1);
  expect(pole[0]).toBe(0);
  expect(pole[1]).toBe(Math.SQRT2 * 6371000);
});
