// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {Bounds, Bounds2D, Bounds3D, NumericArray} from '@math.gl/core';

type ReadonlyBounds = readonly [ArrayLike<number>, ArrayLike<number>];
function dimension(bounds: ReadonlyBounds): number {
  const n = bounds[0].length;
  if (
    (n !== 2 && n !== 3) ||
    bounds[1].length !== n ||
    [...Array.from(bounds[0]), ...Array.from(bounds[1])].some(Number.isNaN)
  ) {
    throw new RangeError('Expected 2D or 3D bounds without NaN');
  }
  const empty = Array.from({length: n}, (_, i) => bounds[0][i] > bounds[1][i]).some(Boolean);
  if (
    !empty &&
    [...Array.from(bounds[0]), ...Array.from(bounds[1])].some(x => !Number.isFinite(x))
  ) {
    throw new RangeError('Nonempty bounds must be finite');
  }
  return n;
}
function pair(a: ReadonlyBounds, b: ReadonlyBounds): number {
  const n = dimension(a);
  if (dimension(b) !== n) throw new RangeError('Bounds dimensions must match');
  return n;
}
function point(p: ArrayLike<number>, n: number): void {
  if (p.length !== n || Array.from(p).some(x => !Number.isFinite(x)))
    throw new RangeError('Expected a finite point of matching dimension');
}
export function createEmptyBounds(dimension: 2): Bounds2D;
export function createEmptyBounds(dimension: 3): Bounds3D;
export function createEmptyBounds(dimension: 2 | 3): Bounds;
export function createEmptyBounds(dimension: 2 | 3): Bounds {
  if (dimension !== 2 && dimension !== 3) throw new RangeError('Expected dimension 2 or 3');
  return [new Array(dimension).fill(Infinity), new Array(dimension).fill(-Infinity)] as Bounds;
}
/** Any inverted axis denotes empty bounds. Equal endpoints describe a nonempty point. */
export function isEmptyBounds(bounds: ReadonlyBounds): boolean {
  return Array.from({length: dimension(bounds)}, (_, i) => bounds[0][i] > bounds[1][i]).some(
    Boolean
  );
}
export function boundsContainsPoint(bounds: ReadonlyBounds, p: ArrayLike<number>): boolean {
  point(p, dimension(bounds));
  return (
    !isEmptyBounds(bounds) && Array.from(p).every((x, i) => x >= bounds[0][i] && x <= bounds[1][i])
  );
}
export function boundsContainsBounds(a: ReadonlyBounds, b: ReadonlyBounds): boolean {
  const n = pair(a, b);
  return (
    isEmptyBounds(b) ||
    (!isEmptyBounds(a) &&
      Array.from({length: n}, (_, i) => a[0][i] <= b[0][i] && a[1][i] >= b[1][i]).every(Boolean))
  );
}
export function boundsIntersect(a: ReadonlyBounds, b: ReadonlyBounds): boolean {
  const n = pair(a, b);
  return (
    !isEmptyBounds(a) &&
    !isEmptyBounds(b) &&
    Array.from({length: n}, (_, i) => a[0][i] <= b[1][i] && b[0][i] <= a[1][i]).every(Boolean)
  );
}
function store(values: Bounds, out: Bounds = createEmptyBounds(values[0].length as 2 | 3)): Bounds {
  pair(values, out);
  for (let j = 0; j < 2; j++) for (let i = 0; i < values[j].length; i++) out[j][i] = values[j][i];
  return out;
}
export function unionBounds(a: ReadonlyBounds, b: ReadonlyBounds, out?: Bounds): Bounds {
  const n = pair(a, b);
  const values = createEmptyBounds(n as 2 | 3);
  const ea = isEmptyBounds(a),
    eb = isEmptyBounds(b);
  for (let i = 0; i < n; i++) {
    values[0][i] = Math.min(ea ? Infinity : a[0][i], eb ? Infinity : b[0][i]);
    values[1][i] = Math.max(ea ? -Infinity : a[1][i], eb ? -Infinity : b[1][i]);
  }
  return store(values, out);
}
export function intersectBounds(a: ReadonlyBounds, b: ReadonlyBounds, out?: Bounds): Bounds {
  const n = pair(a, b),
    values = createEmptyBounds(n as 2 | 3);
  if (boundsIntersect(a, b))
    for (let i = 0; i < n; i++) {
      values[0][i] = Math.max(a[0][i], b[0][i]);
      values[1][i] = Math.min(a[1][i], b[1][i]);
    }
  return store(values, out);
}
export function expandBoundsByPoint(
  bounds: ReadonlyBounds,
  p: ArrayLike<number>,
  out?: Bounds
): Bounds {
  point(p, dimension(bounds));
  return unionBounds(bounds, [p, p], out);
}
/** Negative padding shrinks bounds; an inverted result becomes canonical empty bounds. */
export function expandBounds(bounds: ReadonlyBounds, padding: number, out?: Bounds): Bounds {
  if (!Number.isFinite(padding)) throw new RangeError('Padding must be finite');
  const n = dimension(bounds),
    values = createEmptyBounds(n as 2 | 3);
  if (!isEmptyBounds(bounds))
    for (let i = 0; i < n; i++) {
      values[0][i] = bounds[0][i] - padding;
      values[1][i] = bounds[1][i] + padding;
    }
  return store(isEmptyBounds(values) ? createEmptyBounds(n as 2 | 3) : values, out);
}
export function clampPointToBounds(
  bounds: ReadonlyBounds,
  p: ArrayLike<number>,
  out: NumericArray = new Array(p.length)
): NumericArray | null {
  point(p, dimension(bounds));
  if (out.length < p.length) throw new RangeError('Result buffer is too short');
  if (isEmptyBounds(bounds)) return null;
  const result = Array.from(p, (x, i) => Math.max(bounds[0][i], Math.min(bounds[1][i], x)));
  for (let i = 0; i < result.length; i++) out[i] = result[i];
  return out;
}
function radius(r: number): void {
  if (!Number.isFinite(r) || r < 0) throw new RangeError('Radius must be finite and nonnegative');
}
export function spheresIntersect(
  a: ArrayLike<number>,
  ar: number,
  b: ArrayLike<number>,
  br: number
): boolean {
  point(a, 3);
  point(b, 3);
  radius(ar);
  radius(br);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) <= ar + br;
}
export function boundsIntersectSphere(
  bounds: ReadonlyBounds,
  center: ArrayLike<number>,
  r: number
): boolean {
  radius(r);
  const closest = clampPointToBounds(bounds, center);
  return closest !== null && Math.hypot(...Array.from(center, (x, i) => x - closest[i])) <= r;
}
