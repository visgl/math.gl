// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainProfile} from './profile';
import {TerrainSampleStatus} from './types';

/** Horizon of known samples. Missing coverage means the true horizon may be higher. */
export type TerrainProfileHorizon = {
  angle: number | undefined;
  sampleIndex: number | undefined;
  missingSampleCount: number;
  complete: boolean;
};

export type TerrainProfileHorizonOptions = {observerHeight: number; maxSamples?: number};

/** Calculate the maximum elevation angle in radians of a straight, sampled profile.
 * The observer is at station zero, and its absolute height must be above known terrain
 * there. Values describe a local Cartesian piecewise-linear profile, not unsampled
 * terrain, curvature, refraction or a geographic path. Missing samples leave the
 * maximum of known samples as a lower bound rather than a complete horizon.
 */
export function getTerrainProfileHorizon(
  profile: TerrainProfile,
  options: TerrainProfileHorizonOptions
): TerrainProfileHorizon {
  const {distances, heights, statuses, length} = profile;
  const count = distances.length;
  const limit = options.maxSamples ?? 1_000_000;
  if (
    !(distances instanceof Float64Array) ||
    !(heights instanceof Float64Array) ||
    !(statuses instanceof Uint8Array) ||
    count < 2 ||
    heights.length !== count ||
    statuses.length !== count ||
    !Number.isSafeInteger(limit) ||
    limit < count ||
    !Number.isFinite(options.observerHeight) ||
    !Number.isFinite(length) ||
    length <= 0 ||
    distances[0] !== 0 ||
    distances[count - 1] !== length
  )
    throw new Error('Invalid terrain horizon profile or options');
  let angle = -Infinity;
  let sampleIndex: number | undefined;
  let missingSampleCount = 0;
  for (let i = 0; i < count; i++) {
    const distance = distances[i];
    const status = statuses[i];
    if (!Number.isFinite(distance) || (i > 0 && distance <= distances[i - 1]))
      throw new Error('Invalid terrain horizon stationing');
    if (status > TerrainSampleStatus.NOT_RESIDENT)
      throw new Error('Invalid terrain horizon status');
    if (status !== TerrainSampleStatus.VALID) {
      missingSampleCount++;
      continue;
    }
    if (!Number.isFinite(heights[i])) throw new Error('Invalid terrain horizon height');
    if (i === 0) {
      if (options.observerHeight <= heights[i])
        throw new Error('Terrain horizon observer must be above ground');
      continue;
    }
    const delta = heights[i] - options.observerHeight;
    if (!Number.isFinite(delta)) throw new Error('Terrain horizon arithmetic overflow');
    const sampleAngle = Math.atan2(delta, distance);
    if (sampleAngle > angle) {
      angle = sampleAngle;
      sampleIndex = i;
    }
  }
  return {
    angle: sampleIndex === undefined ? undefined : angle,
    sampleIndex,
    missingSampleCount,
    complete: missingSampleCount === 0
  };
}
