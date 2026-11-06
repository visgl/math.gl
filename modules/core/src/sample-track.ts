// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {NumericArray} from './types';
import {slerp} from './gl-matrix/quat';

export type SampleTrackOptions = {
  size?: number;
  interpolation?: 'discrete' | 'linear' | 'cubic' | 'bezier';
  boundary?: 'clamp' | 'throw';
  quaternion?: boolean;
  /** Per key/component [time, value] control points, flattened. Required for Bezier. */
  inTangents?: ArrayLike<number>;
  outTangents?: ArrayLike<number>;
};

/** Immutable sampled data with cached/binary interval lookup and caller-owned outputs. */
export class SampleTrack {
  readonly size: number;
  private readonly times: number[];
  private readonly values: number[];
  private readonly mode: NonNullable<SampleTrackOptions['interpolation']>;
  private readonly boundary: NonNullable<SampleTrackOptions['boundary']>;
  private readonly quaternion: boolean;
  private readonly inTangents?: number[];
  private readonly outTangents?: number[];
  private interval = 0;

  constructor(
    times: ArrayLike<number>,
    values: ArrayLike<number>,
    options: SampleTrackOptions = {}
  ) {
    this.size = options.size ?? (options.quaternion ? 4 : 1);
    this.times = Array.from(times);
    this.values = Array.from(values);
    this.mode = options.interpolation ?? 'linear';
    this.boundary = options.boundary ?? 'clamp';
    this.quaternion = options.quaternion ?? false;
    if (
      !Number.isSafeInteger(this.size) ||
      this.size < 1 ||
      !this.times.length ||
      this.values.length !== this.times.length * this.size ||
      [...this.times, ...this.values].some(x => !Number.isFinite(x)) ||
      this.times.some((t, i) => i > 0 && t <= this.times[i - 1]) ||
      !['discrete', 'linear', 'cubic', 'bezier'].includes(this.mode) ||
      !['clamp', 'throw'].includes(this.boundary)
    ) {
      throw new RangeError('Invalid track data or options; times must strictly increase');
    }
    if (this.quaternion) {
      if (this.size !== 4 || this.mode === 'bezier')
        throw new RangeError(
          'Quaternion tracks require size 4 and discrete, linear or cubic interpolation'
        );
      for (let k = 0; k < this.times.length; k++) {
        const offset = k * 4;
        const scale = Math.max(...this.values.slice(offset, offset + 4).map(Math.abs));
        if (!scale) throw new RangeError('Zero quaternion sample');
        for (let j = 0; j < 4; j++) this.values[offset + j] /= scale;
        const length = Math.hypot(...this.values.slice(offset, offset + 4));
        for (let j = 0; j < 4; j++) this.values[offset + j] /= length;
        if (
          k &&
          this.values
            .slice(offset, offset + 4)
            .reduce((sum, x, j) => sum + x * this.values[offset - 4 + j], 0) < 0
        ) {
          for (let j = 0; j < 4; j++) this.values[offset + j] = -this.values[offset + j];
        }
      }
    }
    if (this.mode === 'bezier') {
      this.inTangents = Array.from(options.inTangents ?? []);
      this.outTangents = Array.from(options.outTangents ?? []);
      const count = this.values.length * 2;
      if (
        this.inTangents.length !== count ||
        this.outTangents.length !== count ||
        [...this.inTangents, ...this.outTangents].some(x => !Number.isFinite(x))
      )
        throw new RangeError('Bezier tracks require finite time/value tangents for every sample');
      for (let k = 0; k + 1 < this.times.length; k++)
        for (let j = 0; j < this.size; j++) {
          const a = this.outTangents[(k * this.size + j) * 2],
            b = this.inTangents[((k + 1) * this.size + j) * 2];
          if (a < this.times[k] || b < a || b > this.times[k + 1])
            throw new RangeError('Bezier control times must increase within each interval');
        }
    }
  }

  evaluate(time: number): number[];
  evaluate<T extends NumericArray>(time: number, out: T): T;
  evaluate(time: number, out: NumericArray = new Array(this.size)): NumericArray {
    if (!Number.isFinite(time) || out.length < this.size)
      throw new RangeError('Invalid time or result buffer');
    const last = this.times.length - 1;
    if (this.boundary === 'throw' && (time < this.times[0] || time > this.times[last]))
      throw new RangeError('Time is outside track bounds');
    if (time <= this.times[0] || time >= this.times[last]) {
      const key = time <= this.times[0] ? 0 : last;
      for (let j = 0; j < this.size; j++) out[j] = this.values[key * this.size + j];
      return out;
    }
    let i = this.interval;
    if (!(this.times[i] <= time && time < this.times[i + 1])) {
      let low = 0,
        high = last;
      while (low + 1 < high) {
        const mid = Math.floor((low + high) / 2);
        if (this.times[mid] <= time) low = mid;
        else high = mid;
      }
      i = this.interval = low;
    }
    const start = this.times[i],
      end = this.times[i + 1],
      dt = end - start,
      t = (time - start) / dt;
    if (this.quaternion && this.mode === 'linear') {
      slerp(
        out,
        this.values.slice(i * 4, i * 4 + 4),
        this.values.slice((i + 1) * 4, (i + 2) * 4),
        t
      );
      return out;
    }
    for (let j = 0; j < this.size; j++) {
      const a = this.values[i * this.size + j],
        b = this.values[(i + 1) * this.size + j];
      if (this.mode === 'discrete') out[j] = a;
      else if (this.mode === 'linear') out[j] = a + t * (b - a);
      else if (this.mode === 'cubic') {
        const weightedSlope = (key: number) => {
          const left = Math.max(0, key - 1),
            right = Math.min(last, key + 1);
          const difference = this.values[right * this.size + j] - this.values[left * this.size + j];
          const span = this.times[right] - this.times[left];
          const ratio = dt / span;
          // Avoid losing precision in a subnormal ratio or overflowing the derivative.
          if (ratio >= 2 ** -1022) return difference * ratio;
          const product = difference * dt;
          return Number.isFinite(product) && product !== 0
            ? product / span
            : (difference / span) * dt;
        };
        out[j] =
          (2 * t ** 3 - 3 * t ** 2 + 1) * a +
          (t ** 3 - 2 * t ** 2 + t) * weightedSlope(i) +
          (-2 * t ** 3 + 3 * t ** 2) * b +
          (t ** 3 - t ** 2) * weightedSlope(i + 1);
      } else {
        const outIndex = (i * this.size + j) * 2,
          inIndex = ((i + 1) * this.size + j) * 2;
        const x1 = this.outTangents![outIndex],
          x2 = this.inTangents![inIndex];
        let low = 0,
          high = 1;
        for (let n = 0; n < 52; n++) {
          const mid = (low + high) / 2;
          if (bezier(mid, start, x1, x2, end) < time) low = mid;
          else high = mid;
        }
        out[j] = bezier(
          (low + high) / 2,
          a,
          this.outTangents![outIndex + 1],
          this.inTangents![inIndex + 1],
          b
        );
      }
    }
    if (this.quaternion) {
      // Cubic is normalized component Hermite interpolation, not constant-speed rotation.
      const length = Math.hypot(out[0], out[1], out[2], out[3]);
      if (length === 0) throw new RangeError('Cubic quaternion interpolation reached zero');
      for (let j = 0; j < 4; j++) out[j] /= length;
    }
    return out;
  }
}
function bezier(t: number, a: number, b: number, c: number, d: number): number {
  const u = 1 - t;
  return u ** 3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t ** 3 * d;
}
