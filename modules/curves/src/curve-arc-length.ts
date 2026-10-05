// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumericArray} from '@math.gl/types';
import {Curve, validateDivisions, validateParameter} from './curve';

/** Reusable polyline approximation to a curve's cumulative arc length. */
export class CurveArcLength {
  readonly curve: Curve;
  readonly divisions: number;
  readonly length: number;
  private readonly cumulativeLengths: Float64Array;

  constructor(curve: Curve, divisions = 1024) {
    validateDivisions(divisions);
    this.curve = curve;
    this.divisions = divisions;
    this.cumulativeLengths = new Float64Array(divisions + 1);
    let previous = curve.getPoint(0);
    let current = new Array<number>(curve.dimension);
    let length = 0;
    for (let i = 1; i <= divisions; i++) {
      curve.getPoint(i / divisions, current);
      length += Math.hypot(
        current[0] - previous[0],
        current[1] - previous[1],
        curve.dimension === 3 ? current[2] - previous[2] : 0
      );
      if (!Number.isFinite(length)) throw new RangeError('Curve arc length must be finite');
      this.cumulativeLengths[i] = length;
      [previous, current] = [current, previous];
    }
    this.length = length;
  }

  /** Map a fraction of total length to t, preserving endpoints and zero-length curves. */
  getParameterAt(u: number): number {
    validateParameter(u);
    if (u === 0 || u === 1 || this.length === 0) return u;
    const target = u * this.length;
    let low = 0;
    let high = this.divisions;
    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2);
      if (this.cumulativeLengths[middle] <= target) low = middle;
      else high = middle;
    }
    const span = this.cumulativeLengths[high] - this.cumulativeLengths[low];
    return (low + (span > 0 ? (target - this.cumulativeLengths[low]) / span : 0)) / this.divisions;
  }

  getPointAt(u: number): number[];
  getPointAt<T extends NumericArray>(u: number, result: T): T;
  getPointAt(u: number, result: NumericArray = new Array(this.curve.dimension)): NumericArray {
    return this.curve.getPoint(this.getParameterAt(u), result);
  }

  /** Flat samples at approximately equal distances along the curve. */
  getSpacedPoints(divisions = 64): Float64Array {
    validateDivisions(divisions);
    const points = new Float64Array((divisions + 1) * this.curve.dimension);
    const point = new Array<number>(this.curve.dimension);
    for (let i = 0; i <= divisions; i++) {
      this.getPointAt(i / divisions, point);
      points.set(point, i * this.curve.dimension);
    }
    return points;
  }
}
