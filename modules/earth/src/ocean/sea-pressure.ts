// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {MAX_SEA_PRESSURE, PASCALS_PER_DECIBAR} from './constants';
import {checkFinite, checkRange} from './domain';
import {getStandardOceanSpecificVolumeCoefficients} from './specific-volume';

/** Options for {@link getHeightFromSeaPressure} and {@link getSeaPressureFromHeight}. */
export type SeaPressureHeightOptions = {
  /**
   * Dynamic height anomaly Ψ, m²/s², of the water column relative to the sea surface; default 0.
   * With 0 the function assumes a standard ocean (SA = 35.16504 g/kg, Θ = 0 °C).
   * GSW argument: `geo_strf_dyn_height`.
   */
  dynamicHeightAnomaly?: number;
  /** Geopotential at zero sea pressure, m²/s²; default 0. GSW argument: `sea_surface_geopotential`. */
  seaSurfaceGeopotential?: number;
  /**
   * Gravity at the sea surface, m/s². The default is the GSW formula
   * `9.780327 (1 + (5.2792e-3 + 2.32e-5 sin²φ) sin²φ)`. A caller can pass a measured value
   * or a normal-gravity value instead.
   */
  surfaceGravity?: number;
};

/** Vertical gradient of gravity in the ocean, 1/m (TEOS-10 manual, section 3.32). */
const GRAVITY_GRADIENT = 2.26e-7;

/** Returns surface gravity, m/s², from the options or from the GSW formula. */
function getSurfaceGravity(latitude: number, options: SeaPressureHeightOptions): number {
  checkRange('latitude', latitude, -90, 90);
  if (options.surfaceGravity !== undefined) {
    return checkRange('surfaceGravity', options.surfaceGravity, 9.7, 9.9);
  }
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  const sin2 = sinLatitude * sinLatitude;
  return 9.780327 * (1 + (5.2792e-3 + 2.32e-5 * sin2) * sin2);
}

/** Returns Ψ + Φ0 from the options, m²/s². */
function getGeopotentialOffset(options: SeaPressureHeightOptions): number {
  return (
    checkFinite('dynamicHeightAnomaly', options.dynamicHeightAnomaly ?? 0) +
    checkFinite('seaSurfaceGeopotential', options.seaSurfaceGeopotential ?? 0)
  );
}

/**
 * Returns the dynamic enthalpy of the standard ocean, ∫ v dP from 0 to p, J/kg, and the
 * standard-ocean specific volume at p, m³/kg.
 */
function getStandardOceanEnthalpy(seaPressure: number): {enthalpy: number; specificVolume: number} {
  const coefficients = getStandardOceanSpecificVolumeCoefficients();
  const zeta = seaPressure / 1e4;
  let integral = 0;
  let specificVolume = 0;
  for (let k = coefficients.length - 1; k >= 0; k--) {
    integral = integral * zeta + coefficients[k] / (k + 1);
    specificVolume = specificVolume * zeta + coefficients[k];
  }
  // dP = 10^4 Pa/dbar × 10^4 dbar/ζ × dζ.
  return {enthalpy: integral * zeta * 1e8, specificVolume};
}

/**
 * Returns the height of a sea pressure, relative to the sea surface.
 *
 * The relation is `h_SSO(p) - Ψ - Φ0 = -g(φ) (z - γ z² / 2)` with γ = 2.26e-7 /m, where
 * h_SSO is the dynamic enthalpy of a standard ocean (SA = 35.16504 g/kg, Θ = 0 °C) from the
 * 75-term polynomial. The function solves the quadratic in z.
 *
 * Reference: TEOS-10 manual, eq. (3.32.3). GSW counterpart: `gsw_z_from_p`.
 * @param seaPressure - Sea pressure p, dbar, from 0 to 8000.
 * @param latitude - Latitude φ, degrees, from -90 to 90.
 * @param options - Dynamic height anomaly, sea-surface geopotential and surface gravity.
 * @returns Height z, m. It is negative below the sea surface.
 * @throws {RangeError} When an input is not finite or is outside the domain.
 */
export function getHeightFromSeaPressure(
  seaPressure: number,
  latitude: number,
  options: SeaPressureHeightOptions = {}
): number {
  checkRange('seaPressure', seaPressure, 0, MAX_SEA_PRESSURE);
  const gravity = getSurfaceGravity(latitude, options);
  const c = getStandardOceanEnthalpy(seaPressure).enthalpy - getGeopotentialOffset(options);
  const a = -0.5 * GRAVITY_GRADIENT * gravity;
  // Solve a z² + g z + c = 0 in the form that keeps precision when c is small.
  return (-2 * c) / (gravity + Math.sqrt(gravity * gravity - 4 * a * c));
}

/**
 * Returns the sea pressure at a height relative to the sea surface. It inverts
 * {@link getHeightFromSeaPressure} with a Newton iteration.
 *
 * GSW counterpart: `gsw_p_from_z`, which takes one modified Newton step from the
 * Saunders (1981) estimate.
 * @param height - Height z, m; negative below the sea surface.
 * @param latitude - Latitude φ, degrees, from -90 to 90.
 * @param options - Dynamic height anomaly, sea-surface geopotential and surface gravity.
 * @returns Sea pressure p, dbar.
 * @throws {RangeError} When an input is not finite, or when the result is outside 0 to 8000 dbar.
 */
export function getSeaPressureFromHeight(
  height: number,
  latitude: number,
  options: SeaPressureHeightOptions = {}
): number {
  checkFinite('height', height);
  const gravity = getSurfaceGravity(latitude, options);
  const target =
    getGeopotentialOffset(options) - gravity * (height - 0.5 * GRAVITY_GRADIENT * height * height);
  // First estimate: 1 m of standard ocean is about 1.0076 dbar near the surface.
  let seaPressure = Math.max(0, -height * 1.0076);
  for (let iteration = 0; iteration < 20; iteration++) {
    const {enthalpy, specificVolume} = getStandardOceanEnthalpy(seaPressure);
    const step = (enthalpy - target) / (PASCALS_PER_DECIBAR * specificVolume);
    seaPressure -= step;
    if (Math.abs(step) < 1e-12 * Math.max(1, seaPressure)) break;
  }
  // Accept rounding at the two ends of the domain.
  if (!(seaPressure >= -1e-9 && seaPressure <= MAX_SEA_PRESSURE + 1e-9)) {
    throw new RangeError(
      `height ${height} m gives a sea pressure outside 0 to ${MAX_SEA_PRESSURE} dbar`
    );
  }
  return Math.min(MAX_SEA_PRESSURE, Math.max(0, seaPressure));
}
