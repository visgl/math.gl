// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Bounds2D} from '@math.gl/types';
import {type DGGSDecoder} from './dggs-decoder';

import {getS2IndexFromToken, getS2TokenFromIndex} from './s2-geometry/s2-token';
import {getS2GeoBounds} from './s2-geometry/s2-to-boundary';
import {getS2Cell, IJToST, STToUV, FaceUVToXYZ, XYZToLngLat} from './s2-geometry/s2-geometry';

/** Decoder for the S2 DGGS */
export const S2Decoder = {
  name: 's2',
  getCellIndexFromToken: (s2Token: string): bigint => getS2IndexFromToken(s2Token),
  getTokenFromCellIndex: (s2Index: bigint): string => getS2TokenFromIndex(s2Index),
  getCellLngLat: (s2Token: string): number[] => getS2LngLat(s2Token),
  getCellBoundaryPolygon: (s2Token: string): [number, number][] => getS2Boundary(s2Token),
  getCellBoundaryPolygonFlat: (s2Token: string): number[] => getS2BoundaryFlat(s2Token),
  getCellBounds: (s2Token: string): Bounds2D => getS2Bounds(s2Token)
} as const satisfies DGGSDecoder;

/**
 * Retrieve S2 geometry center
 */
export function getS2LngLat(s2Token: string): number[] {
  const s2Index = getS2IndexFromToken(s2Token);
  const cell = getS2Cell(s2Index);

  const st = IJToST(cell.ij, cell.level, [0.5, 0.5]);
  const uv = STToUV(st);
  const xyz = FaceUVToXYZ(cell.face, uv);
  const lngLat = XYZToLngLat(xyz);

  return lngLat;
}

/**
 * Get a polygon with corner coordinates for an s2 cell
 * @param - This can be an S2 key or token
 * @return {Float64Array} - a simple polygon in flat array format: [lng0, lat0, lng1, lat1, ...]
 *   - the polygon is closed, i.e. last coordinate is a copy of the first coordinate
 */
export function getS2BoundaryFlat(s2Token: string): number[] {
  const s2Index = getS2IndexFromToken(s2Token);
  const float64Array = getS2GeoBounds(s2Index);
  // TODO - inefficient
  return Array.from(float64Array);
}

function getS2Boundary(s2Token: string): [number, number][] {
  const flatBoundary = getS2BoundaryFlat(s2Token);
  const boundary: [number, number][] = [];
  for (let i = 0; i < flatBoundary.length; i += 2) {
    boundary.push([flatBoundary[i], flatBoundary[i + 1]]);
  }
  return boundary;
}

function getS2Bounds(s2Token: string): Bounds2D {
  const flatBoundary = getS2Boundary(s2Token);

  // We know that we have at least one point, no Infinity will be returned.
  let xmin = Infinity;
  let ymin = Infinity;
  let xmax = -Infinity;
  let ymax = -Infinity;

  for (const [x, y] of flatBoundary) {
    if (x < xmin) xmin = x;
    if (x > xmax) xmax = x;
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }

  return [
    [xmin, ymin],
    [xmax, ymax]
  ];
}
