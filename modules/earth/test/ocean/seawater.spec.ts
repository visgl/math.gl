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
  getSeawaterSoundSpeed
} from '@math.gl/earth/ocean';
import reference from './data/seawater-reference.json';

// Controls: GSW-C 3.06.16 (TEOS-10/GSW-C commit db75c391), `gsw_check_data.h`.
// The casts store GSW MATLAB 3.06.16 inputs and outputs; the gates are the GSW check
// tolerances (`*_ca`) from the same file. Edge controls come from the unmodified GSW-C,
// compiled offline by `modules/earth/scripts/ocean/generate-seawater-reference.py`.
type Cast = (typeof reference.casts)[number];
const casts: Cast[] = reference.casts;
const tolerance = reference.tolerances;
/** Cast 2 is in the Baltic Sea, where GSW uses a special Absolute Salinity relation. */
const openOceanCasts = casts.filter(row => row.cast !== 2);

/** Returns the largest absolute difference between two lists. */
function maxError(actual: number[], expected: number[]): number {
  return Math.max(...actual.map((value, index) => Math.abs(value - expected[index])));
}

test('ocean#getReferenceSalinity matches gsw_SR_from_SP at the GSW check casts', () => {
  expect(casts).toHaveLength(98);
  const error = maxError(
    casts.map(row => getReferenceSalinity(row.sp)),
    casts.map(row => row.sr_from_sp)
  );
  expect(error).toBeLessThanOrEqual(tolerance.sr_from_sp);
});

test('ocean#getAbsoluteSalinity with the atlas anomaly matches gsw_SA_from_SP outside the Baltic', () => {
  expect(openOceanCasts).toHaveLength(90);
  const error = maxError(
    openOceanCasts.map(row => getAbsoluteSalinity(row.sp, row.deltasa_from_sp)),
    openOceanCasts.map(row => row.sa_from_sp)
  );
  expect(error).toBeLessThanOrEqual(tolerance.sa_from_sp);
  expect(getAbsoluteSalinity(35)).toBe(getReferenceSalinity(35));
});

test('ocean#getConservativeTemperature matches gsw_CT_from_t at the GSW check casts', () => {
  const error = maxError(
    casts.map(row => getConservativeTemperature(row.sa, row.t, row.p)),
    casts.map(row => row.ct_from_t)
  );
  expect(error).toBeLessThanOrEqual(tolerance.ct_from_t);
});

test('ocean#getSeawaterDensity matches gsw_rho at the GSW check casts', () => {
  const error = maxError(
    casts.map(row => getSeawaterDensity(row.sa, row.ct, row.p)),
    casts.map(row => row.rho)
  );
  expect(error).toBeLessThanOrEqual(tolerance.rho);
});

test('ocean#getSeawaterSoundSpeed matches gsw_sound_speed at the GSW check casts', () => {
  const error = maxError(
    casts.map(row => getSeawaterSoundSpeed(row.sa, row.ct, row.p)),
    casts.map(row => row.sound_speed)
  );
  expect(error).toBeLessThanOrEqual(tolerance.sound_speed);
});

test('ocean#getSeawaterFreezingTemperature matches gsw_t_freezing_poly at the GSW check casts', () => {
  // The GSW check values use an air saturation fraction of 0.5.
  const error = maxError(
    casts.map(row => getSeawaterFreezingTemperature(row.sa, row.p, 0.5)),
    casts.map(row => row.t_freezing_poly)
  );
  expect(error).toBeLessThanOrEqual(tolerance.t_freezing_poly);
});

test('ocean#getHeightFromSeaPressure and getSeaPressureFromHeight match gsw_z_from_p and gsw_p_from_z', () => {
  const heightError = maxError(
    casts.map(row => getHeightFromSeaPressure(row.p, row.lat)),
    casts.map(row => row.z_from_p)
  );
  expect(heightError).toBeLessThanOrEqual(tolerance.z_from_p);
  const pressureError = maxError(
    casts.map(row => getSeaPressureFromHeight(row.z_from_p, row.lat)),
    casts.map(row => row.p_from_z)
  );
  expect(pressureError).toBeLessThanOrEqual(tolerance.p_from_z);
});

test('ocean#seawater functions match GSW-C at the edges of the declared domain', () => {
  for (const {function: name, inputs, value} of reference.edges) {
    // The O6a controls (PSS-78, potential temperature, reference density) get their own tests.
    if (['c_from_sp', 'sp_from_c', 'pt_from_t', 'rho_ref'].includes(name)) {
      continue;
    }
    const [a, b, c, d] = inputs;
    let actual: number;
    let gate: number;
    switch (name) {
      case 'rho':
        [actual, gate] = [getSeawaterDensity(a, b, c), tolerance.rho];
        break;
      case 'sound_speed':
        [actual, gate] = [getSeawaterSoundSpeed(a, b, c), tolerance.sound_speed];
        break;
      case 'ct_from_t':
        [actual, gate] = [getConservativeTemperature(a, b, c), tolerance.ct_from_t];
        break;
      case 'freezing':
        [actual, gate] = [getSeawaterFreezingTemperature(a, b, c), tolerance.t_freezing_poly];
        break;
      case 'z_from_p':
        actual = getHeightFromSeaPressure(a, b, {
          dynamicHeightAnomaly: c,
          seaSurfaceGeopotential: d
        });
        gate = tolerance.z_from_p;
        break;
      case 'p_from_z':
        actual = getSeaPressureFromHeight(a, b, {
          dynamicHeightAnomaly: c,
          seaSurfaceGeopotential: d
        });
        gate = tolerance.p_from_z;
        break;
      default:
        throw new Error(`Unknown control ${name}`);
    }
    expect(Math.abs(actual - value), `${name}(${inputs.join(', ')})`).toBeLessThanOrEqual(gate);
  }
});
