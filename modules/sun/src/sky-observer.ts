// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {validateRange} from './celestial';

/** Shared observer for celestial snapshots, batch calculations and event searches. */
export type SkyObserver = Readonly<{latitude: number; longitude: number; elevation: number}>;
export type SkyHorizonProfile = readonly {azimuth: number; altitude: number}[];

/** Periodic linear terrain horizon, with azimuth/altitude in radians. Empty means flat. */
export function getSkyHorizonAltitude(azimuth: number, profile: SkyHorizonProfile = []): number {
  validateRange('Azimuth', azimuth, -Number.MAX_VALUE, Number.MAX_VALUE);
  const tau = 2 * Math.PI;
  const wrap = (angle: number) => ((angle % tau) + tau) % tau;
  const points = profile
    .map(point => {
      validateRange('Horizon azimuth', point.azimuth, -Number.MAX_VALUE, Number.MAX_VALUE);
      validateRange('Horizon altitude', point.altitude, -Math.PI / 2, Math.PI / 2);
      return {azimuth: wrap(point.azimuth), altitude: point.altitude};
    })
    .sort((a, b) => a.azimuth - b.azimuth);
  if (points.length === 0) return 0;
  if (points.length === 1) return points[0].altitude;
  if (points.some((point, i) => i > 0 && point.azimuth === points[i - 1].azimuth))
    throw new RangeError('Horizon azimuths must be distinct modulo 2PI');
  const angle = wrap(azimuth);
  const index = points.findIndex(point => point.azimuth > angle);
  const upper = index < 0 ? {...points[0], azimuth: points[0].azimuth + tau} : points[index];
  const lower =
    index === 0
      ? {...points[points.length - 1], azimuth: points[points.length - 1].azimuth - tau}
      : points[index < 0 ? points.length - 1 : index - 1];
  const t = (angle - lower.azimuth) / (upper.azimuth - lower.azimuth);
  return lower.altitude + t * (upper.altitude - lower.altitude);
}
export function createSkyObserver(options: {
  latitude: number;
  longitude: number;
  elevation?: number;
}): SkyObserver {
  const {latitude, longitude, elevation = 0} = options;
  validateRange('Latitude', latitude, -90, 90);
  validateRange('Longitude', longitude, -Number.MAX_VALUE, Number.MAX_VALUE);
  validateRange('Elevation', elevation, -1000, 100000);
  return Object.freeze({latitude, longitude: (((longitude % 360) + 540) % 360) - 180, elevation});
}
/** Outward ENU sky vector. Azimuth is radians from south towards west. */
export function getSkyDirection(altitude: number, azimuth: number): [number, number, number] {
  validateRange('Altitude', altitude, -Math.PI / 2, Math.PI / 2);
  validateRange('Azimuth', azimuth, -Number.MAX_VALUE, Number.MAX_VALUE);
  return [
    -Math.cos(altitude) * Math.sin(azimuth),
    -Math.cos(altitude) * Math.cos(azimuth),
    Math.sin(altitude)
  ];
}
/** Convert outward sky direction to incoming illumination, or vice versa. */
export function reverseSkyDirection(direction: readonly number[]): [number, number, number] {
  if (
    direction.length !== 3 ||
    direction.some(value => !Number.isFinite(value)) ||
    Math.hypot(...direction) === 0
  )
    throw new RangeError('Direction must be a finite nonzero three-vector');
  return [-direction[0], -direction[1], -direction[2]];
}
