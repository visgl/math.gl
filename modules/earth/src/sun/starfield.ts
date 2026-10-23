// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Compatibility adapter over original math.gl mean-frame helpers. UTC remains the default approximation to UT1/TT.

import {
  JulianDate,
  getMeanSiderealAngle,
  getMeanEquatorialToLocalRotation
} from '../celestial/index';
import {validateObserver} from './celestial';

export type StarfieldOptions = {
  /** Mean-equatorial frame. Default J2000; 'date' skips precession. */
  epoch?: 'J2000' | 'date';
  /** Explicit UT1 minus UTC, seconds. Default zero retains the approximate legacy model. */
  ut1MinusUtc?: number;
  /** Explicit TT minus UTC, seconds. Default zero retains the approximate legacy model. */
  ttMinusUtc?: number;
};

/** Approximate local mean sidereal angle; UTC approximates UT1 unless offset is supplied. */
export function getLocalSiderealTime(
  timestamp: number | Date,
  longitude: number,
  ut1MinusUtc = 0
): number {
  validateObserver(timestamp, 0, longitude);
  const ut1 = JulianDate.fromUnixMilliseconds(timestamp, ut1MinusUtc, 'UT1');
  return (
    (((getMeanSiderealAngle(ut1) + ((longitude % 360) * Math.PI) / 180) % (2 * Math.PI)) +
      2 * Math.PI) %
    (2 * Math.PI)
  );
}

/** Column-major rotation from mean-equatorial directions to outward local ENU.
 * Equatorial +X = RA 0, Dec 0; +Y = RA 6h, Dec 0; +Z = north celestial pole.
 * Model remains approximate: explicit offsets do not add nutation or polar motion.
 */
export function getStarfieldRotation(
  timestamp: number | Date,
  latitude: number,
  longitude: number,
  options: StarfieldOptions = {}
): number[] {
  validateObserver(timestamp, latitude, longitude);
  return getMeanEquatorialToLocalRotation(
    JulianDate.fromUnixMilliseconds(timestamp, options.ut1MinusUtc ?? 0, 'UT1'),
    JulianDate.fromUnixMilliseconds(timestamp, options.ttMinusUtc ?? 0, 'TT'),
    latitude,
    longitude,
    options.epoch ?? 'J2000'
  );
}
