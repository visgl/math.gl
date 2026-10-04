// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original procedural rendering approximation, not observational sky data.
import {
  equatorialToGalactic,
  galacticToEquatorial,
  integrateGalacticOrbit,
  SOLAR_POSITION,
  SOLAR_VELOCITY
} from './star-galactic';

export type MilkyWaySample = {intensity: number; color: readonly number[]};
export type MilkyWayBackground = {
  /** Fixed equatorial J2000 directions; apply the same rendering rotation as foreground stars. */
  centerDirection: readonly number[];
  northDirection: readonly number[];
  /** Qualitative relative intensity and linear RGB tint, not luminance or measured flux. */
  sample: (equatorialDirection: readonly number[]) => MilkyWaySample;
};

/** Create a qualitative band, bulge and dust lane. Shares one Solar orbit integration per epoch. */
export function createMilkyWayBackground(
  epochYear = 2000,
  maximumStepYears = 10000
): MilkyWayBackground {
  const solar = integrateGalacticOrbit(
    SOLAR_POSITION,
    SOLAR_VELOCITY,
    epochYear - 2000,
    maximumStepYears
  ).position;
  const radius = Math.hypot(...solar);
  const center = solar.map(value => -value / radius);
  const longitude = Math.atan2(center[1], center[0]);
  const color = Object.freeze([1, 0.91, 0.8]);
  return {
    centerDirection: galacticToEquatorial(center),
    northDirection: galacticToEquatorial([0, 0, 1]),
    sample: direction => {
      if (
        direction.length !== 3 ||
        !direction.every(Number.isFinite) ||
        Math.hypot(...direction) === 0
      )
        throw new RangeError('Expected a finite nonzero direction');
      const vector = equatorialToGalactic(direction);
      const latitude = Math.asin(Math.max(-1, Math.min(1, vector[2] / Math.hypot(...vector))));
      const delta = Math.atan2(
        Math.sin(Math.atan2(vector[1], vector[0]) - longitude),
        Math.cos(Math.atan2(vector[1], vector[0]) - longitude)
      );
      const gaussian = (angle: number, width: number): number =>
        Math.exp(-0.5 * (angle / ((width * Math.PI) / 180)) ** 2);
      const band = 0.25 * gaussian(latitude, 8);
      const bulge = 0.75 * gaussian(delta, 20) * gaussian(latitude, 10);
      const dust = 1 - 0.65 * gaussian(latitude, 1.5);
      return {intensity: (band + bulge) * dust, color};
    }
  };
}
