// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainPolytopeSweepResult} from './sweep-polytope';
import type {TerrainSurface} from './surface';

type Point = readonly [number, number, number];

/** Sweep an infinite two-sided plane under translation. Work counts active triangles. */
export function sweepTerrainPlane(
  surface: Pick<TerrainSurface, 'copyData' | 'origin'>,
  point: Point,
  normal: Point,
  translation: Point,
  {maxWork = 100_000}: {maxWork?: number} = {}
): TerrainPolytopeSweepResult {
  const length = Math.hypot(...normal);
  if (
    ![point, normal, translation].every(v => v.length === 3 && v.every(Number.isFinite)) ||
    !(length > 0 && Number.isFinite(length)) ||
    !Number.isSafeInteger(maxWork) ||
    maxWork < 0
  )
    throw new RangeError('Invalid terrain plane sweep');
  const unit: Point = [normal[0] / length, normal[1] / length, normal[2] / length];
  const velocity = translation[0] * unit[0] + translation[1] * unit[1] + translation[2] * unit[2];
  if (!Number.isFinite(velocity)) throw new RangeError('Terrain plane velocity overflow');
  const {positions, indices, triangleValidity} = surface.copyData();
  const local = point.map((value, axis) => value - surface.origin[axis]);
  let work = 0;
  let fraction = Infinity;
  let triangleIndex = -1;
  for (let i = 0; i < triangleValidity.length; i++) {
    if (!triangleValidity[i]) continue;
    if (work >= maxWork) return {status: 'incomplete', work};
    work++;
    let min = Infinity;
    let max = -Infinity;
    for (let j = 0; j < 3; j++) {
      const k = indices[3 * i + j] * 3;
      const distance =
        (positions[k] - local[0]) * unit[0] +
        (positions[k + 1] - local[1]) * unit[1] +
        (positions[k + 2] - local[2]) * unit[2];
      if (!Number.isFinite(distance)) throw new RangeError('Terrain plane projection overflow');
      min = Math.min(min, distance);
      max = Math.max(max, distance);
    }
    if (min <= 0 && max >= 0)
      return {status: 'hit', fraction: 0, triangleIndex: i, normal: null, work};
    const entry = velocity > 0 ? min / velocity : max / velocity;
    if (velocity !== 0 && entry > 0 && entry <= 1 && entry < fraction) {
      triangleIndex = i;
      fraction = entry;
    }
  }
  if (triangleIndex < 0) return {status: 'miss', work};
  const entryNormal: Point = velocity < 0 ? unit : [-unit[0], -unit[1], -unit[2]];
  return {status: 'hit', fraction, triangleIndex, normal: entryNormal, work};
}
