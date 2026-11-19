// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original code.

import {getBodyFixedFrame} from './body-rotation';
import type {JulianDate} from './julian-date';
import type {SolarSystemBody} from './solar-system-body';

/** A planetocentric point on a body. */
export type BodySurfacePoint = {
  /** Planetocentric longitude, degrees east of the prime meridian, −180 < longitude ≤ 180. */
  readonly longitude: number;
  /** Planetocentric latitude, degrees, from −90 to 90. */
  readonly latitude: number;
};

/**
 * Returns the direction to the Sun in the body-fixed frame of a body.
 *
 * The caller supplies the position of the Sun relative to the body in the ICRF, from any
 * ephemeris. For a planet, it is the negative of the heliocentric position, for example of
 * {@link getApproximatePlanetPosition}. Light time and aberration are the caller's choice.
 * @param body - The body.
 * @param tt - The date, a `JulianDate` in the TT scale, from 1900-01-01T12:00 to 2100-01-01T12:00 TT.
 * @param sunPosition - The vector from the center of the body to the Sun, ICRF axes, any unit.
 * @returns A unit vector in the body-fixed frame of {@link getBodyFixedFrame}: +X at the prime
 * meridian, +Z at the north pole.
 * @throws {RangeError} When an input is not supported or not finite, or `sunPosition` is zero.
 */
export function getBodySunDirection(
  body: SolarSystemBody,
  tt: JulianDate,
  sunPosition: readonly number[]
): [number, number, number] {
  const [x, y, z] = getBodyFixedFrame(body, tt).transformPosition(sunPosition);
  const length = Math.hypot(x, y, z);
  if (!(length > 0) || !Number.isFinite(length)) {
    throw new RangeError('The Sun position must be a non-zero finite vector');
  }
  return [x / length, y / length, z / length];
}

/**
 * Returns the planetocentric subsolar point of a body: the point where the Sun is at the zenith of
 * a sphere. On an ellipsoid it is the point under the line from the center to the Sun, as the
 * CSPICE `subslr` method `'INTERCEPT/ELLIPSOID'` gives it.
 *
 * The terminator is the great circle 90 degrees from this point, without refraction. See
 * {@link getBodySunDirection} for `sunPosition`.
 * @param body - The body.
 * @param tt - The date, a `JulianDate` in the TT scale, from 1900-01-01T12:00 to 2100-01-01T12:00 TT.
 * @param sunPosition - The vector from the center of the body to the Sun, ICRF axes, any unit.
 * @returns Planetocentric longitude (east positive) and latitude, degrees.
 * @throws {RangeError} When an input is not supported or not finite, or `sunPosition` is zero.
 */
export function getBodySubsolarPoint(
  body: SolarSystemBody,
  tt: JulianDate,
  sunPosition: readonly number[]
): BodySurfacePoint {
  const [x, y, z] = getBodySunDirection(body, tt, sunPosition);
  const longitude = (Math.atan2(y, x) * 180) / Math.PI;
  return {
    longitude: longitude === -180 ? 180 : longitude,
    latitude: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI
  };
}
