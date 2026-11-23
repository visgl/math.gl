// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Bool, Float64} from 'apache-arrow';
import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {WGS84_RADIUS_X, WGS84_RADIUS_Z} from './constants';
import {normalizeCRSIdentifier} from './crs/crs-identifier';
import {EllipsoidGeodesic, type GeodesicLine} from './ellipsoid-geodesic';
import {lineKinds, pointKinds, spatialFunction} from './spatial-sql';

/** Ellipsoidal kernel with axes expressed in meters, initialized when first used. */
let kernel: EllipsoidGeodesic | undefined;

/** Reuses one WGS84 ellipsoid for all rows and segments. */
function getKernel(): EllipsoidGeodesic {
  kernel ??= new EllipsoidGeodesic({
    semiMajorAxis: WGS84_RADIUS_X,
    semiMinorAxis: WGS84_RADIUS_Z
  });
  return kernel;
}

/** Measures the shortest WGS84 geodesic between two longitude–latitude positions. */
function meters(a: readonly number[], b: readonly number[]): number {
  return getKernel().inverse(a[1]!, a[0]!, b[1]!, b[0]!).s12;
}

/** Tests the coordinate representation of an empty point. */
function emptyPoint(coordinate: readonly number[]): boolean {
  return !coordinate.length || coordinate.every(Number.isNaN);
}

/** Linear paths, with no implicit connecting segment between parts. */
function paths(geometry: WellKnownGeometry): readonly (readonly (readonly number[])[])[] {
  if (geometry.type === 'LineString') return [geometry.coordinates];
  if (geometry.type === 'MultiLineString') return geometry.coordinates;
  throw new Error('Expected geodesic line geometry');
}

/** Measures linear components without adding a segment between components. */
function lineLength(geometry: WellKnownGeometry): number {
  let length = 0;
  for (const path of paths(geometry))
    for (let index = 1; index < path.length; index++)
      length += meters(path[index - 1]!, path[index]!);
  return length;
}

/** Search the interiors of long geodesics in intervals of at most 1,000 km. */
const MAX_SEARCH_INTERVAL = 1_000_000;
/** Along-track termination tolerance, in meters. */
const SEARCH_TOLERANCE = 1e-7;
/** Interior sampling ratio for a golden-section search. */

const GOLDEN_RATIO = (Math.sqrt(5) - 1) / 2;

/** Takes one inverse measurement after evaluating a position on the cached geodesic. */
function distanceAt(line: GeodesicLine, offset: number, point: readonly number[]): number {
  const position = line.position(offset);
  return getKernel().inverse(position.lat2, position.lon2, point[1]!, point[0]!).s12;
}

/** Finds a local minimum without allocating a new geodesic line at each evaluation. */
function minimizeDistance(
  line: GeodesicLine,
  point: readonly number[],
  lo: number,
  hi: number,
  threshold: number
): number {
  let a = hi - GOLDEN_RATIO * (hi - lo);
  let b = lo + GOLDEN_RATIO * (hi - lo);
  let da = distanceAt(line, a, point);
  let db = distanceAt(line, b, point);
  while (hi - lo > SEARCH_TOLERANCE && Math.min(da, db) > threshold) {
    if (da <= db) {
      hi = b;
      b = a;
      db = da;
      a = hi - GOLDEN_RATIO * (hi - lo);
      da = distanceAt(line, a, point);
    } else {
      lo = a;
      a = b;
      da = db;
      b = lo + GOLDEN_RATIO * (hi - lo);
      db = distanceAt(line, b, point);
    }
  }
  return Math.min(da, db);
}

/** Lower bound from the triangle inequality using both interval endpoints. */
function intervalLowerBound(start: number, end: number, length: number): number {
  return (start + end - length) / 2;
}

/** Measures one finite segment, avoiding refinement when the endpoint bound already decides it. */
function segmentDistance(
  a: readonly number[],
  b: readonly number[],
  point: readonly number[],
  startDistance: number,
  endDistance: number,
  best: number,
  threshold: number
): number {
  const limit = threshold >= 0 ? threshold : best;
  const solver = getKernel();
  const {s12: length, azi1} = solver.inverse(a[1]!, a[0]!, b[1]!, b[0]!);
  if (length === 0 || intervalLowerBound(startDistance, endDistance, length) > limit) return best;

  const line = solver.line(a[1]!, a[0]!, azi1);
  const count = Math.ceil(length / MAX_SEARCH_INTERVAL);
  let start = 0;
  for (let interval = 1; interval <= count; interval++) {
    const end = (interval * length) / count;
    const distance = interval === count ? endDistance : distanceAt(line, end, point);
    best = Math.min(best, distance);
    if (intervalLowerBound(startDistance, distance, end - start) <= Math.min(limit, best)) {
      best = Math.min(best, minimizeDistance(line, point, start, end, threshold));
    }
    if (best <= threshold) break;
    start = end;
    startDistance = distance;
  }
  return best;
}

/** Measures a point to the nearest position on any route component. */
function routeDistance(
  route: WellKnownGeometry,
  point: readonly number[],
  threshold: number
): number | null {
  let best = Infinity;
  for (const path of paths(route)) {
    if (!path.length) continue;
    let previous = meters(path[0]!, point);
    best = Math.min(previous, best);
    if (best <= threshold) return best;
    for (let vertex = 1; vertex < path.length; vertex++) {
      const distance = meters(path[vertex]!, point);
      best = Math.min(distance, best);
      if (best <= threshold) return best;
      best = segmentDistance(
        path[vertex - 1]!,
        path[vertex]!,
        point,
        previous,
        distance,
        best,
        threshold
      );
      if (best <= threshold) return best;
      previous = distance;
    }
  }
  return Number.isFinite(best) ? best : null;
}

/** Accepts point/point and point/line in either order, keeping their existing empty semantics. */
function proximityDistance(
  a: WellKnownGeometry,
  b: WellKnownGeometry,
  threshold = -1
): number | null {
  const point = a.type === 'Point' ? a : b;
  if (point.type !== 'Point') throw new Error('Geodesic proximity requires at least one Point');
  const other = a.type === 'Point' ? b : a;
  if (emptyPoint(point.coordinates)) return null;
  if (other.type === 'Point') {
    return emptyPoint(other.coordinates) ? null : meters(point.coordinates, other.coordinates);
  }
  return routeDistance(other, point.coordinates, threshold);
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

/** Geometry kinds accepted by point-to-point and point-to-route proximity. */

const proximityKinds = [...pointKinds, ...lineKinds];

/** Returns WGS84 point-to-point or point-to-route distance in meters. */
export const ST_GEODESICDISTANCE = /* @__PURE__ */ spatialFunction(
  'ST_GeodesicDistance',
  [proximityKinds, proximityKinds],
  /* @__PURE__ */ new Float64(),
  ([a, b]) => proximityDistance(a!, b!),
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

/** Checks an inclusive WGS84 point-to-point or point-to-route threshold in meters. */
export const ST_GEODESICDWITHIN = /* @__PURE__ */ spatialFunction(
  'ST_GeodesicDWithin',
  [proximityKinds, proximityKinds],
  /* @__PURE__ */ new Bool(),
  ([a, b], radius) => {
    if (!Number.isFinite(radius) || radius! < 0)
      throw new Error('ST_GeodesicDWithin requires a finite nonnegative radius in meters');
    const limit = a!.type === 'Point' && b!.type === 'Point' ? radius! : radius! + SEARCH_TOLERANCE;
    const distance = proximityDistance(a!, b!, limit);
    return distance !== null && distance <= limit;
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
