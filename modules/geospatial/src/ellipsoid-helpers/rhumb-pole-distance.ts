// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original fixed-point meridian integral for cancellation-sensitive rhumb pole gaps.
// Forty-eight decimal places preserve the small difference of a meridian arc
// and a direct northing. Only near-pole cancellation uses this slow path.
const Q = 10n ** 48n;
const PI = 3141592653589793238462643383279502884197169399375n;
const mul = (x: bigint, y: bigint) => (x * y) / Q;
const div = (x: bigint, y: bigint) => (x * Q) / y;
function exact(x: number): bigint {
  const bytes = new DataView(new ArrayBuffer(8));
  bytes.setFloat64(0, x);
  const bits = bytes.getBigUint64(0),
    exponent = Number((bits >> 52n) & 2047n);
  const mantissa = (bits & ((1n << 52n) - 1n)) | (exponent ? 1n << 52n : 0n);
  const shift = exponent ? exponent - 1075 : -1074;
  const value = shift >= 0 ? (mantissa * Q) << BigInt(shift) : (mantissa * Q) >> BigInt(-shift);
  return bits >> 63n ? -value : value;
}
function sc(x: bigint): [bigint, bigint] {
  let s = x,
    c = Q,
    ts = x,
    tc = Q;
  const square = mul(x, x);
  for (let n = 1n; n < 160n; n++) {
    ts = -mul(ts, square) / (2n * n * (2n * n + 1n));
    tc = -mul(tc, square) / ((2n * n - 1n) * (2n * n));
    s += ts;
    c += tc;
    if (ts === 0n && tc === 0n) break;
  }
  return [s, c];
}
/** @internal Independent fixed-point binomial integral; inputs retain their exact binary values. */
export function remainingPoleDistance(
  a: number,
  b: number,
  latitude: number,
  azimuth: number,
  distance: number,
  sign: number
): number {
  // A shared power-of-two rescaling is exact and keeps fixed-point inputs
  // representable even when the physical axes are extremely small or large.
  const unit = 2 ** Math.floor(Math.log2(a));
  a /= unit;
  b /= unit;
  distance /= unit;
  const ratio = div(exact(b), exact(a));
  const theta = mul(90n * Q - BigInt(sign) * exact(latitude), PI) / 180n;
  const [s, c] = sc(theta),
    prolate = ratio > Q;
  const square = mul(ratio, ratio);
  const k = prolate ? Q - div(Q, square) : Q - square;
  const z = prolate ? s : c,
    other = prolate ? c : s;
  const zz = mul(z, z);
  let integral = theta,
    total = theta,
    coefficient = Q,
    power = z;
  for (let n = 1n; n < 480n; n++) {
    integral = ((2n * n - 1n) * integral + (prolate ? -1n : 1n) * mul(power, other)) / (2n * n);
    coefficient = (mul(coefficient, k) * (2n * n + 1n)) / (2n * n);
    const term = mul(coefficient, integral);
    total += term;
    power = mul(power, zz);
    if (term === 0n) break;
  }
  const gap = prolate ? div(total, ratio) : mul(total, square);
  const angle = mul(exact(azimuth % 360), PI) / 180n;
  const north = mul(div(exact(distance), exact(a)), sc(angle)[1]);
  return Number(gap - BigInt(sign) * north) / Number(Q);
}
