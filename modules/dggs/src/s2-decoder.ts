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
  cellToToken: (cell: DGGSCell): string => getS2TokenFromIndex(getS2CellIndex(cell)),
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

/**
 * Returns conservative longitude/latitude bounds for an S2 cell.
 *
 * Longitudes are unwrapped so `east >= west`; either endpoint may lie outside `[-180, 180]` for
 * antimeridian cells. The two level-zero polar faces span a complete 360-degree longitude range.
 *
 * @param cell - S2 token or 64-bit cell index.
 * @returns Bounds in `[[west, south], [east, north]]` order and degrees.
 */
export function getS2Bounds(cell: DGGSCell): Bounds2D {
  const s2Cell = getS2Cell(getS2CellIndex(cell));
  if (s2Cell.level === 0) {
    return getS2RootBounds(s2Cell.face);
  }

  // For non-root S2 cells, latitude and longitude extrema occur at vertices. Root cells require
  // the special cases above because their curved edges or interiors contain the extrema.
  // https://github.com/google/s2geometry/blob/master/src/s2/s2cell.cc
  const offsets: readonly [number, number][] = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0]
  ];
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  let previousLongitude: number | undefined;
  for (const offset of offsets) {
    const st = IJToST(s2Cell.ij, s2Cell.level, offset);
    const uv = STToUV(st);
    const [x, y, z] = FaceUVToXYZ(s2Cell.face, uv);
    let [longitude, latitude] = XYZToLngLat([x, y, z]);
    if (Math.abs(latitude) > 89.999 && previousLongitude !== undefined) {
      longitude = previousLongitude;
    }
    if (previousLongitude !== undefined) {
      const longitudeDelta = longitude - previousLongitude;
      longitude += longitudeDelta > 180 ? -360 : longitudeDelta < -180 ? 360 : 0;
    }
    previousLongitude = longitude;
    west = Math.min(west, longitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    north = Math.max(north, latitude);
  }

  const angularEpsilon = (2 * Number.EPSILON * 180) / Math.PI;
  return [
    [west - angularEpsilon, Math.max(-90, south - angularEpsilon)],
    [east + angularEpsilon, Math.min(90, north + angularEpsilon)]
  ];
}

function getS2CellIndex(cell: DGGSCell): bigint {
  return typeof cell === 'bigint' ? cell : getS2IndexFromToken(cell);
}

function getS2RootBounds(face: number): Bounds2D {
  const polarLatitude = (Math.asin(Math.sqrt(1 / 3)) * 180) / Math.PI;
  switch (face) {
    case 0:
      return [
        [-45, -45],
        [45, 45]
      ];
    case 1:
      return [
        [45, -45],
        [135, 45]
      ];
    case 2:
      return [
        [-180, polarLatitude],
        [180, 90]
      ];
    case 3:
      return [
        [135, -45],
        [225, 45]
      ];
    case 4:
      return [
        [-135, -45],
        [-45, 45]
      ];
    case 5:
      return [
        [-180, -90],
        [180, -polarLatitude]
      ];
    default:
      throw new Error(`Invalid S2 face: ${face}`);
  }
}
