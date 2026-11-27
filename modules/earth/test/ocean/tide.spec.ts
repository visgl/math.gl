// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {JulianDate} from '@math.gl/earth/celestial';
import {
  getTideHeight,
  getTidalEquilibriumArgument,
  getTidalNodeFactor,
  type TidalConstituent
} from '@math.gl/earth/ocean';
import {TIDAL_CONSTITUENTS} from '../../src/ocean/tide';
import noaa from './data/tide-noaa-9414290-2026.json';

// Controls: NOAA CO-OPS hourly predictions for station 9414290 (San Francisco) in 2026, on the
// MSL datum in metres, with the 37 harmonic constants that NOAA publishes for the station. NOAA
// prints the predictions to 1 mm. Gate (RFC visgl/math.gl#613): 0.01 m across one year.
const NOAA_GATE = 0.01;
const constituents = noaa.constituents as TidalConstituent[];

function hourlyDate(hour: number): JulianDate {
  return JulianDate.fromUnixMilliseconds(Date.UTC(2026, 0, 1) + hour * 3600000, 0, 'UT1');
}

test('ocean#getTideHeight reproduces NOAA CO-OPS predictions for one year', () => {
  const {heights} = noaa.predictions;
  expect(heights).toHaveLength(8760);
  let maximum = 0;
  let sumOfSquares = 0;
  for (let hour = 0; hour < heights.length; hour++) {
    const error = getTideHeight(constituents, hourlyDate(hour)) - heights[hour];
    maximum = Math.max(maximum, Math.abs(error));
    sumOfSquares += error * error;
  }
  expect(maximum).toBeLessThanOrEqual(NOAA_GATE);
  // Measured when this test was written: 1.3 mm maximum and 0.44 mm RMS. These limits catch a
  // regression long before the 0.01 m gate does.
  expect(maximum).toBeLessThanOrEqual(0.002);
  expect(Math.sqrt(sumOfSquares / heights.length)).toBeLessThanOrEqual(0.0006);
});

test('ocean#getTideHeight uses 2200 just before 2201', () => {
  const start = JulianDate.fromUnixMilliseconds(Date.UTC(2201, 0, 1), 0, 'UT1');
  expect(getTideHeight(constituents, start.addSeconds(-1e-5))).toBeCloseTo(
    getTideHeight(constituents, start.addSeconds(-1)),
    3
  );
});

test('ocean#getTideHeight rejects the start of 2201', () => {
  const start = JulianDate.fromUnixMilliseconds(Date.UTC(2201, 0, 1), 0, 'UT1');
  expect(() => getTideHeight(constituents, start)).toThrow(RangeError);
});

test('ocean#getTideHeight uses the calendar year on either side of the start of 2026', () => {
  const start = hourlyDate(0);
  expect(getTideHeight(constituents, start.addSeconds(-1e-5))).toBeCloseTo(
    getTideHeight(constituents, start.addSeconds(-1)),
    3
  );
  expect(getTideHeight(constituents, start.addSeconds(1e-5))).toBeCloseTo(
    getTideHeight(constituents, start.addSeconds(1)),
    3
  );
});

test('ocean#tidal arguments give the speeds that NOAA lists', () => {
  // Speeds of T, s, h, p and p1 in degrees per mean solar hour, Schureman (1958), table 1.
  const elementSpeeds = [15, 0.54901653, 0.04106864, 0.00464183, 0.00000196];
  for (const {name, speed} of constituents) {
    const {v} = TIDAL_CONSTITUENTS[name];
    // M1 keeps p in u (formula 201), so its argument speed lacks the p term of the true speed.
    const pSpeed = name === 'M1' ? elementSpeeds[3] : 0;
    const argumentSpeed = elementSpeeds.reduce((sum, rate, i) => sum + v[i] * rate, pSpeed);
    expect(Math.abs(argumentSpeed - speed), name).toBeLessThan(2e-5);
  }
});

test('ocean#tidal node factors and arguments have the expected forms', () => {
  // Solar constituents have no nodal modulation.
  for (const name of ['S2', 'P1', 'SA', 'SSA', 'T2', 'R2', 'S4'] as const) {
    expect(getTidalNodeFactor(name, 2026)).toBe(1);
  }
  // Shallow-water constituents multiply the factors of their components (Schureman, table 2a).
  const fM2 = getTidalNodeFactor('M2', 2026);
  const fK1 = getTidalNodeFactor('K1', 2026);
  expect(getTidalNodeFactor('M4', 2026)).toBeCloseTo(fM2 ** 2, 14);
  expect(getTidalNodeFactor('MK3', 2026)).toBeCloseTo(fM2 * fK1, 14);
  expect(getTidalNodeFactor('2MK3', 2026)).toBeCloseTo(fM2 ** 2 * fK1, 14);
  // S2 has V = 2T, and T is 180° at 0 h, so V0 + u is 0°.
  expect(getTidalEquilibriumArgument('S2', 2026)).toBe(0);
  // M4 is 2 × M2 in argument.
  const m2 = getTidalEquilibriumArgument('M2', 2026);
  const m4 = getTidalEquilibriumArgument('M4', 2026);
  expect(Math.abs(((m4 - 2 * m2) % 360) + 360) % 360).toBeCloseTo(0, 9);
});

test('ocean#tide functions reject inputs outside the domain', () => {
  const m2: TidalConstituent = {name: 'M2', amplitude: 1, phase: 0, speed: 28.984104};
  const date = hourlyDate(0);
  expect(() => getTideHeight([m2], JulianDate.fromUnixMilliseconds(0, 0, 'TT'))).toThrow(
    RangeError
  );
  expect(() => getTideHeight([{...m2, amplitude: -1}], date)).toThrow(RangeError);
  expect(() => getTideHeight([{...m2, phase: Number.NaN}], date)).toThrow(RangeError);
  expect(() => getTideHeight([m2], date, {datumOffset: Infinity})).toThrow(RangeError);
  expect(() => getTideHeight([{...m2, name: 'X9' as TidalConstituent['name']}], date)).toThrow(
    RangeError
  );
  expect(() => getTidalNodeFactor('M2', 1799)).toThrow(RangeError);
  expect(() => getTidalNodeFactor('M2', 2026.5)).toThrow(RangeError);
  expect(() => getTidalEquilibriumArgument('toString' as TidalConstituent['name'], 2026)).toThrow(
    RangeError
  );
  expect(getTideHeight([], date, {datumOffset: 1.5})).toBe(1.5);
});

test('ocean#getTidalNodeFactor reproduces Schureman table 14 for 1990 to 1999', () => {
  // Schureman (1958), table 14, p. 203: node factor f for the middle of each year, printed to
  // three decimals. MK is f(M2)·f(K1) and 2MK is f(M2)²·f(K1). Schureman (p. 156) states that the
  // tabulated values come from formulas that differ slightly from his printed formulas, which this
  // code uses. Measured differences: at most 0.0015 for M2 and its powers, J1, K1, O1, Mf and Mm,
  // and at most 0.009 for M1 (1995), 0.004 for L2, 0.003 for OO1 and 0.0023 for K2. The gate of
  // 0.01 catches a wrong formula; the NOAA test above checks the current values at 1 mm.
  // biome-ignore format: one row per constituent, as printed
  const table14: Record<string, number[]> = {
    J1: [1.12, 1.08, 1.03, 0.972, 0.914, 0.864, 0.833, 0.829, 0.852, 0.896],
    K1: [1.079, 1.051, 1.015, 0.976, 0.937, 0.905, 0.886, 0.883, 0.897, 0.926],
    K2: [1.203, 1.115, 1.016, 0.922, 0.842, 0.785, 0.754, 0.75, 0.772, 0.821],
    L2: [1.216, 1.248, 0.898, 0.801, 1.077, 1.208, 1.107, 0.921, 0.893, 1.096],
    M1: [1.334, 1.156, 1.778, 1.829, 1.282, 0.8, 1.083, 1.487, 1.56, 1.214],
    M2: [0.977, 0.988, 1.0, 1.013, 1.024, 1.032, 1.037, 1.038, 1.034, 1.027],
    M3: [0.966, 0.982, 1.0, 1.019, 1.036, 1.048, 1.056, 1.057, 1.051, 1.04],
    M4: [0.955, 0.976, 1.0, 1.025, 1.048, 1.065, 1.075, 1.076, 1.069, 1.054],
    M6: [0.932, 0.964, 1.0, 1.038, 1.072, 1.099, 1.115, 1.117, 1.105, 1.082],
    M8: [0.911, 0.952, 1.0, 1.051, 1.098, 1.134, 1.156, 1.159, 1.143, 1.111],
    O1: [1.128, 1.081, 1.024, 0.96, 0.897, 0.844, 0.812, 0.808, 0.832, 0.879],
    OO1: [1.505, 1.296, 1.072, 0.863, 0.688, 0.565, 0.498, 0.489, 0.538, 0.643],
    MK3: [1.054, 1.038, 1.015, 0.988, 0.959, 0.934, 0.918, 0.916, 0.928, 0.95],
    '2MK3': [1.03, 1.025, 1.015, 1.0, 0.982, 0.964, 0.952, 0.951, 0.959, 0.976],
    MF: [1.303, 1.184, 1.048, 0.91, 0.786, 0.691, 0.636, 0.629, 0.669, 0.752],
    MM: [0.918, 0.956, 0.998, 1.042, 1.081, 1.11, 1.128, 1.13, 1.117, 1.091],
    MSF: [0.977, 0.988, 1.0, 1.013, 1.024, 1.032, 1.037, 1.038, 1.034, 1.027]
  };
  const differences: string[] = [];
  for (const [name, values] of Object.entries(table14)) {
    values.forEach((printed, index) => {
      const year = 1990 + index;
      const value = getTidalNodeFactor(name as TidalConstituent['name'], year);
      if (Math.abs(value - printed) > 0.01)
        differences.push(`${name} ${year}: ${value} vs ${printed}`);
    });
  }
  expect(differences).toEqual([]);
});
