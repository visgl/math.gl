// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented mathematical equations (no reference code copied):
// USNO sidereal time: https://aa.usno.navy.mil/faq/GAST
// IAU 1976 precession: https://www.space.t.u-tokyo.ac.jp/s2e-documents/Specifications/Environment/Spec_CelestialRotation.html
// ENU basis: https://gssc.esa.int/navipedia/index.php/Transformations_between_ECEF_and_ENU_coordinates
import {validateObserver} from './celestial';
import {toDays} from './suncalc';

export type StarfieldOptions = {
  /** Cubemap equatorial frame. Default J2000; 'date' skips precession. */
  epoch?: 'J2000' | 'date';
};

/** Local mean sidereal angle, in radians, using UTC as an approximation to UT1 and TT. */
export function getLocalSiderealTime(timestamp: number | Date, longitude: number): number {
  validateObserver(timestamp, 0, longitude);
  const days = toDays(timestamp);
  const midnight = Math.floor(days + 0.5) - 0.5;
  const hours = (days - midnight) * 24;
  const centuries = days / 36525;
  const siderealHours =
    6.697375 + 0.065709824279 * midnight + 1.0027379 * hours + 0.0000258 * centuries * centuries;
  const angle = ((siderealHours % 24) * Math.PI) / 12 + ((longitude % 360) * Math.PI) / 180;
  return ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

/**
 * Column-major 3x3 rotation from equatorial sky directions to local east/north/up.
 * Equatorial +X = RA 0, Dec 0; +Y = RA 6h, Dec 0; +Z = north celestial pole.
 * For cubemap lookup from a local view direction, use the transpose (inverse).
 */
export function getStarfieldRotation(
  timestamp: number | Date,
  latitude: number,
  longitude: number,
  options: StarfieldOptions = {}
): number[] {
  validateObserver(timestamp, latitude, longitude);
  const {epoch = 'J2000'} = options;
  if (epoch !== 'J2000' && epoch !== 'date') {
    throw new RangeError('Starfield epoch must be J2000 or date');
  }
  const sidereal = getLocalSiderealTime(timestamp, longitude);
  const phi = (latitude * Math.PI) / 180;
  const sinTime = Math.sin(sidereal);
  const cosTime = Math.cos(sidereal);
  const sinLatitude = Math.sin(phi);
  const cosLatitude = Math.cos(phi);
  const local = [
    -sinTime,
    -sinLatitude * cosTime,
    cosLatitude * cosTime,
    cosTime,
    -sinLatitude * sinTime,
    cosLatitude * sinTime,
    0,
    cosLatitude,
    sinLatitude
  ];
  if (epoch === 'date') return local;

  // IAU 1976, J2000 to mean equator/equinox of date. UTC approximates TT here.
  const t = toDays(timestamp) / 36525;
  const arcsecondsToRadians = Math.PI / (180 * 3600);
  const zeta = t * (2306.2181 + t * (0.30188 + t * 0.017998)) * arcsecondsToRadians;
  const theta = t * (2004.3109 + t * (-0.42665 - t * 0.041833)) * arcsecondsToRadians;
  const z = t * (2306.2181 + t * (1.09468 + t * 0.018203)) * arcsecondsToRadians;
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
  const precession = multiply(multiply(rotationZ(z), middle), rotationZ(zeta));
  return multiply(local, precession);
}

function rotationZ(angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
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
