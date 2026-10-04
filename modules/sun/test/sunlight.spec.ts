// SPDX-License-Identifier: MIT
// Oracle: BSD-3-Clause Hošek-Wilkie 1.4a, integrated at twice the table's angular resolution.
// https://cgg.mff.cuni.cz/projects/SkylightModelling/
import {test, expect} from 'vitest';
import {getSunLight, getSunPosition} from '../src';
import {SUNLIGHT_REFERENCE} from './data/sunlight-reference';

const radians = (degrees: number): number => (degrees * Math.PI) / 180;
const rgb = (light: {color: number[]; intensity: number}): number[] =>
  light.color.map(value => value * light.intensity);
const black = {color: [0, 0, 0], intensity: 0};

test('getSunLight: matches independently sampled reference sun and sky irradiance', () => {
  const zenith = SUNLIGHT_REFERENCE.find(row => row.altitude === 90 && row.turbidity === 10);
  // Recover the fixed runtime scale from a reference grid point, then compare every other
  // channel, altitude and turbidity (including holdouts between table grid points).
  const scale =
    Math.max(...zenith.irradiance.slice(0, 3)) /
    getSunLight(Math.PI / 2, {turbidity: 10}).intensity;
  for (const reference of SUNLIGHT_REFERENCE) {
    const light = getSunLight(radians(reference.altitude), {turbidity: reference.turbidity});
    const visibility = reference.altitude === 0 ? 0.5 : 1;
    const actual = [...rgb(light), ...rgb(light.diffuse)].map(
      value => (value * scale) / visibility
    );
    for (const offset of [0, 3]) {
      const peak = Math.max(...reference.irradiance.slice(offset, offset + 3));
      for (let channel = offset; channel < offset + 3; channel++) {
        // Covers table interpolation and hemisphere/disk integration error, including
        // weak or gamut-clipped channels, relative to each component's strongest channel.
        expect(Math.abs(actual[channel] - reference.irradiance[channel]) / peak).toBeLessThan(0.06);
      }
    }
  }
});

test('getSunLight: midday is brighter and less red than sunset', () => {
  const noon = getSunLight(radians(90));
  const sunset = getSunLight(radians(1));
  expect(getSunLight(Math.PI / 2, {turbidity: 1}).intensity).toBeCloseTo(1, 12);
  expect(noon.intensity).toBeGreaterThan(0.5);
  expect(noon.color[2]).toBeGreaterThan(0.5);
  expect(sunset.intensity).toBeLessThan(noon.intensity);
  expect(sunset.color[1] / sunset.color[0]).toBeLessThan(noon.color[1] / noon.color[0]);
  expect(sunset.color[2] / sunset.color[0]).toBeLessThan(noon.color[2] / noon.color[0]);
  expect(noon.diffuse.intensity).toBeGreaterThan(0);
});

test('getSunLight: clouds suppress the beam and make diffuse daylight less blue', () => {
  const clear = getSunLight(radians(45));
  const overcast = getSunLight(radians(45), {cloudCover: 1});
  expect(overcast.intensity).toBeLessThan(clear.intensity * 0.001);
  expect(overcast.diffuse.intensity).toBeGreaterThan(0);
  expect(overcast.diffuse.color[0] / overcast.diffuse.color[2]).toBeGreaterThan(
    clear.diffuse.color[0] / clear.diffuse.color[2]
  );
  const partial = getSunLight(radians(45), {cloudCover: 0.5});
  expect(partial.intensity).toBeCloseTo((clear.intensity + overcast.intensity) / 2, 12);
  expect(getSunLight(radians(45), {cloudCover: 1, cloudOpticalDepth: 0})).toEqual(clear);
  expect(getSunLight(radians(45), {cloudCover: 0, cloudOpticalDepth: 100})).toEqual(clear);
});

test('getSunLight: cloud redistribution never adds horizontal incident energy', () => {
  for (const degrees of [0, 1, 10, 45, 90]) {
    const clear = getSunLight(radians(degrees));
    for (const cloudCover of [0.25, 0.5, 1]) {
      for (const cloudOpticalDepth of [0, 0.1, 10, 100, Number.MAX_VALUE]) {
        const cloudy = getSunLight(radians(degrees), {cloudCover, cloudOpticalDepth});
        for (let channel = 0; channel < 3; channel++) {
          const before =
            rgb(clear)[channel] * Math.sin(radians(degrees)) + rgb(clear.diffuse)[channel];
          const after =
            rgb(cloudy)[channel] * Math.sin(radians(degrees)) + rgb(cloudy.diffuse)[channel];
          expect(after).toBeLessThanOrEqual(before + 1e-12);
        }
      }
    }
  }
});

test('getSunLight: night and continuous horizon fade', () => {
  expect(getSunLight(radians(-1))).toEqual({...black, diffuse: black});
  expect(getSunLight(radians(-0.255))).toEqual({...black, diffuse: black});
  expect(getSunLight(radians(-0.255 + 1e-6)).intensity).toBeLessThan(1e-8);
  const horizon = getSunLight(0);
  expect(horizon.intensity).toBeGreaterThan(0);
  expect(getSunLight(1e-9).intensity).toBeCloseTo(horizon.intensity, 8);
  expect(getSunLight(-1e-9).intensity).toBeCloseTo(horizon.intensity, 8);
  expect(getSunLight(1e-9).diffuse.intensity).toBeCloseTo(horizon.diffuse.intensity, 8);
});

test('getSunLight: finite normalized output across all table boundaries', () => {
  for (const turbidity of [1, 1.5, 3, 9.5, 10]) {
    for (let degrees = -90; degrees <= 90; degrees += 0.5) {
      const light = getSunLight(radians(degrees), {turbidity});
      for (const component of [light, light.diffuse]) {
        expect(Number.isFinite(component.intensity)).toBe(true);
        expect(component.intensity).toBeGreaterThanOrEqual(0);
        for (const value of component.color) {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    }
  }
  const {altitude} = getSunPosition(new Date('2026-06-21T12:00:00Z'), 0, 0);
  expect(getSunLight(altitude).intensity).toBeGreaterThan(0.5);
});

test('getSunLight: rejects invalid inputs, including at night', () => {
  for (const altitude of [NaN, Infinity, -Infinity, Math.PI, -Math.PI]) {
    expect(() => getSunLight(altitude)).toThrow(RangeError);
  }
  for (const options of [
    {turbidity: 0},
    {turbidity: 11},
    {turbidity: NaN},
    {cloudCover: -1},
    {cloudCover: 2},
    {cloudCover: Infinity},
    {cloudOpticalDepth: -1},
    {cloudOpticalDepth: NaN},
    {cloudOpticalDepth: Infinity}
  ]) {
    expect(() => getSunLight(-1, options)).toThrow(RangeError);
  }
});
