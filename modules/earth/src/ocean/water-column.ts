// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {PASCALS_PER_DECIBAR} from './constants';
import {GRAVITY_GRADIENT, getHeightFromSeaPressure, getSurfaceGravity} from './sea-pressure';
import {checkFunnel} from './seawater-state';
import {evaluateSpecificVolumeDerivatives} from './specific-volume';

/** Buoyancy frequency squared between adjacent levels of a cast. */
export type BuoyancyFrequencySquared = {
  /** N², 1/s², one value for each pair of adjacent levels (length n - 1). */
  buoyancyFrequencySquared: Float64Array;
  /** Sea pressure at the mid-point of each pair, dbar (length n - 1). */
  midPressure: Float64Array;
};

/** Throws a `RangeError` when an array does not have the cast length. */
function checkLength(name: string, values: ArrayLike<number>, length: number): void {
  if (values.length !== length) {
    throw new RangeError(`${name} must have ${length} values, got ${values.length}`);
  }
}

/** Throws a `RangeError` that names the index when a value is not finite. */
function checkFiniteAt(name: string, value: number, index: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number at index ${index}, got ${value}`);
  }
}

/**
 * Returns the square of the buoyancy (Brunt-Väisälä) frequency between adjacent levels of a cast.
 *
 * For each pair of levels k and k + 1, SA, Θ and p are averaged to the mid-point, where ρ, α
 * and β come from the 75-term polynomial. Then
 * `N² = g² ρ (β ΔSA - α ΔΘ) / ΔP`, with ΔP the pressure difference in Pa and g the mean of
 * the gravity at the two levels. Gravity at a level is `g(φ) (1 - γ z)` with γ = 2.26e-7 /m
 * and z from {@link getHeightFromSeaPressure}.
 *
 * Reference: TEOS-10 manual, section 3.10. GSW counterpart: `gsw_Nsquared`.
 * @param absoluteSalinity - Absolute Salinity SA of each level, g/kg.
 * @param conservativeTemperature - Conservative Temperature Θ of each level, °C (ITS-90).
 * @param seaPressure - Sea pressure p of each level, dbar, strictly increasing.
 * @param latitude - Latitude φ, degrees, from -90 to 90: one value for the cast or one per level.
 * @returns N², 1/s², and the mid-point pressures, dbar, each with n - 1 values.
 * @throws {RangeError} When the arrays have different lengths or fewer than 2 levels, when a
 * value is not finite, when the pressures do not increase, or when a level is outside the
 * oceanographic funnel. The message names the index of the first bad level.
 */
export function getBuoyancyFrequencySquared(
  absoluteSalinity: ArrayLike<number>,
  conservativeTemperature: ArrayLike<number>,
  seaPressure: ArrayLike<number>,
  latitude: number | ArrayLike<number>
): BuoyancyFrequencySquared {
  const levels = absoluteSalinity.length;
  if (levels < 2) {
    throw new RangeError(`absoluteSalinity must have at least 2 levels, got ${levels}`);
  }
  checkLength('conservativeTemperature', conservativeTemperature, levels);
  checkLength('seaPressure', seaPressure, levels);
  if (typeof latitude !== 'number') checkLength('latitude', latitude, levels);

  const gravity = new Float64Array(levels);
  for (let index = 0; index < levels; index++) {
    const lat = typeof latitude === 'number' ? latitude : latitude[index];
    checkFiniteAt('absoluteSalinity', absoluteSalinity[index], index);
    checkFiniteAt('conservativeTemperature', conservativeTemperature[index], index);
    checkFiniteAt('seaPressure', seaPressure[index], index);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new RangeError(
        `latitude must be a finite number from -90 to 90 at index ${index}, got ${lat}`
      );
    }
    if (index > 0 && !(seaPressure[index] > seaPressure[index - 1])) {
      throw new RangeError(
        `seaPressure must increase strictly; index ${index} has ${seaPressure[index]} after ${seaPressure[index - 1]}`
      );
    }
  }
  for (let index = 0; index < levels; index++) {
    const lat = typeof latitude === 'number' ? latitude : latitude[index];
    try {
      checkFunnel(absoluteSalinity[index], conservativeTemperature[index], seaPressure[index]);
    } catch (error) {
      throw new RangeError(`level at index ${index}: ${(error as Error).message}`);
    }
    const surfaceGravity = getSurfaceGravity(lat);
    const height = getHeightFromSeaPressure(seaPressure[index], lat, {surfaceGravity});
    gravity[index] = surfaceGravity * (1 - GRAVITY_GRADIENT * height);
  }

  const buoyancyFrequencySquared = new Float64Array(levels - 1);
  const midPressure = new Float64Array(levels - 1);
  for (let k = 0; k < levels - 1; k++) {
    const pMid = 0.5 * (seaPressure[k] + seaPressure[k + 1]);
    const {specificVolume, specificVolumeSalinity, specificVolumeTemperature} =
      evaluateSpecificVolumeDerivatives(
        0.5 * (absoluteSalinity[k] + absoluteSalinity[k + 1]),
        0.5 * (conservativeTemperature[k] + conservativeTemperature[k + 1]),
        pMid
      );
    const density = 1 / specificVolume;
    const alpha = specificVolumeTemperature / specificVolume;
    const beta = -specificVolumeSalinity / specificVolume;
    const gravityMid = 0.5 * (gravity[k] + gravity[k + 1]);
    const deltaPressure = (seaPressure[k + 1] - seaPressure[k]) * PASCALS_PER_DECIBAR;
    buoyancyFrequencySquared[k] =
      ((gravityMid * gravityMid * density) / deltaPressure) *
      (beta * (absoluteSalinity[k + 1] - absoluteSalinity[k]) -
        alpha * (conservativeTemperature[k + 1] - conservativeTemperature[k]));
    midPressure[k] = pMid;
  }
  return {buoyancyFrequencySquared, midPressure};
}
