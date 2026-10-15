// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeographicBounds, ProjectionRenderingProfile} from './types';

const RADIANS = Math.PI / 180;

/** Kernel parameter ranges, in radians. These are not geographic coverage bounds. */
export type AngularRanges = {
  readonly longitude: readonly [number, number];
  readonly latitude: readonly [number, number];
};

/** Construct explicitly typed numerical parameter ranges, in radians. */
export function createAngularRanges(
  west: number,
  south: number,
  east: number,
  north: number
): AngularRanges {
  return {longitude: [west, east], latitude: [south, north]};
}

/** Normalize a longitude in degrees; the dateline's canonical point is -180. */
export function normalizeLongitude(longitude: number): number {
  return longitude >= -180 && longitude < 180
    ? longitude
    : ((((longitude + 180) % 360) + 360) % 360) - 180;
}

/** Construct geographic coverage from an eastward degree interval, preserving a full world. */
export function createGeographicBounds(
  west: number,
  south: number,
  east: number,
  north: number
): GeographicBounds {
  if (
    ![west, south, east, north].every(Number.isFinite) ||
    south < -90 ||
    north > 90 ||
    south > north ||
    east - west < -360 ||
    east - west > 360 + 1e-10
  )
    throw new Error('Invalid geographic coverage');
  if (east - west >= 360 - 1e-10) return [-180, south, 180, north];
  const wrappedEast = normalizeLongitude(east);
  return [
    normalizeLongitude(west),
    south,
    wrappedEast === -180 && east > west ? 180 : wrappedEast,
    north
  ];
}

/** Split periodic coverage into rectangles whose longitude endpoints are ordered. */
export function splitGeographicBounds(bounds: GeographicBounds): GeographicBounds[] {
  const [west, south, east, north] = bounds;
  return west <= east
    ? [bounds]
    : [
        [west, south, 180, north],
        [-180, south, east, north]
      ];
}

/** Inclusive coverage membership; +180 and -180 refer to the same meridian. */
export function containsGeographicPoint(
  bounds: GeographicBounds,
  point: readonly [number, number]
): boolean {
  const [west, south, east, north] = bounds;
  const longitude = normalizeLongitude(point[0]);
  return (
    point[1] >= south &&
    point[1] <= north &&
    (west <= east
      ? (longitude >= west && longitude <= east) || (longitude === -180 && east === 180)
      : longitude >= west || longitude <= east)
  );
}

/** Intersect periodic coverage without replacing disconnected regions with an envelope. */
export function intersectGeographicBounds(
  a: GeographicBounds,
  b: GeographicBounds
): GeographicBounds[] {
  const south = Math.max(a[1], b[1]),
    north = Math.min(a[3], b[3]);
  if (south > north) return [];
  const intervals: [number, number][] = [];
  for (const left of splitGeographicBounds(a))
    for (const right of splitGeographicBounds(b)) {
      const west = Math.max(left[0], right[0]),
        east = Math.min(left[2], right[2]);
      if (west <= east) intervals.push([west, east]);
      else if ((left[2] === 180 && right[0] === -180) || (right[2] === 180 && left[0] === -180))
        intervals.push([-180, -180]);
    }
  intervals.sort((left, right) => left[0] - right[0]);
  const merged: [number, number][] = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]);
    else merged.push([...interval]);
  }
  if (merged.length > 1 && merged[0][0] === -180 && merged[merged.length - 1][1] === 180) {
    const first = merged.shift()!,
      last = merged.pop()!;
    return [
      [last[0], south, first[1], north],
      ...merged.map(([west, east]) => [west, south, east, north] as GeographicBounds)
    ];
  }
  return merged.map(([west, east]) => [west, south, east, north]);
}

/** Clamp a degree point to coverage using circular longitude distance. */
export function clampGeographicPoint(
  bounds: GeographicBounds,
  point: readonly [number, number]
): [number, number] {
  let longitude = normalizeLongitude(point[0]);
  const latitude = Math.max(bounds[1], Math.min(bounds[3], point[1]));
  if (!containsGeographicPoint(bounds, [longitude, latitude])) {
    const westDistance = Math.abs(normalizeLongitude(longitude - bounds[0]));
    const eastDistance = Math.abs(normalizeLongitude(longitude - bounds[2]));
    longitude = westDistance <= eastDistance ? bounds[0] : bounds[2];
  }
  return [longitude, latitude];
}

/** Express coverage in the kernel's angular parameters, choosing a continuous periodic interval. */
export function getAngularRanges(
  bounds: GeographicBounds,
  primeMeridian = 0,
  origin = 0
): AngularRanges {
  const width = bounds[2] >= bounds[0] ? bounds[2] - bounds[0] : bounds[2] - bounds[0] + 360;
  const west = bounds[0] * RADIANS - primeMeridian;
  const middle = west + (width * RADIANS) / 2;
  const shift = Math.round((origin - middle) / (2 * Math.PI)) * 2 * Math.PI;
  return createAngularRanges(
    width === 360 ? origin - Math.PI : west + shift,
    bounds[1] * RADIANS,
    width === 360 ? origin + Math.PI : west + shift + width * RADIANS,
    bounds[3] * RADIANS
  );
}

/** Convert numerical kernel ranges into Greenwich degree coverage at an explicit boundary. */
export function getGeographicBounds(ranges: AngularRanges, primeMeridian = 0): GeographicBounds {
  return createGeographicBounds(
    (ranges.longitude[0] + primeMeridian) / RADIANS,
    ranges.latitude[0] / RADIANS,
    (ranges.longitude[1] + primeMeridian) / RADIANS,
    ranges.latitude[1] / RADIANS
  );
}

/** Combine projected envelopes for disconnected coverage regions. */
export function unionRenderingBounds(
  bounds: readonly ProjectionRenderingProfile['bounds'][]
): ProjectionRenderingProfile['bounds'] {
  if (!bounds.length) throw new Error('CRS coverage does not intersect the rendering target');
  return [
    [0, 1, 2].map(axis => Math.min(...bounds.map(pair => pair[0][axis]))) as [
      number,
      number,
      number
    ],
    [0, 1, 2].map(axis => Math.max(...bounds.map(pair => pair[1][axis]))) as [
      number,
      number,
      number
    ]
  ];
}
