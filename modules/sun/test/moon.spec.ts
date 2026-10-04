// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {
  getMoonPosition,
  getMoonDirection,
  getMoonIllumination,
  getMoonLight,
  getStarfieldRotation
} from '../src';
import {getLocalSiderealTime} from '../src/starfield';
import {MOON_REFERENCE} from './data/moon-reference';

const radians = (degrees: number): number => (degrees * Math.PI) / 180;
const transform = (m: number[], v: number[]): number[] =>
  [0, 1, 2].map(row => m[row] * v[0] + m[row + 3] * v[1] + m[row + 6] * v[2]);
const norm = (v: number[]): number => Math.hypot(...v);

test('moon position: reference ephemeris projected to observer, including parallax', () => {
  for (const reference of MOON_REFERENCE) {
    const date = new Date(reference.timestamp);
    const ra = reference.rightAscension;
    const dec = reference.declination;
    const equatorial = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
    for (const [latitude, longitude] of [
      [0, 0],
      [47.6, -122.3],
      [-33.9, 151.2],
      [90, 0],
      [-90, 0]
    ]) {
      const position = getMoonPosition(date, latitude, longitude);
      const geocentric = transform(
        getStarfieldRotation(date, latitude, longitude, {epoch: 'date'}),
        equatorial
      );
      const relative = geocentric.map(value => value * reference.distance);
      relative[2] -= 6378.14;
      const distance = norm(relative);
      expect(position.distance).toBeCloseTo(distance, 5);
      expect(position.altitude).toBeCloseTo(
        Math.atan2(relative[2], Math.hypot(relative[0], relative[1])),
        9
      );
      const direction = getMoonDirection(date, latitude, longitude);
      expect(norm(direction)).toBeCloseTo(1, 12);
      for (let i = 0; i < 3; i++) expect(direction[i]).toBeCloseTo(-relative[i] / distance, 9);
      expect(getMoonPosition(date.getTime(), latitude, longitude)).toEqual(position);
    }
  }
});

test('moon illumination: upstream reference phase, fraction and bright limb', () => {
  for (const reference of MOON_REFERENCE) {
    const actual = getMoonIllumination(new Date(reference.timestamp));
    expect(actual.fraction).toBeCloseTo(reference.illumination.fraction, 12);
    expect(actual.phase).toBeCloseTo(reference.illumination.phase, 12);
    expect(actual.angle).toBeCloseTo(reference.illumination.angle, 12);
    expect(actual.phaseAngle).toBeCloseTo(Math.acos(2 * actual.fraction - 1), 12);
  }
  expect(getMoonIllumination(new Date('2024-04-08T18:00:00Z')).fraction).toBeLessThan(0.01);
  expect(getMoonIllumination(new Date('2024-04-23T23:00:00Z')).fraction).toBeGreaterThan(0.99);
});

test('moonlight: empirical quarter-moon brightness is not just illuminated area', () => {
  const full = getMoonLight(Math.PI / 2);
  const quarter = getMoonLight(Math.PI / 2, {phaseAngle: Math.PI / 2});
  const expected = Math.pow(10, -0.4 * (0.026 * 90 + 4e-9 * Math.pow(90, 4)));
  expect(quarter.intensity / full.intensity).toBeCloseTo(expected, 12);
  expect(quarter.intensity).toBeLessThan(full.intensity / 2);
  expect(getMoonLight(Math.PI / 2, {phaseAngle: Math.PI}).intensity).toBe(0);
  expect(getMoonLight(Math.PI / 2, {phaseAngle: Math.PI - 1e-6}).intensity).toBeLessThan(1e-10);
  const near = getMoonLight(Math.PI / 2, {distance: 360000});
  const far = getMoonLight(Math.PI / 2, {distance: 400000});
  expect(near.intensity / far.intensity).toBeCloseTo(Math.pow(400000 / 360000, 2), 12);
});

test('moonlight: atmospheric warming, cloud attenuation and horizon', () => {
  const high = getMoonLight(radians(60));
  const low = getMoonLight(radians(1));
  expect(low.intensity).toBeLessThan(high.intensity);
  expect(low.color[2]).toBeLessThan(high.color[2]);
  expect(getMoonLight(radians(-1))).toEqual({color: [0, 0, 0], intensity: 0});
  expect(getMoonLight(0).intensity).toBeGreaterThan(0);
  expect(getMoonLight(-1e-9).intensity).toBeCloseTo(getMoonLight(1e-9).intensity, 8);
  expect(getMoonLight(radians(60), {cloudCover: 1}).intensity).toBeLessThan(high.intensity * 0.001);
  expect(getMoonLight(radians(60), {cloudCover: 1, cloudOpticalDepth: 0})).toEqual(high);
  expect(getMoonLight(1, {aerosolOpticalDepth: Number.MAX_VALUE})).toEqual({
    color: [0, 0, 0],
    intensity: 0
  });
});

test('moon APIs: invalid inputs and finite polar results', () => {
  for (const timestamp of [NaN, Infinity, new Date('invalid')]) {
    expect(() => getMoonPosition(timestamp, 0, 0)).toThrow(RangeError);
    expect(() => getMoonIllumination(timestamp)).toThrow(RangeError);
  }
  expect(() => getMoonDirection(0, 91, 0)).toThrow(RangeError);
  expect(() => getMoonPosition(0, 0, NaN)).toThrow(RangeError);
  for (const altitude of [NaN, Infinity, Math.PI])
    expect(() => getMoonLight(altitude)).toThrow(RangeError);
  for (const options of [
    {phaseAngle: -1},
    {phaseAngle: 4},
    {phaseAngle: NaN},
    {distance: 0},
    {distance: Infinity},
    {aerosolOpticalDepth: -1},
    {cloudCover: 2},
    {cloudOpticalDepth: -1}
  ]) {
    expect(() => getMoonLight(-1, options)).toThrow(RangeError);
  }
  for (const latitude of [-90, 90]) {
    expect(Object.values(getMoonPosition(0, latitude, 0)).every(Number.isFinite)).toBe(true);
  }
});

test('moon position: finite overhead direction at a lunar transit', () => {
  const reference = MOON_REFERENCE[0];
  const date = new Date(reference.timestamp);
  const latitude = (reference.declination * 180) / Math.PI;
  const longitude = ((reference.rightAscension - getLocalSiderealTime(date, 0)) * 180) / Math.PI;
  const position = getMoonPosition(date, latitude, longitude);
  expect(position.altitude).toBeCloseTo(Math.PI / 2, 7);
  expect(position.distance).toBeCloseTo(reference.distance - 6378.14, 5);
  const direction = getMoonDirection(date, latitude, longitude);
  expect(direction[0]).toBeCloseTo(0, 7);
  expect(direction[1]).toBeCloseTo(0, 7);
  expect(direction[2]).toBeCloseTo(-1, 7);
});
