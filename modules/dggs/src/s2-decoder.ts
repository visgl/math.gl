// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Bounds2D} from '@math.gl/types';
import {type DGGSCell, type DGGSDecoder} from './dggs-decoder';

import {getS2IndexFromToken, getS2TokenFromIndex} from './s2-geometry/s2-token';
import {getS2GeoBounds} from './s2-geometry/s2-to-boundary';
import {getS2Cell, IJToST, STToUV, FaceUVToXYZ, XYZToLngLat} from './s2-geometry/s2-geometry';

/** Decoder for the S2 DGGS */
export const S2Decoder = {
  name: 's2',
  hasNumericRepresentation: true,
  cellColumnNames: ['s2', 's2Token', 's2_token', 's2Cell', 's2_cell', 's2CellId', 's2_cell_id'],
  tokenToCell: (s2Token: string): bigint => getS2IndexFromToken(s2Token),
  cellToToken: (cell: DGGSCell): string =>
    typeof cell === 'string' ? cell : getS2TokenFromIndex(cell),
  cellToLngLat: (cell: DGGSCell): [number, number] => getS2LngLat(cell),
  cellToBoundary: (cell: DGGSCell): [number, number][] => getS2Boundary(cell),
  cellToBoundaryFlat: (cell: DGGSCell): number[] => getS2BoundaryFlat(cell),
  cellToBounds: (cell: DGGSCell): Bounds2D => getS2Bounds(cell)
} as const satisfies DGGSDecoder;

/**
 * Retrieve S2 geometry center
 */
export function getS2LngLat(cell: DGGSCell): [number, number] {
  const s2Index = getS2CellIndex(cell);
  const s2Cell = getS2Cell(s2Index);

  const st = IJToST(s2Cell.ij, s2Cell.level, [0.5, 0.5]);
  const uv = STToUV(st);
  const xyz = FaceUVToXYZ(s2Cell.face, uv);
  const lngLat = XYZToLngLat(xyz);

  return lngLat as [number, number];
}

/**
 * Get a polygon with corner coordinates for an s2 cell
 * @param - This can be an S2 key or token
 * @return {Float64Array} - a simple polygon in flat array format: [lng0, lat0, lng1, lat1, ...]
 *   - the polygon is closed, i.e. last coordinate is a copy of the first coordinate
 */
export function getS2BoundaryFlat(cell: DGGSCell): number[] {
  const s2Index = getS2CellIndex(cell);
  const float64Array = getS2GeoBounds(s2Index);
  // TODO - inefficient
  return Array.from(float64Array);
}

function getS2Boundary(cell: DGGSCell): [number, number][] {
  const flatBoundary = getS2BoundaryFlat(cell);
  const boundary: [number, number][] = [];
  for (let i = 0; i < flatBoundary.length; i += 2) {
    boundary.push([flatBoundary[i], flatBoundary[i + 1]]);
  }
  return boundary;
}

function getS2Bounds(cell: DGGSCell): Bounds2D {
  const flatBoundary = getS2Boundary(cell);

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

function getS2CellIndex(cell: DGGSCell): bigint {
  return typeof cell === 'bigint' ? cell : getS2IndexFromToken(cell);
}
