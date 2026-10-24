// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original distance-parameterized adapter over the attributed math.gl rhumb solver.

import type {NumericArray} from '@math.gl/core/types';
import {EllipsoidRhumb, type RhumbLine} from './ellipsoid-rhumb';
import {validateGeographicPosition} from './geodesic-path';
import {WGS84_RADIUS_X, WGS84_RADIUS_Z} from './constants';

let wgs84: EllipsoidRhumb | undefined;
function getDefaultRhumb(): EllipsoidRhumb {
  if (!wgs84)
    wgs84 = new EllipsoidRhumb({semiMajorAxis: WGS84_RADIUS_X, semiMinorAxis: WGS84_RADIUS_Z});
  return wgs84;
}

export type RhumbPathOptions = {
  rhumb?: EllipsoidRhumb;
  /** Preserve the supplied endpoint interval, including complete turns. */
  longitudeMode?: 'shortest' | 'unrolled';
  /** Whole turns added to the shortest endpoint longitude difference. */
  longitudeTurns?: number;
};

/** Constant-bearing endpoint path, in degrees and solver axis units. Height is
 * linear in surface-distance fraction and does not contribute to length.
 * Unlike geodesics, rhumbs reject exact poles. Endpoints/options are snapshots.
 */
export class RhumbPath {
  readonly length: number;
  readonly size: 2 | 3;
  private readonly first: readonly number[];
  private readonly last: readonly number[];
  private readonly line: RhumbLine;

  constructor(start: ArrayLike<number>, end: ArrayLike<number>, options: RhumbPathOptions = {}) {
    validateGeographicPosition(start);
    validateGeographicPosition(end);
    if (start.length !== end.length) throw new RangeError('Rhumb endpoint dimensions must match');
    const solver = options.rhumb || getDefaultRhumb();
    if (
      (options.longitudeMode !== undefined &&
        !['shortest', 'unrolled'].includes(options.longitudeMode)) ||
      (options.longitudeMode === 'unrolled' && options.longitudeTurns !== undefined)
    )
      throw new RangeError('Choose explicit turns or unrolled endpoint longitudes');
    let inverse = solver.inverse(start[1], start[0], end[1], end[0], {
      longitudeTurns: options.longitudeTurns,
      unrollLongitude: true
    });
    if (options.longitudeMode === 'unrolled') {
      const turns = Math.round((end[0] - inverse.lon2) / 360);
      if (turns !== 0)
        inverse = solver.inverse(start[1], start[0], end[1], end[0], {
          longitudeTurns: turns,
          unrollLongitude: true
        });
    }
    if (![inverse.s12, inverse.azi12, inverse.lon2].every(Number.isFinite) || inverse.s12 < 0)
      throw new RangeError('Unresolved rhumb path');
    this.size = start.length as 2 | 3;
    this.length = inverse.s12;
    this.first = Object.freeze(Array.from(start));
    const last = Array.from(end);
    const turns = Math.round((inverse.lon2 - end[0]) / 360);
    const endpoint = end[0] + 360 * turns;
    const retainsPhase =
      Number.isSafeInteger(turns) &&
      Number.isFinite(endpoint) &&
      Math.abs(endpoint - inverse.lon2) <=
        4 * Number.EPSILON * Math.max(360, Math.abs(inverse.lon2));
    last[0] = inverse.s12 === 0 ? start[0] : retainsPhase ? endpoint : inverse.lon2;
    if (inverse.s12 === 0) last[1] = start[1];
    this.last = Object.freeze(last);
    this.line = solver.line(start[1], start[0], inverse.azi12, {unrollLongitude: true});
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
    if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1)
      throw new RangeError('Rhumb fraction must be in [0, 1]');
    if (
      result.length !== this.size ||
      (ArrayBuffer.isView(result) &&
        !(result instanceof Float32Array) &&
        !(result instanceof Float64Array))
    )
      throw new RangeError('Expected a floating rhumb output with matching dimensions');
    let longitude = this.first[0],
      latitude = this.first[1];
    if (fraction === 1) {
      longitude = this.last[0];
      latitude = this.last[1];
    } else if (fraction !== 0 && this.length !== 0) {
      const p = this.line.position(this.length * fraction);
      longitude = p.lon2;
      latitude = p.lat2;
    }
    const height = this.size === 3 ? this.first[2] * (1 - fraction) + this.last[2] * fraction : 0;
    const values = [longitude, latitude, height];
    if (
      !values.every(Number.isFinite) ||
      (result instanceof Float32Array && !values.every(x => Number.isFinite(Math.fround(x))))
    )
      throw new RangeError('Unrepresentable rhumb sample');
    result[0] = longitude;
    result[1] = latitude;
    if (this.size === 3) result[2] = height;
    return result;
  }

  sampleByDistance(distance: number): number[];
  sampleByDistance<T extends NumericArray>(distance: number, result: T): T;
  sampleByDistance(distance: number, result: NumericArray = new Array(this.size)): NumericArray {
    if (!Number.isFinite(distance) || distance < 0 || distance > this.length)
      throw new RangeError('Distance must be within the rhumb path');
    return this.sample(this.length === 0 ? 0 : distance / this.length, result);
  }
}
