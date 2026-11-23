// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original geodesic edge adapter over the shared adaptive polyline subdivision engine.

import {subdividePolyline} from '@math.gl/geometry/polygon';
import type {SubdividePolylineOptions, SubdividedPolyline} from '@math.gl/geometry/polygon';
import {GeodesicPath, validateGeographicPosition, type GeodesicPathOptions} from './geodesic-path';

export type SubdivideGeodesicPolylineOptions = Omit<
  SubdividePolylineOptions,
  'createEdgeSampler' | 'maxSegmentLength'
> &
  GeodesicPathOptions & {
    /** Positive maximum surface distance per output edge, in solver axis units.
     * Height is excluded. Infinity by default; sampled target error is still checked.
     */
    maxSurfaceDistance?: number;
  };

/** Adaptively sample shortest endpoint geodesics through a supplied continuous transform.
 * Geographic source angles are degrees; heights interpolate by surface-distance fraction.
 * Output longitudes are unrolled across successive edges. No seam splitting, clipping,
 * rhumb semantics or universal error bound is implied. Original-edge provenance is retained.
 */
export function subdivideGeodesicPolyline(
  input: ArrayLike<number>,
  options: SubdivideGeodesicPolylineOptions
): SubdividedPolyline {
  const {geodesic, size = 2, maxSurfaceDistance = Infinity, ...subdivision} = options;
  if (
    (size !== 2 && size !== 3) ||
    !Number.isSafeInteger(input.length) ||
    input.length < 0 ||
    input.length % size !== 0
  ) {
    throw new RangeError('Expected packed longitude/latitude[/height] positions');
  }
  // Reject size/vertex-limit violations before constructing potentially many line objects.
  const maxVertices = subdivision.maxVertices ?? 65536;
  if (
    !Number.isSafeInteger(maxVertices) ||
    maxVertices < 1 ||
    maxVertices > 0xffffffff ||
    input.length / size > maxVertices
  ) {
    throw new RangeError('Invalid or exceeded maxVertices');
  }
  if (
    !(maxSurfaceDistance > 0) ||
    (maxSurfaceDistance !== Infinity && !Number.isFinite(maxSurfaceDistance))
  ) {
    throw new RangeError('maxSurfaceDistance must be positive');
  }
  const positions = Array.from(input);
  for (let i = 0; i < positions.length; i += size)
    validateGeographicPosition(positions.slice(i, i + size));
  const paths: GeodesicPath[] = [];
  for (let i = size; i < positions.length; i += size) {
    const path = new GeodesicPath(positions.slice(i - size, i), positions.slice(i, i + size), {
      geodesic
    });
    paths.push(path);
    const end = path.end;
    for (let component = 0; component < size; component++)
      positions[i + component] = end[component];
  }
  return subdividePolyline(positions, {
    ...subdivision,
    size,
    maxSegmentLength: maxSurfaceDistance,
    createEdgeSampler: (_start, _end, index) => paths[index]
  });
}
