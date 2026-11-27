// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  getHeightFromSeaPressure,
  getSoundAbsorptionAinslieMcColm,
  getSoundAbsorptionFrancoisGarrison,
  getSoundSpeedChenMillero,
  getSoundSpeedDelGrosso,
  getSoundSpeedMackenzie
} from '@math.gl/earth/ocean';
import {CHEN_MILLERO_IPTS68, evaluateChenMillero} from '../../src/ocean/sound-speed';
import reference from './data/acoustic-reference.json';

// Controls: `modules/earth/scripts/ocean/generate-acoustic-reference.py`, an independent
// 40-digit evaluation of each published equation. It does not reuse the TypeScript code.
// Gates (RFC visgl/math.gl#613): 1e-9 m/s for sound speed, relative 1e-12 for absorption.
const SOUND_SPEED_GATE = 1e-9;
const ABSORPTION_GATE = 1e-12;
const {controls} = reference;

test('ocean#getSoundSpeedChenMillero reproduces the UNESCO check value', () => {
  // Fofonoff and Millard (1983), UNESCO Technical Papers in Marine Science 44, p. 49:
  // "CHECKVALUE: SVEL=1731.995 M/S, S=40 (PSS-78), T=40 DEG C, P=10000 DBAR" (IPTS-68).
  const value = evaluateChenMillero(CHEN_MILLERO_IPTS68, 40, 40, 1000);
  expect(Math.abs(value - 1731.995)).toBeLessThanOrEqual(0.0005);
  expect(Math.abs(value - reference.unescoCheckValue.highPrecision)).toBeLessThanOrEqual(
    SOUND_SPEED_GATE
  );
  // The ITS-90 coefficients of Wong and Zhu (1995) at t90 = 40 / 1.00024 °C stay within
  // the 0.024 m/s change that Wong and Zhu state.
  expect(Math.abs(getSoundSpeedChenMillero(40, 40 / 1.00024, 10000) - 1731.995)).toBeLessThan(
    0.024
  );
});

/**
 * The Millero and Li (1994) correction Cc, m/s, as APL-UW TR 9407 (1994) prints it on p. I-2.
 * The library does not include it; the tests use it to reach the handbook's comparisons.
 */
function getMilleroLiCorrection(temperature: number, pressureBar: number): number {
  const [t, p] = [temperature, pressureBar];
  return (
    (0.0029 - 2.19e-4 * t + 1.4e-5 * t * t) * p +
    (-4.76e-6 + 3.47e-7 * t - 2.59e-8 * t * t) * p * p +
    2.68e-9 * p * p * p
  );
}

/** The Chen-Millero-Li sound speed of the handbook, m/s, from the library's Chen-Millero function. */
function getChenMilleroLi(salinity: number, temperature: number, seaPressure: number): number {
  return (
    getSoundSpeedChenMillero(salinity, temperature, seaPressure) -
    getMilleroLiCorrection(temperature, seaPressure / 10)
  );
}

test('ocean#Chen-Millero arithmetic matches the APL-UW handbook check value', () => {
  // APL-UW TR 9407 (1994), "High-Frequency Ocean Environmental Acoustic Models Handbook",
  // section I.A.1, p. I-2: "C = 1745.0954 for P = 1000 bars, T = 40 °C, S = 40 ‰" for the
  // Chen-Millero-Li form C = UNESCO - Cc, with the Millero and Li (1994) term Cc below.
  // The library does not include the Li term. This test checks only the arithmetic of the
  // UNESCO part, to the fourth decimal; at this point Cc is -13.1 m/s and is not physical.
  const value =
    evaluateChenMillero(CHEN_MILLERO_IPTS68, 40, 40, 1000) - getMilleroLiCorrection(40, 1000);
  expect(Math.abs(value - 1745.0954)).toBeLessThanOrEqual(0.00005);
});

test('ocean#classic sound-speed equations agree within the published bands', () => {
  // These bands find gross coefficient errors (a wrong sign or power of ten); they are not
  // check values. The rows are ocean-like combinations of salinity, temperature (°C) and sea
  // pressure (dbar); warm water does not occur at great depth, and on a full rectangular grid
  // the equations differ by more than the bands.
  const oceanRows = [
    [35, 15, 0],
    [35, 12, 300],
    [34.6, 5, 1000],
    [34.7, 2.5, 3000],
    [34.7, 1.5, 5000],
    [34.7, 1.5, 8000]
  ];
  // APL-UW TR 9407 (1994), p. I-4: Del Grosso and Chen-Millero-Li agree within 0.15 m/s for
  // 0 to 15 °C, salinity 33 to 38 and 0 to about 1000 bar.
  for (const [salinity, temperature, seaPressure] of oceanRows) {
    const difference =
      getSoundSpeedDelGrosso(salinity, temperature, seaPressure) -
      getChenMilleroLi(salinity, temperature, seaPressure);
    expect(Math.abs(difference), `${salinity}, ${temperature}, ${seaPressure}`).toBeLessThanOrEqual(
      0.15
    );
  }
  // p. I-3: Mackenzie and Chen-Millero-Li differ by about ±0.5 m/s. The handbook uses
  // depth = 0.99 × pressure (dbar); that is about 1.5 % too deep at 8000 dbar, so this test takes the
  // depth from getHeightFromSeaPressure at latitude 30°.
  for (const [salinity, temperature, seaPressure] of oceanRows) {
    const difference =
      getSoundSpeedMackenzie(salinity, temperature, -getHeightFromSeaPressure(seaPressure, 30)) -
      getChenMilleroLi(salinity, temperature, seaPressure);
    expect(Math.abs(difference), `${salinity}, ${temperature}, ${seaPressure}`).toBeLessThanOrEqual(
      0.5
    );
  }
});

test('ocean#getSoundSpeedChenMillero matches the high-precision evaluation', () => {
  for (const {inputs, value} of controls.chenMillero) {
    const [s, t, p] = inputs;
    expect(
      Math.abs(getSoundSpeedChenMillero(s, t, p) - value),
      inputs.join(', ')
    ).toBeLessThanOrEqual(SOUND_SPEED_GATE);
  }
});

test('ocean#getSoundSpeedDelGrosso matches the high-precision evaluation', () => {
  // No open source prints a Del Grosso (1974) check value; see the RFC.
  for (const {inputs, value} of controls.delGrosso) {
    const [s, t, p] = inputs;
    expect(
      Math.abs(getSoundSpeedDelGrosso(s, t, p) - value),
      inputs.join(', ')
    ).toBeLessThanOrEqual(SOUND_SPEED_GATE);
  }
});

test('ocean#getSoundSpeedMackenzie matches the high-precision evaluation', () => {
  // No open source prints a Mackenzie (1981) check value; see the RFC.
  for (const {inputs, value} of controls.mackenzie) {
    const [s, t, d] = inputs;
    expect(
      Math.abs(getSoundSpeedMackenzie(s, t, d) - value),
      inputs.join(', ')
    ).toBeLessThanOrEqual(SOUND_SPEED_GATE);
  }
});

test('ocean#getSoundAbsorptionFrancoisGarrison matches the high-precision evaluation', () => {
  for (const {inputs, value} of controls.francoisGarrison) {
    const [frequency, temperature, salinity, depth, pH, soundSpeed] = inputs;
    const actual = getSoundAbsorptionFrancoisGarrison({
      frequency,
      temperature,
      salinity,
      depth,
      pH,
      soundSpeed: soundSpeed ?? undefined
    });
    expect(Math.abs(actual - value) / value, inputs.join(', ')).toBeLessThanOrEqual(
      ABSORPTION_GATE
    );
  }
});

test('ocean#getSoundAbsorptionFrancoisGarrison reproduces the APL-UW Table 2 values', () => {
  // APL-UW TR 9407 (1994), section I.B, Table 2, pp. I-8 to I-10: "Absorption in seawater
  // according to the Francois-Garrison equation (dB/km)", depth 0, pH 8. Gate: half a unit
  // in the last printed digit. The table is a secondary source that tabulates the equation;
  // it does not test the depth or pH terms. The cell at 300 kHz, 10 °C, S = 30 is printed
  // as 76.2, but its neighbours and the equation give about 67.2; it is a misprint and is left out.
  const cells = [
    // [kHz, °C, salinity, printed dB/km, half unit]
    [0.4, -1.8, 35, 0.02, 0.0005],
    [1, 10, 35, 0.06, 0.0005],
    [10, 10, 35, 0.963, 0.0005],
    [28, 10, 35, 6.1, 0.005],
    [100, 10, 30, 29.4, 0.05],
    [100, 10, 35, 33.6, 0.05],
    [200, 20, 35, 77.1, 0.05],
    [300, 10, 35, 73.1, 0.05],
    [400, 25, 35, 146, 0.5],
    [900, 10, 35, 299, 0.5],
    [1000, 0, 35, 515, 0.5],
    [1000, 30, 35, 344, 0.5]
  ];
  for (const [kilohertz, temperature, salinity, printed, halfUnit] of cells) {
    const value = getSoundAbsorptionFrancoisGarrison({
      frequency: kilohertz * 1000,
      temperature,
      salinity,
      depth: 0,
      pH: 8
    });
    expect(
      Math.abs(value - printed),
      `${kilohertz} kHz, ${temperature} °C, S = ${salinity}`
    ).toBeLessThanOrEqual(halfUnit);
  }
});

test('ocean#getSoundAbsorptionAinslieMcColm matches the high-precision evaluation', () => {
  for (const {inputs, value} of controls.ainslieMcColm) {
    const [frequency, temperature, salinity, depth, pH] = inputs;
    const actual = getSoundAbsorptionAinslieMcColm({frequency, temperature, salinity, depth, pH});
    expect(Math.abs(actual - value) / value, inputs.join(', ')).toBeLessThanOrEqual(
      ABSORPTION_GATE
    );
  }
});

test('ocean#absorption formulas agree within the stated 10 %', () => {
  // NPL: Ainslie-McColm is within 10 % of Francois-Garrison from 100 Hz to 1 MHz.
  for (const frequency of [1e3, 1e4, 1e5, 1e6]) {
    const options = {frequency, temperature: 10, salinity: 35, depth: 0, pH: 8};
    const ratio =
      getSoundAbsorptionAinslieMcColm(options) / getSoundAbsorptionFrancoisGarrison(options);
    expect(Math.abs(ratio - 1), `${frequency} Hz`).toBeLessThan(0.1);
  }
});
