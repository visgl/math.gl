// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original code. Radii from the IAU WGCCRE 2015 report as NAIF pck00011.tpc gives them; GM values from NAIF gm_de440.tpc. Physical constants are facts, not copied code.

import {JulianDate} from './julian-date';

/** A body that has an IAU WGCCRE 2015 rotation model and a pinned radius and GM. */
export type SolarSystemBody =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'moon'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

/** Radii of the reference ellipsoid of a body, in metres. */
export type BodyRadii = {
  /** Equatorial radius, m. */
  readonly equatorialRadius: number;
  /** Polar radius, m. */
  readonly polarRadius: number;
};

// [equatorial radius, polar radius] in m, from BODYnnn_RADII of NAIF pck00011.tpc (IAU WGCCRE
// 2015, Archinal et al. 2018, Table 4 and Table 5). The two equatorial axes are equal for all
// these bodies. The Earth values are the IAU values, not WGS84.
const RADII: Readonly<Record<SolarSystemBody, readonly [number, number]>> = {
  sun: [695700000, 695700000],
  mercury: [2440530, 2438260],
  venus: [6051800, 6051800],
  earth: [6378136.6, 6356751.9],
  moon: [1737400, 1737400],
  mars: [3396190, 3376200],
  jupiter: [71492000, 66854000],
  saturn: [60268000, 54364000],
  uranus: [25559000, 24973000],
  neptune: [24764000, 24341000]
};

// GM in km^3/s^2, from NAIF gm_de440.tpc: BODY10, 199, 299, 399 and 301 are the DE440 values
// (Park et al. 2021); BODY499 to BODY899 are the planet alone, without its satellites, from the
// JPL satellite ephemeris solutions that the same file gives.
const GM_KM3_S2: Readonly<Record<SolarSystemBody, number>> = {
  sun: 1.3271244004127942e11,
  mercury: 2.2031868551400003e4,
  venus: 3.24858592e5,
  earth: 3.9860043550702266e5,
  moon: 4.9028001184575496e3,
  mars: 4.282837362069909e4,
  jupiter: 1.266865319003704e8,
  saturn: 3.793120623436167e7,
  uranus: 5.793951256527211e6,
  neptune: 6.835103145462294e6
};

/** The bodies that this module supports, in order of distance from the Sun (the Moon after the Earth). */
export const SOLAR_SYSTEM_BODIES: readonly SolarSystemBody[] = Object.freeze([
  'sun',
  'mercury',
  'venus',
  'earth',
  'moon',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune'
]);

/**
 * Returns the radii of the reference ellipsoid of a body, from the IAU WGCCRE 2015 report.
 *
 * Reference: Archinal et al. (2018), "Report of the IAU Working Group on Cartographic Coordinates
 * and Rotational Elements: 2015", Celest. Mech. Dyn. Astr. 130:22, doi:10.1007/s10569-017-9805-5,
 * as NAIF `pck00011.tpc` gives it. The Earth values (6378136.6 m, 6356751.9 m) are the IAU values,
 * not WGS84 (6378137 m).
 * @param body - The body.
 * @returns Equatorial and polar radius, m.
 * @throws {RangeError} When `body` is not a supported body.
 */
export function getBodyRadii(body: SolarSystemBody): BodyRadii {
  const [equatorialRadius, polarRadius] = RADII[checkBody(body)];
  return {equatorialRadius, polarRadius};
}

/**
 * Returns the gravitational parameter GM of a body, without its satellites.
 *
 * Reference: NAIF `gm_de440.tpc`. The Sun, Mercury, Venus, the Earth and the Moon have the DE440
 * values (Park et al. 2021, Astron. J. 161:105, doi:10.3847/1538-3881/abd414). Mars to Neptune have
 * the values of the JPL satellite ephemeris solutions in the same file.
 * @param body - The body.
 * @returns GM, m³/s².
 * @throws {RangeError} When `body` is not a supported body.
 */
export function getBodyGravitationalParameter(body: SolarSystemBody): number {
  return GM_KM3_S2[checkBody(body)] * 1e9;
}

/**
 * Throws a `RangeError` when `body` is not a supported body.
 * @param body - The value to check.
 * @returns The body, unchanged.
 */
export function checkBody(body: SolarSystemBody): SolarSystemBody {
  if (!Object.prototype.hasOwnProperty.call(RADII, body)) {
    throw new RangeError(`Unsupported body ${String(body)}`);
  }
  return body;
}

/** The J2000.0 epoch, TT. */
const J2000_TT = new JulianDate(2451545, 0, 'TT');

/**
 * Returns the days of TT since J2000.0 (JD 2451545.0 TT) of a TT Julian date.
 * @param tt - A Julian date in the TT scale.
 * @param minimumDays - Smallest permitted value.
 * @param maximumDays - Largest permitted value.
 * @returns Days since J2000.0.
 * @throws {RangeError} When `tt` is not a TT `JulianDate`, or is outside the range.
 */
export function getDaysSinceJ2000TT(
  tt: JulianDate,
  minimumDays: number,
  maximumDays: number
): number {
  if (!(tt instanceof JulianDate) || tt.timeScale !== 'TT') {
    throw new RangeError('Expected a JulianDate in the TT scale');
  }
  const days = tt.secondsDifference(J2000_TT) / 86400;
  if (days < minimumDays || days > maximumDays) {
    throw new RangeError(
      `Date is outside the supported range: ${days} days from J2000.0, permitted ${minimumDays} to ${maximumDays}`
    );
  }
  return days;
}
