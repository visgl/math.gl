// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Forward geocentric equations and Hannover inverse moved/adapted from math.gl projection's proj4js 2.22.0 datumUtils.js port. See ../PROJ4-LICENSE.md. Safeguarded exterior inverse and numeric output commit are original math.gl code.

/** Numeric leaf: angles in radians, distances in axis units; no CRS, global config or scratch. */
import type {SpheroidParameters} from '@math.gl/types';
export type SpheroidGeometry = SpheroidParameters & {readonly eccentricitySquared: number};
export type SpheroidPoint = {x: number; y: number; z: number};

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
 * iteration. Very flat/exterior failures use a safeguarded normal-footpoint solve.
 * false leaves output untouched. Interior ambiguity is not resolved by this API.
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
  const p = Math.hypot(x, y),
    rr = Math.hypot(x, y, z);
  if (!(rr > 0) || !Number.isFinite(rr)) return false;
  if (es === 0) return commit(result, p === 0 ? 0 : Math.atan2(y, x), Math.atan2(z, p), rr - a);
  if (p === 0) return commit(result, 0, (Math.sign(z) * Math.PI) / 2, Math.abs(z) - b);
  if (es >= 0.9) return exteriorInverse(x, y, z, p, a, b, result);
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
      if (!Number.isFinite(height) || !Number.isFinite(nextSin) || !Number.isFinite(nextCos)) break;
      return commit(result, Math.atan2(y, x), Math.atan2(nextSin, Math.abs(nextCos)), height);
    }
    cos = nextCos;
    sin = nextSin;
  }
  return exteriorInverse(x, y, z, p, a, b, result);
}

/** Original dimensionless Lagrange-multiplier solve, restricted to surface/exterior. */
function exteriorInverse(
  x: number,
  y: number,
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
  if (!Number.isFinite(norm) || norm < 1 - 8 * Number.EPSILON || !(ratio2 > 0)) return false;
  let lower = 0,
    upper = Math.hypot(horizontal, vertical * ratio);
  if (!Number.isFinite(upper)) return false;
  let multiplier = norm <= 1 + 8 * Number.EPSILON ? 0 : upper / 2;
  for (let i = 0; i < 96; i++) {
    const equatorial = 1 + multiplier,
      polar = ratio2 + multiplier;
    const u = horizontal / equatorial,
      v = (vertical * ratio) / polar;
    const length = Math.hypot(u, v);
    const residual = length - 1;
    if (Math.abs(residual) <= 4 * Number.EPSILON) {
      const latitude = Math.atan2(vertical / polar, horizontal / equatorial);
      const sin = Math.sin(latitude),
        cos = Math.cos(latitude);
      const height = p * cos + z * sin - a * Math.hypot(cos, ratio * sin);
      return commit(result, Math.atan2(y, x), latitude, height);
    }
    if (residual > 0) lower = multiplier;
    else upper = multiplier;
    const derivative = -((u * u) / equatorial + (v * v) / polar) / length;
    const next = multiplier - residual / derivative;
    multiplier = Number.isFinite(next) && next > lower && next < upper ? next : (lower + upper) / 2;
  }
  return false;
}

/** Values are captured before invoking application setters; recursive writes are safe. */
function commit(result: SpheroidPoint, x: number, y: number, z: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return false;
  result.x = x;
  result.y = y;
  result.z = z;
  return true;
}
