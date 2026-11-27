// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  ATMOSPHERE_WAVELENGTHS,
  BODIES_WITH_ATMOSPHERE,
  SOLAR_SYSTEM_BODIES,
  getBodyAtmosphere,
  getBodyRadii,
  getRayleighCrossSection
} from '../../src/celestial';
import type {BodyAtmosphere, SolarSystemBody} from '../../src/celestial';

const BOLTZMANN = 1.380649e-23;

function atmosphere(body: SolarSystemBody): BodyAtmosphere {
  const value = getBodyAtmosphere(body);
  expect(value).not.toBeNull();
  return value as BodyAtmosphere;
}

describe('celestial#getBodyAtmosphere', () => {
  test('every body with an atmosphere has a spec, and only those bodies', () => {
    // Bodies with a gas envelope that scatters sunlight. The Sun is a star; Mercury and the Moon
    // have only a surface-bounded exosphere.
    const expected: SolarSystemBody[] = [
      'venus',
      'earth',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune'
    ];
    expect([...BODIES_WITH_ATMOSPHERE]).toEqual(expected);
    for (const body of SOLAR_SYSTEM_BODIES) {
      const value = getBodyAtmosphere(body);
      expect(value === null, body).toBe(!expected.includes(body));
      if (value) {
        expect(value.body).toBe(body);
      }
    }
    expect(() => getBodyAtmosphere('pluto' as SolarSystemBody)).toThrow(RangeError);
  });

  test('every value is finite and in its range, and every spec has references', () => {
    for (const body of BODIES_WITH_ATMOSPHERE) {
      const a = atmosphere(body);
      const {equatorialRadius} = getBodyRadii(body);
      for (const value of [a.baseRadius, a.topRadius, a.rayleighScaleHeight, a.mieScaleHeight]) {
        expect(Number.isFinite(value) && value > 0, body).toBe(true);
      }
      expect(a.baseAltitude).toBeGreaterThanOrEqual(0);
      expect(a.topAltitude).toBeGreaterThan(a.baseAltitude);
      expect(a.baseRadius).toBe(equatorialRadius + a.baseAltitude);
      expect(a.topRadius).toBe(equatorialRadius + a.topAltitude);
      // The shell holds at least 5 gas scale heights.
      expect(a.topAltitude - a.baseAltitude).toBeGreaterThan(5 * a.rayleighScaleHeight);
      for (let c = 0; c < 3; c++) {
        expect(Number.isFinite(a.rayleighScattering[c]) && a.rayleighScattering[c] > 0).toBe(true);
        expect(Number.isFinite(a.mieExtinction[c]) && a.mieExtinction[c] >= 0).toBe(true);
        expect(a.mieScattering[c]).toBeGreaterThanOrEqual(0);
        expect(a.mieScattering[c]).toBeLessThanOrEqual(a.mieExtinction[c]);
      }
      // Rayleigh scattering grows toward the blue.
      expect(a.rayleighScattering[0]).toBeLessThan(a.rayleighScattering[1]);
      expect(a.rayleighScattering[1]).toBeLessThan(a.rayleighScattering[2]);
      expect(Math.abs(a.mieAsymmetry)).toBeLessThan(1);
      if (a.cloudDeck) {
        for (const value of a.cloudDeck.albedo) {
          expect(value > 0 && value <= 1).toBe(true);
        }
      }
      expect(a.references.length).toBeGreaterThan(0);
      expect(Object.isFrozen(a) && Object.isFrozen(a.rayleighScattering)).toBe(true);
    }
  });

  test('Earth: the Bruneton (2017) demo constants', () => {
    const earth = atmosphere('earth');
    expect(earth.baseRadius).toBe(6378136.6);
    expect(earth.topAltitude).toBe(60000);
    expect(earth.rayleighScaleHeight).toBe(8000);
    expect(earth.mieScaleHeight).toBe(1200);
    expect(earth.rayleighScattering[0]).toBeCloseTo(5.802e-6, 9);
    expect(earth.rayleighScattering[1]).toBeCloseTo(13.558e-6, 9);
    expect(earth.rayleighScattering[2]).toBeCloseTo(33.1e-6, 9);
    expect(earth.mieExtinction[1]).toBeCloseTo(5.328e-3 / 1200, 12);
    expect(earth.mieScattering[1] / earth.mieExtinction[1]).toBeCloseTo(0.9, 12);
    expect(earth.mieAsymmetry).toBe(0.8);
    expect(earth.cloudDeck).toBeNull();
    // Vertical Rayleigh optical depth at 440 nm: about 0.26.
    expect(earth.rayleighScattering[2] * earth.rayleighScaleHeight).toBeCloseTo(0.265, 2);
    // The physical value of dry air at 15 °C and 101325 Pa is about 18 % lower at 550 nm.
    const physical = (101325 / (BOLTZMANN * 288.15)) * getRayleighCrossSection('air', 550e-9);
    expect(earth.rayleighScattering[1] / physical).toBeGreaterThan(1.15);
    expect(earth.rayleighScattering[1] / physical).toBeLessThan(1.2);
  });

  test('Mars: dust dominates, optical depth 0.5; Rayleigh about 2 % of the Earth per metre', () => {
    const mars = atmosphere('mars');
    expect(mars.mieExtinction[1] * mars.mieScaleHeight).toBeCloseTo(0.5, 10);
    const ratio = mars.rayleighScattering[1] / atmosphere('earth').rayleighScattering[1];
    expect(ratio).toBeGreaterThan(0.015);
    expect(ratio).toBeLessThan(0.03);
    // Vertical Rayleigh optical depth at 550 nm: about 0.003, far below the dust.
    expect(mars.rayleighScattering[1] * mars.rayleighScaleHeight).toBeCloseTo(0.0027, 4);
    // Dust absorbs blue more than red.
    expect(mars.mieScattering[2]).toBeLessThan(mars.mieScattering[0]);
  });

  test('Venus: the atmosphere starts at the cloud deck, 70 km up', () => {
    const venus = atmosphere('venus');
    expect(venus.baseRadius).toBe(6051800 + 70000);
    expect(venus.cloudDeck).not.toBeNull();
    // RT / (M g) at 70 km.
    const g = 8.87 * (6051.8 / 6121.8) ** 2;
    expect(venus.rayleighScaleHeight).toBeCloseTo((8.314462618 * 230) / (0.04345 * g), -2);
    expect(venus.mieExtinction[1] * venus.mieScaleHeight).toBeCloseTo(0.3, 10);
  });

  test('giant planets: H2 and He above the 1-bar level, no aerosol data', () => {
    const jupiter = atmosphere('jupiter');
    expect(jupiter.baseRadius).toBe(getBodyRadii('jupiter').equatorialRadius);
    expect(jupiter.mieExtinction).toEqual([0, 0, 0]);
    // Rayleigh optical depth above 1 bar at 550 nm: about 0.1 (p / (m g) times σ).
    expect(jupiter.rayleighScattering[1] * jupiter.rayleighScaleHeight).toBeCloseTo(0.104, 2);
    for (const body of ['saturn', 'uranus', 'neptune'] as const) {
      expect(atmosphere(body).rayleighScattering[1]).toBeGreaterThan(jupiter.rayleighScattering[1]);
    }
  });
});

describe('celestial#getRayleighCrossSection', () => {
  test('air at 550 nm matches the published value', () => {
    // Bucholtz (1995), Appl. Opt. 34, 2765, Table 2: 4.513e-27 cm² at 0.55 µm.
    expect(getRayleighCrossSection('air', 550e-9) / 4.513e-31).toBeCloseTo(1, 2);
  });

  test('ratios of the gases at 532 nm', () => {
    const air = getRayleighCrossSection('air', 532e-9);
    // CO2 scatters about 2.5 times as much as air (Sneep & Ubachs 2005).
    expect(getRayleighCrossSection('carbon-dioxide', 532e-9) / air).toBeCloseTo(2.6, 1);
    expect(getRayleighCrossSection('hydrogen', 532e-9) / air).toBeCloseTo(0.215, 2);
    expect(getRayleighCrossSection('helium', 532e-9) / air).toBeCloseTo(0.0136, 3);
  });

  test('close to λ⁻⁴ and rejects other inputs', () => {
    const [red, , blue] = ATMOSPHERE_WAVELENGTHS;
    const ratio = getRayleighCrossSection('air', blue) / getRayleighCrossSection('air', red);
    expect(ratio / (red / blue) ** 4).toBeGreaterThan(1);
    expect(ratio / (red / blue) ** 4).toBeLessThan(1.1);
    expect(() => getRayleighCrossSection('air', 1e-6)).toThrow(RangeError);
    expect(() => getRayleighCrossSection('neon' as 'air', 550e-9)).toThrow(RangeError);
  });
});
