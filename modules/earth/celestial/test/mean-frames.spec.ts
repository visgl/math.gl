// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  JulianDate,
  getMeanSiderealAngle,
  getIAU1976Precession,
  getMeanEquatorialToLocalRotation
} from '../../src/celestial';
import {getStarfieldRotation} from '../../src/sun';

test('Mean frame helpers require explicit UT1/TT and match J2000 analytic identities', () => {
  const ut1 = new JulianDate(2451545, 0, 'UT1');
  const tt = new JulianDate(2451545, 0, 'TT');
  expect(getMeanSiderealAngle(ut1)).toBeCloseTo((18.6973748283 * Math.PI) / 12, 6);
  expect(getIAU1976Precession(tt)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  expect(() => getMeanSiderealAngle(tt)).toThrow(RangeError);
  expect(() => getIAU1976Precession(ut1)).toThrow(RangeError);
  expect(() => getMeanEquatorialToLocalRotation(ut1, tt, 91, 0)).toThrow(RangeError);
});

test('Starfield compatibility uses shared mean frames and honors explicit offsets', () => {
  const date = new Date('2026-10-23T00:00:00Z');
  const ut1 = JulianDate.fromUnixMilliseconds(date, 0.25, 'UT1');
  const tt = JulianDate.fromUnixMilliseconds(date, 69.184, 'TT');
  expect(getStarfieldRotation(date, 40, -75, {ut1MinusUtc: 0.25, ttMinusUtc: 69.184})).toEqual(
    getMeanEquatorialToLocalRotation(ut1, tt, 40, -75)
  );
  expect(getStarfieldRotation(date, 40, -75)).not.toEqual(
    getStarfieldRotation(date, 40, -75, {ut1MinusUtc: 0.25})
  );
});

test('Starfield adapters apply explicit UT1/TT offsets and reject invalid offsets', async () => {
  const {getStarfieldRotation} = await import('../../src/sun');
  const timestamp = Date.parse('2026-10-23T00:00:00Z');
  const options = {ut1MinusUtc: 0.2, ttMinusUtc: 69.184};
  const expected = getMeanEquatorialToLocalRotation(
    JulianDate.fromUnixMilliseconds(timestamp, options.ut1MinusUtc, 'UT1'),
    JulianDate.fromUnixMilliseconds(timestamp, options.ttMinusUtc, 'TT'),
    30,
    -110
  );
  expect(getStarfieldRotation(timestamp, 30, -110, options)).toEqual(expected);
  expect(getStarfieldRotation(timestamp, 30, -110)).not.toEqual(expected);
  expect(() => getStarfieldRotation(timestamp, 0, 0, {ut1MinusUtc: NaN})).toThrow(RangeError);
  expect(() => getStarfieldRotation(timestamp, 0, 0, {ttMinusUtc: Infinity})).toThrow(RangeError);
});
