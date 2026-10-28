// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {getSunTerminator} from '../../src/sun/terminator';
import {getSunPosition} from '../../src/sun/suncalc';

const RAD = Math.PI / 180;
for (const date of [
  '2026-03-20T12:00Z',
  '2026-06-21T00:00Z',
  '2026-09-23T23:59Z',
  '2026-12-21T12:00Z',
  '2027-01-01T00:00Z'
]) {
  for (const altitude of [0, -6, -12, -18]) {
    test(`terminator ${date} at ${altitude}`, () => {
      const time = new Date(date);
      const result = getSunTerminator(time, {altitude});
      expect(result).toEqual(getSunTerminator(time.getTime(), {altitude}));
      expect(Math.hypot(...result.sunDirection)).toBeCloseTo(1, 14);
      const [x, y, z] = result.sunDirection;
      const lon = Math.atan2(y, x) / RAD;
      const lat = Math.asin(z) / RAD;
      expect(getSunPosition(time, lat, lon + 0.001).altitude / RAD).toBeGreaterThan(89.99);
      expect(getSunPosition(time, -lat, lon + 180.001).altitude / RAD).toBeLessThan(-89.99);
      for (const path of result.geometry.coordinates) {
        expect(path.length).toBeGreaterThanOrEqual(2);
        path.forEach(([longitude, latitude], i) => {
          expect(Math.abs(longitude)).toBeLessThanOrEqual(180);
          expect(Math.abs(latitude)).toBeLessThanOrEqual(90);
          expect(getSunPosition(time, latitude, longitude).altitude / RAD).toBeCloseTo(altitude, 8);
          if (i) expect(Math.abs(longitude - path[i - 1][0])).toBeLessThanOrEqual(180);
        });
      }
      // Adjacent split endpoints identify the same point on the sphere.
      const paths = result.geometry.coordinates;
      for (let i = 0; i < paths.length; i++) {
        const end = paths[i][paths[i].length - 1];
        const start = paths[(i + 1) % paths.length][0];
        const vector = ([lo, la]: number[]) => [
          Math.cos(lo * RAD) * Math.cos(la * RAD),
          Math.sin(lo * RAD) * Math.cos(la * RAD),
          Math.sin(la * RAD)
        ];
        vector(end).forEach((value, j) => {
          expect(value).toBeCloseTo(vector(start)[j], 8);
        });
      }
    });
  }
}

test('pole crossings at arbitrary sampling resolutions', () => {
  const time = Date.UTC(2026, 2, 1);
  const altitude = getSunPosition(time, 90, 0).altitude / RAD;
  for (const resolution of [8, 37, 360]) {
    const result = getSunTerminator(time, {altitude, resolution});
    expect(result.geometry.coordinates.flat().some(p => Math.abs(p[1] - 90) < 1e-8)).toBe(true);
    for (const path of result.geometry.coordinates) {
      path.forEach((p, i) => {
        expect(getSunPosition(time, p[1], p[0]).altitude / RAD).toBeCloseTo(altitude, 8);
        if (i) expect(Math.abs(p[0] - path[i - 1][0])).toBeLessThanOrEqual(180);
      });
    }
  }
});

test('invalid inputs', () => {
  for (const value of [NaN, Infinity, -Infinity, 9e15, new Date(NaN)])
    expect(() => getSunTerminator(value)).toThrow(RangeError);
  for (const altitude of [NaN, Infinity, -19, 1])
    expect(() => getSunTerminator(0, {altitude})).toThrow(RangeError);
  for (const resolution of [NaN, Infinity, 7, 8.5])
    expect(() => getSunTerminator(0, {resolution})).toThrow(RangeError);
});

test('equinoctial great circle and both polar tangencies', () => {
  // Find the zero-declination instant in the same lightweight solar model.
  let before = Date.UTC(2026, 2, 18);
  let after = Date.UTC(2026, 2, 23);
  for (let i = 0; i < 45; i++) {
    const middle = (before + after) / 2;
    if (getSunTerminator(middle).sunDirection[2] < 0) before = middle;
    else after = middle;
  }
  const equinox = getSunTerminator((before + after) / 2, {resolution: 37});
  expect(Math.abs(equinox.sunDirection[2])).toBeLessThan(1e-10);
  for (const pole of [-90, 90]) {
    expect(equinox.geometry.coordinates.flat().some(p => Math.abs(p[1] - pole) < 1e-8)).toBe(true);
  }
  for (const path of equinox.geometry.coordinates) {
    path.forEach((p, i) => {
      if (i) expect(Math.abs(p[0] - path[i - 1][0])).toBeLessThanOrEqual(180);
    });
  }
  const time = Date.UTC(2026, 8, 1);
  const altitude = getSunPosition(time, -90, 0).altitude / RAD;
  const south = getSunTerminator(time, {altitude, resolution: 37});
  expect(south.geometry.coordinates.flat().some(p => Math.abs(p[1] + 90) < 1e-8)).toBe(true);
});
