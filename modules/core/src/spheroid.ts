// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Forward geocentric equations and Hannover inverse moved/adapted from math.gl projection's proj4js 2.22.0 datumUtils.js port. See ../PROJ4-LICENSE.md. Safeguarded nearest-footpoint inverse and numeric output commit are original math.gl code.

/** Numeric leaf: angles in radians, distances in axis units; no CRS, global config or scratch. */
import type {SpheroidParameters} from './types';
export type SpheroidGeometry = SpheroidParameters & {readonly eccentricitySquared: number};
export type SpheroidPoint = {x: number; y: number; z: number};

const EPSILON = Number.EPSILON;

/** Caller supplies validated positive finite axes and eccentricity. No latitude wrapping. */
export function spheroidToCartesian(
  point: SpheroidPoint,
  geometry: SpheroidGeometry,
  result: SpheroidPoint = point
): boolean {
  const longitude = point.x,
    latitude = point.y,
    height = point.z;
  const {semiMajorAxis: a, semiMinorAxis: b, eccentricitySquared: es} = geometry;
  const sin = Math.sin(latitude),
    cos = Math.cos(latitude);
  // Use the axis ratio for very flat shapes: 1 - es*sin² loses polar precision.
  const ratio = b / a;
  const radius = es < 0.9 ? a / Math.sqrt(1 - es * sin * sin) : a / Math.hypot(cos, ratio * sin);
  const x = (radius + height) * cos * Math.cos(longitude);
  const y = (radius + height) * cos * Math.sin(longitude);
  const z = (radius * (es < 0.9 ? 1 - es : ratio * ratio) + height) * sin;
  return commit(result, x, y, z);
}

/**
 * Bounded inverse. Sphere is analytic; ordinary spheroids use the retained Hannover
 * iteration on exterior points. Interiors use a safeguarded nearest-footpoint solve.
 * Equatorial interiors below the evolute cusp have two nearest normals: reject.
 * false leaves output untouched, including the center and unresolved binary64 cases.
 * Only exact poles canonicalize longitude; adapters may retain other conventions.
 */
export function cartesianToSpheroid(
  point: SpheroidPoint,
  geometry: SpheroidGeometry,
  result: SpheroidPoint = point
): boolean {
  const x = point.x,
    y = point.y,
    z = point.z;
  const {semiMajorAxis: a, semiMinorAxis: b, eccentricitySquared: es} = geometry;
  const longitude = Math.atan2(y, x);
  const p = Math.hypot(x, y),
    rr = Math.hypot(x, y, z);
  if (!(rr > 0) || !Number.isFinite(rr)) return false;
  if (es === 0) return commit(result, p === 0 ? 0 : longitude, Math.atan2(z, p), rr - a);
  if (p === 0) return commit(result, 0, (Math.sign(z) * Math.PI) / 2, Math.abs(z) - b);
  const horizontal = p / a,
    vertical = z / b;
  if (horizontal * horizontal + vertical * vertical < 1 - 16 * EPSILON)
    return interiorInverse(x, y, z, p, a, b, result);
  if (es >= 0.9) return exteriorInverse(longitude, z, p, a, b, result);
  const ct = z / rr,
    st = p / rr;
  let rx = 1 / Math.sqrt(1 - es * (2 - es) * st * st);
  let cos = st * (1 - es) * rx,
    sin = ct * rx;
  for (let i = 0; i < 30; i++) {
    const rn = a / Math.sqrt(1 - es * sin * sin);
    const height = p * cos + z * sin - rn * (1 - es * sin * sin);
    const rk = (es * rn) / (rn + height);
    rx = 1 / Math.sqrt(1 - rk * (2 - rk) * st * st);
    const nextCos = st * (1 - rk) * rx,
      nextSin = ct * rx;
    if (Math.abs(nextSin * cos - nextCos * sin) <= 1e-12) {
      if (!Number.isFinite(height)) break;
      return commit(result, longitude, Math.atan2(nextSin, Math.abs(nextCos)), height);
    }
    cos = nextCos;
    sin = nextSin;
  }
  return exteriorInverse(longitude, z, p, a, b, result);
}

/** Original nearest-normal solve in t = (lambda + b²)/a², avoiding interior cancellation.
 * The positive interval selects the globally nearest branch, rather than a stationary normal.
 */
function interiorInverse(
  x: number,
  y: number,
  z: number,
  p: number,
  a: number,
  b: number,
  result: SpheroidPoint
): boolean {
  const longitude = Math.atan2(y, x);
  const ratio = b / a,
    ratio2 = ratio * ratio;
  const horizontal = p / a,
    vertical = z / a,
    delta = 1 - ratio2;
  if (!(ratio2 > 0) || ratio > 1) return false;
  const aa = a * a,
    bb = b * b;
  const ratioError =
    Number.isFinite(aa) && aa > 0
      ? (bb -
          ratio2 * aa +
          productError(b, b, bb) -
          ratio2 * productError(a, a, aa) -
          productError(ratio2, aa, ratio2 * aa)) /
        aa
      : 0;
  const pp = p * p,
    xx = x * x,
    yy = y * y,
    sum = xx + yy;
  const radiusError =
    Number.isFinite(pp) && pp > 0
      ? (sum -
          pp +
          sumError(xx, yy, sum) +
          productError(x, x, xx) +
          productError(y, y, yy) -
          productError(p, p, pp)) /
        (2 * p)
      : 0;
  const shift = a * ratio2,
    base = p - a + shift;
  const correction =
    radiusError + sumError(p - a, shift, base) + productError(a, ratio2, shift) + a * ratioError;
  if (z === 0) {
    // A rounded hypot can equal the cusp for points just inside it. Include
    // the radius/axis corrections before selecting a unique equatorial normal.
    if (base + correction < 0) return false;
    return commit(result, longitude, 0, p - a);
  }
  const weighted = Math.abs(vertical) * ratio;
  let lower = 0,
    upper = ratio2;
  // A lower bound near the short-axis singularity prevents thousands of bisections
  // for deep, nearly equatorial interiors. No subtraction of lambda and -b².
  let t = Math.max(weighted, horizontal - delta);
  if (!(t > lower && t < upper)) t = upper / 2;
  // Below the cusp, a vanishing polar input can make t subnormal. The
  // limiting vertical footpoint remains well conditioned. Use it only when
  // its bound t <= abs(z)*ratio/(a*v) is negligible relative to the cusp gap.
  const gap = -(base + correction) / a;
  const limiting = Math.sqrt(gap * (horizontal + delta)) / delta;
  let latitude: number | undefined =
    gap > 0 && (Math.abs(z) / limiting / a) * ratio <= EPSILON * gap
      ? Math.atan2((Math.sign(z) * limiting) / ratio, horizontal / delta)
      : undefined;
  for (let i = 0; i < 1024 && latitude === undefined; i++) {
    const equatorial = delta + t;
    const u = horizontal / equatorial,
      // Divide by t first: both z/a and a*t can lose precision in the
      // subnormal range although the near-cusp latitude is representable.
      verticalAt = z / t / a,
      v = verticalAt * ratio;
    const at = a * t,
      difference = base - at;
    const offset =
      (difference + (sumError(base, -at, difference) + correction - productError(a, t, at))) /
      (a * equatorial);
    const term = offset * (u + 1);
    const residual = term + v * v;
    if (!Number.isFinite(residual)) return false;
    if (residual > 0) lower = t;
    else upper = t;
    const derivative = -2 * ((u * u) / equatorial + (v * v) / t);
    const next = t - residual / derivative;
    const candidate = next > lower && next < upper ? next : lower + (upper - lower) / 2;
    if (
      Math.abs(residual) <= 4 * EPSILON * (Math.abs(term) + v * v) ||
      upper - lower <= 4 * EPSILON * t ||
      candidate === t
    ) {
      latitude = Math.atan2(verticalAt, u);
      break;
    }
    t = candidate;
  }
  if (latitude === undefined) return false;
  return commitNormal(result, longitude, latitude, p, z, a, ratio);
}

/** Error-free transforms on the finite squared-axis domain used by geometry adapters. */
function sumError(x: number, y: number, sum: number): number {
  const part = sum - x;
  return x - (sum - part) + (y - part);
}
function productError(x: number, y: number, product: number): number {
  const sx = 134217729 * x,
    sy = 134217729 * y;
  if (!Number.isFinite(sx) || !Number.isFinite(sy)) return 0;
  const hx = sx - (sx - x),
    hy = sy - (sy - y),
    lx = x - hx,
    ly = y - hy;
  return hx * hy - product + hx * ly + lx * hy + lx * ly;
}

/** Original dimensionless Lagrange-multiplier solve, restricted to surface/exterior. */
function exteriorInverse(
  longitude: number,
  z: number,
  p: number,
  a: number,
  b: number,
  result: SpheroidPoint
): boolean {
  const ratio = b / a,
    ratio2 = ratio * ratio,
    horizontal = p / a,
    vertical = z / a;
  const norm = Math.hypot(horizontal, z / b);
  if (!Number.isFinite(norm) || norm < 1 - 8 * EPSILON || !(ratio2 > 0)) return false;
  let lower = 0,
    upper = Math.hypot(horizontal, vertical * ratio);
  if (!Number.isFinite(upper)) return false;
  let multiplier = norm <= 1 + 8 * EPSILON ? 0 : upper / 2;
  for (let i = 0; i < 96; i++) {
    const equatorial = 1 + multiplier,
      polar = ratio2 + multiplier;
    const u = horizontal / equatorial,
      v = (vertical * ratio) / polar;
    const length = Math.hypot(u, v);
    const residual = length - 1;
    if (Math.abs(residual) <= 4 * EPSILON) {
      const latitude = Math.atan2(vertical / polar, horizontal / equatorial);
      return commitNormal(result, longitude, latitude, p, z, a, ratio);
    }
    if (residual > 0) lower = multiplier;
    else upper = multiplier;
    const derivative = -((u * u) / equatorial + (v * v) / polar) / length;
    const next = multiplier - residual / derivative;
    multiplier = next > lower && next < upper ? next : (lower + upper) / 2;
  }
  return false;
}

/** Shared signed distance along the solved surface normal. */
function commitNormal(
  result: SpheroidPoint,
  longitude: number,
  latitude: number,
  p: number,
  z: number,
  a: number,
  ratio: number
): boolean {
  const sin = Math.sin(latitude),
    cos = Math.cos(latitude);
  return commit(result, longitude, latitude, p * cos + z * sin - a * Math.hypot(cos, ratio * sin));
}

/** Values are captured before invoking application setters; recursive writes are safe. */
function commit(result: SpheroidPoint, x: number, y: number, z: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return false;
  result.x = x;
  result.y = y;
  result.z = z;
  return true;
}
