// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {checkRange} from './domain';

/**
 * Coefficients of the Chen and Millero (1977) equation, in the order
 * C00-C05, C10-C14, C20-C24, C30-C32, A00-A04, A10-A14, A20-A23, A30-A32, B00, B01, B10, B11, D00, D10.
 */
export type ChenMilleroCoefficients = readonly number[];

/**
 * UNESCO coefficients for IPTS-68 temperature, from the `SVEL` listing of Fofonoff and
 * Millard (1983), UNESCO Technical Papers in Marine Science 44, p. 49.
 */
// biome-ignore format: keep one row per coefficient group
export const CHEN_MILLERO_IPTS68: ChenMilleroCoefficients = [
  1402.388, 5.03711, -5.80852e-2, 3.342e-4, -1.478e-6, 3.1464e-9,
  0.153563, 6.8982e-4, -8.1788e-6, 1.3621e-7, -6.1185e-10,
  3.126e-5, -1.7107e-6, 2.5974e-8, -2.5335e-10, 1.0405e-12,
  -9.7729e-9, 3.8504e-10, -2.3643e-12,
  1.389, -1.262e-2, 7.164e-5, 2.006e-6, -3.21e-8,
  9.4742e-5, -1.258e-5, -6.4885e-8, 1.0507e-8, -2.0122e-10,
  -3.9064e-7, 9.1041e-9, -1.6002e-10, 7.988e-12,
  1.1e-10, 6.649e-12, -3.389e-13,
  -1.922e-2, -4.42e-5, 7.3637e-5, 1.7945e-7,
  1.727e-3, -7.9836e-6
];

/**
 * Coefficients for ITS-90 temperature, from Wong and Zhu (1995), J. Acoust. Soc. Am. 97(3),
 * 1732-1736, doi:10.1121/1.413048.
 */
// biome-ignore format: keep one row per coefficient group
export const CHEN_MILLERO_ITS90: ChenMilleroCoefficients = [
  1402.388, 5.0383, -5.8109e-2, 3.3432e-4, -1.47797e-6, 3.1419e-9,
  0.153563, 6.8999e-4, -8.1829e-6, 1.3632e-7, -6.126e-10,
  3.126e-5, -1.7111e-6, 2.5986e-8, -2.5353e-10, 1.0415e-12,
  -9.7729e-9, 3.8513e-10, -2.3654e-12,
  1.389, -1.262e-2, 7.166e-5, 2.008e-6, -3.21e-8,
  9.4742e-5, -1.2583e-5, -6.4928e-8, 1.0515e-8, -2.0142e-10,
  -3.9064e-7, 9.1061e-9, -1.6009e-10, 7.994e-12,
  1.1e-10, 6.651e-12, -3.391e-13,
  -1.922e-2, -4.42e-5, 7.3637e-5, 1.795e-7,
  1.727e-3, -7.9836e-6
];

/** Evaluates `Σ coefficients[offset + n] t^n` for `count` coefficients. */
function polynomial(
  coefficients: ChenMilleroCoefficients,
  offset: number,
  count: number,
  t: number
): number {
  let value = 0;
  for (let n = offset + count - 1; n >= offset; n--) {
    value = value * t + coefficients[n];
  }
  return value;
}

/**
 * Evaluates the Chen and Millero (1977) equation with a given coefficient set.
 *
 * c = Cw(t, P) + A(t, P) S + B(t, P) S^(3/2) + D(t, P) S², with P in bar.
 * @param coefficients - {@link CHEN_MILLERO_ITS90} or {@link CHEN_MILLERO_IPTS68}.
 * @param salinity - Practical Salinity.
 * @param temperature - Temperature on the scale of the coefficient set, °C.
 * @param pressureBar - Sea pressure, bar.
 * @returns Speed of sound, m/s.
 */
export function evaluateChenMillero(
  coefficients: ChenMilleroCoefficients,
  salinity: number,
  temperature: number,
  pressureBar: number
): number {
  const t = temperature;
  const p = pressureBar;
  const c = coefficients;
  const cw =
    polynomial(c, 0, 6, t) +
    p * (polynomial(c, 6, 5, t) + p * (polynomial(c, 11, 5, t) + p * polynomial(c, 16, 3, t)));
  const a =
    polynomial(c, 19, 5, t) +
    p * (polynomial(c, 24, 5, t) + p * (polynomial(c, 29, 4, t) + p * polynomial(c, 33, 3, t)));
  const b = c[36] + c[37] * t + (c[38] + c[39] * t) * p;
  const d = c[40] + c[41] * p;
  return cw + a * salinity + b * salinity * Math.sqrt(salinity) + d * salinity * salinity;
}

/**
 * Returns the speed of sound in seawater from the Chen and Millero (1977) equation, also
 * known as the UNESCO equation, with the ITS-90 coefficients of Wong and Zhu (1995).
 *
 * Stated validity: 0 to 40 °C, salinity 0 to 40, 0 to 10 000 dbar; standard deviation
 * 0.19 m/s (Fofonoff and Millard 1983). The UNESCO check value 1731.995 m/s
 * (S = 40, t68 = 40 °C, p = 10 000 dbar) applies to the IPTS-68 coefficients; the ITS-90
 * coefficients give 0.008 m/s more at that point, within the 0.024 m/s change that Wong and
 * Zhu state.
 *
 * References: Chen and Millero (1977), J. Acoust. Soc. Am. 62(5), 1129-1135; Fofonoff and
 * Millard (1983), `SVEL`; Wong and Zhu (1995).
 * @param practicalSalinity - Practical Salinity (PSS-78), from 0 to 40.
 * @param temperature - In-situ temperature, °C (ITS-90), from 0 to 40.
 * @param seaPressure - Sea pressure, dbar, from 0 to 10 000.
 * @returns Speed of sound, m/s.
 * @throws {RangeError} When an input is not finite or is outside the domain.
 */
export function getSoundSpeedChenMillero(
  practicalSalinity: number,
  temperature: number,
  seaPressure: number
): number {
  checkRange('practicalSalinity', practicalSalinity, 0, 40);
  checkRange('temperature', temperature, 0, 40);
  checkRange('seaPressure', seaPressure, 0, 10000);
  return evaluateChenMillero(CHEN_MILLERO_ITS90, practicalSalinity, temperature, seaPressure / 10);
}

/**
 * Del Grosso (1974) NRL II coefficients for ITS-90 temperature, from Wong and Zhu (1995):
 * C000, CT1, CT2, CT3, CS1, CS2, CP1, CP2, CP3, CST, CTP, CT2P2, CTP2, CTP3, CT3P, CS2P2,
 * CST2, CS2TP, CSTP.
 */
const DEL_GROSSO_ITS90 = [
  1402.392, 0.5012285e1, -0.551184e-1, 0.221649e-3, 0.132953e1, 0.1288598e-3, 0.1560592,
  0.2449993e-4, -0.8833959e-8, -0.1275936e-1, 0.6353509e-2, 0.2656174e-7, -0.1593895e-5,
  0.5222483e-9, -0.4383615e-6, -0.1616745e-8, 0.9688441e-4, 0.4857614e-5, -0.3406824e-3
];

/** Decibars in one kilogram-force per square centimetre (98 066.5 Pa). */
const DECIBARS_PER_KILOGRAM_FORCE_PER_SQUARE_CENTIMETRE = 9.80665;

/**
 * Returns the speed of sound in seawater from the Del Grosso (1974) NRL II equation, with
 * the ITS-90 coefficients of Wong and Zhu (1995).
 *
 * Stated validity: 0 to 30 °C, salinity 30 to 40, 0 to 1000 kg/cm² (0 to 9806.65 dbar);
 * standard deviation 0.05 m/s (Del Grosso 1974, abstract).
 *
 * Reference: Del Grosso (1974), J. Acoust. Soc. Am. 56(4), 1084-1091, doi:10.1121/1.1903388.
 * @param practicalSalinity - Practical Salinity (PSS-78), from 30 to 40.
 * @param temperature - In-situ temperature, °C (ITS-90), from 0 to 30.
 * @param seaPressure - Sea pressure, dbar, from 0 to 9806.65.
 * @returns Speed of sound, m/s.
 * @throws {RangeError} When an input is not finite or is outside the domain.
 */
export function getSoundSpeedDelGrosso(
  practicalSalinity: number,
  temperature: number,
  seaPressure: number
): number {
  checkRange('practicalSalinity', practicalSalinity, 30, 40);
  checkRange('temperature', temperature, 0, 30);
  checkRange(
    'seaPressure',
    seaPressure,
    0,
    1000 * DECIBARS_PER_KILOGRAM_FORCE_PER_SQUARE_CENTIMETRE
  );
  const [
    c000,
    ct1,
    ct2,
    ct3,
    cs1,
    cs2,
    cp1,
    cp2,
    cp3,
    cst,
    ctp,
    ct2p2,
    ctp2,
    ctp3,
    ct3p,
    cs2p2,
    cst2,
    cs2tp,
    cstp
  ] = DEL_GROSSO_ITS90;
  const s = practicalSalinity;
  const t = temperature;
  const p = seaPressure / DECIBARS_PER_KILOGRAM_FORCE_PER_SQUARE_CENTIMETRE;
  const deltaT = t * (ct1 + t * (ct2 + t * ct3));
  const deltaS = s * (cs1 + s * cs2);
  const deltaP = p * (cp1 + p * (cp2 + p * cp3));
  const deltaSTP =
    ctp * t * p +
    ct3p * t * t * t * p +
    ctp2 * t * p * p +
    ct2p2 * t * t * p * p +
    ctp3 * t * p * p * p +
    cst * s * t +
    cst2 * s * t * t +
    cstp * s * t * p +
    cs2tp * s * s * t * p +
    cs2p2 * s * s * p * p;
  return c000 + deltaT + deltaS + deltaP + deltaSTP;
}

/**
 * Returns the speed of sound in seawater from the nine-term equation of Mackenzie (1981).
 *
 * c = 1448.96 + 4.591 T - 5.304e-2 T² + 2.374e-4 T³ + 1.340 (S - 35) + 1.630e-2 D
 * + 1.675e-7 D² - 1.025e-2 T (S - 35) - 7.139e-13 T D³.
 *
 * The equation uses depth, not pressure. Stated validity: -2 to 30 °C, salinity 30 to 40,
 * depth 0 to 8000 m (Mackenzie 1981, abstract). NPL gives a narrower range: 2 to 30 °C and
 * salinity 25 to 40. The equation predates ITS-90; the difference is below its accuracy.
 *
 * Reference: Mackenzie (1981), J. Acoust. Soc. Am. 70(3), 807-812, doi:10.1121/1.386920.
 * @param practicalSalinity - Practical Salinity (PSS-78), from 30 to 40.
 * @param temperature - In-situ temperature, °C, from -2 to 30.
 * @param depth - Depth below the sea surface, m, positive down, from 0 to 8000.
 * @returns Speed of sound, m/s.
 * @throws {RangeError} When an input is not finite or is outside the domain.
 */
export function getSoundSpeedMackenzie(
  practicalSalinity: number,
  temperature: number,
  depth: number
): number {
  checkRange('practicalSalinity', practicalSalinity, 30, 40);
  checkRange('temperature', temperature, -2, 30);
  checkRange('depth', depth, 0, 8000);
  const t = temperature;
  const s = practicalSalinity - 35;
  const d = depth;
  return (
    1448.96 +
    t * (4.591 + t * (-5.304e-2 + t * 2.374e-4)) +
    1.34 * s +
    d * (1.63e-2 + d * 1.675e-7) -
    1.025e-2 * t * s -
    7.139e-13 * t * d * d * d
  );
}
