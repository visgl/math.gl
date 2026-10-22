// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original safeguarded constrained-distance solver; no upstream code.

/** Unique nearest point on a positive three-axis ellipsoid. No output on failure.
 * With t = lambda + min(radii)^2 > 0 the constrained Hessian is positive
 * definite, certifying a global minimum. A root at t=0 can have multiple nearest
 * points; reject this boundary rather than choosing an arbitrary normal.
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
  const scale = Math.max(a, b, c);
  if (!(Math.min(a, b, c) > 0) || !Number.isFinite(scale)) return false;
  const ax = a / scale,
    ay = b / scale,
    az = c / scale;
  const px = x / scale,
    py = y / scale,
    pz = z / scale;
  const minimum = Math.min(ax, ay, az);
  const minimumSquared = minimum * minimum;
  if (!(minimumSquared > 0) || !Number.isFinite(Math.hypot(px, py, pz))) return false;
  const dx = (ax - minimum) * (ax + minimum);
  const dy = (ay - minimum) * (ay + minimum);
  const dz = (az - minimum) * (az + minimum);
  const ux = ax * px,
    uy = ay * py,
    uz = az * pz;
  // At the lower endpoint, zero coordinates in a minimum-axis eigenspace
  // contribute zero. A limit <= 1 has no positive-definite root.
  const limit = Math.hypot(
    dx === 0 ? (ux === 0 ? 0 : Infinity) : ux / dx,
    dy === 0 ? (uy === 0 ? 0 : Infinity) : uy / dy,
    dz === 0 ? (uz === 0 ? 0 : Infinity) : uz / dz
  );
  if (limit <= 1) return false;
  // Preserve exact cardinal coordinates when the positive-definite root exists.
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
  for (let iteration = 0; iteration < 256; iteration++) {
    const vx = ux / (dx + t),
      vy = uy / (dy + t),
      vz = uz / (dz + t);
    const norm = Math.hypot(vx, vy, vz);
    if (!Number.isFinite(norm)) return false;
    if (Math.abs(norm - 1) <= 2 * Number.EPSILON) {
      const qx = ax * vx * scale,
        qy = ay * vy * scale,
        qz = az * vz * scale;
      if (!Number.isFinite(qx) || !Number.isFinite(qy) || !Number.isFinite(qz)) return false;
      result.x = qx;
      result.y = qy;
      result.z = qz;
      return true;
    }
    if (norm > 1) lower = t;
    else upper = t;
    const derivative = -((vx * vx) / (dx + t) + (vy * vy) / (dy + t) + (vz * vz) / (dz + t)) / norm;
    const candidate = t - (norm - 1) / derivative;
    const next = candidate > lower && candidate < upper ? candidate : lower + (upper - lower) / 2;
    if (next === t) return false;
    t = next;
  }
  return false;
}
