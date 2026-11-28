// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  MAX_ABSOLUTE_SALINITY,
  MAX_REFERENCE_PRESSURE,
  MAX_SEA_PRESSURE,
  MAX_TEMPERATURE,
  MIN_TEMPERATURE
} from './constants';
import {checkRange} from './domain';
import {getEntropy, getTemperatureFromEntropy} from './gibbs-function';
import {checkFunnel} from './seawater-state';
import {evaluateSpecificVolume} from './specific-volume';

/**
 * Returns the potential temperature of seawater at a reference pressure.
 *
 * Potential temperature θ is the temperature that a seawater parcel has after an adiabatic,
 * isohaline move from `seaPressure` to `referencePressure`. The function finds θ with a
 * Newton iteration on the entropy of the TEOS-10 Gibbs function: η(SA, θ, p_ref) = η(SA, t, p).
 *
 * Reference: TEOS-10 manual, section 3.1. GSW counterpart: `gsw_pt_from_t`.
 * @param absoluteSalinity - Absolute Salinity SA, g/kg, from 0 to 42.
 * @param temperature - In-situ temperature t, °C (ITS-90), from -3 to 40.
 * @param seaPressure - Sea pressure p, dbar, from 0 to 8000.
 * @param referencePressure - Reference sea pressure p_ref, dbar, from 0 to 10 000. The default is 0.
 * @returns Potential temperature θ at `referencePressure`, °C (ITS-90).
 * @throws {RangeError} When an input is not finite or is outside the domain.
 */
export function getPotentialTemperature(
  absoluteSalinity: number,
  temperature: number,
  seaPressure: number,
  referencePressure = 0
): number {
  checkRange('absoluteSalinity', absoluteSalinity, 0, MAX_ABSOLUTE_SALINITY);
  checkRange('temperature', temperature, MIN_TEMPERATURE, MAX_TEMPERATURE);
  checkRange('seaPressure', seaPressure, 0, MAX_SEA_PRESSURE);
  checkRange('referencePressure', referencePressure, 0, MAX_REFERENCE_PRESSURE);
  if (seaPressure === referencePressure) {
    return temperature;
  }
  const entropy = getEntropy(absoluteSalinity, temperature, seaPressure);
  return getTemperatureFromEntropy(absoluteSalinity, entropy, referencePressure, temperature);
}

/**
 * Returns the potential density of seawater at a reference pressure.
 *
 * Potential density is the density that a seawater parcel has after an adiabatic, isohaline
 * move to `referencePressure`. Because SA and Θ do not change in that move, the function
 * evaluates the 75-term polynomial for specific volume at (SA, Θ, p_ref).
 *
 * Reference: Roquet et al. (2015); TEOS-10 manual, section 3.4. GSW counterparts: `gsw_sigma0`
 * (plus 1000 kg/m³) at 0 dbar, and `gsw_rho(SA, CT, p_ref)` at other reference pressures.
 * @param absoluteSalinity - Absolute Salinity SA, g/kg.
 * @param conservativeTemperature - Conservative Temperature Θ, °C (ITS-90).
 * @param referencePressure - Reference sea pressure p_ref, dbar. The default is 0.
 * @returns Potential density ρ at `referencePressure`, kg/m³.
 * @throws {RangeError} When (SA, Θ, p_ref) is not finite or is outside the oceanographic
 * funnel (see `getSeawaterDensity`). Thus p_ref is at most 8000 dbar.
 */
export function getPotentialDensity(
  absoluteSalinity: number,
  conservativeTemperature: number,
  referencePressure = 0
): number {
  checkFunnel(absoluteSalinity, conservativeTemperature, referencePressure);
  return (
    1 /
    evaluateSpecificVolume(absoluteSalinity, conservativeTemperature, referencePressure)
      .specificVolume
  );
}
