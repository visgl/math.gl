// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {getSunCoords, getSiderealTime, toDays} from './suncalc';

export type SunTerminatorOptions = {
  /** Geometric solar altitude in degrees, from -18 to 0. Default: 0. */
  altitude?: number;
  /** Number of circle segments before seam splitting. Integer >= 8. Default: 360. */
  resolution?: number;
};

export type SunTerminator = {
  /** Longitude/latitude degrees, split at the antimeridian and poles. */
  geometry: {type: 'MultiLineString'; coordinates: [number, number][][]};
  /** Unit vector toward the Sun: +X Greenwich, +Y 90°E, +Z north. */
  sunDirection: [number, number, number];
  /** Geometric solar altitude in degrees. Darkness is below this threshold. */
  altitude: number;
};

const RAD = Math.PI / 180;
const TAU = 2 * Math.PI;
// Sub-millimeter tolerance on Earth; also covers Julian-day rounding at equinox.
const POLE_EPSILON = 1e-10;

/** Spherical geometric day/night or twilight boundary, without atmospheric refraction. */
export function getSunTerminator(
  timestamp: number | Date,
  {altitude = 0, resolution = 360}: SunTerminatorOptions = {}
): SunTerminator {
  const time = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  if (!Number.isFinite(time) || !Number.isFinite(new Date(time).getTime())) {
    throw new RangeError('Timestamp must be a valid finite date');
  }
  if (!Number.isFinite(altitude) || altitude < -18 || altitude > 0) {
    throw new RangeError('Altitude must be between -18 and 0 degrees');
  }
  if (!Number.isSafeInteger(resolution) || resolution < 8) {
    throw new RangeError('Resolution must be an integer >= 8');
  }
  const days = toDays(time);
  const {declination, rightAscension} = getSunCoords(days);
  const longitude = rightAscension - getSiderealTime(days, 0);
  const sunDirection: [number, number, number] = [
    Math.cos(declination) * Math.cos(longitude),
    Math.cos(declination) * Math.sin(longitude),
    Math.sin(declination)
  ];
  const [sx, sy, sz] = sunDirection;
  const horizontal = Math.hypot(sx, sy);
  const u = [-sy / horizontal, sx / horizontal, 0];
  const v = [-sz * u[1], sz * u[0], horizontal];
  const offset = Math.sin(altitude * RAD);
  const radius = Math.cos(altitude * RAD);
  const point = (angle: number): number[] =>
    sunDirection.map(
      (component, i) =>
        offset * component + radius * (Math.cos(angle) * u[i] + Math.sin(angle) * v[i])
    );

  // Solve y(theta)=0 analytically and split only on the negative-X half plane.
  // This inserts exact boundary points rather than interpolating in lon/lat.
  const cuts = [0, TAU];
  const a = radius * u[1];
  const b = radius * v[1];
  const amplitude = Math.hypot(a, b);
  const ratio = (-offset * sy) / amplitude;
  if (amplitude > 1e-14 && Math.abs(ratio) <= 1 + 1e-14) {
    const phase = Math.atan2(b, a);
    const angle = Math.acos(Math.max(-1, Math.min(1, ratio)));
    for (const candidate of [phase - angle, phase + angle]) {
      const t = ((candidate % TAU) + TAU) % TAU;
      if (point(t)[0] < 1e-12) cuts.push(t);
    }
  }
  // A circle through a pole has two different limiting longitudes there.
  for (const t of [Math.PI / 2, (3 * Math.PI) / 2]) {
    const p = point(t);
    if (Math.hypot(p[0], p[1]) < POLE_EPSILON) cuts.push(t);
  }
  const sorted = cuts.sort((x, y) => x - y).filter((t, i, all) => !i || t - all[i - 1] > 1e-12);
  const coordinates: [number, number][][] = [];
  for (let i = 1; i < sorted.length; i++) {
    const start = sorted[i - 1];
    const end = sorted[i];
    const angles = [start];
    for (let j = Math.floor((start / TAU) * resolution) + 1; j < resolution; j++) {
      const t = (j / resolution) * TAU;
      if (t >= end - 1e-12) break;
      angles.push(t);
    }
    angles.push(end);
    coordinates.push(
      angles.map((t, j): [number, number] => {
        const p = point(t);
        const nearby = point(t + (j === 0 ? 1 : -1) * Math.min(1e-7, (end - start) / 4));
        const polar = Math.hypot(p[0], p[1]) < POLE_EPSILON;
        let longitude = Math.atan2(polar ? nearby[1] : p[1], polar ? nearby[0] : p[0]) / RAD;
        if (!polar && p[0] < 0 && Math.abs(p[1]) < 1e-12) {
          longitude = nearby[1] >= 0 ? 180 : -180;
        }
        return [longitude, Math.atan2(p[2], Math.hypot(p[0], p[1])) / RAD];
      })
    );
  }
  return {
    geometry: {type: 'MultiLineString', coordinates},
    sunDirection,
    altitude
  };
}
