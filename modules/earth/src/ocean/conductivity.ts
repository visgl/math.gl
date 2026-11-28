// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  MAX_PRACTICAL_SALINITY,
  MAX_PSS78_PRESSURE,
  MAX_PSS78_TEMPERATURE,
  MIN_PSS78_TEMPERATURE
} from './constants';
import {checkFinite, checkRange} from './domain';

// PSS-78 coefficients: Unesco (1981, 1983); the TEOS-10 manual, appendix E, table in E.1.
/** a_i of eq. (E.1.1) and (E.2.6). Their sum is 35. */
const A = [0.008, -0.1692, 25.3851, 14.0941, -7.0261, 2.7081];
/** b_i of eq. (E.2.6). Their sum is 0. */
const B = [0.0005, -0.0056, -0.0066, -0.0375, 0.0636, -0.0144];
/** c_i of the r_t polynomial, eq. (E.2.3). */
const C = [6.766097e-1, 2.00564e-2, 1.104259e-4, -6.9698e-7, 1.0031e-9];
/** d_1 to d_4 of the R_p denominator, eq. (E.2.4). */
const D1 = 3.426e-2;
const D2 = 4.464e-4;
const D3 = 4.215e-1;
const D4 = -3.107e-3;
/** e_1 to e_3 of the R_p numerator, eq. (E.2.4). */
const E1 = 2.07e-5;
const E2 = -6.37e-10;
const E3 = 3.989e-15;
/** k of the temperature term of eq. (E.2.6). */
const K = 0.0162;

/** Conductivity C(35, t68 = 15 °C, 0) of PSS-78, mS/cm. */
const REFERENCE_CONDUCTIVITY = 42.914;

/** Ratio t68 / t90 (Saunders 1990; TEOS-10 manual, eq. (A.1.3)). */
const T68_PER_T90 = 1.00024;

/**
 * Rounding margin above SP = 42 that the forward function accepts. The inverse of SP = 42
 * can return SP = 42 + 1 ulp; the margin is far less than the GSW check gate.
 */
const SALINITY_ROUNDING_MARGIN = 1e-12;

/** Practical Salinity below which the Hill et al. (1986) extension applies. */
const HILL_LIMIT = 2;

/**
 * Fixed Newton steps for √Rt at SP = 2, from the first estimate √(2/35). The smallest count
 * that keeps the edge controls within the gates is 3. This value is that count plus one.
 */
const HILL_LIMIT_NEWTON_STEPS = 4;

/**
 * Fixed Newton steps for √Rt in the inverse, from the first estimate √(SP/35). The smallest
 * count that passes the round-trip test over the full domain is 5 (4 passes the spec grid, but
 * not a dense grid of SP from 1e-12 to 42, t from -2 to 35 and p from 0 to 10000). This
 * value is that count plus one.
 */
const INVERSE_NEWTON_STEPS = 6;

/** Smallest first estimate of √Rt in the inverse, for SP more than 0. */
const MIN_RATIO_ROOT_ESTIMATE = 0.01;

/** Returns `(t68 - 15) / (1 + k (t68 - 15))`, the temperature factor of eq. (E.2.6). */
function getTemperatureFactor(t68: number): number {
  return (t68 - 15) / (1 + K * (t68 - 15));
}

/** Returns r_t of eq. (E.2.3). */
function getTemperatureRatio(t68: number): number {
  return C[0] + t68 * (C[1] + t68 * (C[2] + t68 * (C[3] + t68 * C[4])));
}

/** Returns PSS-78 SP of eq. (E.2.6) as a function of x = √Rt, and its derivative dSP/dx. */
function getPss78Salinity(x: number, factor: number): {value: number; slope: number} {
  let value = 0;
  let slope = 0;
  for (let i = 5; i >= 0; i--) {
    slope = slope * x + value;
    value = value * x + A[i] + factor * B[i];
  }
  return {value, slope};
}

/**
 * Returns the low-salinity correction ΔS, which the extension subtracts from PSS-78, and
 * its derivative dΔS/dx, with x = √Rt:
 * `ΔS = a0 / (1 + 1.5 X + X²) + b0 f / (1 + Y^½ + Y + Y^³⁄₂)`, X = 400 Rt, Y = 100 Rt.
 * This is the form of Hill et al. (1986). The coefficients and the denominator terms are
 * confirmed against the stored GSW-C outputs, not against the printed paper.
 */
function getHillCorrection(x: number, factor: number): {value: number; slope: number} {
  const x2 = x * x;
  // 1 + 1.5 X + X² = 1 + 600 x² + 160000 x⁴, and 1 + Y^½ + Y + Y^³⁄₂ = 1 + 10 x + 100 x² + 1000 x³.
  const first = 1 + x2 * (600 + 160000 * x2);
  const second = 1 + x * (10 + x * (100 + 1000 * x));
  const value = A[0] / first + (B[0] * factor) / second;
  const slope =
    (-A[0] * x * (1200 + 640000 * x2)) / (first * first) -
    (B[0] * factor * (10 + x * (200 + 3000 * x))) / (second * second);
  return {value, slope};
}

/**
 * Returns `2 - ΔS` at the √Rt where PSS-78 gives SP = 2. Division by this value scales the
 * Hill et al. extension so that it is 2 at that point, which makes SP continuous at 2.
 * The TEOS-10 manual (appendix E) requires the extension to equal PSS-78 at SP = 2, but
 * does not print the scale factor. This multiplicative rescale is the simplest form that
 * meets that requirement, and it agrees with the stored GSW-C outputs to 1e-15.
 */
function getHillDenominator(factor: number): number {
  let x = Math.sqrt(HILL_LIMIT / 35);
  for (let step = 0; step < HILL_LIMIT_NEWTON_STEPS; step++) {
    const {value, slope} = getPss78Salinity(x, factor);
    x -= (value - HILL_LIMIT) / slope;
  }
  return HILL_LIMIT - getHillCorrection(x, factor).value;
}

/**
 * Returns SP and dSP/dx from x = √Rt. Set `hillDenominator` to use the extension below
 * SP = 2: `SP = 2 (S_PSS78 - ΔS) / (2 - ΔS(SP = 2))`. The TEOS-10 manual (appendix E)
 * requires the extension to equal PSS-78 at SP = 2, but does not print the scale factor.
 * This multiplicative rescale is the simplest form that meets that requirement, and it
 * agrees with the stored GSW-C outputs to 1e-15.
 */
function getSalinityFromRatioRoot(
  x: number,
  factor: number,
  hillDenominator?: number
): {value: number; slope: number} {
  const pss78 = getPss78Salinity(x, factor);
  if (hillDenominator === undefined) {
    return pss78;
  }
  const hill = getHillCorrection(x, factor);
  const scale = HILL_LIMIT / hillDenominator;
  return {
    value: scale * (pss78.value - hill.value),
    slope: scale * (pss78.slope - hill.slope)
  };
}

/** Returns the numerator and the denominator of the R_p fraction of eq. (E.2.4). */
function getPressureTerms(t68: number, seaPressure: number): {numerator: number; base: number} {
  const p = seaPressure;
  return {
    numerator: p * (E1 + p * (E2 + p * E3)),
    base: 1 + t68 * (D1 + t68 * D2)
  };
}

/** Checks temperature and sea pressure against the PSS-78 domain. */
function checkPss78Domain(temperature: number, seaPressure: number): void {
  checkRange('temperature', temperature, MIN_PSS78_TEMPERATURE, MAX_PSS78_TEMPERATURE);
  checkRange('seaPressure', seaPressure, 0, MAX_PSS78_PRESSURE);
}

/**
 * Returns Practical Salinity from conductivity, temperature and sea pressure (PSS-78).
 *
 * The function converts t90 to t68 = 1.00024 t90 and the conductivity ratio is
 * R = C / 42.914 mS/cm. Then Rt = R / (Rp rt) and SP is the Rt^(i/2) sum of eq. (E.2.6).
 * Below SP = 2 the function uses the Hill et al. (1986) extension, scaled to be
 * continuous at SP = 2.
 *
 * Reference: Unesco (1983), Fofonoff and Millard, Unesco Tech. Pap. Mar. Sci. 44; Hill,
 * Dauphinee and Woods (1986), IEEE J. Oceanic Eng. 11, 109-112; TEOS-10 manual, appendix E.
 * GSW counterpart: `gsw_SP_from_C`.
 * @param conductivity - Conductivity C, mS/cm, finite and not negative.
 * @param temperature - In-situ temperature t, °C (ITS-90), from -2 to 35.
 * @param seaPressure - Sea pressure p, dbar, from 0 to 10000.
 * @returns Practical Salinity SP (PSS-78), unitless, to 42. For C below about 0.005 mS/cm
 * the extended scale gives values slightly below 0 (to about -2.5e-4). The function does
 * not clamp them.
 * @throws {RangeError} When an input is not finite or is outside the domain, or when the
 * result is more than 42.
 */
export function getPracticalSalinityFromConductivity(
  conductivity: number,
  temperature: number,
  seaPressure: number
): number {
  checkFinite('conductivity', conductivity);
  if (conductivity < 0) {
    throw new RangeError(`conductivity must not be negative, got ${conductivity}`);
  }
  checkPss78Domain(temperature, seaPressure);

  const t68 = T68_PER_T90 * temperature;
  const factor = getTemperatureFactor(t68);
  const ratio = conductivity / REFERENCE_CONDUCTIVITY;
  const {numerator, base} = getPressureTerms(t68, seaPressure);
  const pressureRatio = 1 + numerator / (base + ratio * (D3 + D4 * t68));
  const x = Math.sqrt(ratio / (pressureRatio * getTemperatureRatio(t68)));

  let practicalSalinity = getPss78Salinity(x, factor).value;
  if (practicalSalinity < HILL_LIMIT) {
    practicalSalinity = getSalinityFromRatioRoot(x, factor, getHillDenominator(factor)).value;
  }
  if (practicalSalinity > MAX_PRACTICAL_SALINITY + SALINITY_ROUNDING_MARGIN) {
    throw new RangeError(
      `conductivity ${conductivity} gives a Practical Salinity more than ${MAX_PRACTICAL_SALINITY}`
    );
  }
  return practicalSalinity;
}

/**
 * Returns conductivity from Practical Salinity, temperature and sea pressure (PSS-78).
 *
 * The function finds √Rt with a fixed number of Newton steps on eq. (E.2.6), with the
 * Hill et al. (1986) extension below SP = 2. Then it solves eq. (E.2.4) with
 * R = Rp rt Rt, a quadratic in R, and returns C = 42.914 mS/cm × R.
 *
 * Reference: Unesco (1983), Fofonoff and Millard, Unesco Tech. Pap. Mar. Sci. 44; Hill,
 * Dauphinee and Woods (1986), IEEE J. Oceanic Eng. 11, 109-112; TEOS-10 manual,
 * appendix E.3. GSW counterpart: `gsw_C_from_SP`.
 * @param practicalSalinity - Practical Salinity SP (PSS-78), unitless, from 0 to 42.
 * @param temperature - In-situ temperature t, °C (ITS-90), from -2 to 35.
 * @param seaPressure - Sea pressure p, dbar, from 0 to 10000.
 * @returns Conductivity C, mS/cm.
 * @throws {RangeError} When an input is not finite or is outside the domain.
 */
export function getConductivityFromPracticalSalinity(
  practicalSalinity: number,
  temperature: number,
  seaPressure: number
): number {
  checkRange('practicalSalinity', practicalSalinity, 0, MAX_PRACTICAL_SALINITY);
  checkPss78Domain(temperature, seaPressure);

  const t68 = T68_PER_T90 * temperature;
  const factor = getTemperatureFactor(t68);
  const hillDenominator = practicalSalinity < HILL_LIMIT ? getHillDenominator(factor) : undefined;

  // Near SP = 0 the extension dips below 0 (to between -2.0e-4 and -2.7e-4 at √Rt ≈ 0.003)
  // and crosses 0 again at √Rt ≈ 0.005 to 0.006. A first estimate of at least √Rt = 0.01
  // starts Newton on the rising, convex side, so it cannot go into the dip.
  let x =
    practicalSalinity > 0
      ? Math.max(Math.sqrt(practicalSalinity / 35), MIN_RATIO_ROOT_ESTIMATE)
      : 0;
  for (let step = 0; step < INVERSE_NEWTON_STEPS; step++) {
    const {value, slope} = getSalinityFromRatioRoot(x, factor, hillDenominator);
    x -= (value - practicalSalinity) / slope;
  }

  // R (base + d R) = q (base + d R + numerator), with q = rt Rt and d = d3 + d4 t68.
  const q = getTemperatureRatio(t68) * x * x;
  const {numerator, base} = getPressureTerms(t68, seaPressure);
  const d = D3 + D4 * t68;
  const linear = base - q * d;
  // The stable root of d R² + (base - q d) R - q (base + numerator) = 0.
  const ratio =
    (2 * q * (base + numerator)) /
    (linear + Math.sqrt(linear * linear + 4 * d * q * (base + numerator)));
  return REFERENCE_CONDUCTIVITY * ratio;
}
