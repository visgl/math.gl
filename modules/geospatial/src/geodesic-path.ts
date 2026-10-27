// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original distance-parameterized path adapter over math.gl's attributed GeographicLib facade.

import type {NumericArray} from '@math.gl/core';
import {EllipsoidGeodesic, type GeodesicLine} from './ellipsoid-geodesic';
import {WGS84_RADIUS_X, WGS84_RADIUS_Z} from './constants';

let wgs84: EllipsoidGeodesic | undefined;

export type GeodesicPathOptions = {
  /** Reuse a solver with explicit sphere/revolution axes; defaults to WGS84. */
  geodesic?: EllipsoidGeodesic;
};

/** Shortest endpoint geodesic, parameterized by surface distance, not longitude.
 * Positions are [longitude, latitude] in degrees, optionally followed by height.
 * Heights interpolate linearly and do not contribute to surface length. Longitudes
 * are unrolled relative to the start; endpoint winding does not request extra circuits.
 * Ambiguous antipodes follow the solver's deterministic shortest-path selection.
 */
export class GeodesicPath {
  readonly length: number;
  readonly size: 2 | 3;
  private readonly first: readonly number[];
  private readonly last: readonly number[];
  private readonly line: GeodesicLine;

  constructor(start: ArrayLike<number>, end: ArrayLike<number>, options: GeodesicPathOptions = {}) {
    validateGeographicPosition(start);
    validateGeographicPosition(end);
    if (start.length !== end.length)
      throw new RangeError('Geodesic endpoint dimensions must match');
    const solver = options.geodesic || getDefaultGeodesic();
    const inverse = solver.inverse(start[1], start[0], end[1], end[0], {unrollLongitude: true});
    if (
      !Number.isFinite(inverse.s12) ||
      inverse.s12 < 0 ||
      !Number.isFinite(inverse.azi1) ||
      !Number.isFinite(inverse.lon2)
    ) {
      throw new RangeError('Unresolved geodesic path');
    }
    this.size = start.length as 2 | 3;
    this.length = inverse.s12;
    this.first = Object.freeze(Array.from(start));
    const last = Array.from(end);
    last[0] = inverse.lon2;
    // Same surface point (including different longitudes at a pole): hold its
    // horizontal representation fixed; fraction still interpolates endpoint heights.
    if (this.length === 0) {
      last[0] = start[0];
      last[1] = start[1];
    }
    this.last = Object.freeze(last);
    this.line = solver.line(start[1], start[0], inverse.azi1, {unrollLongitude: true});
  }

  get start(): number[] {
    return this.first.slice();
  }

  get end(): number[] {
    return this.last.slice();
  }

  sample(fraction: number): number[];
  sample<T extends NumericArray>(fraction: number, result: T): T;
  sample(fraction: number, result: NumericArray = new Array(this.size)): NumericArray {
    if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) {
      throw new RangeError('Geodesic fraction must be in [0, 1]');
    }
    if (result.length !== this.size) throw new RangeError('Invalid geodesic sample output length');
    let longitude: number;
    let latitude: number;
    if (fraction === 0 || this.length === 0) {
      longitude = this.first[0];
      latitude = this.first[1];
    } else if (fraction === 1) {
      longitude = this.last[0];
      latitude = this.last[1];
    } else {
      const value = this.line.position(this.length * fraction);
      longitude = value.lon2;
      latitude = value.lat2;
    }
    const height = this.size === 3 ? this.first[2] * (1 - fraction) + this.last[2] * fraction : 0;
    if (
      ![longitude, latitude, height].every(Number.isFinite) ||
      (result instanceof Float32Array &&
        ![longitude, latitude, height].every(value => Number.isFinite(Math.fround(value))))
    ) {
      throw new RangeError('Unrepresentable geodesic sample');
    }
    result[0] = longitude;
    result[1] = latitude;
    if (this.size === 3) result[2] = height;
    return result;
  }

  sampleByDistance(distance: number): number[];
  sampleByDistance<T extends NumericArray>(distance: number, result: T): T;
  sampleByDistance(distance: number, result: NumericArray = new Array(this.size)): NumericArray {
    if (!Number.isFinite(distance) || distance < 0 || distance > this.length) {
      throw new RangeError('Distance must be within the geodesic path');
    }
    // A zero-length horizontal path has no distance-based height parameter.
    return this.sample(this.length === 0 ? 0 : distance / this.length, result);
  }
}

export function validateGeographicPosition(point: ArrayLike<number>): void {
  if (
    (point.length !== 2 && point.length !== 3) ||
    !Array.from(point).every(Number.isFinite) ||
    Math.abs(point[1]) > 90
  ) {
    throw new RangeError('Expected finite longitude/latitude[/height], latitude in [-90, 90]');
  }
}

function getDefaultGeodesic(): EllipsoidGeodesic {
  if (!wgs84) {
    wgs84 = new EllipsoidGeodesic({semiMajorAxis: WGS84_RADIUS_X, semiMinorAxis: WGS84_RADIUS_Z});
  }
  return wgs84;
}
