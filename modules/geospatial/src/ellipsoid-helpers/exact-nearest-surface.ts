// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original exact-dyadic fallback for ill-conditioned nearest-point geometry; no upstream code.

/** Rare fallback: exact signs of the multiplier equation, not arbitrary precision
 * transcendental arithmetic. BigInt/string allocations are confined to this path.
 * Input dyadics share a unit; t uses at least 64 fraction bits. For a nonzero
 * shortest-axis coordinate the root is at least one squared input unit, so this
 * resolves its relative bracket to substantially better than binary64 precision.
 */
export function exactNearestSurface(
  x: number,
  y: number,
  z: number,
  a: number,
  b: number,
  c: number,
  result: {x: number; y: number; z: number}
): boolean {
  const values = [a, b, c, Math.abs(x), Math.abs(y), Math.abs(z)];
  const parts = values.map(value => {
    const bits = value.toString(2);
    const dot = bits.indexOf('.');
    return {
      integer: BigInt('0b' + bits.replace('.', '')),
      exponent: dot < 0 ? 0 : dot + 1 - bits.length
    };
  });
  const exponent = Math.min(...parts.filter(p => p.integer !== 0n).map(p => p.exponent));
  const integers = parts.map(p => p.integer << BigInt(p.exponent - exponent));
  const squares = integers.slice(0, 3).map(v => v * v);
  const minimum = squares.reduce((p, v) => (p < v ? p : v));
  const offsets = squares.map(v => v - minimum);
  const products = squares.map((_, i) => integers[i] * integers[i + 3]);
  let precision = 64;
  if (!products.some((u, i) => offsets[i] === 0n && u !== 0n)) {
    // Exact boundary classification. Negative means multiple minima; equality
    // means the unique cusp point has zero shortest-axis coordinates.
    let numerator = -1n,
      denominator = 1n;
    for (let i = 0; i < 3; i++) {
      if (offsets[i] === 0n) continue;
      const d2 = offsets[i] * offsets[i];
      numerator = numerator * d2 + products[i] * products[i] * denominator;
      denominator *= d2;
    }
    if (numerator < 0n) return false;
    if (numerator === 0n) {
      return commit(0n, 1n);
    }
    // Convexity bounds the positive root below by F(0)/abs(F'(0)).
    // abs(F'(0)) <= 2*(1+F(0))/minPositiveOffset. Use this exact
    // rational bound when a zero shortest-axis coordinate admits a tiny root.
    const positive = offsets.filter(d => d > 0n);
    const least = positive.reduce((p, v) => (p < v ? p : v));
    precision = Math.max(
      64,
      (2n * (denominator + numerator)).toString(2).length -
        (numerator * least).toString(2).length +
        128
    );
  }
  const unit = 1n << BigInt(precision);
  const d = offsets.map(v => v * unit);
  const u = products.map(v => v * unit);
  const u2 = u.map(v => v * v);
  let lower = 0n,
    upper = u.reduce((sum, v) => sum + v, 0n);
  if (upper === 0n) return false;
  for (let iteration = 0; iteration < 4096; iteration++) {
    const t = (lower + upper) >> 1n;
    if (t === lower) return false;
    const dx = d[0] + t,
      dy = d[1] + t,
      dz = d[2] + t;
    const xx = dx * dx,
      yy = dy * dy,
      zz = dz * dz;
    const sign = u2[0] * yy * zz + u2[1] * xx * zz + u2[2] * xx * yy - xx * yy * zz;
    if (sign === 0n) return commit(t, unit);
    if (sign > 0n) lower = t;
    else upper = t;
    if (lower > 0n && upper - lower <= lower >> 60n) return commit((lower + upper) >> 1n, unit);
  }
  return false;

  function commit(t: bigint, unit: bigint): boolean {
    const output = squares.map((r2, i) => {
      const denominator = offsets[i] * unit + t;
      return denominator === 0n ? 0 : ratio(r2 * integers[i + 3] * unit, denominator, exponent);
    });
    if (!output.every(Number.isFinite)) return false;
    const qx = Math.sign(x) * output[0],
      qy = Math.sign(y) * output[1],
      qz = Math.sign(z) * output[2];
    result.x = qx;
    result.y = qy;
    result.z = qz;
    return true;
  }
}

/** Round a positive rational dyadic to a binary64 significand without converting
 * unbounded integers to Number first. Split the exponent for subnormal outputs.
 */
export function ratio(n: bigint, d: bigint, exponent: number): number {
  if (n === 0n) return 0;
  const shift = 52 - (n.toString(2).length - d.toString(2).length);
  const numerator = shift >= 0 ? n << BigInt(shift) : n;
  const denominator = shift >= 0 ? d : d << BigInt(-shift);
  let quotient = numerator / denominator;
  const remainder = numerator % denominator;
  if (2n * remainder > denominator || (2n * remainder === denominator && quotient & 1n)) quotient++;
  const power = exponent - shift;
  const first = Math.max(-1022, Math.min(1023, power));
  return Number(quotient) * 2 ** first * 2 ** (power - first);
}
