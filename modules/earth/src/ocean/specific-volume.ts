// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Coefficients from Roquet, Madec, McDougall and Barker (2015), Ocean Modelling 90, 29-43.

import {PRACTICAL_SALINITY_SCALE, STANDARD_OCEAN_SALINITY} from './constants';

/**
 * Coefficients of the 75-term polynomial for the specific volume of seawater, as flat
 * `[i, j, k, v_ijk]` tuples, in m³/kg.
 *
 * Source: Roquet, Madec, McDougall and Barker (2015), "Accurate polynomial expressions for
 * the density and specific volume of seawater using the TEOS-10 standard", Ocean Modelling 90,
 * 29-43, doi:10.1016/j.ocemod.2015.04.002. `v = Σ v_ijk τ^i s^j ζ^k` with `τ = Θ / 40 °C`,
 * `s = sqrt((SA + 24 g/kg) / (40 u_PS))` and `ζ = p / 10^4 dbar`.
 */
// biome-ignore format: keep one row per coefficient group
const SPECIFIC_VOLUME_TERMS = [
  0, 0, 0, 1.0769995862e-3,
  0, 0, 1, -6.0799143809e-5,
  0, 0, 2, 9.9856169219e-6,
  0, 0, 3, -1.1309361437e-6,
  0, 0, 4, 1.0531153080e-7,
  0, 0, 5, -1.2647261286e-8,
  0, 0, 6, 1.9613503930e-9,
  0, 1, 0, -3.1038981976e-4,
  0, 1, 1, 2.4262468747e-5,
  0, 1, 2, -5.8484432984e-7,
  0, 1, 3, 3.6310188515e-7,
  0, 1, 4, -1.1147125423e-7,
  0, 2, 0, 6.6928067038e-4,
  0, 2, 1, -3.4792460974e-5,
  0, 2, 2, -4.8122251597e-6,
  0, 2, 3, 1.6746303780e-8,
  0, 3, 0, -8.5047933937e-4,
  0, 3, 1, 3.7470777305e-5,
  0, 3, 2, 4.9263106998e-6,
  0, 4, 0, 5.8086069943e-4,
  0, 4, 1, -1.7322218612e-5,
  0, 4, 2, -1.7811974727e-6,
  0, 5, 0, -2.1092370507e-4,
  0, 5, 1, 3.0927427253e-6,
  0, 6, 0, 3.1932457305e-5,
  1, 0, 0, -1.5649734675e-5,
  1, 0, 1, 1.8505765429e-5,
  1, 0, 2, -1.1736386731e-6,
  1, 0, 3, -3.6527006553e-7,
  1, 0, 4, 3.1454099902e-7,
  1, 1, 0, 3.5009599764e-5,
  1, 1, 1, -9.5677088156e-6,
  1, 1, 2, -5.5699154557e-6,
  1, 1, 3, -2.7295696237e-7,
  1, 2, 0, -4.3592678561e-5,
  1, 2, 1, 1.1100834765e-5,
  1, 2, 2, 5.4620748834e-6,
  1, 3, 0, 3.4532461828e-5,
  1, 3, 1, -9.8447117844e-6,
  1, 3, 2, -1.3544185627e-6,
  1, 4, 0, -1.1959409788e-5,
  1, 4, 1, 2.5909225260e-6,
  1, 5, 0, 1.3864594581e-6,
  2, 0, 0, 2.7762106484e-5,
  2, 0, 1, -1.1716606853e-5,
  2, 0, 2, 2.1305028740e-6,
  2, 0, 3, 2.8695905159e-7,
  2, 1, 0, -3.7435842344e-5,
  2, 1, 1, -2.3678308361e-7,
  2, 1, 2, 3.9137387080e-7,
  2, 2, 0, 3.5907822760e-5,
  2, 2, 1, 2.9283346295e-6,
  2, 2, 2, -6.5731104067e-7,
  2, 3, 0, -1.8698584187e-5,
  2, 3, 1, -4.8826139200e-7,
  2, 4, 0, 3.8595339244e-6,
  3, 0, 0, -1.6521159259e-5,
  3, 0, 1, 7.9279656173e-6,
  3, 0, 2, -4.6132540037e-7,
  3, 1, 0, 2.4141479483e-5,
  3, 1, 1, -3.4558773655e-6,
  3, 1, 2, 7.7618888092e-9,
  3, 2, 0, -1.4353633048e-5,
  3, 2, 1, 3.1655306078e-7,
  3, 3, 0, 2.2863324556e-6,
  4, 0, 0, 6.9111322702e-6,
  4, 0, 1, -3.4102187482e-6,
  4, 0, 2, -6.3352916514e-8,
  4, 1, 0, -8.7595873154e-6,
  4, 1, 1, 1.2956717783e-6,
  4, 2, 0, 4.3703680598e-6,
  5, 0, 0, -8.0539615540e-7,
  5, 0, 1, 5.0736766814e-7,
  5, 1, 0, -3.3052758900e-7,
  6, 0, 0, 2.0543094268e-7
];

/** Reciprocal of the salinity reducing value `40 u_PS`, kg/g. */
const SALINITY_FACTOR = 1 / (40 * PRACTICAL_SALINITY_SCALE);

/** Salinity offset ΔS = 24 g/kg of the polynomial, in reduced units. */
const SALINITY_OFFSET = 24 * SALINITY_FACTOR;

/** Specific volume and its pressure derivative. */
export type SpecificVolume = {
  /** Specific volume v, m³/kg. */
  specificVolume: number;
  /** ∂v/∂ζ with ζ = p / 10^4 dbar, m³/kg. */
  specificVolumeZeta: number;
};

/**
 * Evaluates the 75-term specific-volume polynomial and its derivative with respect to pressure.
 * @param absoluteSalinity - Absolute Salinity SA, g/kg.
 * @param conservativeTemperature - Conservative Temperature Θ, °C.
 * @param seaPressure - Sea pressure p, dbar.
 */
export function evaluateSpecificVolume(
  absoluteSalinity: number,
  conservativeTemperature: number,
  seaPressure: number
): SpecificVolume {
  const s = Math.sqrt(SALINITY_FACTOR * absoluteSalinity + SALINITY_OFFSET);
  const tau = conservativeTemperature / 40;
  const zeta = seaPressure / 1e4;
  let specificVolume = 0;
  let specificVolumeZeta = 0;
  for (let n = 0; n < SPECIFIC_VOLUME_TERMS.length; n += 4) {
    const k = SPECIFIC_VOLUME_TERMS[n + 2];
    const term =
      SPECIFIC_VOLUME_TERMS[n + 3] *
      tau ** SPECIFIC_VOLUME_TERMS[n] *
      s ** SPECIFIC_VOLUME_TERMS[n + 1];
    specificVolume += term * zeta ** k;
    if (k >= 1) specificVolumeZeta += k * term * zeta ** (k - 1);
  }
  return {specificVolume, specificVolumeZeta};
}

/** Specific volume and its derivatives with respect to Absolute Salinity and Conservative Temperature. */
export type SpecificVolumeDerivatives = {
  /** Specific volume v, m³/kg. */
  specificVolume: number;
  /** ∂v/∂SA at constant Θ and p, m³/kg per g/kg. The saline contraction coefficient is β = -v_SA / v. */
  specificVolumeSalinity: number;
  /** ∂v/∂Θ at constant SA and p, m³/kg per K. The thermal expansion coefficient is α = v_Θ / v. */
  specificVolumeTemperature: number;
};

/**
 * Evaluates the 75-term specific-volume polynomial and its derivatives with respect to
 * Absolute Salinity and Conservative Temperature, in one pass over the terms.
 *
 * The derivatives come from term-by-term differentiation of `Σ v_ijk τ^i s^j ζ^k`, with
 * dτ/dΘ = 1/40 and ds/dSA = SALINITY_FACTOR / (2 s) (TEOS-10 manual, appendix A.20, K;
 * Roquet et al. 2015). It is separate from {@link evaluateSpecificVolume}, so that the density
 * and sound-speed functions do not calculate derivatives that they do not use.
 * @param absoluteSalinity - Absolute Salinity SA, g/kg.
 * @param conservativeTemperature - Conservative Temperature Θ, °C.
 * @param seaPressure - Sea pressure p, dbar.
 */
export function evaluateSpecificVolumeDerivatives(
  absoluteSalinity: number,
  conservativeTemperature: number,
  seaPressure: number
): SpecificVolumeDerivatives {
  const s = Math.sqrt(SALINITY_FACTOR * absoluteSalinity + SALINITY_OFFSET);
  const tau = conservativeTemperature / 40;
  const zeta = seaPressure / 1e4;
  let specificVolume = 0;
  // Sums of i v_ijk τ^(i-1) s^j ζ^k and j v_ijk τ^i s^(j-1) ζ^k.
  let sumTau = 0;
  let sumS = 0;
  for (let n = 0; n < SPECIFIC_VOLUME_TERMS.length; n += 4) {
    const i = SPECIFIC_VOLUME_TERMS[n];
    const j = SPECIFIC_VOLUME_TERMS[n + 1];
    const coefficient = SPECIFIC_VOLUME_TERMS[n + 3] * zeta ** SPECIFIC_VOLUME_TERMS[n + 2];
    specificVolume += coefficient * tau ** i * s ** j;
    // Terms with exponent 0 have a zero derivative; skip them so that no power is negative.
    if (i >= 1) sumTau += i * coefficient * tau ** (i - 1) * s ** j;
    if (j >= 1) sumS += j * coefficient * tau ** i * s ** (j - 1);
  }
  // s ≥ sqrt(SALINITY_OFFSET) > 0, so the division by s is safe at SA = 0.
  return {
    specificVolume,
    specificVolumeSalinity: (sumS * SALINITY_FACTOR) / (2 * s),
    specificVolumeTemperature: sumTau / 40
  };
}

/**
 * Cache of the seven standard-ocean coefficients a_0 … a_6 that
 * `getStandardOceanSpecificVolumeCoefficients` returns. It is `null` until the first call
 * computes the coefficients; they do not change after that.
 */
let standardOceanProfile: number[] | null = null;

/**
 * Returns the coefficients a_k of v(S_SO, 0 °C, ζ) = Σ a_k ζ^k, the specific volume of the
 * standard ocean (SA = 35.16504 g/kg, Θ = 0 °C) as a polynomial in ζ = p / 10^4 dbar.
 *
 * The coefficients come from the 75-term polynomial and are computed once.
 */
export function getStandardOceanSpecificVolumeCoefficients(): number[] {
  if (!standardOceanProfile) {
    const s = Math.sqrt(SALINITY_FACTOR * STANDARD_OCEAN_SALINITY + SALINITY_OFFSET);
    const profile = [0, 0, 0, 0, 0, 0, 0];
    for (let n = 0; n < SPECIFIC_VOLUME_TERMS.length; n += 4) {
      if (SPECIFIC_VOLUME_TERMS[n] === 0) {
        profile[SPECIFIC_VOLUME_TERMS[n + 2]] +=
          SPECIFIC_VOLUME_TERMS[n + 3] * s ** SPECIFIC_VOLUME_TERMS[n + 1];
      }
    }
    standardOceanProfile = profile;
  }
  return standardOceanProfile;
}
