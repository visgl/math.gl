// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original compensated binary64 products for tangent contacts; no upstream code copied.
import type {NumericArray} from '@math.gl/core/types';
import {ratio} from './exact-nearest-surface';
const SPLITTER = 134217729;
function productError(a: number, b: number, product: number): number {
  const ca = SPLITTER * a,
    cb = SPLITTER * b;
  const ah = ca - (ca - a),
    al = a - ah;
  const bh = cb - (cb - b),
    bl = b - bh;
  return ah * bh - product + ah * bl + al * bh + al * bl;
}
function sumError(a: number, b: number, sum: number): number {
  const v = sum - a;
  return a - (sum - v) + (b - v);
}
/** Exact power-of-two scaling keeps products finite without rounding ratios. */
function binaryScale(value: number): number {
  return 2 ** Math.min(1023, Math.floor(Math.log2(value)));
}
export function compensatedDot3(
  x: number,
  y: number,
  z: number,
  a: number,
  b: number,
  c: number
): number {
  const magnitude = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
  if (magnitude === 0) return 0;
  const scale = binaryScale(magnitude);
  const sx = x / scale,
    sy = y / scale,
    sz = z / scale;
  const p = sx * a,
    q = sy * b,
    r = sz * c;
  const s = p + q,
    t = s + r;
  return (
    (t +
      (sumError(p, q, s) +
        sumError(s, r, t) +
        productError(sx, a, p) +
        productError(sy, b, q) +
        productError(sz, c, r))) *
    scale
  );
}
/** Rare exact-sign fallback for a normal line near an ellipsoid silhouette.
 * The stored binary64 origin/basis and local coordinates define the affine line.
 */
export function exactNormalIntersection(
  radii: readonly number[],
  origin: readonly number[],
  east: readonly number[],
  north: readonly number[],
  normal: readonly number[],
  point: Readonly<NumericArray>,
  sphereRadius?: number
): number[] | undefined {
  const values = sphereRadius
    ? [
        sphereRadius,
        sphereRadius,
        sphereRadius,
        sphereRadius,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        1,
        1,
        0,
        0,
        point[0],
        point[1]
      ]
    : [...radii, ...origin, ...east, ...north, ...normal, ...point];
  const v = values.map(value => {
    const [whole, fraction = ''] = Math.abs(value).toString(2).split('.');
    return (
      ((value < 0 ? -1n : 1n) * BigInt('0b' + whole + fraction)) << BigInt(1074 - fraction.length)
    );
  });
  const unit = 1n << 1074n,
    q = 1n << 64n;
  const factors = [v[1] * v[2], v[0] * v[2], v[0] * v[1]];
  const p = [0, 1, 2].map(
    i => (v[3 + i] * unit + v[6 + i] * v[15] + v[9 + i] * v[16]) * factors[i]
  );
  const n = v.slice(12, 15).map((x, i) => x * factors[i]);
  const dot = (x: bigint[], y: bigint[]) => x.reduce((s, v, i) => s + v * y[i], 0n);
  const a = dot(n, n),
    b = dot(n, p),
    c = dot(p, p) - (v[0] * v[1] * v[2] * unit) ** 2n;
  const discriminant = b * b - a * c;
  if (a === 0n || discriminant < 0n) return undefined;
  const value = discriminant << 128n;
  let root = value === 0n ? 0n : 1n << BigInt(Math.ceil(value.toString(2).length / 2));
  if (root)
    for (;;) {
      const next = (root + value / root) >> 1n;
      if (next >= root) break;
      root = next;
    }
  const output = p.map((x, i) =>
    signedRatio(x * a * q + n[i] * (root - b * q), a * q * factors[i])
  );
  return sphereRadius
    ? output.map((_, i) => east[i] * output[1] + north[i] * output[2] + normal[i] * output[0])
    : output;
}

function signedRatio(n: bigint, d: bigint): number {
  return Math.sign(Number(n)) * ratio(n < 0n ? -n : n, d, -2148);
}
