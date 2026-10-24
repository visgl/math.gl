// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original rhumb adapter for the existing adaptive subdivision engine.

import {subdividePolyline} from '@math.gl/geometry/polygon';
import type {
  SubdividePolylineOptions,
  SubdividedPolyline,
  PolylineEdgeSampler
} from '@math.gl/geometry/polygon';
import {RhumbPath, type RhumbPathOptions} from './rhumb-path';
import {validateGeographicPosition} from './geodesic-path';

export type SubdivideRhumbPolylineOptions = Omit<
  SubdividePolylineOptions,
  'createEdgeSampler' | 'maxSegmentLength'
> &
  Omit<RhumbPathOptions, 'longitudeTurns'> & {
    /** One safe integer turn count per original edge; copied before sampling. */
    longitudeTurns?: readonly number[];
    maxSurfaceDistance?: number;
  };

/** Rhumb sampling through a continuous transform. This is a sampled error test,
 * not seam clipping or a universal error certificate. Source provenance is kept.
 */
export function subdivideRhumbPolyline(
  input: ArrayLike<number>,
  options: SubdivideRhumbPolylineOptions
): SubdividedPolyline {
  const {
    rhumb,
    longitudeTurns,
    longitudeMode,
    size = 2,
    maxSurfaceDistance = Infinity,
    ...subdivision
  } = options;
  const maxVertices = subdivision.maxVertices ?? 65536;
  if (
    (longitudeMode !== undefined && !['shortest', 'unrolled'].includes(longitudeMode)) ||
    (longitudeMode === 'unrolled' && longitudeTurns !== undefined) ||
    (size !== 2 && size !== 3) ||
    !Number.isSafeInteger(input.length) ||
    input.length < 0 ||
    input.length % size !== 0 ||
    !Number.isSafeInteger(maxVertices) ||
    maxVertices < 1 ||
    maxVertices > 0xffffffff ||
    input.length / size > maxVertices ||
    !(maxSurfaceDistance > 0) ||
    (maxSurfaceDistance !== Infinity && !Number.isFinite(maxSurfaceDistance))
  )
    throw new RangeError('Invalid rhumb subdivision dimensions or limits');
  const count = Math.max(0, input.length / size - 1);
  const turns = longitudeTurns ? Array.from(longitudeTurns) : undefined;
  if (turns && (turns.length !== count || !turns.every(Number.isSafeInteger)))
    throw new RangeError('Expected one integer longitudeTurns value per rhumb edge');
  const positions = Array.from(input);
  for (let i = 0; i < positions.length; i += size)
    validateGeographicPosition(positions.slice(i, i + size));
  const original = positions.slice();
  const paths: PolylineEdgeSampler[] = [];
  for (let i = size; i < positions.length; i += size) {
    const path = new RhumbPath(original.slice(i - size, i), original.slice(i, i + size), {
      rhumb,
      longitudeMode,
      longitudeTurns: turns?.[paths.length]
    });
    // Select each signed interval before translating it into the accumulated
    // world. Otherwise a preceding wrap can reverse an exact 180-degree tie.
    const first = positions.slice(i - size, i);
    const worldTurns = Math.round((first[0] - original[i - size]) / 360);
    const offset = 360 * worldTurns;
    if (!Number.isSafeInteger(worldTurns) || original[i - size] + offset !== first[0])
      throw new RangeError('Unrepresentable rhumb longitude chart');
    const last = path.end;
    const endTurns = Math.round((last[0] - original[i]) / 360);
    const translated = last[0] + offset;
    const endpoint = original[i] + (offset + 360 * endTurns);
    last[0] =
      Number.isSafeInteger(endTurns) &&
      Number.isFinite(endpoint) &&
      Math.abs(endpoint - translated) <= 4 * Number.EPSILON * Math.max(360, Math.abs(translated))
        ? endpoint
        : translated;
    if (path.length === 0) {
      last[0] = first[0];
      last[1] = first[1];
    }
    const sample = (fraction: number): number[] => {
      if (fraction === 0) return first.slice();
      if (fraction === 1) return last.slice();
      const p = path.sample(fraction);
      p[0] += offset;
      return p;
    };
    paths.push({length: path.length, sample});
    positions.splice(i, size, ...sample(1));
  }
  return subdividePolyline(positions, {
    ...subdivision,
    size,
    maxSegmentLength: maxSurfaceDistance,
    createEdgeSampler: (_start, _end, index) => paths[index]
  });
}
