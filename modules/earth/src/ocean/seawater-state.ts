// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Freezing coefficients from McDougall, Barker, Feistel and Galton-Fenzi (2014), J. Phys. Oceanogr. 44, 1751-1775.

import {
  MAX_ABSOLUTE_SALINITY,
  MAX_SEA_PRESSURE,
  MAX_TEMPERATURE,
  MIN_TEMPERATURE,
  STANDARD_OCEAN_SALINITY
} from './constants';
import {checkFinite, checkRange} from './domain';
import {
  getConservativeTemperatureFromPotential,
  getEntropy,
  getPotentialTemperatureFromConservative,
  getTemperatureFromEntropy
} from './gibbs-function';
import {evaluateSpecificVolume} from './specific-volume';

/**
 * Coefficients c0 to c22 of the polynomial for the Conservative Temperature at which
 * air-free seawater freezes, as fit by McDougall, Barker, Feistel and Galton-Fenzi (2014),
 * "Melting of ice and sea ice into seawater and frazil ice formation", J. Phys. Oceanogr. 44,
 * 1751-1775, doi:10.1175/JPO-D-13-0253.1.
 */
// biome-ignore format: keep one row per coefficient group
const FREEZING_COEFFICIENTS = [
  0.017947064327968736, -6.076099099929818, 4.883198653547851, -11.88081601230542,
  13.34658511480257, -8.722761043208607, 2.082038908808201, -7.389420998107497,
  -2.110913185058476, 0.2295491578006229, -0.9891538123307282, -0.08987150128406496,
  0.3831132432071728, 1.054318231187074, 1.065556599652796, -0.7997496801694032,
  0.3850133554097069, -2.078616693017569, 0.8756340772729538, -2.079022768390933,
  1.596435439942262, 0.1338002171109174, 1.242891021876471
];

/** Coefficient a of the dissolved-air term of the same fit. */
const AIR_A = 0.014289763856964;
/** Coefficient b of the dissolved-air term of the same fit. */
const AIR_B = 0.05700064989972;

/**
 * Returns the Conservative Temperature at which seawater freezes (polynomial fit).
 * @param absoluteSalinity - Absolute Salinity, g/kg.
 * @param seaPressure - Sea pressure, dbar.
 * @param airSaturationFraction - Saturation fraction of dissolved air, from 0 to 1.
 */
export function getFreezingConservativeTemperature(
  absoluteSalinity: number,
  seaPressure: number,
  airSaturationFraction: number
): number {
  const c = FREEZING_COEFFICIENTS;
  const s = absoluteSalinity * 1e-2;
  const x = Math.sqrt(s);
  const p = seaPressure * 1e-4;
  const airFree =
    c[0] +
    s * (c[1] + x * (c[2] + x * (c[3] + x * (c[4] + x * (c[5] + c[6] * x))))) +
    p * (c[7] + p * (c[8] + c[9] * p)) +
    s *
      p *
      (c[10] +
        p * (c[12] + p * (c[15] + c[21] * s)) +
        s * (c[13] + c[17] * p + c[19] * s) +
        x * (c[11] + p * (c[14] + c[18] * p) + s * (c[16] + c[20] * p + c[22] * s)));
  const airCorrection =
    airSaturationFraction *
    1e-3 *
    (2.4 - AIR_A * absoluteSalinity) *
    (1 + AIR_B * (1 - absoluteSalinity / STANDARD_OCEAN_SALINITY));
  return airFree - airCorrection;
}

/**
 * Throws a `RangeError` when (SA, Θ, p) is outside the oceanographic funnel of
 * Roquet et al. (2015), the domain of the 75-term polynomial.
 *
 * The limits follow GSW `gsw_infunnel`, with two differences: the freezing limit uses the
 * polynomial freezing temperature, and Θ is also at most 40 °C below 500 dbar.
 */
export function checkFunnel(
  absoluteSalinity: number,
  conservativeTemperature: number,
  seaPressure: number
): void {
  checkRange('absoluteSalinity', absoluteSalinity, 0, MAX_ABSOLUTE_SALINITY);
  checkRange('seaPressure', seaPressure, 0, MAX_SEA_PRESSURE);
  checkFinite('conservativeTemperature', conservativeTemperature);
  const freezing = getFreezingConservativeTemperature(
    absoluteSalinity,
    Math.min(seaPressure, 500),
    0
  );
  let maxTemperature = MAX_TEMPERATURE;
  let minSalinity = 0;
  if (seaPressure >= 6500) {
    maxTemperature = 10;
    minSalinity = 30;
  } else if (seaPressure >= 500) {
    maxTemperature = 31.66666666666667 - seaPressure * 3.333333333333334e-3;
    minSalinity = seaPressure * 5e-3 - 2.5;
  }
  if (absoluteSalinity < minSalinity) {
    throw new RangeError(
      `absoluteSalinity must be at least ${minSalinity} g/kg at ${seaPressure} dbar, got ${absoluteSalinity}`
    );
  }
  checkRange('conservativeTemperature', conservativeTemperature, freezing, maxTemperature);
}

/**
 * Returns Conservative Temperature from in-situ temperature.
 *
 * The function first finds the potential temperature θ (reference pressure 0 dbar) with a
 * Newton iteration on the entropy of the TEOS-10 Gibbs function. It then evaluates the
 * potential enthalpy h0(SA, θ) and returns Θ = h0 / c_p0.
 *
 * Reference: TEOS-10 manual, section 3.3. GSW counterpart: `gsw_CT_from_t`.
 * @param absoluteSalinity - Absolute Salinity SA, g/kg, from 0 to 42.
 * @param temperature - In-situ temperature t, °C (ITS-90), from -3 to 40.
 * @param seaPressure - Sea pressure p, dbar, from 0 to 8000.
 * @returns Conservative Temperature Θ, °C (ITS-90).
 * @throws {RangeError} When an input is not finite or is outside the domain.
 */
export function getConservativeTemperature(
  absoluteSalinity: number,
  temperature: number,
  seaPressure: number
): number {
  checkRange('absoluteSalinity', absoluteSalinity, 0, MAX_ABSOLUTE_SALINITY);
  checkRange('temperature', temperature, MIN_TEMPERATURE, MAX_TEMPERATURE);
  checkRange('seaPressure', seaPressure, 0, MAX_SEA_PRESSURE);
  const entropy = getEntropy(absoluteSalinity, temperature, seaPressure);
  const potentialTemperature = getTemperatureFromEntropy(absoluteSalinity, entropy, 0, temperature);
  return getConservativeTemperatureFromPotential(absoluteSalinity, potentialTemperature);
}

/**
 * Returns the in-situ density of seawater from the 75-term polynomial for specific volume.
 *
 * Reference: Roquet et al. (2015); TEOS-10 manual, appendices A.30 and K. GSW counterpart: `gsw_rho`.
 * @param absoluteSalinity - Absolute Salinity SA, g/kg.
 * @param conservativeTemperature - Conservative Temperature Θ, °C (ITS-90).
 * @param seaPressure - Sea pressure p, dbar.
 * @returns In-situ density ρ, kg/m³.
 * @throws {RangeError} When (SA, Θ, p) is not finite or is outside the oceanographic funnel:
 * 0 ≤ SA ≤ 42 g/kg; 0 ≤ p ≤ 8000 dbar; Θ not below the freezing temperature (at p, or at
 * 500 dbar when p ≥ 500); Θ ≤ 40 °C; from 500 to 6500 dbar, SA ≥ 0.005 p - 2.5 and
 * Θ ≤ 31.67 - 0.003333 p; from 6500 dbar, SA ≥ 30 and Θ ≤ 10 °C.
 */
export function getSeawaterDensity(
  absoluteSalinity: number,
  conservativeTemperature: number,
  seaPressure: number
): number {
  checkFunnel(absoluteSalinity, conservativeTemperature, seaPressure);
  return (
    1 /
    evaluateSpecificVolume(absoluteSalinity, conservativeTemperature, seaPressure).specificVolume
  );
}

/**
 * Returns the speed of sound in seawater from the 75-term polynomial for specific volume.
 *
 * c = sqrt(∂P/∂ρ) at constant entropy = v / sqrt(-∂v/∂P), where the derivative is taken at
 * constant SA and Θ (TEOS-10 manual, eq. 2.17.1). Reference: Roquet et al. (2015). GSW counterpart: `gsw_sound_speed`.
 * @param absoluteSalinity - Absolute Salinity SA, g/kg.
 * @param conservativeTemperature - Conservative Temperature Θ, °C (ITS-90).
 * @param seaPressure - Sea pressure p, dbar.
 * @returns Speed of sound, m/s.
 * @throws {RangeError} When (SA, Θ, p) is not finite or is outside the oceanographic funnel
 * (see {@link getSeawaterDensity}).
 */
export function getSeawaterSoundSpeed(
  absoluteSalinity: number,
  conservativeTemperature: number,
  seaPressure: number
): number {
  checkFunnel(absoluteSalinity, conservativeTemperature, seaPressure);
  const {specificVolume, specificVolumeZeta} = evaluateSpecificVolume(
    absoluteSalinity,
    conservativeTemperature,
    seaPressure
  );
  // ∂v/∂P = 1e-8 ∂v/∂ζ, because ζ = p / 10^4 dbar and 1 dbar = 10^4 Pa.
  return 1e4 * Math.sqrt(-(specificVolume * specificVolume) / specificVolumeZeta);
}

/**
 * Returns the in-situ temperature at which seawater freezes.
 *
 * The function evaluates the polynomial for the freezing Conservative Temperature of
 * McDougall et al. (2014) and converts it to in-situ temperature with the Gibbs function.
 * GSW states an error of -5e-4 K to 6e-4 K for the Conservative Temperature polynomial
 * against the exact freezing temperature.
 *
 * GSW counterpart: `gsw_t_freezing_poly`.
 * @param absoluteSalinity - Absolute Salinity SA, g/kg, from 0 to 42.
 * @param seaPressure - Sea pressure p, dbar, from 0 to 8000.
 * @param airSaturationFraction - Saturation fraction of dissolved air, from 0 (air-free) to 1 (saturated).
 * @returns In-situ freezing temperature, °C (ITS-90).
 * @throws {RangeError} When an input is not finite or is outside the domain.
 */
export function getSeawaterFreezingTemperature(
  absoluteSalinity: number,
  seaPressure: number,
  airSaturationFraction: number
): number {
  checkRange('absoluteSalinity', absoluteSalinity, 0, MAX_ABSOLUTE_SALINITY);
  checkRange('seaPressure', seaPressure, 0, MAX_SEA_PRESSURE);
  checkRange('airSaturationFraction', airSaturationFraction, 0, 1);
  const conservativeTemperature = getFreezingConservativeTemperature(
    absoluteSalinity,
    seaPressure,
    airSaturationFraction
  );
  const potentialTemperature = getPotentialTemperatureFromConservative(
    absoluteSalinity,
    conservativeTemperature
  );
  const entropy = getEntropy(absoluteSalinity, potentialTemperature, 0);
  return getTemperatureFromEntropy(absoluteSalinity, entropy, seaPressure, potentialTemperature);
}
