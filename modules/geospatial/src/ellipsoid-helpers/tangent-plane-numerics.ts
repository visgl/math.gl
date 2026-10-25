// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original compensated binary64 products for tangent contacts; no upstream code copied.
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
/** Positive near-facing spherical coordinate, or undefined for a real miss. */
export function sphereNormalCoordinate(radius: number, x: number, y: number): number | undefined {
  if (Math.abs(x) > radius || Math.abs(y) > radius) return undefined;
  const scale = binaryScale(radius);
  if (!(scale > 0)) return undefined;
  const r = radius / scale,
    u = x / scale,
    v = y / scale;
  const rr = r * r,
    uu = u * u,
    vv = v * v;
  const s = rr - uu,
    t = s - vv;
  const low =
    sumError(rr, -uu, s) +
    sumError(s, -vv, t) +
    productError(r, r, rr) -
    productError(u, u, uu) -
    productError(v, v, vv);
  const squared = t + low;
  return squared < 0 ? undefined : Math.sqrt(squared) * scale;
}
