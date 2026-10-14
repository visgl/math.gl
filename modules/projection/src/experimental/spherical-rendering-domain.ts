// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeographicRenderingBounds} from './rendering-profile';
import {wrapLongitude} from './parameters';

export type Vector = readonly [number, number, number];
export type AngularDomain = {latitude: number; distance: number};
export function geographicVector(longitude: number, latitude: number): Vector {
  return [
    Math.cos(latitude) * Math.cos(longitude),
    Math.cos(latitude) * Math.sin(longitude),
    Math.sin(latitude)
  ];
}
const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Solve A cos(t) + B sin(t) = C; retain roots in the specified interval. */
export function trigonometricRoots(
  a: number,
  b: number,
  c: number,
  low: number,
  high: number
): number[] {
  const radius = Math.hypot(a, b);
  if (!radius || Math.abs(c) > radius + 1e-14) return [];
  const angle = Math.atan2(b, a);
  const offset = Math.acos(Math.max(-1, Math.min(1, c / radius)));
  const roots: number[] = [];
  for (const phase of [angle - offset, angle + offset]) {
    for (
      let k = Math.ceil((low - phase) / (2 * Math.PI));
      k <= Math.floor((high - phase) / (2 * Math.PI));
      k++
    ) {
      roots.push(phase + k * 2 * Math.PI);
    }
  }
  return roots;
}

/** Extremize a linear form on a geographic rectangle intersected with a spherical cap.
 * Candidates are stationary points, edge intersections and cap tangent points;
 * no tessellation or curve sampling is needed.
 */
export function sphericalExtremum(
  vector: Vector,
  coverage: GeographicRenderingBounds,
  domain?: AngularDomain,
  maximize = true
): {value: number; point: [number, number]} {
  const [west, south, east, north] = coverage;
  const center = (west + east) / 2;
  const axis: Vector = domain
    ? [Math.cos(domain.latitude), 0, Math.sin(domain.latitude)]
    : [1, 0, 0];
  const limit = domain ? Math.cos(domain.distance) : -1;
  let best = maximize ? -Infinity : Infinity;
  let point: [number, number] = [NaN, NaN];
  const consider = (longitude: number, latitude: number) => {
    longitude = center + wrapLongitude(longitude - center);
    if (
      longitude < west - 1e-12 ||
      longitude > east + 1e-12 ||
      latitude < south - 1e-12 ||
      latitude > north + 1e-12
    )
      return;
    const position = geographicVector(longitude, latitude);
    if (domain && dot(axis, position) < limit - 1e-13) return;
    const value = dot(vector, position);
    if (maximize ? value > best : value < best) {
      best = value;
      point = [longitude, latitude];
    }
  };
  // Rectangle corners and stationary points of each longitude/latitude edge.
  const longitudes = [west, east, ...trigonometricRoots(-vector[1], vector[0], 0, west, east)];
  for (const longitude of longitudes) {
    const coefficient = vector[0] * Math.cos(longitude) + vector[1] * Math.sin(longitude);
    for (const latitude of [
      south,
      north,
      ...trigonometricRoots(vector[2], -coefficient, 0, south, north)
    ])
      consider(longitude, latitude);
  }
  if (domain) {
    const [a, , c] = axis;
    // Intersections of the cap circle with the four geographic edges.
    for (const latitude of [south, north]) {
      for (const longitude of trigonometricRoots(
        a * Math.cos(latitude),
        0,
        limit - c * Math.sin(latitude),
        west,
        east
      ))
        consider(longitude, latitude);
    }
    for (const longitude of [west, east]) {
      for (const latitude of trigonometricRoots(a * Math.cos(longitude), c, limit, south, north))
        consider(longitude, latitude);
    }
    // Extrema of the linear form on the cap circle: its two tangency points.
    const parallel = dot(vector, axis);
    let tangent = vector.map((value, index) => value - parallel * axis[index]);
    let length = Math.hypot(...tangent);
    if (length <= 1e-14) {
      // Parallel forms are constant on the cap circle; choose its meridian tangency.
      tangent = [-axis[2], 0, axis[0]];
      length = 1;
    }
    if (length > 1e-14) {
      for (const sign of [-1, 1]) {
        const position = axis.map(
          (value, index) =>
            value * limit + (sign * tangent[index] * Math.sin(domain.distance)) / length
        );
        consider(
          Math.atan2(position[1], position[0]),
          Math.atan2(position[2], Math.hypot(position[0], position[1]))
        );
      }
    }
  }
  if (!Number.isFinite(best))
    throw new Error('CRS coverage does not intersect the rendering domain');
  return {value: best, point};
}

export function sphericalRange(
  vector: Vector,
  coverage: GeographicRenderingBounds,
  domain?: AngularDomain
): [number, number] {
  return [
    sphericalExtremum(vector, coverage, domain, false).value,
    sphericalExtremum(vector, coverage, domain).value
  ];
}

/** Extremize a linear-fractional projection by solving its support equation.
 * A positive denominator makes max(N-qD)=0 monotone in q, so bisection
 * brackets the true extremum instead of searching sampled boundary points.
 */
export function sphericalRatioRange(
  numerator: Vector,
  denominator: Vector,
  constant: number,
  coverage: GeographicRenderingBounds,
  domain?: AngularDomain
): [number, number] {
  const n = sphericalRange(numerator, coverage, domain);
  const d = sphericalRange(denominator, coverage, domain).map(value => value + constant);
  if (d[0] <= 0) throw new Error('Projection rendering denominator is not positive');
  const quotients = n.flatMap(value => d.map(divisor => value / divisor));
  return [false, true].map(maximize => {
    let low = Math.min(...quotients),
      high = Math.max(...quotients);
    for (let iteration = 0; iteration < 60; iteration++) {
      const middle = (low + high) / 2;
      const vector = numerator.map(
        (value, index) => value - middle * denominator[index]
      ) as unknown as Vector;
      const residual =
        sphericalExtremum(vector, coverage, domain, maximize).value - middle * constant;
      if (residual > 0) low = middle;
      else high = middle;
    }
    return maximize ? high : low;
  }) as [number, number];
}
