// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {NumericArray} from './types';

type Input = ArrayLike<number>;
function finite(...values: number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Expected finite numbers');
}
function vector(a: Input, b?: Input): void {
  if (a.length < 2 || a.length > 4 || (b && a.length !== b.length))
    throw new RangeError('Expected matching 2D, 3D or 4D vectors');
  finite(...Array.from(a), ...(b ? Array.from(b) : []));
}
function write<T extends NumericArray>(out: T, values: number[]): T {
  if (out.length < values.length) throw new RangeError('Result buffer is too short');
  for (let i = 0; i < values.length; i++) out[i] = values[i];
  return out;
}
/** Projection onto a possibly non-unit vector. A zero target produces zero. */
export function vectorProjectOnVector<T extends NumericArray>(
  out: T,
  value: Input,
  target: Input
): T {
  vector(value, target);
  const length = Math.hypot(...Array.from(target));
  const unit = Array.from(target, x => (length ? x / length : 0));
  const d = unit.reduce((sum, x, i) => sum + x * value[i], 0);
  return write(
    out,
    unit.map(x => x * d)
  );
}
/** A zero plane normal leaves the input unchanged. */
export function vectorProjectOnPlane<T extends NumericArray>(
  out: T,
  value: Input,
  normal: Input
): T {
  const projection = vectorProjectOnVector(new Array(value.length), value, normal);
  return write(
    out,
    Array.from(value, (x, i) => x - projection[i])
  );
}
/** Reflect across a plane with a possibly non-unit normal; zero normal is identity. */
export function vectorReflect<T extends NumericArray>(out: T, value: Input, normal: Input): T {
  const projection = vectorProjectOnVector(new Array(value.length), value, normal);
  return write(
    out,
    Array.from(value, (x, i) => x - 2 * projection[i])
  );
}
/** Zero vectors stay zero, since they have no direction. */
export function vectorSetLength<T extends NumericArray>(out: T, value: Input, length: number): T {
  vector(value);
  finite(length);
  if (length < 0) throw new RangeError('Length must be nonnegative');
  const original = Math.hypot(...Array.from(value));
  return write(
    out,
    Array.from(value, x => (original ? (x / original) * length : 0))
  );
}
export function vectorClampLength<T extends NumericArray>(
  out: T,
  value: Input,
  minimum: number,
  maximum: number
): T {
  finite(minimum, maximum);
  if (minimum < 0 || maximum < minimum) throw new RangeError('Invalid length interval');
  return vectorSetLength(
    out,
    value,
    Math.max(minimum, Math.min(maximum, Math.hypot(...Array.from(value))))
  );
}
export function vectorManhattanDistance(a: Input, b: Input): number {
  vector(a, b);
  return Array.from(a).reduce((sum, x, i) => sum + Math.abs(x - b[i]), 0);
}
/** Does not clamp. A zero-width interval maps to zero. */
export function inverseLerp(start: number, end: number, value: number): number {
  finite(start, end, value);
  return start === end ? 0 : (value - start) / (end - start);
}
export function mapLinear(
  value: number,
  inputStart: number,
  inputEnd: number,
  outputStart: number,
  outputEnd: number
): number {
  finite(outputStart, outputEnd);
  return outputStart + inverseLerp(inputStart, inputEnd, value) * (outputEnd - outputStart);
}
/** Exponential damping, with nonnegative rate and elapsed time in matching units. */
export function damp(start: number, end: number, rate: number, dt: number): number {
  finite(start, end, rate, dt);
  if (rate < 0 || dt < 0) throw new RangeError('Rate and dt must be nonnegative');
  return start + (end - start) * -Math.expm1(-rate * dt);
}
function smoothParameter(value: number, minimum: number, maximum: number): number {
  finite(value, minimum, maximum);
  if (maximum <= minimum) throw new RangeError('Smoothing interval must have positive width');
  return Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)));
}
export function smoothstep(value: number, minimum: number, maximum: number): number {
  const t = smoothParameter(value, minimum, maximum);
  return t * t * (3 - 2 * t);
}
export function smootherstep(value: number, minimum: number, maximum: number): number {
  const t = smoothParameter(value, minimum, maximum);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export function pingpong(value: number, length = 1): number {
  finite(value, length);
  if (length <= 0 || !Number.isFinite(length * 2)) throw new RangeError('Invalid ping-pong length');
  const period = 2 * length;
  return length - Math.abs((((value % period) + period) % period) - length);
}
export {rotateTowards as quatRotateTowards} from './gl-matrix/quat';
