// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original code. The disc-overlap area is the standard circle-circle intersection (lens) formula.

/** A sphere or an oblate spheroid that can hide the Sun. */
export type EclipseOccluder = {
  /** Center, in the frame and length unit of the other inputs. */
  readonly center: readonly number[];
  /** Equatorial radius, same length unit. */
  readonly radius: number;
  /**
   * Equatorial radius divided by polar radius, 1 or more. The polar axis is the z axis of the
   * frame. The default is 1, a sphere.
   */
  readonly polarScale?: number;
};

/** A ring of constant normal optical depth in the z = 0 plane, centered on the origin. */
export type RingOpticalDepthBand = {
  /** Inner radius, same length unit as the points. */
  readonly innerRadius: number;
  /** Outer radius, same length unit as the points. */
  readonly outerRadius: number;
  /** Normal (vertical) optical depth τ, 0 or more. */
  readonly opticalDepth: number;
};

/**
 * Returns the visible fraction of a uniform light disc of radius 1 when an opaque disc of radius
 * `occluderRadius` has its center at the distance `separation` from the center of the light disc.
 * Both lengths are in units of the radius of the light disc, for example angles divided by the
 * angular radius of the Sun.
 *
 * - `separation ≥ 1 + r`: no overlap, 1.
 * - `separation ≤ r − 1`: the occluder covers the light disc (umbra, total eclipse), 0.
 * - `separation ≤ 1 − r`: the occluder is inside the light disc (antumbra, annular eclipse), 1 − r².
 * - Between these, 1 − A / π, with the lens area of two circles of radii 1 and r at distance d:
 *   A = acos((d² + 1 − r²) / (2d)) + r² acos((d² + r² − 1) / (2dr))
 *   − ½ √((−d + 1 + r)(d + 1 − r)(d − 1 + r)(d + 1 + r)).
 *
 * The discs are flat. On the sky, this is the small-angle limit: for the Sun seen from the Earth
 * (0.27 degrees), the relative error is of the order of 1e−5. Limb darkening is not modeled.
 * @param occluderRadius - r, 0 or more.
 * @param separation - d, 0 or more.
 * @returns The visible fraction, from 0 to 1.
 * @throws {RangeError} When an input is negative or not finite.
 */
export function getDiscVisibleFraction(occluderRadius: number, separation: number): number {
  checkNonNegative('Occluder radius', occluderRadius);
  checkNonNegative('Separation', separation);
  const r = occluderRadius;
  const d = separation;
  if (d >= 1 + r) {
    return 1;
  }
  if (d <= Math.abs(1 - r)) {
    return r >= 1 ? 0 : 1 - r * r;
  }
  const lightAngle = Math.acos(clamp((d * d + 1 - r * r) / (2 * d), -1, 1));
  const occluderAngle = Math.acos(clamp((d * d + r * r - 1) / (2 * d * r), -1, 1));
  const kite = Math.sqrt(Math.max(0, (-d + 1 + r) * (d + 1 - r) * (d - 1 + r) * (d + 1 + r)));
  const overlap = lightAngle + r * r * occluderAngle - 0.5 * kite;
  return clamp(1 - overlap / Math.PI, 0, 1);
}

/**
 * Returns the visible fraction of the solar disc at a point, when one body can hide the Sun.
 *
 * The angular radii of the Sun and the occluder are asin(R / distance) at the point, and their
 * angular separation is the angle between the two directions. {@link getDiscVisibleFraction} then
 * gives the fraction. The result is 0 in the umbra, 1 − (r / s)² in the antumbra, and 1 outside
 * the penumbra. An occluder that is farther away than the Sun hides nothing.
 *
 * An oblate occluder (`polarScale` > 1) becomes a sphere when z is multiplied by `polarScale`. The
 * function takes both directions in that scaled space, which approximates the projected solar disc. Contact accuracy depends on viewing geometry. The frame must have its z axis along the polar axis of the occluder.
 *
 * Positions are geometric. For a correct shadow, give the Sun and the occluder at the times when
 * the light that reaches the point passed them (light-time corrected, without aberration).
 * @param point - The point that receives the light.
 * @param sunCenter - The center of the Sun.
 * @param sunRadius - The radius of the Sun, more than 0.
 * @param occluder - The body that can hide the Sun.
 * @returns The visible fraction of the solar disc, from 0 to 1. A point inside the occluder gives 0.
 * @throws {RangeError} When an input is not finite or out of range.
 */
export function getSunVisibleFraction(
  point: readonly number[],
  sunCenter: readonly number[],
  sunRadius: number,
  occluder: EclipseOccluder
): number {
  checkVector('Point', point);
  checkVector('Sun center', sunCenter);
  checkVector('Occluder center', occluder.center);
  checkPositive('Sun radius', sunRadius);
  checkPositive('Occluder radius', occluder.radius);
  const polarScale = occluder.polarScale ?? 1;
  if (!(polarScale >= 1) || !Number.isFinite(polarScale)) {
    throw new RangeError('Polar scale must be finite and 1 or more');
  }
  const toSun = subtract(sunCenter, point);
  const sunDistance = length(toSun);
  if (!(sunDistance > 0)) {
    throw new RangeError('The point must not be at the center of the Sun');
  }
  const sunAngle = Math.asin(Math.min(1, sunRadius / sunDistance));
  const a = scaleZ(toSun, polarScale);
  const b = scaleZ(subtract(occluder.center, point), polarScale);
  const lightDistance = length(a);
  const occluderDistance = length(b);
  if (occluderDistance >= lightDistance) {
    return 1;
  }
  if (occluderDistance <= occluder.radius) {
    return 0;
  }
  const occluderAngle = Math.asin(occluder.radius / occluderDistance);
  const separation = Math.atan2(length(cross(a, b)), dot(a, b));
  return getDiscVisibleFraction(occluderAngle / sunAngle, separation / sunAngle);
}

/**
 * Returns the transmission of a flat ring system along the ray from a point to the center of the
 * Sun: exp(−τ / |μ|), where τ is the normal optical depth of the band that the ray crosses and μ is
 * the sine of the elevation of the Sun above the ring plane, as seen from the point.
 *
 * The rings are in the z = 0 plane of the frame, centered on the origin: for example the
 * body-fixed or equatorial frame of Saturn. The Sun is a point here; its disc spans about 50 km at
 * the distance of Saturn's rings. A ray parallel to the plane, or one that does not cross it
 * toward the Sun, gives 1. Bands must not overlap; outside all bands τ is 0.
 * @param point - The point that receives the light.
 * @param sunCenter - The center of the Sun.
 * @param bands - The bands of the rings, with radii in the length unit of the points.
 * @returns The transmission, from 0 to 1.
 * @throws {RangeError} When an input is not finite or out of range.
 */
export function getRingTransmission(
  point: readonly number[],
  sunCenter: readonly number[],
  bands: readonly RingOpticalDepthBand[]
): number {
  checkVector('Point', point);
  checkVector('Sun center', sunCenter);
  for (const band of bands) {
    checkNonNegative('Ring inner radius', band.innerRadius);
    checkNonNegative('Ring optical depth', band.opticalDepth);
    if (!(band.outerRadius >= band.innerRadius) || !Number.isFinite(band.outerRadius)) {
      throw new RangeError('Ring outer radius must be finite and not less than the inner radius');
    }
  }
  const toSun = subtract(sunCenter, point);
  const distance = length(toSun);
  if (!(distance > 0)) {
    throw new RangeError('The point must not be at the center of the Sun');
  }
  const mu = toSun[2] / distance;
  if (Math.abs(mu) < 1e-12) {
    return 1;
  }
  const t = -point[2] / mu;
  if (!(t > 0 && t < distance)) {
    return 1;
  }
  const radius = Math.hypot(
    point[0] + (t * toSun[0]) / distance,
    point[1] + (t * toSun[1]) / distance
  );
  const band = bands.find(
    ({innerRadius, outerRadius}) => radius >= innerRadius && radius < outerRadius
  );
  return band ? Math.exp(-band.opticalDepth / Math.abs(mu)) : 1;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function subtract(a: readonly number[], b: readonly number[]): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scaleZ(v: readonly number[], factor: number): [number, number, number] {
  return [v[0], v[1], v[2] * factor];
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: readonly number[], b: readonly number[]): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function length(v: readonly number[]): number {
  return Math.hypot(v[0], v[1], v[2]);
}

function checkVector(name: string, v: readonly number[]): void {
  if (v.length < 3 || !Number.isFinite(v[0]) || !Number.isFinite(v[1]) || !Number.isFinite(v[2])) {
    throw new RangeError(`${name} must be a finite 3D vector`);
  }
}

function checkNonNegative(name: string, value: number): void {
  if (!(value >= 0) || !Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite and 0 or more`);
  }
}

function checkPositive(name: string, value: number): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite and more than 0`);
  }
}
