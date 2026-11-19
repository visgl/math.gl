// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Coefficients from IAPWS R13-08 (Table 2) and IAPWS SR7-09 (Table 2).

import {CELSIUS_ZERO, CONSERVATIVE_HEAT_CAPACITY, PRACTICAL_SALINITY_SCALE} from './constants';

/**
 * Coefficients g_jk of the pure-water Gibbs function, as flat `[j, k, g_jk]` triples.
 *
 * Source: IAPWS SR7-09, "Supplementary Release on a Computationally Efficient
 * Thermodynamic Formulation for Liquid Water for Oceanographic Use" (2009), Table 2.
 * `g_W / (J/kg) = Σ g_jk τ^j π^k` with `τ = t / 40 °C` and `π = p / 10^4 dbar`.
 */
// biome-ignore format: keep one row per coefficient group
const PURE_WATER_TERMS = [
  0, 0, 101.342743139674,
  0, 1, 100015.695367145,
  0, 2, -2544.5765420363,
  0, 3, 284.517778446287,
  0, 4, -33.3146754253611,
  0, 5, 4.20263108803084,
  0, 6, -0.546428511471039,
  1, 0, 5.90578347909402,
  1, 1, -270.983805184062,
  1, 2, 776.153611613101,
  1, 3, -196.51255088122,
  1, 4, 28.9796526294175,
  1, 5, -2.13290083518327,
  2, 0, -12357.785933039,
  2, 1, 1455.0364540468,
  2, 2, -756.558385769359,
  2, 3, 273.479662323528,
  2, 4, -55.5604063817218,
  2, 5, 4.34420671917197,
  3, 0, 736.741204151612,
  3, 1, -672.50778314507,
  3, 2, 499.360390819152,
  3, 3, -239.545330654412,
  3, 4, 48.8012518593872,
  3, 5, -1.66307106208905,
  4, 0, -148.185936433658,
  4, 1, 397.968445406972,
  4, 2, -301.815380621876,
  4, 3, 152.196371733841,
  4, 4, -26.3748377232802,
  5, 0, 58.0259125842571,
  5, 1, -194.618310617595,
  5, 2, 120.520654902025,
  5, 3, -55.2723052340152,
  5, 4, 6.48190668077221,
  6, 0, -18.9843846514172,
  6, 1, 63.5113936641785,
  6, 2, -22.2897317140459,
  6, 3, 8.17060541818112,
  7, 0, 3.05081646487967,
  7, 1, -9.63108119393062
];

/**
 * Coefficients g_ijk of the saline part of the Gibbs function, as flat `[i, j, k, g_ijk]` tuples.
 *
 * Source: IAPWS R13-08, "Release on the IAPWS Formulation 2008 for the Thermodynamic
 * Properties of Seawater" (2008), Table 2.
 * `g_S / (J/kg) = Σ_jk (g_1jk ξ² ln ξ + Σ_{i≥2} g_ijk ξ^i) τ^j π^k`, with `ξ² = SA / (40 u_PS)`.
 * The rows with `i = 1` are the coefficients of the logarithmic term.
 */
// biome-ignore format: keep one row per coefficient group
const SALINE_TERMS = [
  1, 0, 0, 5812.81456626732,
  1, 1, 0, 851.226734946706,
  2, 0, 0, 1416.27648484197,
  2, 0, 1, -3310.49154044839,
  2, 0, 2, 384.794152978599,
  2, 0, 3, -96.5324320107458,
  2, 0, 4, 15.8408172766824,
  2, 0, 5, -2.62480156590992,
  2, 1, 0, 168.072408311545,
  2, 1, 1, 729.116529735046,
  2, 1, 2, -343.956902961561,
  2, 1, 3, 124.687671116248,
  2, 1, 4, -31.656964386073,
  2, 1, 5, 7.04658803315449,
  2, 2, 0, 880.031352997204,
  2, 2, 1, -860.764303783977,
  2, 2, 2, 337.409530269367,
  2, 2, 3, -178.314556207638,
  2, 2, 4, 44.2040358308,
  2, 2, 5, -7.92001547211682,
  2, 3, 0, -225.267649263401,
  2, 3, 1, 694.244814133268,
  2, 3, 2, -204.889641964903,
  2, 3, 3, 113.561697840594,
  2, 3, 4, -11.1282734326413,
  2, 4, 0, 91.4260447751259,
  2, 4, 1, -297.728741987187,
  2, 4, 2, 74.726141138756,
  2, 4, 3, -36.4872919001588,
  2, 5, 0, -21.6603240875311,
  2, 6, 0, 2.13016970847183,
  3, 0, 0, -2432.14662381794,
  3, 0, 1, 199.459603073901,
  3, 0, 2, -52.2940909281335,
  3, 0, 3, 68.0444942726459,
  3, 0, 4, -3.41251932441282,
  3, 1, 0, -493.407510141682,
  3, 1, 1, -175.292041186547,
  3, 1, 2, 83.1923927801819,
  3, 1, 3, -29.483064349429,
  3, 2, 0, -43.0664675978042,
  3, 2, 1, 383.058066002476,
  3, 2, 2, -54.1917262517112,
  3, 2, 3, 25.6398487389914,
  3, 3, 0, -10.0227370861875,
  3, 3, 1, -460.319931801257,
  3, 4, 0, 0.875600661808945,
  3, 4, 1, 234.565187611355,
  4, 0, 0, 2025.80115603697,
  4, 0, 1, -54.7919133532887,
  4, 0, 2, -4.08193978912261,
  4, 0, 3, -30.1755111971161,
  4, 1, 0, 543.835333000098,
  4, 1, 1, -22.6683558512829,
  4, 2, 0, -68.5572509204491,
  4, 3, 0, 49.3667694856254,
  4, 4, 0, -17.1397577419788,
  4, 5, 0, 2.49697009569508,
  5, 0, 0, -1091.66841042967,
  5, 0, 1, 36.0284195611086,
  5, 1, 0, -196.028306689776,
  6, 0, 0, 374.60123787784,
  6, 1, 0, 36.7571622995805,
  7, 0, 0, -48.5891069025409
];

/** Reciprocal of the salinity reducing value `S_u = 40 u_PS`, kg/g. */
const SALINITY_FACTOR = 1 / (40 * PRACTICAL_SALINITY_SCALE);

/** Derivatives of the Gibbs function with respect to temperature at fixed salinity and pressure. */
export type GibbsTemperatureDerivatives = {
  /** Specific Gibbs energy g, J/kg. */
  g: number;
  /** ∂g/∂T, J/(kg K). The specific entropy is `-gT`. */
  gT: number;
  /** ∂²g/∂T², J/(kg K²). The isobaric heat capacity is `-(T0 + t) gTT`. */
  gTT: number;
};

/**
 * Evaluates the TEOS-10 Gibbs function of seawater and its first two temperature derivatives.
 *
 * Only this part of the Gibbs function is in the subpath. It is enough for potential
 * temperature, Conservative Temperature and their inverses.
 * @param absoluteSalinity - Absolute Salinity SA, g/kg.
 * @param temperature - In-situ temperature t, °C (ITS-90).
 * @param seaPressure - Sea pressure p, dbar.
 * @returns g, ∂g/∂T and ∂²g/∂T².
 */
export function evaluateGibbsFunction(
  absoluteSalinity: number,
  temperature: number,
  seaPressure: number
): GibbsTemperatureDerivatives {
  const y = temperature / 40;
  const z = seaPressure / 1e4;
  let g = 0;
  let gY = 0;
  let gYY = 0;

  for (let n = 0; n < PURE_WATER_TERMS.length; n += 3) {
    const j = PURE_WATER_TERMS[n];
    const term = PURE_WATER_TERMS[n + 2] * z ** PURE_WATER_TERMS[n + 1];
    g += term * y ** j;
    if (j >= 1) gY += j * term * y ** (j - 1);
    if (j >= 2) gYY += j * (j - 1) * term * y ** (j - 2);
  }

  if (absoluteSalinity > 0) {
    const x2 = SALINITY_FACTOR * absoluteSalinity;
    const x = Math.sqrt(x2);
    const logX = Math.log(x);
    for (let n = 0; n < SALINE_TERMS.length; n += 4) {
      const i = SALINE_TERMS[n];
      const j = SALINE_TERMS[n + 1];
      const salinePower = i === 1 ? x2 * logX : x ** i;
      const term = SALINE_TERMS[n + 3] * salinePower * z ** SALINE_TERMS[n + 2];
      g += term * y ** j;
      if (j >= 1) gY += j * term * y ** (j - 1);
      if (j >= 2) gYY += j * (j - 1) * term * y ** (j - 2);
    }
  }

  return {g, gT: gY / 40, gTT: gYY / 1600};
}

/**
 * Returns the specific entropy η = -∂g/∂T of seawater, J/(kg K).
 * @param absoluteSalinity - Absolute Salinity SA, g/kg.
 * @param temperature - In-situ temperature, °C (ITS-90).
 * @param seaPressure - Sea pressure, dbar.
 */
export function getEntropy(
  absoluteSalinity: number,
  temperature: number,
  seaPressure: number
): number {
  return -evaluateGibbsFunction(absoluteSalinity, temperature, seaPressure).gT;
}

/**
 * Finds the temperature at `targetPressure` that has the entropy `entropy` (an isentropic move).
 *
 * The solver is a Newton iteration on η(SA, t, p) with ∂η/∂t = -∂²g/∂T². It starts at
 * `initialTemperature` and stops when the step is below 1e-12 K.
 * @param absoluteSalinity - Absolute Salinity SA, g/kg.
 * @param entropy - Target specific entropy, J/(kg K).
 * @param targetPressure - Sea pressure of the result, dbar.
 * @param initialTemperature - First estimate, °C.
 * @returns Temperature, °C (ITS-90).
 */
export function getTemperatureFromEntropy(
  absoluteSalinity: number,
  entropy: number,
  targetPressure: number,
  initialTemperature: number
): number {
  let temperature = initialTemperature;
  for (let iteration = 0; iteration < 20; iteration++) {
    const {gT, gTT} = evaluateGibbsFunction(absoluteSalinity, temperature, targetPressure);
    const step = (-gT - entropy) / -gTT;
    temperature -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return temperature;
}

/**
 * Returns potential enthalpy divided by c_p0, that is Conservative Temperature, from potential temperature.
 *
 * h0 = g(SA, θ, 0) - (T0 + θ) ∂g/∂T (SA, θ, 0) (TEOS-10 manual, sections 3.2 and 3.3).
 * @param absoluteSalinity - Absolute Salinity SA, g/kg.
 * @param potentialTemperature - Potential temperature θ referenced to 0 dbar, °C.
 * @returns Conservative Temperature Θ, °C.
 */
export function getConservativeTemperatureFromPotential(
  absoluteSalinity: number,
  potentialTemperature: number
): number {
  const {g, gT} = evaluateGibbsFunction(absoluteSalinity, potentialTemperature, 0);
  return (g - (CELSIUS_ZERO + potentialTemperature) * gT) / CONSERVATIVE_HEAT_CAPACITY;
}

/**
 * Inverts {@link getConservativeTemperatureFromPotential} with a Newton iteration.
 *
 * ∂Θ/∂θ = -(T0 + θ) ∂²g/∂T² (SA, θ, 0) / c_p0.
 * @param absoluteSalinity - Absolute Salinity SA, g/kg.
 * @param conservativeTemperature - Conservative Temperature Θ, °C.
 * @returns Potential temperature θ referenced to 0 dbar, °C.
 */
export function getPotentialTemperatureFromConservative(
  absoluteSalinity: number,
  conservativeTemperature: number
): number {
  let potentialTemperature = conservativeTemperature;
  for (let iteration = 0; iteration < 20; iteration++) {
    const {g, gT, gTT} = evaluateGibbsFunction(absoluteSalinity, potentialTemperature, 0);
    const absoluteTemperature = CELSIUS_ZERO + potentialTemperature;
    const value = (g - absoluteTemperature * gT) / CONSERVATIVE_HEAT_CAPACITY;
    const slope = (-absoluteTemperature * gTT) / CONSERVATIVE_HEAT_CAPACITY;
    const step = (value - conservativeTemperature) / slope;
    potentialTemperature -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return potentialTemperature;
}
