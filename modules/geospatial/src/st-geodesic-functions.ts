// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Bool, Float64} from 'apache-arrow';
import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {WGS84_RADIUS_X, WGS84_RADIUS_Z} from './constants';
import {normalizeCRSIdentifier} from './crs/crs-identifier';
import {EllipsoidGeodesic} from './ellipsoid-geodesic';
import {lineKinds, pointKinds, spatialFunction} from './spatial-sql';

/** Ellipsoidal kernel with axes expressed in meters, initialized when first used. */
let kernel: EllipsoidGeodesic | undefined;

/** Measures the shortest WGS84 geodesic between two longitude–latitude positions. */
function meters(a: readonly number[], b: readonly number[]): number {
  kernel ??= new EllipsoidGeodesic({
    semiMajorAxis: WGS84_RADIUS_X,
    semiMinorAxis: WGS84_RADIUS_Z
  });
  return kernel.inverse(a[1]!, a[0]!, b[1]!, b[0]!).s12;
}

/** Tests the coordinate representation of an empty point. */
function emptyPoint(coordinate: readonly number[]): boolean {
  return !coordinate.length || coordinate.every(Number.isNaN);
}

/** Measures a point pair, with null for the empty set. */
function pointDistance(a: WellKnownGeometry, b: WellKnownGeometry): number | null {
  if (a.type !== 'Point' || b.type !== 'Point') throw new Error('Expected geodesic point pair');
  return emptyPoint(a.coordinates) || emptyPoint(b.coordinates)
    ? null
    : meters(a.coordinates, b.coordinates);
}

/** Measures linear components without adding a segment between components. */
function lineLength(geometry: WellKnownGeometry): number {
  const lines =
    geometry.type === 'LineString'
      ? [geometry.coordinates]
      : geometry.type === 'MultiLineString'
        ? geometry.coordinates
        : [];
  let length = 0;
  for (const path of lines)
    for (let index = 1; index < path.length; index++)
      length += meters(path[index - 1]!, path[index]!);
  return length;
}

/** Recognizes the WGS84 geographic identifiers in GeoArrow field metadata. */
function isWGS84(crs: unknown): boolean {
  if (typeof crs === 'string') {
    const identifier = normalizeCRSIdentifier(crs);
    return identifier === 'EPSG:4326' || identifier === 'OGC:CRS84';
  }
  if (!crs || typeof crs !== 'object' || !('id' in crs)) return false;
  const {id} = crs;
  return Boolean(
    id &&
      typeof id === 'object' &&
      'authority' in id &&
      'code' in id &&
      isWGS84(String(id.authority) + ':' + String(id.code))
  );
}

/** Validates the CRS only when a geodesic function is bound. */
function validateWGS84(crs: unknown, name: string): void {
  if (!isWGS84(crs))
    throw new Error(`${name} requires WGS84 CRS metadata (EPSG:4326 or OGC:CRS84)`);
}

/** Returns WGS84 point-to-point distance in meters. */
export const ST_GEODESICDISTANCE = /* @__PURE__ */ spatialFunction(
  'ST_GeodesicDistance',
  [pointKinds, pointKinds],
  /* @__PURE__ */ new Float64(),
  ([a, b]) => pointDistance(a!, b!),
  0,
  true,
  false,
  validateWGS84
);

/** Sums WGS84 geodesic segment lengths in meters. */
export const ST_GEODESICLENGTH = /* @__PURE__ */ spatialFunction(
  'ST_GeodesicLength',
  [lineKinds],
  /* @__PURE__ */ new Float64(),
  ([line]) => lineLength(line!),
  0,
  true,
  false,
  validateWGS84
);

/** Checks an inclusive WGS84 point-to-point proximity threshold in meters. */
export const ST_GEODESICDWITHIN = /* @__PURE__ */ spatialFunction(
  'ST_GeodesicDWithin',
  [pointKinds, pointKinds],
  /* @__PURE__ */ new Bool(),
  ([a, b], radius) => {
    if (!Number.isFinite(radius) || radius! < 0)
      throw new Error('ST_GeodesicDWithin requires a finite nonnegative radius in meters');
    const distance = pointDistance(a!, b!);
    return distance !== null && distance <= radius!;
  },
  1,
  true,
  false,
  validateWGS84
);

/** Opt-in SQL package for ellipsoidal distance, length, and proximity. */
export const GEODESIC_SPATIAL_FUNCTIONS = /* @__PURE__ */ Object.freeze([
  ST_GEODESICDISTANCE,
  ST_GEODESICLENGTH,
  ST_GEODESICDWITHIN
]);
