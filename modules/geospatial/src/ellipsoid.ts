// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Derived from Cesium. See the repository LICENSE for upstream attribution and Apache-2.0 terms. Original math.gl follow-up uses stable atan2 latitude and numeric cartographic output.

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {Vector3, Matrix4, assert, _MathUtils, NumericArray, config} from '@math.gl/core';
import type {SpheroidParameters} from '@math.gl/core/types';
import {
  spheroidToCartesian,
  cartesianToSpheroid,
  type SpheroidGeometry
} from '@math.gl/core/spheroid';

import {WGS84_RADIUS_X, WGS84_RADIUS_Y, WGS84_RADIUS_Z} from './constants';
import {
  fromCartographic,
  fromCartographicToRadians,
  toCartographicFromRadiansComponents
} from './type-utils';

import type {AxisDirection} from './ellipsoid-helpers/ellipsoid-transform';
import {localFrameToFixedFrame} from './ellipsoid-helpers/ellipsoid-transform';
import {scaleToGeodeticSurface, writeResult} from './ellipsoid-helpers/scale-to-geodetic-surface';

const spheroidScratch = {x: 0, y: 0, z: 0};
const scratchVector = new Vector3();
const scratchNormal = new Vector3();
const scratchPosition = new Vector3();
const scratchCartesian = new Vector3();

/**
 * A quadratic surface defined in Cartesian coordinates by the equation
 * `(x / a)^2 + (y / b)^2 + (z / c)^2 = 1`.  Primarily used
 * to represent the shape of planetary bodies.
 */
export class Ellipsoid {
  /** An Ellipsoid instance initialized to the WGS84 standard. */
  static readonly WGS84: Ellipsoid = new Ellipsoid(WGS84_RADIUS_X, WGS84_RADIUS_Y, WGS84_RADIUS_Z);

  /** Construct from two-axis geometry, including normalized projection ellipsoids.
   * The equatorial X/Y radii are equal; no CRS or datum information is inferred.
   */
  static fromSpheroid(parameters: SpheroidParameters): Ellipsoid {
    const {semiMajorAxis, semiMinorAxis} = parameters;
    validateSpheroid(semiMajorAxis, semiMinorAxis);
    return new Ellipsoid(semiMajorAxis, semiMajorAxis, semiMinorAxis);
  }

  readonly radii: Vector3;
  readonly radiiSquared: Vector3;
  readonly radiiToTheFourth: Vector3;
  readonly oneOverRadii: Vector3;
  readonly oneOverRadiiSquared: Vector3;
  readonly minimumRadius: number;
  readonly maximumRadius: number;
  readonly centerToleranceSquared: number = _MathUtils.EPSILON1;
  readonly squaredXOverSquaredZ: number;
  private readonly spheroidGeometry?: SpheroidGeometry;

  /** Creates an Ellipsoid from a Cartesian specifying the radii in x, y, and z directions. */
  constructor(x: number, y: number, z: number);
  constructor();

  constructor(x = 0.0, y = 0.0, z = 0.0) {
    assert(Number.isFinite(x) && x >= 0.0);
    assert(Number.isFinite(y) && y >= 0.0);
    assert(Number.isFinite(z) && z >= 0.0);

    this.radii = new Vector3(x, y, z);

    this.radiiSquared = new Vector3(x * x, y * y, z * z);

    this.radiiToTheFourth = new Vector3(x * x * x * x, y * y * y * y, z * z * z * z);

    this.oneOverRadii = new Vector3(
      x === 0.0 ? 0.0 : 1.0 / x,
      y === 0.0 ? 0.0 : 1.0 / y,
      z === 0.0 ? 0.0 : 1.0 / z
    );

    this.oneOverRadiiSquared = new Vector3(
      x === 0.0 ? 0.0 : 1.0 / (x * x),
      y === 0.0 ? 0.0 : 1.0 / (y * y),
      z === 0.0 ? 0.0 : 1.0 / (z * z)
    );

    this.minimumRadius = Math.min(x, y, z);

    this.maximumRadius = Math.max(x, y, z);

    if (z !== 0) {
      this.squaredXOverSquaredZ = (x / z) ** 2;
    }

    // Setup only: retain the three-radius path for unsupported/lossy shapes.
    if (
      x === y &&
      z > 0 &&
      z <= x &&
      Number.isFinite(this.radiiSquared.x) &&
      this.radiiSquared.z > 0
    )
      this.spheroidGeometry = Object.freeze({
        semiMajorAxis: x,
        semiMinorAxis: z,
        eccentricitySquared: 1 - (z / x) ** 2
      });
    // Geometry and all derived caches are one immutable snapshot. Mutating a
    // public vector previously changed some algorithms while leaving others stale.
    Object.freeze(this.radii);
    Object.freeze(this.radiiSquared);
    Object.freeze(this.radiiToTheFourth);
    Object.freeze(this.oneOverRadii);
    Object.freeze(this.oneOverRadiiSquared);
    Object.freeze(this);
  }

  /** Return an owned geometry snapshot for a sphere or oblate spheroid.
   * Triaxial, prolate and degenerate ellipsoids cannot be represented by this contract.
   * Call during setup, outside coordinate loops.
   */
  toSpheroid(): SpheroidParameters {
    const {x, y, z} = this.radii;
    if (x !== y) throw new Error('Spheroid requires equal X/Y radii');
    validateSpheroid(x, z);
    return Object.freeze({semiMajorAxis: x, semiMinorAxis: z});
  }

  /** Compares this Ellipsoid against the provided Ellipsoid componentwise */
  equals(right: Ellipsoid): boolean {
    return this === right || Boolean(right && this.radii.equals(right.radii));
  }

  /** Creates a string representing this Ellipsoid in the format '[radii.x, radii.y, radii.z]'. */
  toString(): string {
    return this.radii.toString();
  }

  /** Converts the provided cartographic position to Cartesian representation.
   * The position is supplied as [longitude, latitude, height], where longitude and latitude
   * are in degrees and height is in meters above the ellipsoid.
   */
  cartographicToCartesian(cartographic: number[], result: Vector3): Vector3;
  cartographicToCartesian(cartographic: number[], result?: number[]): number[];

  cartographicToCartesian(cartographic: Readonly<NumericArray>, result = [0, 0, 0]) {
    const llh = fromCartographicToRadians(cartographic, scratchCartesian);
    const longitude = llh[0],
      latitude = llh[1],
      height = llh[2];
    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(height) ||
      !(this.minimumRadius > 0) ||
      !Number.isFinite(this.maximumRadius * this.maximumRadius)
    )
      return undefined;
    // Degree inputs near a pole retain their complement before conversion. A
    // rounded radian latitude loses angle bits amplified by thin-shape curvature.
    if (
      this.spheroidGeometry &&
      (config._cartographicRadians || Math.abs(latitude) <= Math.PI / 4)
    ) {
      spheroidScratch.x = longitude;
      spheroidScratch.y = latitude;
      spheroidScratch.z = height;
      if (!spheroidToCartesian(spheroidScratch, this.spheroidGeometry)) return undefined;
      return writeResult(result, spheroidScratch.x, spheroidScratch.y, spheroidScratch.z);
    }
    const normal = scratchNormal;
    this.geodeticSurfaceNormalCartographic(cartographic, normal);
    const nx = normal.x,
      ny = normal.y,
      nz = normal.z;
    const rx = this.radii.x,
      ry = this.radii.y,
      rz = this.radii.z;
    // Form support from scaled axes, not rounded (possibly subnormal) squares.
    const gamma = Math.hypot(rx * nx, ry * ny, rz * nz);
    const x = rx * ((rx * nx) / gamma) + height * nx;
    const y = ry * ((ry * ny) / gamma) + height * ny;
    const z = rz * ((rz * nz) / gamma) + height * nz;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return undefined;
    return writeResult(result, x, y, z);
  }

  /** Converts the provided Cartesian position to [longitude, latitude, height],
   * where longitude and latitude are in degrees and height is in meters above the ellipsoid.
   * The cartographic position is undefined at the center of the ellipsoid.
   */
  cartesianToCartographic(cartesian: Readonly<NumericArray>, result: Vector3): Vector3;
  cartesianToCartographic(cartesian: Readonly<NumericArray>, result?: number[]): number[];

  cartesianToCartographic(cartesian: Readonly<NumericArray>, result = [0, 0, 0]) {
    const object = cartesian as unknown as {x: number; y: number; z: number};
    const x = 'x' in cartesian ? object.x : cartesian[0];
    const y = 'x' in cartesian ? object.y : cartesian[1];
    const z = 'x' in cartesian ? object.z : cartesian[2];
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return undefined;
    // Sphere/oblate conversion chooses the unique nearest normal, including interiors.
    // Preserve legacy geometry magnitude limits; prolate/triaxial keep their own kernel.
    if (
      this.spheroidGeometry &&
      Number.isFinite(x * x + y * y + z * z) &&
      Number.isFinite(this.oneOverRadiiSquared.x) &&
      Number.isFinite(this.oneOverRadiiSquared.z)
    ) {
      spheroidScratch.x = x;
      spheroidScratch.y = y;
      spheroidScratch.z = z;
      const shape = this.spheroidGeometry;
      const nearBoundary =
        z === 0 &&
        shape.semiMinorAxis < shape.semiMajorAxis &&
        Math.abs(Math.hypot(x, y) - shape.semiMajorAxis * shape.eccentricitySquared) <=
          64 * Number.EPSILON * shape.semiMajorAxis;
      // On the cusp plane classify exact axes/coordinates, not a rounded hypot.
      if (!nearBoundary && cartesianToSpheroid(spheroidScratch, shape)) {
        // Preserve signed-zero atan2 at exact poles rather than projection's canonical zero.
        const longitude = x === 0 && y === 0 ? Math.atan2(y, x) : spheroidScratch.x;
        return toCartographicFromRadiansComponents(
          longitude,
          spheroidScratch.y,
          spheroidScratch.z,
          result
        );
      }
      // Exact three-axis fallback can recover a unique root when the shared
      // bounded numeric solve cannot represent its intermediate scaling.
    }
    // Retain the legacy representable squared-axis domain for normal arithmetic.
    if (
      !(this.minimumRadius > 0) ||
      !Number.isFinite(this.maximumRadius * this.maximumRadius) ||
      !Number.isFinite(1 / (this.minimumRadius * this.minimumRadius))
    )
      return undefined;
    scratchCartesian.set(x, y, z);
    const point = this.scaleToGeodeticSurface(scratchCartesian, scratchPosition);

    if (!point) {
      return undefined;
    }

    const gx = point[0] * this.oneOverRadiiSquared.x;
    const gy = point[1] * this.oneOverRadiiSquared.y;
    const gz = point[2] * this.oneOverRadiiSquared.z;
    const length = Math.hypot(gx, gy, gz);
    if (!(length > 0) || !Number.isFinite(length)) return undefined;
    const nx = gx / length,
      ny = gy / length,
      nz = gz / length;
    const longitude = Math.atan2(ny, nx);
    const latitude = Math.atan2(nz, Math.hypot(nx, ny));
    // Project onto the unit normal. The former sign(h dot input) can underflow
    // for a deep interior even when its signed height is representable.
    const height = (x - point[0]) * nx + (y - point[1]) * ny + (z - point[2]) * nz;

    return toCartographicFromRadiansComponents(longitude, latitude, height, result);
  }

  /** Computes a 4x4 transformation matrix from a reference frame with an east-north-up axes
   * centered at the provided origin to the provided ellipsoid's fixed reference frame. */
  eastNorthUpToFixedFrame(origin: Readonly<NumericArray>, result?: Matrix4): Matrix4;
  eastNorthUpToFixedFrame(origin: Readonly<NumericArray>, result: number[]): number[];

  eastNorthUpToFixedFrame(origin: Readonly<NumericArray>, result = new Matrix4()) {
    return localFrameToFixedFrame(this, 'east', 'north', 'up', origin, result);
  }

  /** Computes a 4x4 transformation matrix from a reference frame centered at
   * the provided origin to the ellipsoid's fixed reference frame.
   */
  localFrameToFixedFrame(
    firstAxis: AxisDirection,
    secondAxis: AxisDirection,
    thirdAxis: AxisDirection,
    origin: Readonly<NumericArray>,
    result?: Matrix4
  ): Matrix4;
  localFrameToFixedFrame<_Matrix4T>(
    firstAxis: AxisDirection,
    secondAxis: AxisDirection,
    thirdAxis: AxisDirection,
    origin: Readonly<NumericArray>,
    result: number[]
  ): number[];

  // Computes a 4x4 transformation matrix from a reference frame centered at
  // the provided origin to the ellipsoid's fixed reference frame.
  localFrameToFixedFrame(
    firstAxis: AxisDirection,
    secondAxis: AxisDirection,
    thirdAxis: AxisDirection,
    origin: Readonly<NumericArray>,
    result = new Matrix4()
  ) {
    return localFrameToFixedFrame(this, firstAxis, secondAxis, thirdAxis, origin, result);
  }

  /** Computes the unit vector directed from the center of this ellipsoid toward
   * the provided Cartesian position. */
  geocentricSurfaceNormal(cartesian: number[], result?: number[]): number[];
  geocentricSurfaceNormal<NumArray>(cartesian: number[], result: NumArray): NumArray;
  geocentricSurfaceNormal(cartesian: Readonly<NumericArray>, result = [0, 0, 0]) {
    fromCartographic(cartesian, scratchVector);
    const point = scratchVector;
    return normalResult(point.x, point.y, point.z, result);
  }

  /** Computes the normal of the plane tangent to the surface of the ellipsoid at the provided
   * [longitude, latitude, height], where longitude and latitude are in degrees.
   */
  geodeticSurfaceNormalCartographic<NumArray>(
    cartographic: Readonly<NumericArray>,
    result: NumArray
  ): NumArray;
  geodeticSurfaceNormalCartographic(cartographic: number[]): number[];
  geodeticSurfaceNormalCartographic(cartographic: Readonly<NumericArray>, result = [0, 0, 0]) {
    const point = fromCartographic(cartographic, scratchCartesian);
    const longitude = config._cartographicRadians ? point[0] : (point[0] * Math.PI) / 180;
    const latitude = config._cartographicRadians ? point[1] : (point[1] * Math.PI) / 180;
    const polarDegrees = !config._cartographicRadians && Math.abs(point[1]) > 45;
    const complement = ((90 - Math.abs(point[1])) * Math.PI) / 180;
    const cosLatitude = polarDegrees
      ? Math.sin(complement)
      : Math.abs(latitude) === Math.PI / 2
        ? 0
        : Math.cos(latitude);
    const sinLatitude = polarDegrees
      ? Math.sign(point[1]) * Math.cos(complement)
      : Math.sin(latitude);
    return normalResult(
      cosLatitude * Math.cos(longitude),
      cosLatitude * Math.sin(longitude),
      sinLatitude,
      result
    );
  }

  /** Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position. */
  geodeticSurfaceNormal<NumArrayT>(cartesian: number[], result: NumArrayT): NumArrayT;
  geodeticSurfaceNormal(cartesian: number[]): number[];
  geodeticSurfaceNormal(cartesian: Readonly<NumericArray>, result = [0, 0, 0]) {
    if (!(this.minimumRadius > 0)) return undefined;
    fromCartographic(cartesian, scratchVector);
    const point = scratchVector;
    const scale = Math.max(Math.abs(point.x), Math.abs(point.y), Math.abs(point.z));
    if (!(scale > 0) || !Number.isFinite(scale)) return undefined;
    const nx = (point.x / scale) * (this.minimumRadius / this.radii.x) ** 2;
    const ny = (point.y / scale) * (this.minimumRadius / this.radii.y) ** 2;
    const nz = (point.z / scale) * (this.minimumRadius / this.radii.z) ** 2;
    if (
      (point.x === 0 || Math.abs(nx) >= 2 ** -1022) &&
      (point.y === 0 || Math.abs(ny) >= 2 ** -1022) &&
      (point.z === 0 || Math.abs(nz) >= 2 ** -1022)
    )
      return normalResult(nx, ny, nz, result);

    // Original exponent-scaled gradient fallback: evaluate x/a² only after
    // extracting exact powers of two. Squared radius ratios and scaled input
    // coordinates can underflow independently before their weights compensate.
    const ex = point.x === 0 ? 0 : Math.min(1023, Math.floor(Math.log2(Math.abs(point.x))));
    const ey = point.y === 0 ? 0 : Math.min(1023, Math.floor(Math.log2(Math.abs(point.y))));
    const ez = point.z === 0 ? 0 : Math.min(1023, Math.floor(Math.log2(Math.abs(point.z))));
    const ax = Math.min(1023, Math.floor(Math.log2(this.radii.x)));
    const ay = Math.min(1023, Math.floor(Math.log2(this.radii.y)));
    const az = Math.min(1023, Math.floor(Math.log2(this.radii.z)));
    const common = Math.max(
      point.x === 0 ? -Infinity : ex - 2 * ax,
      point.y === 0 ? -Infinity : ey - 2 * ay,
      point.z === 0 ? -Infinity : ez - 2 * az
    );
    return normalResult(
      point.x === 0
        ? point.x
        : (point.x / 2 ** ex / (this.radii.x / 2 ** ax) ** 2) * 2 ** (ex - 2 * ax - common),
      point.y === 0
        ? point.y
        : (point.y / 2 ** ey / (this.radii.y / 2 ** ay) ** 2) * 2 ** (ey - 2 * ay - common),
      point.z === 0
        ? point.z
        : (point.z / 2 ** ez / (this.radii.z / 2 ** az) ** 2) * 2 ** (ez - 2 * az - common),
      result
    );
  }

  /** Scales the provided Cartesian position along the geodetic surface normal
   * so that it is on the surface of this ellipsoid.  If the position is
   * at the center of the ellipsoid, this function returns undefined. */
  scaleToGeodeticSurface(cartesian: number[], result?: number[]): number[] {
    return scaleToGeodeticSurface(cartesian, this, result);
  }

  /** Scales the provided Cartesian position along the geocentric surface normal
   * so that it is on the surface of this ellipsoid. */
  scaleToGeocentricSurface(cartesian: number[], result: number[] = [0, 0, 0]): number[] {
    fromCartographic(cartesian, scratchPosition);
    const point = scratchPosition;
    const scale = Math.max(Math.abs(point.x), Math.abs(point.y), Math.abs(point.z));
    if (!(this.minimumRadius > 0) || !(scale > 0) || !Number.isFinite(scale)) return undefined;
    const squared =
      point.x * point.x * this.oneOverRadiiSquared.x +
      point.y * point.y * this.oneOverRadiiSquared.y +
      point.z * point.z * this.oneOverRadiiSquared.z;
    // Preserve the ordinary path's established rounding; scale only when its
    // squared intermediates are unsafe. Commit scalar snapshots in both paths.
    if (
      squared >= 2 ** -1022 &&
      Number.isFinite(squared) &&
      scale * scale >= 2 ** -1022 &&
      Number.isFinite(scale * scale)
    ) {
      const beta = 1 / Math.sqrt(squared);
      return writeResult(result, point.x * beta, point.y * beta, point.z * beta);
    }
    const x = point.x / scale,
      y = point.y / scale,
      z = point.z / scale;
    const norm = Math.hypot(x / this.radii.x, y / this.radii.y, z / this.radii.z);
    if (!(norm > 0) || !Number.isFinite(norm)) return undefined;
    return writeResult(result, x / norm, y / norm, z / norm);
  }

  /** Transforms a Cartesian X, Y, Z position to the ellipsoid-scaled space by multiplying
   * its components by the result of `Ellipsoid#oneOverRadii` */
  transformPositionToScaledSpace(position: number[], result: number[] = [0, 0, 0]): number[] {
    fromCartographic(position, scratchPosition);
    const point = scratchPosition.scale(this.oneOverRadii);
    return writeResult(result, point.x, point.y, point.z);
  }

  /** Transforms a Cartesian X, Y, Z position from the ellipsoid-scaled space by multiplying
   * its components by the result of `Ellipsoid#radii`. */
  transformPositionFromScaledSpace(position: number[], result: number[] = [0, 0, 0]): number[] {
    fromCartographic(position, scratchPosition);
    const point = scratchPosition.scale(this.radii);
    return writeResult(result, point.x, point.y, point.z);
  }

  /** Computes a point which is the intersection of the surface normal with the z-axis. */
  getSurfaceNormalIntersectionWithZAxis(
    position: number[],
    buffer: number = 0,
    result: number[] = [0, 0, 0]
  ): number[] {
    // Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y)
    assert(this.radii.x === this.radii.y && this.minimumRadius > 0);

    fromCartographic(position, scratchPosition);
    if (
      !Number.isFinite(scratchPosition.x) ||
      !Number.isFinite(scratchPosition.y) ||
      !Number.isFinite(scratchPosition.z) ||
      !Number.isFinite(buffer)
    )
      return undefined;
    const z = scratchPosition.z * (1 - this.squaredXOverSquaredZ);
    if (!Number.isFinite(z)) return undefined;

    if (Math.abs(z) >= this.radii.z - buffer) {
      return undefined;
    }

    return writeResult(result, 0, 0, z);
  }
}

// Original parameter adapter; conversion and surface kernels above retain Cesium attribution.
function validateSpheroid(a: number, b: number): void {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0 || b > a)
    throw new Error('Spheroid requires finite positive axes with semiMinorAxis <= semiMajorAxis');
}

/** Original scaled normalization and scalar commit; safe for tiny/huge rays and reentrant setters. */
function normalResult(x: number, y: number, z: number, result: number[]): number[] {
  const scale = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
  if (!(scale > 0) || !Number.isFinite(scale)) return undefined;
  const nx = x / scale,
    ny = y / scale,
    nz = z / scale;
  const length = Math.hypot(nx, ny, nz);
  return writeResult(result, nx / length, ny / length, nz / length);
}
