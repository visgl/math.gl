// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainProfile} from './profile';
import {TerrainSampleStatus} from './types';

export type TerrainProfileVisibility = {
  /** A sample blocks the line, all samples are clear, or coverage is incomplete. */
  status: 'blocked' | 'clear' | 'unknown';
  /** First observed blocking sample; missing samples can hide an earlier obstruction. */
  firstBlockingSample: number | undefined;
  missingSampleCount: number;
  /** Smallest sampled vertical clearance, including endpoints. */
  minimumClearance: number | undefined;
};

/** Compare absolute observer and target heights against a sampled, straight horizontal profile.
 * A touching sample blocks the line. A clear result applies only to the sampled
 * piecewise-linear profile; it does not certify unsampled terrain, Earth curvature,
 * refraction, or a geographic/geodesic path. Heights and distances must use compatible units.
 */
export function getTerrainProfileVisibility(
  profile: TerrainProfile,
  options: {
    observerHeight: number;
    targetHeight: number;
    maxSamples?: number;
  }
): TerrainProfileVisibility {
  const {observerHeight, targetHeight} = options;
  const limit = options.maxSamples ?? 1_000_000;
  const {distances, heights, statuses, length} = profile;
  const count = distances.length;
  if (
    !(distances instanceof Float64Array) ||
    !(heights instanceof Float64Array) ||
    !(statuses instanceof Uint8Array) ||
    count < 2 ||
    heights.length !== count ||
    statuses.length !== count ||
    !Number.isSafeInteger(limit) ||
    limit < count ||
    !Number.isFinite(observerHeight) ||
    !Number.isFinite(targetHeight) ||
    !Number.isFinite(length) ||
    length <= 0 ||
    distances[0] !== 0 ||
    distances[count - 1] !== length
  )
    throw new Error('Invalid terrain visibility profile or options');
  let missingSampleCount = 0;
  let firstBlockingSample: number | undefined;
  let minimumClearance = Infinity;
  for (let i = 0; i < count; i++) {
    const distance = distances[i],
      status = statuses[i];
    if (!Number.isFinite(distance) || (i > 0 && distance <= distances[i - 1]))
      throw new Error('Invalid terrain visibility stationing');
    if (status > TerrainSampleStatus.NOT_RESIDENT)
      throw new Error('Invalid terrain visibility status');
    if (status !== TerrainSampleStatus.VALID) {
      missingSampleCount++;
      continue;
    }
    if (!Number.isFinite(heights[i])) throw new Error('Invalid terrain visibility height');
    const fraction = distance / length;
    const lineHeight = observerHeight * (1 - fraction) + targetHeight * fraction;
    const clearance = lineHeight - heights[i];
    if (!Number.isFinite(clearance)) throw new Error('Terrain visibility arithmetic overflow');
    minimumClearance = Math.min(minimumClearance, clearance);
    if (clearance <= 0 && firstBlockingSample === undefined) firstBlockingSample = i;
  }
  return {
    status:
      firstBlockingSample !== undefined ? 'blocked' : missingSampleCount ? 'unknown' : 'clear',
    firstBlockingSample,
    missingSampleCount,
    minimumClearance: minimumClearance === Infinity ? undefined : minimumClearance
  };
}
