// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original rhumb adapter for the existing adaptive subdivision engine.

import {subdividePolyline} from '@math.gl/geometry/polygon';
import type {SubdividePolylineOptions, SubdividedPolyline} from '@math.gl/geometry/polygon';
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
  const paths: RhumbPath[] = [];
  for (let i = size; i < positions.length; i += size) {
    const path = new RhumbPath(positions.slice(i - size, i), positions.slice(i, i + size), {
      rhumb,
      longitudeMode,
      longitudeTurns: turns?.[paths.length]
    });
    paths.push(path);
    positions.splice(i, size, ...path.end);
  }
  return subdividePolyline(positions, {
    ...subdivision,
    size,
    maxSegmentLength: maxSurfaceDistance,
    createEdgeSampler: (_start, _end, index) => paths[index]
  });
}
