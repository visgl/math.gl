// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  getAbsoluteSalinity,
  getConservativeTemperature,
  getHeightFromSeaPressure,
  getReferenceSalinity,
  getSeaPressureFromHeight,
  getSeawaterDensity,
  getSeawaterFreezingTemperature,
  getSeawaterSoundSpeed,
  getSoundAbsorptionAinslieMcColm,
  getSoundAbsorptionFrancoisGarrison,
  getSoundSpeedChenMillero,
  getSoundSpeedDelGrosso,
  getSoundSpeedMackenzie
} from '@math.gl/earth/ocean';

test('ocean#functions reject non-finite inputs', () => {
  for (const bad of [Number.NaN, Number.POSITIVE_INFINITY]) {
    expect(() => getReferenceSalinity(bad)).toThrow(RangeError);
    expect(() => getAbsoluteSalinity(35, bad)).toThrow(RangeError);
    expect(() => getConservativeTemperature(35, bad, 0)).toThrow(RangeError);
    expect(() => getSeawaterDensity(35, 10, bad)).toThrow(RangeError);
    expect(() => getSeawaterSoundSpeed(35, bad, 0)).toThrow(RangeError);
    expect(() => getSeawaterFreezingTemperature(bad, 0, 0)).toThrow(RangeError);
    expect(() => getHeightFromSeaPressure(100, bad)).toThrow(RangeError);
    expect(() => getSeaPressureFromHeight(bad, 0)).toThrow(RangeError);
    expect(() => getHeightFromSeaPressure(100, 0, {dynamicHeightAnomaly: bad})).toThrow(RangeError);
    expect(() => getSoundSpeedChenMillero(35, 10, bad)).toThrow(RangeError);
    expect(() => getSoundSpeedDelGrosso(bad, 10, 0)).toThrow(RangeError);
    expect(() => getSoundSpeedMackenzie(35, 10, bad)).toThrow(RangeError);
    const options = {frequency: 1e4, temperature: 10, salinity: 35, depth: 0};
    expect(() => getSoundAbsorptionFrancoisGarrison({...options, frequency: bad})).toThrow(
      RangeError
    );
    expect(() => getSoundAbsorptionAinslieMcColm({...options, pH: bad})).toThrow(RangeError);
  }
});

test('ocean#seawater state rejects points outside the oceanographic funnel', () => {
  // Below the freezing temperature of fresh water (0.018 °C) at the surface.
  expect(() => getSeawaterDensity(0, 0, 0)).toThrow(RangeError);
  expect(getSeawaterDensity(0, 0.018, 0)).toBeGreaterThan(999);
  // From 500 to 6500 dbar: SA ≥ 0.005 p - 2.5 and Θ ≤ 31.67 - 0.003333 p.
  expect(() => getSeawaterSoundSpeed(7, 5, 2000)).toThrow(RangeError);
  expect(() => getSeawaterSoundSpeed(35, 25.1, 2000)).toThrow(RangeError);
  expect(getSeawaterSoundSpeed(35, 24.9, 2000)).toBeGreaterThan(1500);
  // From 6500 dbar: SA ≥ 30 and Θ ≤ 10 °C.
  expect(() => getSeawaterDensity(29.9, 2, 7000)).toThrow(RangeError);
  expect(() => getSeawaterDensity(35, 10.1, 7000)).toThrow(RangeError);
  expect(() => getSeawaterDensity(35, 2, 8001)).toThrow(RangeError);
  expect(() => getSeawaterDensity(42.1, 10, 0)).toThrow(RangeError);
  expect(() => getSeawaterDensity(35, 40.1, 0)).toThrow(RangeError);
});

test('ocean#classic equations reject inputs outside their stated validity', () => {
  expect(() => getSoundSpeedChenMillero(41, 10, 0)).toThrow(RangeError);
  expect(() => getSoundSpeedChenMillero(35, -0.1, 0)).toThrow(RangeError);
  expect(() => getSoundSpeedChenMillero(35, 10, 10001)).toThrow(RangeError);
  expect(() => getSoundSpeedDelGrosso(29, 10, 0)).toThrow(RangeError);
  expect(() => getSoundSpeedDelGrosso(35, 31, 0)).toThrow(RangeError);
  expect(() => getSoundSpeedDelGrosso(35, 10, 9807)).toThrow(RangeError);
  expect(() => getSoundSpeedMackenzie(35, -2.1, 0)).toThrow(RangeError);
  expect(() => getSoundSpeedMackenzie(35, 10, 8001)).toThrow(RangeError);
  const options = {frequency: 1e4, temperature: 10, salinity: 35, depth: 0};
  expect(() => getSoundAbsorptionFrancoisGarrison({...options, frequency: 100})).toThrow(
    RangeError
  );
  expect(() => getSoundAbsorptionFrancoisGarrison({...options, soundSpeed: 1000})).toThrow(
    RangeError
  );
  expect(() => getSoundAbsorptionAinslieMcColm({...options, salinity: 4})).toThrow(RangeError);
  expect(() => getSoundAbsorptionAinslieMcColm({...options, depth: 7001})).toThrow(RangeError);
});

test('ocean#height and pressure are inverse and keep their sign convention', () => {
  expect(getHeightFromSeaPressure(0, 30)).toBe(-0);
  for (const latitude of [-90, -30, 0, 45, 90]) {
    for (const seaPressure of [1, 100, 1000, 4000, 8000]) {
      const height = getHeightFromSeaPressure(seaPressure, latitude);
      expect(height).toBeLessThan(0);
      expect(Math.abs(getSeaPressureFromHeight(height, latitude) - seaPressure)).toBeLessThan(1e-9);
    }
  }
  // More gravity gives less depth for the same pressure.
  const height = getHeightFromSeaPressure(4000, 0);
  expect(getHeightFromSeaPressure(4000, 0, {surfaceGravity: 9.79})).toBeGreaterThan(height);
  expect(() => getSeaPressureFromHeight(-9000, 0)).toThrow(RangeError);
  expect(() => getSeaPressureFromHeight(10, 0)).toThrow(RangeError);
});
