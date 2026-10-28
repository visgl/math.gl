// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainGradientGrid} from './derivatives';
import {TerrainSampleStatus as Status} from './types';

/** Radians: slope from horizontal; downhill aspect clockwise from world +Y.
 * Aspect is undefined on an exactly flat surface. This does not infer geographic north.
 */
export function getTerrainSlopeAspect(
  gradientX: number,
  gradientY: number
): {slope: number; aspect: number | undefined} {
  if (!Number.isFinite(gradientX) || !Number.isFinite(gradientY))
    throw new Error('Terrain gradient must be finite');
  const slope = Math.atan(Math.hypot(gradientX, gradientY));
  const angle = Math.atan2(-gradientX, -gradientY);
  return {
    slope,
    aspect:
      gradientX === 0 && gradientY === 0
        ? undefined
        : (angle < 0 ? angle + 2 * Math.PI : angle || 0) % (2 * Math.PI)
  };
}

export type TerrainSlopeAspectGrid = {
  width: number;
  height: number;
  slopes: Float64Array;
  aspects: Float64Array;
  statuses: Uint8Array;
  aspectStatuses: Uint8Array;
};

/** Convert an explicit gradient grid without importing stencil calculation or terrain classes. */
export function createTerrainSlopeAspectGrid(
  grid: Pick<TerrainGradientGrid, 'width' | 'height' | 'gradients' | 'statuses'>,
  options: {maxSamples?: number} = {}
): TerrainSlopeAspectGrid {
  const count = grid.width * grid.height,
    limit = options.maxSamples ?? 1_100_000;
  if (
    !Number.isSafeInteger(grid.width) ||
    grid.width < 2 ||
    !Number.isSafeInteger(grid.height) ||
    grid.height < 2 ||
    !Number.isSafeInteger(limit) ||
    limit < 0 ||
    count > limit
  )
    throw new Error('Invalid terrain slope grid dimensions or capacity');
  if (
    !(grid.gradients instanceof Float64Array) ||
    grid.gradients.length !== 2 * count ||
    !(grid.statuses instanceof Uint8Array) ||
    grid.statuses.length !== count
  )
    throw new Error('Invalid terrain slope grid buffers');
  const slopes = new Float64Array(count),
    aspects = new Float64Array(count);
  const statuses = grid.statuses.slice(),
    aspectStatuses = grid.statuses.slice();
  for (let i = 0; i < count; i++) {
    if (statuses[i] > Status.NOT_RESIDENT) throw new Error('Invalid terrain gradient status');
    if (statuses[i] !== Status.VALID) continue;
    const value = getTerrainSlopeAspect(grid.gradients[2 * i], grid.gradients[2 * i + 1]);
    slopes[i] = value.slope;
    if (value.aspect === undefined) aspectStatuses[i] = Status.NO_DATA;
    else aspects[i] = value.aspect;
  }
  return {width: grid.width, height: grid.height, slopes, aspects, statuses, aspectStatuses};
}
