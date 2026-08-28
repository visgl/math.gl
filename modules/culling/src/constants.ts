// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Classification returned by culling intersection tests. */
export type CullingResult = 'outside' | 'intersecting' | 'inside';

/**
 * @deprecated Use the string values of {@link CullingResult} directly.
 */
export enum INTERSECTION {
  OUTSIDE = 'outside', // The object is not contained within the frustum.
  INTERSECTING = 'intersecting', // The object intersects one or more frustum planes.
  INSIDE = 'inside' // The object is fully within the frustum.
}
