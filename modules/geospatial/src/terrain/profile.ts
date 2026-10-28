// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {TerrainSampleStatus as Status, type TerrainSampleStatus} from './types';

/** Bind source choice, interpolation and residency policy in the callback. */
export type TerrainProfileSampler = (
  x: number,
  y: number
) => {status: TerrainSampleStatus; height: number};
export type TerrainProfile = {
  positions: Float64Array;
  distances: Float64Array;
  heights: Float64Array;
  statuses: Uint8Array;
  /** Horizontal Cartesian path length, not surface length or geodesic distance. */
  length: number;
};

/** Preserve every nonrepeated path vertex; subdivide each segment evenly to at most spacing.
 * Missing samples remain explicit. No interpolation across gaps or clearance guarantee is implied.
 */
export function sampleTerrainProfile(
  sample: TerrainProfileSampler,
  path: ArrayLike<number>,
  options: {spacing: number; maxSamples?: number}
): TerrainProfile {
  const limit = options.maxSamples ?? 1_000_000;
  if (
    !Number.isFinite(options.spacing) ||
    options.spacing <= 0 ||
    !Number.isSafeInteger(limit) ||
    limit < 1
  )
    throw new Error('Invalid terrain profile spacing or capacity');
  if (
    !Number.isSafeInteger(path.length) ||
    path.length < 2 ||
    path.length % 2 ||
    path.length / 2 > limit
  )
    throw new Error('Invalid terrain profile path or vertex capacity');
  for (let i = 0; i < path.length; i++)
    if (!Number.isFinite(path[i])) throw new Error('Terrain profile coordinates must be finite');
  const points = Float64Array.from(path),
    lengths = new Float64Array(points.length / 2 - 1),
    divisions = new Float64Array(lengths.length);
  let count = 1,
    length = 0;
  for (let i = 0; i < lengths.length; i++) {
    const distance = Math.hypot(
      points[2 * i + 2] - points[2 * i],
      points[2 * i + 3] - points[2 * i + 1]
    );
    const nextLength = length + distance;
    if (!Number.isFinite(nextLength) || (distance > 0 && nextLength <= length))
      throw new Error('Terrain profile distance overflow or loss of precision');
    const steps = distance === 0 ? 0 : Math.max(1, Math.ceil(distance / options.spacing));
    if (!Number.isSafeInteger(steps) || count + steps > limit)
      throw new Error('Terrain profile sample capacity exceeded');
    lengths[i] = distance;
    divisions[i] = steps;
    count += steps;
    length = nextLength;
  }
  const positions = new Float64Array(count * 2),
    distances = new Float64Array(count),
    heights = new Float64Array(count),
    statuses = new Uint8Array(count);
  let index = 0;
  const emit = (x: number, y: number, distance: number): void => {
    if (
      index > 0 &&
      (distance <= distances[index - 1] ||
        (x === positions[2 * index - 2] && y === positions[2 * index - 1]))
    )
      throw new Error('Terrain profile samples lose coordinate or distance precision');
    positions[2 * index] = x;
    positions[2 * index + 1] = y;
    distances[index] = distance;
    const value = sample(x, y);
    if (!Number.isInteger(value.status) || value.status < 0 || value.status > Status.NOT_RESIDENT)
      throw new Error('Invalid terrain profile sample status');
    statuses[index] = value.status;
    if (value.status === Status.VALID) {
      if (Number.isFinite(value.height)) heights[index] = value.height;
      else statuses[index] = Status.NUMERIC_ERROR;
    }
    index++;
  };
  emit(points[0], points[1], 0);
  let start = 0;
  for (let i = 0; i < lengths.length; i++) {
    const steps = divisions[i];
    for (let j = 1; j <= steps; j++) {
      const fraction = j / steps;
      emit(
        j === steps
          ? points[2 * i + 2]
          : points[2 * i] + (points[2 * i + 2] - points[2 * i]) * fraction,
        j === steps
          ? points[2 * i + 3]
          : points[2 * i + 1] + (points[2 * i + 3] - points[2 * i + 1]) * fraction,
        start + lengths[i] * fraction
      );
    }
    start += lengths[i];
  }
  return {positions, distances, heights, statuses, length};
}
