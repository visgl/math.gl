// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Derived from Cesium. Original math.gl follow-up adds explicit radial/normal inverses, packed projection and an orthonormal three-radius tangent basis. See the repository LICENSE for upstream attribution and Apache-2.0 terms.

// This file is derived from the Cesium library under Apache 2 license
// See ../LICENSE for the retained Cesium notice and Apache-2.0 terms.

import {Vector2, Vector3} from '@math.gl/core';
import type {NumericArray} from '@math.gl/core/types';
import {Plane} from '@math.gl/geometry/culling';
import {Ellipsoid} from './ellipsoid';
import {compensatedDot3, sphereNormalCoordinate} from './ellipsoid-helpers/tangent-plane-numerics';

export type TangentPlaneProjectionMode = 'normal' | 'radial';
export type TangentPlaneProjection = {
  positions: Float64Array;
  /** One byte per input point: 1 for success, 0 for no radial intersection. */
  valid: Uint8Array;
};

/** A two-dimensional east-north plane tangent to an ellipsoid. */
export class EllipsoidTangentPlane {
  private _origin: Vector3;
  private _xAxis: Vector3;
  private _yAxis: Vector3;
  private _plane: Plane;
  private readonly radii: readonly number[];
  private readonly sphereRadius?: number;

  /**
   * Creates a new plane tangent to an ellipsoid at the provided origin.
   * If origin is not on the surface of the ellipsoid, its surface projection will be used.
   *
   * @param origin A nonzero Cartesian point on or near the ellipsoid.
   * @param ellipsoid The ellipsoid to which the origin belongs. Defaults to WGS84.
   */
  constructor(origin: Readonly<NumericArray>, ellipsoid: Ellipsoid = Ellipsoid.WGS84) {
    finiteInput(origin, 3);
    this.radii = Object.freeze(Array.from(ellipsoid.radii));
    if (this.radii[0] === this.radii[1] && this.radii[1] === this.radii[2])
      this.sphereRadius = this.radii[0];
    if (!this.radii.every(radius => radius > 0 && Number.isFinite(radius))) {
      throw new RangeError('Tangent plane requires positive finite ellipsoid radii');
    }
    const originOnSurface = ellipsoid.scaleToGeodeticSurface(Array.from(origin), new Vector3());
    if (!originOnSurface) throw new RangeError('Origin has no unique ellipsoid surface point');

    this._origin = new Vector3(originOnSurface);
    const normal = new Vector3(ellipsoid.geodeticSurfaceNormal(originOnSurface));
    if (!normal.every(Number.isFinite) || !(normal.len() > 0)) {
      throw new RangeError('Cannot resolve tangent-plane normal');
    }
    normal.normalize();
    // Use the surface normal, rather than the radial position, so unequal X/Y
    // radii still produce an orthonormal tangent basis.
    const horizontal = Math.hypot(normal[0], normal[1]);
    this._xAxis =
      horizontal > 0
        ? new Vector3(-normal[1] / horizontal, normal[0] / horizontal, 0)
        : new Vector3(0, 1, 0);
    this._yAxis = new Vector3(normal).cross(this._xAxis).normalize();
    this._plane = new Plane().fromPointNormal(this._origin, normal);
  }

  /**
   * Computes the projection of the provided 3D position onto the 2D plane, along the plane normal.
   *
   * @param cartesian The fixed Cartesian point to project.
   * @param result The optional object in which to store the local east-north coordinates.
   * @returns The supplied result or a new Vector2.
   */
  projectPointToNearestOnPlane(cartesian: Readonly<NumericArray>, result = new Vector2()): Vector2 {
    finiteInput(cartesian, 3);
    // Tangential dot products equal orthogonal projection without constructing the 3D footpoint.
    const x = cartesian[0] - this._origin[0];
    const y = cartesian[1] - this._origin[1];
    const z = cartesian[2] - this._origin[2];
    const projected = writePlanePoint(this, x, y, z, result, this.sphereRadius);
    if (!projected) throw new RangeError('Tangent-plane projection overflow');
    return projected;
  }

  /** Project along the outward ray from the ellipsoid center.
   * Back-facing, horizon and nonfinite intersections return undefined without writing result.
   */
  projectPointRadiallyOntoPlane(
    cartesian: Readonly<NumericArray>,
    result = new Vector2()
  ): Vector2 | undefined {
    finiteInput(cartesian, 3);
    const scale = Math.max(Math.abs(cartesian[0]), Math.abs(cartesian[1]), Math.abs(cartesian[2]));
    if (scale === 0) return undefined;
    const sx = cartesian[0] / scale,
      sy = cartesian[1] / scale,
      sz = cartesian[2] / scale;
    const length = Math.hypot(sx, sy, sz);
    const x = sx / length;
    const y = sy / length;
    const z = sz / length;
    const n = this.zAxis;
    const denominator = x * n[0] + y * n[1] + z * n[2];
    if (denominator <= 1e-14) return undefined;
    const distance = this._origin.dot(n) / denominator;
    return writePlanePoint(
      this,
      x * distance - this._origin[0],
      y * distance - this._origin[1],
      z * distance - this._origin[2],
      result,
      this.sphereRadius
    );
  }

  /** Lift a local east/north point to the ellipsoid. Radial is the inverse of radial
   * projection. Normal selects the nearest-facing line intersection and can miss.
   * Neither operation restores a source point's height. Failure leaves result untouched.
   */
  projectPointOntoEllipsoid(
    point: Readonly<NumericArray>,
    mode: TangentPlaneProjectionMode = 'radial',
    result = new Vector3()
  ): Vector3 | undefined {
    finiteInput(point, 2);
    checkMode(mode);
    const [rx, ry, rz] = this.radii;
    if (mode === 'radial') {
      const scale = Math.max(
        Math.abs(this._origin[0]),
        Math.abs(this._origin[1]),
        Math.abs(this._origin[2]),
        Math.abs(point[0]),
        Math.abs(point[1])
      );
      const u = point[0] / scale,
        v = point[1] / scale;
      const x = this._origin[0] / scale + this._xAxis[0] * u + this._yAxis[0] * v;
      const y = this._origin[1] / scale + this._xAxis[1] * u + this._yAxis[1] * v;
      const z = this._origin[2] / scale + this._xAxis[2] * u + this._yAxis[2] * v;
      const minimum = Math.min(rx, ry, rz);
      const ax = x * (minimum / rx),
        ay = y * (minimum / ry),
        az = z * (minimum / rz);
      const length = Math.hypot(ax, ay, az);
      if (!(length > 0 && Number.isFinite(length))) return undefined;
      return writeSurfacePoint(rx * (ax / length), ry * (ay / length), rz * (az / length), result);
    }
    const n = this.zAxis;
    if (this.sphereRadius !== undefined) {
      const height = sphereNormalCoordinate(this.sphereRadius, point[0], point[1]);
      if (height === undefined) return undefined;
      return writeSurfacePoint(
        this._xAxis[0] * point[0] + this._yAxis[0] * point[1] + n[0] * height,
        this._xAxis[1] * point[0] + this._yAxis[1] * point[1] + n[1] * height,
        this._xAxis[2] * point[0] + this._yAxis[2] * point[1] + n[2] * height,
        result
      );
    }
    const p = [
      this._origin[0] + this._xAxis[0] * point[0] + this._yAxis[0] * point[1],
      this._origin[1] + this._xAxis[1] * point[0] + this._yAxis[1] * point[1],
      this._origin[2] + this._xAxis[2] * point[0] + this._yAxis[2] * point[1]
    ];
    if (!p.every(Number.isFinite)) return undefined;
    const ax = n[0] / rx,
      ay = n[1] / ry,
      az = n[2] / rz;
    const px = p[0] / rx,
      py = p[1] / ry,
      pz = p[2] / rz;
    const a = ax * ax + ay * ay + az * az;
    const b = ax * px + ay * py + az * pz;
    const c = px * px + py * py + pz * pz - 1;
    const squaredB = b * b,
      ac = a * c;
    const error = 8 * Number.EPSILON * (Math.abs(squaredB) + Math.abs(ac));
    const discriminant = squaredB - ac;
    if (!(a > 0 && discriminant >= -error && Number.isFinite(discriminant))) return undefined;
    // Stable form of the nearer root (-b + sqrt(discriminant)) / a.
    const root = Math.sqrt(Math.max(0, discriminant));
    const t = b > 0 ? -c / (b + root) : (-b + root) / a;
    return writeSurfacePoint(p[0] + t * n[0], p[1] + t * n[1], p[2] + t * n[2], result);
  }

  /** Packed XYZ to packed east/north. Invalid radial points produce NaN pairs and a zero mask.
   * Optional output must have exactly two components per point and must not overlap input.
   */
  projectPointsFlat(
    input: Readonly<NumericArray>,
    mode: TangentPlaneProjectionMode = 'normal',
    output?: Float64Array
  ): TangentPlaneProjection {
    checkMode(mode);
    if (input.length % 3) throw new RangeError('Expected packed XYZ coordinates');
    const count = input.length / 3;
    const positions = output || new Float64Array(count * 2);
    if (positions.length !== count * 2) throw new RangeError('Invalid tangent-plane output length');
    if (
      ArrayBuffer.isView(input) &&
      input.buffer === positions.buffer &&
      input.byteOffset < positions.byteOffset + positions.byteLength &&
      positions.byteOffset < input.byteOffset + input.byteLength
    ) {
      throw new RangeError('Input and output buffers must not overlap');
    }
    // Validate before writing any output, including malformed later records.
    for (let i = 0; i < input.length; i++) {
      if (!Number.isFinite(input[i])) throw new RangeError('Expected finite coordinates');
    }
    const valid = new Uint8Array(count);
    const point = new Vector3();
    const projected = new Vector2();
    for (let i = 0; i < count; i++) {
      point.set(input[i * 3], input[i * 3 + 1], input[i * 3 + 2]);
      const value =
        mode === 'normal'
          ? this.projectPointToNearestOnPlane(point, projected)
          : this.projectPointRadiallyOntoPlane(point, projected);
      valid[i] = value ? 1 : 0;
      positions[i * 2] = value ? value[0] : NaN;
      positions[i * 2 + 1] = value ? value[1] : NaN;
    }
    return {positions, valid};
  }

  get plane(): Plane {
    return this._plane;
  }

  get origin(): Vector3 {
    return this._origin;
  }

  get xAxis(): Vector3 {
    return this._xAxis;
  }

  get yAxis(): Vector3 {
    return this._yAxis;
  }

  get zAxis(): Vector3 {
    return this._plane.normal;
  }
}

function finiteInput(point: Readonly<NumericArray>, length: number): void {
  if (point.length !== length) throw new RangeError(`Expected ${length} finite coordinates`);
  for (let i = 0; i < length; i++) {
    if (!Number.isFinite(point[i])) throw new RangeError(`Expected ${length} finite coordinates`);
  }
}

function checkMode(mode: TangentPlaneProjectionMode): void {
  if (mode !== 'normal' && mode !== 'radial') throw new RangeError('Invalid tangent-plane mode');
}

function writePlanePoint(
  plane: EllipsoidTangentPlane,
  x: number,
  y: number,
  z: number,
  result: Vector2,
  sphereRadius?: number
): Vector2 | undefined {
  let east = x * plane.xAxis[0] + y * plane.xAxis[1] + z * plane.xAxis[2];
  let north = x * plane.yAxis[0] + y * plane.yAxis[1] + z * plane.yAxis[2];
  if (
    sphereRadius !== undefined &&
    Math.abs((east / sphereRadius) ** 2 + (north / sphereRadius) ** 2 - 1) <= 32 * Number.EPSILON
  ) {
    east = compensatedDot3(x, y, z, plane.xAxis[0], plane.xAxis[1], plane.xAxis[2]);
    north = compensatedDot3(x, y, z, plane.yAxis[0], plane.yAxis[1], plane.yAxis[2]);
  }
  if (!Number.isFinite(east) || !Number.isFinite(north)) return undefined;
  return result.set(east, north);
}

function writeSurfacePoint(x: number, y: number, z: number, result: Vector3): Vector3 | undefined {
  if (![x, y, z].every(Number.isFinite)) return undefined;
  return result.set(x, y, z);
}
