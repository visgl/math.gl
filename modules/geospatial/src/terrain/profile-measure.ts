// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainProfile} from './profile';
import {TerrainSampleStatus as Status} from './types';

export type TerrainProfileMeasurements = {
  length: number;
  coveredLength: number;
  missingLength: number;
  coveredSegmentCount: number;
  missingSegmentCount: number;
  validSampleCount: number;
  minimumHeight: number | undefined;
  maximumHeight: number | undefined;
  ascent: number;
  descent: number;
  surfaceLength: number;
  /** Trapezoidal integral over covered station intervals, in height * distance units. */
  heightIntegral: number;
  meanHeight: number | undefined;
  /** Every sample was VALID, including isolated samples and single-point profiles. */
  complete: boolean;
};

/** Measure the sampled piecewise-linear profile. Only adjacent VALID samples contribute intervals.
 * Distances are the authoritative horizontal stationing. No gaps are bridged or terrain resampled.
 */
export function measureTerrainProfile(
  profile: TerrainProfile,
  options: {maxSamples?: number} = {}
): TerrainProfileMeasurements {
  const limit = options.maxSamples ?? 1_000_000;
  if (
    !Number.isSafeInteger(limit) ||
    limit < 0 ||
    !(profile.distances instanceof Float64Array) ||
    profile.distances.length < 1 ||
    profile.distances.length > limit
  )
    throw new Error('Invalid terrain profile sample capacity');
  const count = profile.distances.length;
  if (
    !(profile.positions instanceof Float64Array) ||
    profile.positions.length !== 2 * count ||
    !profile.positions.every(Number.isFinite) ||
    !(profile.heights instanceof Float64Array) ||
    profile.heights.length !== count ||
    !(profile.statuses instanceof Uint8Array) ||
    profile.statuses.length !== count
  )
    throw new Error('Invalid terrain profile buffers');
  if (
    !Number.isFinite(profile.length) ||
    profile.length < 0 ||
    profile.distances[0] !== 0 ||
    profile.distances[count - 1] !== profile.length
  )
    throw new Error('Invalid terrain profile stationing');
  let validSampleCount = 0,
    minimum = Infinity,
    maximum = -Infinity,
    coveredSegmentCount = 0,
    missingSegmentCount = 0;
  // Compensated accumulation for lengths, elevation changes and the height integral.
  let meanHeight = 0;
  const sums = new Float64Array(6),
    corrections = new Float64Array(6);
  const add = (index: number, value: number): void => {
    const y = value - corrections[index],
      next = sums[index] + y;
    if (!Number.isFinite(value) || !Number.isFinite(next))
      throw new Error('Terrain profile measurement arithmetic overflow');
    corrections[index] = next - sums[index] - y;
    sums[index] = next;
  };
  for (let i = 0; i < count; i++) {
    const distance = profile.distances[i],
      status = profile.statuses[i],
      height = profile.heights[i];
    if (!Number.isFinite(distance) || (i > 0 && distance <= profile.distances[i - 1]))
      throw new Error('Invalid terrain profile stationing');
    if (status > Status.NOT_RESIDENT) throw new Error('Invalid terrain profile status');
    if (status === Status.VALID) {
      if (!Number.isFinite(height)) throw new Error('Invalid terrain profile height');
      validSampleCount++;
      minimum = Math.min(minimum, height);
      maximum = Math.max(maximum, height);
    }
    if (i === 0) continue;
    const ds = distance - profile.distances[i - 1];
    if (status !== Status.VALID || profile.statuses[i - 1] !== Status.VALID) {
      missingSegmentCount++;
      add(1, ds);
      continue;
    }
    coveredSegmentCount++;
    const previousCovered = sums[0];
    add(0, ds);
    const previous = profile.heights[i - 1],
      dh = height - previous;
    add(dh >= 0 ? 2 : 3, Math.abs(dh));
    add(4, Math.hypot(ds, dh));
    const average = previous + dh / 2;
    add(5, average * ds);
    if (previousCovered === 0) meanHeight = average;
    else {
      const oldWeight = previousCovered / sums[0],
        newWeight = ds / sums[0];
      const delta = average - meanHeight;
      meanHeight = Number.isFinite(delta)
        ? newWeight <= 0.5
          ? meanHeight + delta * newWeight
          : average - delta * oldWeight
        : meanHeight * oldWeight + average * newWeight;
      if (!Number.isFinite(meanHeight))
        throw new Error('Terrain profile measurement arithmetic overflow');
    }
  }
  return {
    length: profile.length,
    coveredLength: sums[0],
    missingLength: sums[1],
    coveredSegmentCount,
    missingSegmentCount,
    validSampleCount,
    minimumHeight: validSampleCount ? minimum : undefined,
    maximumHeight: validSampleCount ? maximum : undefined,
    ascent: sums[2],
    descent: sums[3],
    surfaceLength: sums[4],
    heightIntegral: sums[5],
    meanHeight: sums[0] ? meanHeight : undefined,
    complete: validSampleCount === count
  };
}
