// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** 2 dimensional bounds [[minX, minY], [maxX, maxY]] */
export type Bounds2D = [[number, number], [number, number]];

/** 3 dimensional bounds [[minX, minY, minZ], [maxX, maxY, maxZ]] */
export type Bounds3D = [[number, number, number], [number, number, number]];

/** 2 or 3 dimensional bounds [[minX, minY], [maxX, maxY]] or [[minX, minY, minZ], [maxX, maxY, maxZ]] */
export type Bounds =
  | [[number, number], [number, number]]
  | [[number, number, number], [number, number, number]];

/** Checks if a `Bounds` is a `Bounds2D` */
export function isBounds2D(bounds: Bounds): bounds is Bounds2D {
  return bounds.length === 2;
}

/** Accepts 2D and 3D bounds and returns a 2D bound, truncating 3D dimension if necessary */
export function getBounds2D(bounds: Bounds): Bounds2D {
  return isBounds2D(bounds)
    ? bounds
    : [
        [bounds[0][0], bounds[0][1]],
        [bounds[1][0], bounds[1][1]]
      ];
}
