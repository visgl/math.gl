// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Bounds2D} from '@math.gl/types';
import {type DGGSDecoder} from './dggs-decoder';

const TILE_SIZE = 512;

/** Decoder for the quadkey DGGS */
export const QuadkeyDecoder = {
  name: 'quadkey',
  getCellLngLat: (quadkey: string): number[] => getQuadkeyLngLat(quadkey),
  getCellBoundaryPolygon: (quadkey: string): [number, number][] => getQuadkeyBoundary(quadkey),
  getCellBoundaryPolygonFlat: (quadkey: string): number[] => getQuadkeyBoundaryFlat(quadkey),
  getCellBounds: (quadkey: string): Bounds2D => getQuadkeyBounds(quadkey)
} as const satisfies DGGSDecoder;

function getQuadkeyLngLat(quadkey: string): number[] {
  const [topLeft, bottomRight] = quadkeyToWorldBounds(quadkey);
  const [w, n] = worldToLngLat(topLeft);
  const [e, s] = worldToLngLat(bottomRight);
  return [(e + w) / 2, (s + n) / 2];
}

function getQuadkeyBoundary(quadkey: string): [number, number][] {
  const [topLeft, bottomRight] = quadkeyToWorldBounds(quadkey);
  const [w, n] = worldToLngLat(topLeft);
  const [e, s] = worldToLngLat(bottomRight);
  return [
    [e, n],
    [e, s],
    [w, s],
    [w, n],
    [e, n]
  ];
}

function getQuadkeyBoundaryFlat(quadkey: string): number[] {
  const [topLeft, bottomRight] = quadkeyToWorldBounds(quadkey);
  const [w, n] = worldToLngLat(topLeft);
  const [e, s] = worldToLngLat(bottomRight);
  return [e, n, e, s, w, s, w, n, e, n];
}

function getQuadkeyBounds(quadkey: string): Bounds2D {
  const [topLeft, bottomRight] = quadkeyToWorldBounds(quadkey);
  const [w, n] = worldToLngLat(topLeft);
  const [e, s] = worldToLngLat(bottomRight);
  return [
    [w, s],
    [e, n]
  ];
}

export function quadkeyToWorldBounds(quadkey: string): [[number, number], [number, number]] {
  let x = 0;
  let y = 0;
  let mask = 1 << quadkey.length;
  const scale = mask / TILE_SIZE;

  for (let i = 0; i < quadkey.length; i++) {
    mask >>= 1;
    const q = parseInt(quadkey[i], 10);
    if (q % 2) x |= mask;
    if (q > 1) y |= mask;
  }
  return [
    [x / scale, TILE_SIZE - y / scale],
    [(x + 0.99) / scale, TILE_SIZE - (y + 0.99) / scale]
  ];
}

// CONSTANTS
const PI = Math.PI;
const PI_4 = PI / 4;
const RADIANS_TO_DEGREES = 180 / PI;

/**
 * Unproject world point [x,y] on map onto {lat, lon} on sphere
 *
 * @param xy - array with [x,y] members
 *  representing point on projected map plane
 * @return - array with [x,y] of point on sphere.
 *   Has toArray method if you need a GeoJSON Array.
 *   Per cartographic tradition, lat and lon are specified as degrees.
 */
function worldToLngLat(xy: number[]): [number, number] {
  const [x, y] = xy;
  const lambda2 = (x / TILE_SIZE) * (2 * PI) - PI;
  const phi2 = 2 * (Math.atan(Math.exp((y / TILE_SIZE) * (2 * PI) - PI)) - PI_4);
  return [lambda2 * RADIANS_TO_DEGREES, phi2 * RADIANS_TO_DEGREES];
}
