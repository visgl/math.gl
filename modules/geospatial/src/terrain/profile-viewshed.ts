// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainProfile} from './profile';
import {TerrainSampleStatus} from './types';
import {getTerrainProfileHorizon, type TerrainProfileHorizonOptions} from './profile-horizon';

/** Sample classification for a single radial profile; station zero is the observer. */
export const TerrainProfileViewStatus = {
  OBSERVER: 0,
  VISIBLE: 1,
  BLOCKED: 2,
  UNKNOWN: 3,
  MISSING: 4
} as const;

/** Classify each terrain sample against earlier samples on a straight radial profile.
 * A previous sample on the ray blocks it. Missing earlier samples make otherwise
 * visible targets unknown, but cannot undo a known obstruction. This is a sampled
 * local profile, not an area viewshed or a guarantee about unsampled terrain.
 */
export function getTerrainProfileViewshed(
  profile: TerrainProfile,
  options: TerrainProfileHorizonOptions
): Uint8Array {
  // Validate the whole profile before writing any output.
  getTerrainProfileHorizon(profile, options);
  const result = new Uint8Array(profile.distances.length);
  let maxAngle = -Infinity;
  let missingBefore = profile.statuses[0] !== TerrainSampleStatus.VALID;
  for (let i = 1; i < result.length; i++) {
    if (profile.statuses[i] !== TerrainSampleStatus.VALID) {
      result[i] = TerrainProfileViewStatus.MISSING;
      missingBefore = true;
      continue;
    }
    const angle = Math.atan2(profile.heights[i] - options.observerHeight, profile.distances[i]);
    result[i] =
      angle <= maxAngle
        ? TerrainProfileViewStatus.BLOCKED
        : missingBefore
          ? TerrainProfileViewStatus.UNKNOWN
          : TerrainProfileViewStatus.VISIBLE;
    maxAngle = Math.max(maxAngle, angle);
  }
  return result;
}
