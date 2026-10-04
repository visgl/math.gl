// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {getCloudLighting, getSunPosition} from '../src';
import {getCloudSunSpectrum} from '../src/cloud-spectral';
const radians = (degrees: number): number => (degrees * Math.PI) / 180;
const rgb = (light: {color: number[]; intensity: number}): number[] =>
  light.color.map(v => v * light.intensity);

test('cloud lighting: spherical horizon depression agrees with Earth tangent geometry', () => {
  const height = 10000;
  const cloud = getCloudLighting(radians(-2), {cloudAltitude: height});
  expect(cloud.horizonAltitude).toBeCloseTo(-Math.acos(6371000 / (6371000 + height)), 14);
  expect(cloud.sunVisibleFraction).toBe(1);
  expect(cloud.direct.intensity).toBeGreaterThan(0);
  const ground = getCloudLighting(radians(-2), {cloudAltitude: 0});
  expect(ground.sunVisibleFraction).toBe(0);
  expect(ground.direct).toEqual({color: [0, 0, 0], intensity: 0});
  expect(cloud.direct.color[0]).toBeGreaterThan(cloud.direct.color[2]);
});

test('cloud lighting: dawn/dusk is warmer and dimmer than midday, while neutral clouds retain the incident tint', () => {
  const noon = getCloudLighting(radians(60));
  const dusk = getCloudLighting(radians(-0.5));
  expect(dusk.direct.intensity).toBeLessThan(noon.direct.intensity);
  expect(dusk.direct.color[2] / dusk.direct.color[0]).toBeLessThan(
    noon.direct.color[2] / noon.direct.color[0]
  );
  expect(dusk.scattered.color[0]).toBeGreaterThan(dusk.scattered.color[2]);
  const covered = getCloudLighting(radians(-0.5), {cloudCover: 1});
  expect(covered.direct).toEqual(dusk.direct);
  expect(covered.diffuse.color).toEqual([1, 1, 1]);
});

test('cloud lighting: a fixed location lights high clouds after ground sunset and before sunrise', () => {
  for (const timestamp of [Date.UTC(2026, 2, 20, 6, 0), Date.UTC(2026, 2, 20, 18, 15)]) {
    const altitude = getSunPosition(timestamp, 0, 0).altitude;
    expect(altitude).toBeLessThan(0);
    const ground = getCloudLighting(altitude, {cloudAltitude: 0});
    const high = getCloudLighting(altitude, {cloudAltitude: 15000});
    expect(ground.direct.intensity).toBe(0);
    expect(high.direct.intensity).toBeGreaterThan(0);
  }
});

test('cloud lighting: partial solar disk is bounded and continuous through the Earth limb', () => {
  const height = 10000,
    horizon = -Math.acos(6371000 / (6371000 + height));
  expect(getCloudLighting(horizon, {cloudAltitude: height}).sunVisibleFraction).toBeCloseTo(
    0.5,
    12
  );
  expect(
    getCloudLighting(horizon - radians(0.266), {cloudAltitude: height}).sunVisibleFraction
  ).toBe(0);
  expect(
    getCloudLighting(horizon + radians(0.266), {cloudAltitude: height}).sunVisibleFraction
  ).toBe(1);
  const sliver = getCloudLighting(horizon - radians(0.266) + 1e-12, {cloudAltitude: height});
  expect(sliver.direct.intensity).toBeGreaterThanOrEqual(0);
  expect(sliver.direct.intensity).toBeLessThan(1e-12);
  expect(Number.isFinite(sliver.rayleighAirMass)).toBe(true);
  const before = getCloudLighting(horizon - 1e-7, {cloudAltitude: height});
  const after = getCloudLighting(horizon + 1e-7, {cloudAltitude: height});
  expect(Math.abs(after.direct.intensity - before.direct.intensity)).toBeLessThan(1e-4);
});

test('cloud lighting: zenith exponential columns agree with the analytic integral', () => {
  for (const cloudAltitude of [0, 2000, 10000, 50000]) {
    const result = getCloudLighting(Math.PI / 2, {cloudAltitude});
    expect(result.rayleighAirMass).toBeCloseTo(
      Math.exp(-cloudAltitude / 8000) - Math.exp(-100000 / 8000),
      6
    );
    expect(result.aerosolAirMass).toBeCloseTo(
      Math.exp(-cloudAltitude / 1200) - Math.exp(-100000 / 1200),
      4
    );
  }
});

test('cloud lighting: tangent extinction converges under quadrature refinement', () => {
  for (const cloudAltitude of [0, 1000, 10000]) {
    const horizon = -Math.acos(6371000 / (6371000 + cloudAltitude));
    const normal = getCloudLighting(horizon, {cloudAltitude});
    const refined = getCloudLighting(horizon, {cloudAltitude, integrationSteps: 1024});
    expect(Math.abs(normal.rayleighAirMass / refined.rayleighAirMass - 1)).toBeLessThan(1e-4);
    expect(Math.abs(normal.aerosolAirMass / refined.aerosolAirMass - 1)).toBeLessThan(0.002);
    for (let i = 0; i < 3; i++)
      expect(rgb(normal.direct)[i]).toBeCloseTo(rgb(refined.direct)[i], 5);
  }
});

test('cloud lighting: measured ray depth shadows incident sunlight and viewer depth attenuates scattering', () => {
  const light = getCloudLighting(radians(30));
  const shadow = getCloudLighting(radians(30), {sunOpticalDepth: 3});
  for (let i = 0; i < 3; i++) expect(shadow.direct.color[i]).toBeCloseTo(light.direct.color[i], 12);
  expect(shadow.direct.intensity / light.direct.intensity).toBeCloseTo(Math.exp(-3), 12);
  expect(shadow.diffuse).toEqual(light.diffuse);
  const obscured = getCloudLighting(radians(30), {viewOpticalDepth: 2});
  expect(obscured.scattered.intensity / light.scattered.intensity).toBeCloseTo(Math.exp(-2), 12);
  expect(obscured.direct).toEqual(light.direct);
  expect(getCloudLighting(radians(30), {sunOpticalDepth: 1000}).direct.intensity).toBe(0);
});

test('cloud lighting: opacity and single-scattering albedo affect appearance, not incident light', () => {
  const transparent = getCloudLighting(0, {cloudOpticalDepth: 0});
  expect(transparent.opacity).toBe(0);
  expect(transparent.scattered.intensity).toBe(0);
  expect(transparent.direct.intensity).toBeGreaterThan(0);
  const absorbed = getCloudLighting(0, {singleScatteringAlbedo: 0});
  expect(absorbed.scattered.intensity).toBe(0);
  const thin = getCloudLighting(0, {cloudOpticalDepth: 0.2});
  const thick = getCloudLighting(0, {cloudOpticalDepth: 5});
  expect(thin.scattered.intensity).toBeLessThan(thick.scattered.intensity);
});

test('cloud lighting: HG phase is normalized and forward scattering peaks near Sun', () => {
  const samples = 10000;
  let integral = 0;
  for (let i = 0; i < samples; i++) {
    const mu = -1 + (2 * (i + 0.5)) / samples;
    const g = 0.7;
    integral +=
      (((1 - g * g) / (4 * Math.PI * (1 + g * g - 2 * g * mu) ** 1.5)) * 4 * Math.PI) / samples;
  }
  expect(integral).toBeCloseTo(1, 4);
  const forward = getCloudLighting(0, {sunSeparation: 0});
  const backward = getCloudLighting(0, {sunSeparation: Math.PI});
  expect(forward.phaseFunction).toBeGreaterThan(backward.phaseFunction);
  expect(getCloudLighting(0, {asymmetry: 0}).phaseFunction).toBeCloseTo(1 / (4 * Math.PI), 14);
});

test('cloud lighting: spectral attenuation preserves a common reference and neutral aerosol extinction', () => {
  const vacuum = getCloudSunSpectrum(0, 0, 0, 0, 1.3);
  expect(Math.max(...vacuum)).toBeCloseTo(1, 12);
  const attenuated = getCloudSunSpectrum(0, 2, 0, 0.3, 0);
  for (let i = 0; i < 3; i++) expect(attenuated[i] / vacuum[i]).toBeCloseTo(Math.exp(-0.6), 12);
  const red = getCloudSunSpectrum(30, 30, 1013.25, 0.1, 1.3);
  expect(red[0]).toBeGreaterThan(red[2]);
});

test('cloud lighting: finite colors through day/night and extreme weather, no direct beam in Earth shadow', () => {
  for (const cloudAltitude of [0, 1000, 10000, 50000])
    for (const degrees of [-90, -18, -6, -3, -1, 0, 30, 90]) {
      const light = getCloudLighting(radians(degrees), {cloudAltitude});
      for (const value of [
        light.sunVisibleFraction,
        light.opacity,
        light.rayleighAirMass,
        light.aerosolAirMass,
        ...light.direct.color,
        light.direct.intensity,
        ...light.diffuse.color,
        light.diffuse.intensity,
        ...light.scattered.color,
        light.scattered.intensity
      ]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
      if (degrees === -90) expect(light.direct.intensity).toBe(0);
    }
  const dark = getCloudLighting(-Math.PI / 2, {darkSkyLuminance: 0, lightPollutionLuminance: 0});
  expect(dark.scattered.intensity).toBe(0);
});

test('cloud lighting: validates all configuration even while Earth-shadowed', () => {
  for (const options of [
    {cloudAltitude: -1},
    {cloudAltitude: 50001},
    {integrationSteps: 33},
    {integrationSteps: 4096},
    {asymmetry: 1},
    {singleScatteringAlbedo: -1},
    {sunSeparation: 4},
    {sunOpticalDepth: NaN},
    {viewOpticalDepth: -1},
    {angstromExponent: Infinity},
    {cloudCover: 2}
  ]) {
    expect(() => getCloudLighting(-Math.PI / 2, options)).toThrow(RangeError);
  }
  expect(() => getCloudLighting(NaN)).toThrow(RangeError);
});

test('cloud lighting: solar reference chromaticity and shadowed cloud color are plausible', () => {
  const [r, g, b] = getCloudSunSpectrum(0, 0, 0, 0, 1.3);
  const x = 0.4124 * r + 0.3576 * g + 0.1805 * b;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = 0.0193 * r + 0.1192 * g + 0.9505 * b;
  expect(Math.abs(x / (x + y + z) - 0.3264)).toBeLessThan(0.002);
  expect(Math.abs(y / (x + y + z) - 0.3357)).toBeLessThan(0.002);
  const sunlit = getCloudLighting(radians(-0.5));
  const shaded = getCloudLighting(radians(-0.5), {sunOpticalDepth: 1000});
  expect(shaded.scattered.color[2] / shaded.scattered.color[0]).toBeGreaterThan(
    sunlit.scattered.color[2] / sunlit.scattered.color[0]
  );
});
