// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumericArray} from '@math.gl/types';
import {Curve, copyPoints, type CurvePoint} from './curve';
import {HermiteCurve} from './hermite-curve';

export type CatmullRomCurveOptions = {
  closed?: boolean;
  parameterization?: 'centripetal' | 'chordal' | 'uniform';
  /** Uniform splines only. Default 0.5; zero gives stationary knot tangents. */
  tension?: number;
};

export class CatmullRomCurve extends Curve {
  readonly closed: boolean;
  private readonly segments: HermiteCurve[];

  constructor(points: readonly CurvePoint[], options: CatmullRomCurveOptions = {}) {
    const data = copyPoints(points);
    super(data[0].length);
    this.closed = options.closed ?? false;
    if (data.length < (this.closed ? 3 : 2)) throw new RangeError('Not enough spline points');
    const mode = options.parameterization ?? 'centripetal';
    if (!['centripetal', 'chordal', 'uniform'].includes(mode)) {
      throw new RangeError('Unknown Catmull-Rom parameterization');
    }
    const tension = options.tension ?? 0.5;
    if (!Number.isFinite(tension) || tension < 0 || tension > 1) {
      throw new RangeError('tension must be in [0, 1]');
    }
    if (options.tension !== undefined && mode !== 'uniform') {
      throw new RangeError('tension is only supported for uniform splines');
    }
    const point = (index: number): number[] => {
      if (this.closed) return data[(index + data.length) % data.length];
      if (index < 0) return data[0].map((x, i) => 2 * x - data[1][i]);
      if (index >= data.length) {
        return data[data.length - 1].map((x, i) => 2 * x - data[data.length - 2][i]);
      }
      return data[index];
    };
    this.segments = [];
    for (let s = 0; s < data.length - (this.closed ? 0 : 1); s++) {
      const p0 = point(s - 1);
      const p1 = point(s);
      const p2 = point(s + 1);
      const p3 = point(s + 2);
      const interval = (a: number[], b: number[]): number => {
        const distance = Math.hypot(...a.map((x, i) => b[i] - x));
        return distance ** (mode === 'chordal' ? 1 : 0.5);
      };
      const d1 = interval(p1, p2);
      if (mode !== 'uniform' && d1 === 0) {
        // A repeated knot is a stationary segment, rather than a spurious loop.
        const zero = new Array<number>(this.dimension).fill(0);
        this.segments.push(new HermiteCurve(p1, p2, zero, zero));
        continue;
      }
      // Reuse the current interval for coincident neighbors. This is scale invariant.
      const d0 = interval(p0, p1) || d1;
      const d2 = interval(p2, p3) || d1;
      const m1 = p1.map((x, i) =>
        mode === 'uniform'
          ? tension * (p2[i] - p0[i])
          : d1 * ((x - p0[i]) / d0 - (p2[i] - p0[i]) / (d0 + d1) + (p2[i] - x) / d1)
      );
      const m2 = p2.map((x, i) =>
        mode === 'uniform'
          ? tension * (p3[i] - p1[i])
          : d1 * ((x - p1[i]) / d1 - (p3[i] - p1[i]) / (d1 + d2) + (p3[i] - x) / d2)
      );
      this.segments.push(new HermiteCurve(p1, p2, m1, m2));
    }
  }

  protected evaluate(t: number, result: NumericArray, derivative: boolean): void {
    const scaled = t * this.segments.length;
    const index = Math.min(Math.floor(scaled), this.segments.length - 1);
    const local = scaled - index;
    if (derivative) {
      this.segments[index].getDerivative(local, result);
      for (let i = 0; i < this.dimension; i++) result[i] *= this.segments.length;
    } else {
      this.segments[index].getPoint(local, result);
    }
  }
}
