// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original safeguarded constrained-distance solver and compensated residual; no upstream code.

/** Unique nearest point on a positive three-axis ellipsoid. No output on failure.
 * With t = lambda + min(radii)^2 > 0 the constrained Hessian is positive
 * definite, certifying a global minimum in exact arithmetic. Singular boundary
 * roots reject rather than choosing an arbitrary normal. Numerical qualification
 * is sampled; unrepresentable products and exhausted convergence reject.
 */
export function nearestSurface(
  x: number,
  y: number,
  z: number,
  a: number,
  b: number,
  c: number,
  result: {x: number; y: number; z: number}
): boolean {
  const minimum = Math.min(a, b, c);
  const minimumSquared = minimum * minimum;
  const aa = a * a,
    bb = b * b,
    cc = c * c;
  if (!(minimum > 0) || !(minimumSquared > 0) || !Number.isFinite(Math.max(aa, bb, cc)))
    return false;
  const minimumError = productError(minimum, minimum, minimumSquared);
  const dx = aa - minimumSquared,
    dy = bb - minimumSquared,
    dz = cc - minimumSquared;
  const ex = sumError(aa, -minimumSquared, dx) + productError(a, a, aa) - minimumError;
  const ey = sumError(bb, -minimumSquared, dy) + productError(b, b, bb) - minimumError;
  const ez = sumError(cc, -minimumSquared, dz) + productError(c, c, cc) - minimumError;
  const ux = a * Math.abs(x),
    uy = b * Math.abs(y),
    uz = c * Math.abs(z);
  const fx = productError(a, Math.abs(x), ux);
  const fy = productError(b, Math.abs(y), uy);
  const fz = productError(c, Math.abs(z), uz);
  const limit = Math.hypot(
    dx === 0 ? (ux === 0 ? 0 : Infinity) : ux / (dx + ex),
    dy === 0 ? (uy === 0 ? 0 : Infinity) : uy / (dy + ey),
    dz === 0 ? (uz === 0 ? 0 : Infinity) : uz / (dz + ez)
  );
  if (limit <= 1) return false;
  if ((x !== 0 ? 1 : 0) + (y !== 0 ? 1 : 0) + (z !== 0 ? 1 : 0) === 1) {
    result.x = x === 0 ? x : Math.sign(x) * a;
    result.y = y === 0 ? y : Math.sign(y) * b;
    result.z = z === 0 ? z : Math.sign(z) * c;
    return true;
  }
  let lower = Math.hypot(dx === 0 ? ux : 0, dy === 0 ? uy : 0, dz === 0 ? uz : 0);
  let upper = Math.hypot(ux, uy, uz);
  if (!(upper > 0) || !Number.isFinite(upper)) return false;
  let t = lower > 0 ? lower : upper;
  for (let iteration = 0; iteration < 512; iteration++) {
    const hx = dx + t,
      hy = dy + t,
      hz = dz + t;
    const lx = sumError(dx, t, hx) + ex;
    const ly = sumError(dy, t, hy) + ey;
    const lz = sumError(dz, t, hz) + ez;
    const vx = ux / hx,
      vy = uy / hy,
      vz = uz / hz;
    // Subtract one from the dominant squared component using a compensated
    // (numerator - denominator), not hypot(v)-1. At a cusp the residual may
    // be 1e-80 even though the ordinary norm rounds exactly to one.
    let term: number, rest: number;
    if (vx >= vy && vx >= vz) {
      term = offset(ux, fx, dx, ex, t, hx) * (vx + 1);
      rest = (vy * (1 - ly / hy)) ** 2 + (vz * (1 - lz / hz)) ** 2;
    } else if (vy >= vz) {
      term = offset(uy, fy, dy, ey, t, hy) * (vy + 1);
      rest = (vx * (1 - lx / hx)) ** 2 + (vz * (1 - lz / hz)) ** 2;
    } else {
      term = offset(uz, fz, dz, ez, t, hz) * (vz + 1);
      rest = (vx * (1 - lx / hx)) ** 2 + (vy * (1 - ly / hy)) ** 2;
    }
    const residual = term + rest;
    if (!Number.isFinite(residual)) return false;
    if (
      Math.abs(residual) <= 4 * Number.EPSILON * (Math.abs(term) + rest) ||
      upper - lower <= 4 * Number.EPSILON * t
    ) {
      const qx = Math.sign(x) * a * (vx * (1 - lx / hx));
      const qy = Math.sign(y) * b * (vy * (1 - ly / hy));
      const qz = Math.sign(z) * c * (vz * (1 - lz / hz));
      if (!Number.isFinite(qx) || !Number.isFinite(qy) || !Number.isFinite(qz)) return false;
      result.x = qx;
      result.y = qy;
      result.z = qz;
      return true;
    }
    if (residual > 0) lower = t;
    else upper = t;
    const derivative = -2 * ((vx * vx) / hx + (vy * vy) / hy + (vz * vz) / hz);
    const candidate = t - residual / derivative;
    const next = candidate > lower && candidate < upper ? candidate : lower + (upper - lower) / 2;
    if (next === t) return false;
    t = next;
  }
  return false;
}

function offset(
  u: number,
  error: number,
  d: number,
  dError: number,
  t: number,
  denominator: number
): number {
  const difference = u - d;
  const correction = sumError(u, -d, difference) + error - dError;
  const base = difference + correction;
  const low = sumError(difference, correction, base);
  const shifted = base - t;
  return (shifted + (sumError(base, -t, shifted) + low)) / denominator;
}
function sumError(x: number, y: number, sum: number): number {
  const part = sum - x;
  return x - (sum - part) + (y - part);
}
function productError(x: number, y: number, product: number): number {
  const sx = 134217729 * x,
    sy = 134217729 * y;
  if (!Number.isFinite(sx) || !Number.isFinite(sy)) return 0;
  const hx = sx - (sx - x),
    hy = sy - (sy - y);
  const lx = x - hx,
    ly = y - hy;
  return hx * hy - product + hx * ly + lx * hy + lx * ly;
}
