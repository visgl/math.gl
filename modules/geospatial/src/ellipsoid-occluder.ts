// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original scaled-space analytic geometry. Consumer requirements: https://github.com/keplergl/kepler.gl/pull/3557 and https://github.com/keplergl/kepler.gl/pull/3593. No implementation code copied.

/** The limb is center + axis1*cos(t) + axis2*sin(t), in input Cartesian units. */
export type EllipsoidHorizon = {
  center: number[];
  axis1: number[];
  axis2: number[];
};

/** Axis-aligned ellipsoid queries, independent of viewport and vector classes. */
export class EllipsoidOccluder {
  readonly radii: readonly number[];
  readonly center: readonly number[];

  constructor(radii: Readonly<ArrayLike<number>>, center: Readonly<ArrayLike<number>> = [0, 0, 0]) {
    validateVector(radii);
    validateVector(center);
    if (Array.from(radii).some(value => value <= 0)) throw new RangeError('Radii must be positive');
    this.radii = Object.freeze(Array.from(radii));
    this.center = Object.freeze(Array.from(center));
  }

  /** Nonnegative ray parameter interval, including tangency and inside-origin rays.
   * Direction need not be normalized. Undefined is a true miss; never clamps a miss
   * to the limb. Result is untouched on miss. Distances equal parameters only for
   * unit directions. Zero direction is a miss.
   */
  intersectRay(
    origin: Readonly<ArrayLike<number>>,
    direction: Readonly<ArrayLike<number>>,
    result: number[] = [0, 0]
  ): number[] | undefined {
    validateVector(origin);
    validateVector(direction);
    const [x, y, z] = this.scalePoint(origin);
    const dx = direction[0] / this.radii[0];
    const dy = direction[1] / this.radii[1];
    const dz = direction[2] / this.radii[2];
    // Normalize in scaled space: avoid a tiny quadratic coefficient for ECEF rays.
    const length = Math.hypot(dx, dy, dz);
    if (length === 0 || !Number.isFinite(length)) return undefined;
    const ux = dx / length,
      uy = dy / length,
      uz = dz / length;
    const along = -(x * ux + y * uy + z * uz);
    const perpendicular = Math.hypot(y * uz - z * uy, z * ux - x * uz, x * uy - y * ux);
    if (perpendicular > 1) return undefined;
    const half = Math.sqrt((1 - perpendicular) * (1 + perpendicular));
    let near = along - half;
    let far = along + half;
    // Recover the small root by the root product rather than subtracting large terms.
    const radius = Math.hypot(x, y, z);
    if (!Number.isFinite(radius)) throw new RangeError('Scaled origin magnitude must be finite');
    if (half > 0 && along > 0 && far !== 0) near = ((radius - 1) / far) * (radius + 1);
    if (half > 0 && along < 0 && near !== 0) far = ((radius - 1) / near) * (radius + 1);
    if (far < 0) return undefined;
    result[0] = Math.max(0, Math.min(near, far)) / length;
    result[1] = Math.max(0, far) / length;
    return result;
  }

  /** True if the finite camera-to-point segment enters the solid interior.
   * Surface contact/tangency alone is not occlusion. Works for elevated points;
   * unlike a facing-normal test it does not discard visible points beyond the
   * surface horizon. tolerance is a nonnegative scaled-space squared-radius margin.
   */
  isPointOccluded(
    camera: Readonly<ArrayLike<number>>,
    point: Readonly<ArrayLike<number>>,
    tolerance = 1e-12
  ): boolean {
    validateVector(camera);
    validateVector(point);
    if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance >= 1)
      throw new RangeError('Tolerance must be in [0, 1)');
    const a = this.scalePoint(camera);
    const b = this.scalePoint(point);
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      dz = b[2] - a[2];
    const length = Math.hypot(dx, dy, dz);
    if (!Number.isFinite(length)) throw new RangeError('Segment magnitude must be finite');
    if (length === 0) return Math.hypot(...a) ** 2 < 1 - tolerance;
    const ux = dx / length,
      uy = dy / length,
      uz = dz / length;
    const distance = Math.max(0, Math.min(length, -(a[0] * ux + a[1] * uy + a[2] * uz)));
    return (
      Math.hypot(a[0] + distance * ux, a[1] + distance * uy, a[2] + distance * uz) ** 2 <
      1 - tolerance
    );
  }

  /** Exact apparent limb ellipse for an exterior camera; undefined on/inside surface. */
  getHorizon(camera: Readonly<ArrayLike<number>>): EllipsoidHorizon | undefined {
    validateVector(camera);
    const scaled = this.scalePoint(camera);
    const distance = Math.hypot(...scaled);
    if (!Number.isFinite(distance)) throw new RangeError('Camera magnitude must be finite');
    if (distance <= 1) return undefined;
    const normal = scaled.map(value => value / distance);
    // Choose a basis away from parallel to the normal, including polar views.
    const reference = Math.abs(normal[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0];
    const u = cross(normal, reference);
    const uLength = Math.hypot(...u);
    const v = cross(
      normal,
      u.map(value => value / uLength)
    );
    const radius = Math.sqrt((1 - 1 / distance) * (1 + 1 / distance));
    return {
      center: normal.map((value, i) => this.center[i] + (this.radii[i] * value) / distance),
      axis1: u.map((value, i) => (this.radii[i] * radius * value) / uLength),
      axis2: v.map((value, i) => this.radii[i] * radius * value)
    };
  }

  private scalePoint(point: Readonly<ArrayLike<number>>): number[] {
    const result = this.radii.map((radius, i) => (point[i] - this.center[i]) / radius);
    if (!result.every(Number.isFinite)) throw new RangeError('Scaled coordinates must be finite');
    return result;
  }
}

function validateVector(vector: Readonly<ArrayLike<number>>): void {
  if (vector.length !== 3 || !Array.from(vector).every(Number.isFinite))
    throw new RangeError('Expected three finite Cartesian components');
}

function cross(a: number[], b: number[]): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
