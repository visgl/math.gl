// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {getStarfieldRotation} from '../src';

const transform = (m: number[], v: number[]): number[] =>
  [0, 1, 2].map(row => m[row] * v[0] + m[row + 3] * v[1] + m[row + 6] * v[2]);
const transpose = (m: number[]): number[] => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
const expectVector = (actual: number[], expected: number[], digits = 10): void => {
  for (let i = 0; i < 3; i++) expect(actual[i]).toBeCloseTo(expected[i], digits);
};
const epoch = new Date('2000-01-01T12:00:00Z');

test('starfield: USNO J2000 Greenwich sidereal angle and known axis directions', () => {
  const angle = (18.6973748283 * Math.PI) / 12;
  const matrix = getStarfieldRotation(epoch, 0, 0);
  expectVector(transform(matrix, [Math.cos(angle), Math.sin(angle), 0]), [0, 0, 1], 6);
  expectVector(
    transform(matrix, [Math.cos(angle + Math.PI / 2), Math.sin(angle + Math.PI / 2), 0]),
    [1, 0, 0],
    6
  );
  expectVector(transform(matrix, [0, 0, 1]), [0, 1, 0]);
  expect(getStarfieldRotation(epoch.getTime(), 0, 0)).toEqual(matrix);
  const ofDate = getStarfieldRotation(epoch, 0, 0, {epoch: 'date'});
  for (let i = 0; i < 9; i++) expect(ofDate[i]).toBeCloseTo(matrix[i], 12);
});

test('starfield: pole elevation and proper rotations at poles and wrapped longitudes', () => {
  for (const latitude of [-90, -45, 0, 45, 90]) {
    const angle = (latitude * Math.PI) / 180;
    for (const longitude of [-180, 0, 180, 540]) {
      const matrix = getStarfieldRotation(new Date('2026-10-04T00:00:00Z'), latitude, longitude, {
        epoch: 'date'
      });
      expectVector(transform(matrix, [0, 0, 1]), [0, Math.cos(angle), Math.sin(angle)]);
      const a = matrix.slice(0, 3),
        b = matrix.slice(3, 6),
        c = matrix.slice(6, 9);
      const determinant =
        a[0] * (b[1] * c[2] - b[2] * c[1]) -
        b[0] * (a[1] * c[2] - a[2] * c[1]) +
        c[0] * (a[1] * b[2] - a[2] * b[1]);
      expect(determinant).toBeCloseTo(1, 12);
      const vector = [0.3, -0.4, Math.sqrt(0.75)];
      expectVector(transform(transpose(matrix), transform(matrix, vector)), vector);
    }
  }
  expectVector(
    getStarfieldRotation(epoch, 30, 180).slice(0, 3),
    getStarfieldRotation(epoch, 30, -180).slice(0, 3)
  );
});

test('starfield: returns after a sidereal day and changes with observer longitude', () => {
  const siderealDay = 86400000 / 1.0027379;
  const a = getStarfieldRotation(epoch, 0, 0, {epoch: 'date'});
  const b = getStarfieldRotation(epoch.getTime() + siderealDay, 0, 0, {epoch: 'date'});
  for (let i = 0; i < 9; i++) expect(a[i]).toBeCloseTo(b[i], 6);
  const angle = (18.6973748283 * Math.PI) / 12;
  const meridian = [Math.cos(angle), Math.sin(angle), 0];
  expectVector(transform(getStarfieldRotation(epoch, 0, 90), meridian), [-1, 0, 0], 6);
});

test('starfield: J2000 precession agrees with published 2050 equinox displacement', () => {
  const date = new Date('2050-01-01T12:00:00Z');
  const ofDate = getStarfieldRotation(date, 0, 0, {epoch: 'date'});
  const j2000 = getStarfieldRotation(date, 0, 0);
  const equinox = transform(transpose(ofDate), transform(j2000, [1, 0, 0]));
  // IAU 1976: J2000 equinox at 2050 is approximately RA 0.6407°, Dec 0.2783°.
  expect((Math.atan2(equinox[1], equinox[0]) * 180) / Math.PI).toBeCloseTo(0.6407, 3);
  expect((Math.asin(equinox[2]) * 180) / Math.PI).toBeCloseTo(0.2783, 3);
  expectVector(transform(transpose(j2000), transform(j2000, [0, 0, 1])), [0, 0, 1]);
});

test('starfield: input validation', () => {
  for (const timestamp of [NaN, Infinity, new Date('invalid')]) {
    expect(() => getStarfieldRotation(timestamp, 0, 0)).toThrow(RangeError);
  }
  expect(() => getStarfieldRotation(0, -91, 0)).toThrow(RangeError);
  expect(() => getStarfieldRotation(0, 0, Infinity)).toThrow(RangeError);
  expect(() => getStarfieldRotation(0, 0, 0, {epoch: 'invalid' as 'date'})).toThrow(RangeError);
});
