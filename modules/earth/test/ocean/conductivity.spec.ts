// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  getConductivityFromPracticalSalinity,
  getPracticalSalinityFromConductivity
} from '@math.gl/earth/ocean';
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

test('ocean#getConductivityFromPracticalSalinity matches gsw_C_from_SP at the GSW check casts', () => {
  const error = maxError(
    casts.map(row => getConductivityFromPracticalSalinity(row.sp, row.t, row.p)),
    casts.map(row => row.c_from_sp)
  );
  expect(error).toBeLessThanOrEqual(tolerance.c_from_sp);
});

test('ocean#getPracticalSalinityFromConductivity matches gsw_SP_from_C at the GSW check casts', () => {
  // GSW checks sp_from_c with its own c_from_sp output as input.
  const error = maxError(
    casts.map(row => getPracticalSalinityFromConductivity(row.c_from_sp, row.t, row.p)),
    casts.map(row => row.sp_from_c)
  );
  expect(error).toBeLessThanOrEqual(tolerance.sp_from_c);
});

test('ocean#PSS-78 matches GSW-C at the domain edges, including the Hill extension', () => {
  const forward = reference.edges.filter(row => row.function === 'c_from_sp');
  const inverse = reference.edges.filter(row => row.function === 'sp_from_c');
  expect(forward.length).toBeGreaterThan(0);
  // One inverse control for each forward control, plus 12 small-conductivity controls.
  expect(inverse.length).toBe(forward.length + 12);
  for (const {inputs, value} of forward) {
    const [sp, t, p] = inputs;
    const actual = getConductivityFromPracticalSalinity(sp, t, p);
    expect(Math.abs(actual - value), `c_from_sp(${inputs})`).toBeLessThanOrEqual(
      tolerance.c_from_sp
    );
  }
  for (const {inputs, value} of inverse) {
    const [c, t, p] = inputs;
    if (value === null) {
      // GSW-C returns GSW_INVALID_VALUE: the extended scale is below 0.
      expect(() => getPracticalSalinityFromConductivity(c, t, p), `sp_from_c(${inputs})`).toThrow(
        RangeError
      );
      continue;
    }
    const actual = getPracticalSalinityFromConductivity(c, t, p);
    expect(Math.abs(actual - value), `sp_from_c(${inputs})`).toBeLessThanOrEqual(
      tolerance.sp_from_c
    );
  }
});

test('ocean#PSS-78 matches GSW-C at small conductivity', () => {
  const small = reference.edges.filter(
    row => row.function === 'sp_from_c' && row.inputs[0] <= 0.002 && row.inputs[2] === 0
  );
  expect(small.length).toBe(12);
  expect(small.filter(row => row.value === null).length).toBeGreaterThan(0);
  expect(small.filter(row => row.value !== null).length).toBeGreaterThan(0);
  // C = 0 gives SP = 0 at every temperature.
  for (const t of [-2, 0, 20, 35]) {
    expect(getPracticalSalinityFromConductivity(0, t, 0)).toBe(0);
  }
});

test('ocean#PSS-78 round trip stays within the forward gate', () => {
  for (const sp of [0, 0.5, 1.99, 2, 2.01, 10, 35, 42]) {
    for (const t of [-2, 10, 35]) {
      for (const p of [0, 4000, 10000]) {
        const conductivity = getConductivityFromPracticalSalinity(sp, t, p);
        const roundTrip = getPracticalSalinityFromConductivity(conductivity, t, p);
        expect(Math.abs(roundTrip - sp), `SP ${sp}, t ${t}, p ${p}`).toBeLessThanOrEqual(
          tolerance.sp_from_c
        );
      }
    }
  }
});

test('ocean#PSS-78 rejects inputs outside the domain', () => {
  expect(() => getPracticalSalinityFromConductivity(-1, 10, 0)).toThrow(RangeError);
  expect(() => getPracticalSalinityFromConductivity(42.914, 10, 10001)).toThrow(RangeError);
  expect(() => getPracticalSalinityFromConductivity(42.914, 36, 0)).toThrow(RangeError);
  expect(() => getPracticalSalinityFromConductivity(100, 10, 0)).toThrow(RangeError); // SP > 42
  expect(() => getConductivityFromPracticalSalinity(42.1, 10, 0)).toThrow(RangeError);
  expect(() => getConductivityFromPracticalSalinity(Number.NaN, 10, 0)).toThrow(RangeError);
  expect(getPracticalSalinityFromConductivity(0, 10, 0)).toBeCloseTo(0, 9);
});
