// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {getPotentialDensity, getPotentialTemperature} from '@math.gl/earth/ocean';
import reference from './data/seawater-reference.json';

// Controls: GSW-C 3.06.16, `gsw_check_data.h` (casts and gates) and the unmodified GSW-C
// compiled offline (edges). See `seawater.spec.ts` for the provenance.
type Cast = (typeof reference.casts)[number];
const casts: Cast[] = reference.casts;
const tolerance = reference.tolerances;

/** Returns the largest absolute difference between two lists. */
function maxError(actual: number[], expected: number[]): number {
  return Math.max(...actual.map((value, index) => Math.abs(value - expected[index])));
}

test('ocean#getPotentialTemperature matches gsw_pt_from_t (p_ref 0) at the GSW check casts', () => {
  const error = maxError(
    casts.map(row => getPotentialTemperature(row.sa, row.t, row.p)),
    casts.map(row => row.pt_from_t)
  );
  expect(error).toBeLessThanOrEqual(tolerance.pt_from_t);
});

test('ocean#getPotentialTemperature matches GSW-C at other reference pressures', () => {
  const rows = reference.edges.filter(row => row.function === 'pt_from_t');
  expect(rows.length).toBeGreaterThan(0);
  for (const {inputs, value} of rows) {
    const [sa, t, p, referencePressure] = inputs;
    const actual = getPotentialTemperature(sa, t, p, referencePressure);
    expect(Math.abs(actual - value), `pt_from_t(${inputs})`).toBeLessThanOrEqual(
      tolerance.pt_from_t
    );
  }
});

test('ocean#getPotentialDensity matches gsw_sigma0 + 1000 at the GSW check casts', () => {
  const error = maxError(
    casts.map(row => getPotentialDensity(row.sa, row.ct) - 1000),
    casts.map(row => row.sigma0)
  );
  expect(error).toBeLessThanOrEqual(tolerance.sigma0);
});

test('ocean#getPotentialDensity matches gsw_rho at a reference pressure', () => {
  const rows = reference.edges.filter(row => row.function === 'rho_ref');
  expect(rows.length).toBeGreaterThan(0);
  for (const {inputs, value} of rows) {
    const [sa, ct, referencePressure] = inputs;
    // gsw_rho does not check the funnel. From 500 to 6500 dbar the funnel limits Θ to
    // 31.67 - 0.003333 p, so (36, 25, 4000) is outside it and must throw here.
    if (referencePressure >= 500 && ct > 31.66666666666667 - referencePressure / 300) {
      expect(() => getPotentialDensity(sa, ct, referencePressure)).toThrow(RangeError);
      continue;
    }
    const actual = getPotentialDensity(sa, ct, referencePressure);
    expect(Math.abs(actual - value), `rho_ref(${inputs})`).toBeLessThanOrEqual(tolerance.rho);
  }
});

test('ocean#potential properties reject inputs outside the domain', () => {
  // At p = p_ref the result is the input.
  expect(getPotentialTemperature(35, 10, 0)).toBe(10);
  expect(() => getPotentialTemperature(35, 10, 9000)).toThrow(RangeError);
  expect(() => getPotentialTemperature(35, 10, 0, 10001)).toThrow(RangeError);
  expect(() => getPotentialTemperature(35, 10, 0, Number.NaN)).toThrow(RangeError);
  expect(() => getPotentialDensity(35, 10, 8001)).toThrow(RangeError);
  expect(() => getPotentialDensity(Number.NaN, 10)).toThrow(RangeError);
});
