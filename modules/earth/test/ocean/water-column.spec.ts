// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {getBuoyancyFrequencySquared} from '@math.gl/earth/ocean';
import reference from './data/seawater-reference.json';

// Controls: GSW-C 3.06.16, `gsw_check_data.h` (casts, gsw_Nsquared values and gates).
// See `seawater.spec.ts` for the provenance.
type Cast = (typeof reference.casts)[number];
const casts: Cast[] = reference.casts;
const tolerance = reference.tolerances;

/** Returns the largest absolute difference between two lists. */
function maxError(actual: number[], expected: number[]): number {
  return Math.max(...actual.map((value, index) => Math.abs(value - expected[index])));
}

test('ocean#getBuoyancyFrequencySquared matches gsw_Nsquared on the three GSW check casts', () => {
  expect(reference.nsquared).toHaveLength(3);
  for (const {cast, n2, p_mid} of reference.nsquared) {
    const rows = casts.filter(row => row.cast === cast);
    const result = getBuoyancyFrequencySquared(
      rows.map(row => row.sa),
      rows.map(row => row.ct),
      rows.map(row => row.p),
      rows.map(row => row.lat)
    );
    expect(result.buoyancyFrequencySquared).toHaveLength(rows.length - 1);
    expect(result.midPressure).toHaveLength(rows.length - 1);
    expect(n2).toHaveLength(rows.length - 1);
    expect(maxError([...result.buoyancyFrequencySquared], n2), `cast ${cast}`).toBeLessThanOrEqual(
      tolerance.n2
    );
    expect(maxError([...result.midPressure], p_mid), `cast ${cast}`).toBeLessThanOrEqual(
      tolerance.p_mid_n2
    );
  }
});

test('ocean#getBuoyancyFrequencySquared accepts one latitude for the cast', () => {
  const rows = casts.filter(row => row.cast === 0);
  const sa = rows.map(row => row.sa);
  const ct = rows.map(row => row.ct);
  const p = rows.map(row => row.p);
  const fromArray = getBuoyancyFrequencySquared(
    sa,
    ct,
    p,
    rows.map(row => row.lat)
  );
  const fromNumber = getBuoyancyFrequencySquared(sa, ct, p, rows[0].lat);
  expect(fromNumber.buoyancyFrequencySquared).toEqual(fromArray.buoyancyFrequencySquared);
  expect(fromNumber.midPressure).toEqual(fromArray.midPressure);
});

test('ocean#getBuoyancyFrequencySquared validates the cast arrays', () => {
  const sa = [35, 35.1, 35.2];
  const ct = [20, 15, 10];
  const p = [0, 100, 200];
  expect(
    getBuoyancyFrequencySquared(sa.slice(0, 2), ct.slice(0, 2), p.slice(0, 2), 30).midPressure
  ).toEqual(new Float64Array([50]));
  // Fewer than 2 levels.
  expect(() => getBuoyancyFrequencySquared([35], [20], [0], 30)).toThrow(RangeError);
  // Length mismatch.
  expect(() => getBuoyancyFrequencySquared(sa, ct.slice(0, 2), p, 30)).toThrow(RangeError);
  // Latitude length.
  expect(() => getBuoyancyFrequencySquared(sa, ct, p, [30, 30])).toThrow(RangeError);
  // Repeated pressure.
  expect(() => getBuoyancyFrequencySquared(sa, ct, [0, 100, 100], 30)).toThrow(/index 2/);
  // Unsorted pressure.
  expect(() => getBuoyancyFrequencySquared(sa, ct, [0, 200, 100], 30)).toThrow(/index 2/);
  // NaN level.
  expect(() => getBuoyancyFrequencySquared(sa, [20, Number.NaN, 10], p, 30)).toThrow(/index 1/);
  // Latitude out of range.
  expect(() => getBuoyancyFrequencySquared(sa, ct, p, 91)).toThrow(RangeError);
  expect(() => getBuoyancyFrequencySquared(sa, ct, p, [30, 91, 30])).toThrow(/index 1/);
  // A level outside the funnel.
  expect(() => getBuoyancyFrequencySquared(sa, [20, 15, 45], p, 30)).toThrow(RangeError);
});
