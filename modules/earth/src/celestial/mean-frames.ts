// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Existing original math.gl starfield equations factored into explicit-scale mean-frame helpers. USNO sidereal formula and IAU 1976 precession; no SOFA code copied.

// Equation references retained from the original starfield implementation:
// https://aa.usno.navy.mil/faq/GAST
// https://www.space.t.u-tokyo.ac.jp/s2e-documents/Specifications/Environment/Spec_CelestialRotation.html
// https://gssc.esa.int/navipedia/index.php/Transformations_between_ECEF_and_ENU_coordinates

import {JulianDate} from './julian-date';

/** Approximate mean sidereal angle at Greenwich. UT1 is explicit. This retains the
 * existing USNO-style starfield formula, not an IAU 2006/GCRF-to-ITRF model.
 */
export function getMeanSiderealAngle(ut1: JulianDate): number {
  requireScale(ut1, 'UT1');
  const days = daysSinceJ2000(ut1);
  const midnight = Math.floor(days + 0.5) - 0.5;
  const hours = (days - midnight) * 24;
  const centuries = days / 36525;
  const siderealHours =
    6.697375 + 0.065709824279 * midnight + 1.0027379 * hours + 0.0000258 * centuries * centuries;
  return finiteAngle(((siderealHours % 24) * Math.PI) / 12);
}

/** Mean equator/equinox J2000 to mean equator/equinox of date, IAU 1976.
 * TT is explicit. Omits nutation, aberration and modern frame-bias corrections.
 */
export function getIAU1976Precession(tt: JulianDate): number[] {
  requireScale(tt, 'TT');
  const t = daysSinceJ2000(tt) / 36525;
  const arcsecondsToRadians = Math.PI / (180 * 3600);
  const zeta = t * (2306.2181 + t * (0.30188 + t * 0.017998)) * arcsecondsToRadians;
  const theta = t * (2004.3109 + t * (-0.42665 - t * 0.041833)) * arcsecondsToRadians;
  const z = t * (2306.2181 + t * (1.09468 + t * 0.018203)) * arcsecondsToRadians;
  if (![zeta, theta, z].every(Number.isFinite)) throw new RangeError('Unrepresentable precession');
  const middle = [
    Math.cos(theta),
    0,
    Math.sin(theta),
    0,
    1,
    0,
    -Math.sin(theta),
    0,
    Math.cos(theta)
  ];
  return multiply(multiply(rotationZ(z), middle), rotationZ(zeta));
}

/** Approximate column-major mean-equatorial to outward local ENU rotation.
 * Observer angles are degrees. Exact precision Earth-orientation work is separate.
 */
export function getMeanEquatorialToLocalRotation(
  ut1: JulianDate,
  tt: JulianDate,
  latitude: number,
  longitude: number,
  epoch: 'J2000' | 'date' = 'J2000'
): number[] {
  requireScale(ut1, 'UT1');
  requireScale(tt, 'TT');
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    (epoch !== 'J2000' && epoch !== 'date')
  ) {
    throw new RangeError('Invalid mean-frame observer or epoch');
  }
  const sidereal = finiteAngle(getMeanSiderealAngle(ut1) + ((longitude % 360) * Math.PI) / 180);
  const phi = (latitude * Math.PI) / 180;
  const s = Math.sin(sidereal),
    c = Math.cos(sidereal),
    sp = Math.sin(phi),
    cp = Math.cos(phi);
  const local = [-s, -sp * c, cp * c, c, -sp * s, cp * s, 0, cp, sp];
  return epoch === 'date' ? local : multiply(local, getIAU1976Precession(tt));
}

function daysSinceJ2000(time: JulianDate): number {
  return time.dayNumber - 2451545 + time.secondsOfDay / 86400;
}
function requireScale(time: JulianDate, scale: 'TT' | 'UT1'): void {
  if (!(time instanceof JulianDate) || time.timeScale !== scale)
    throw new RangeError(`Expected ${scale} Julian coordinate`);
}
function finiteAngle(angle: number): number {
  if (!Number.isFinite(angle)) throw new RangeError('Unrepresentable sidereal angle');
  return ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}
function rotationZ(angle: number): number[] {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return [c, s, 0, -s, c, 0, 0, 0, 1];
}
function multiply(a: number[], b: number[]): number[] {
  const result = new Array<number>(9);
  for (let column = 0; column < 3; column++) {
    for (let row = 0; row < 3; row++) {
      result[column * 3 + row] =
        a[row] * b[column * 3] + a[row + 3] * b[column * 3 + 1] + a[row + 6] * b[column * 3 + 2];
    }
  }
  return result;
}
