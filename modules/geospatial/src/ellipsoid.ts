// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Derived from Cesium. See the repository LICENSE for upstream attribution and Apache-2.0 terms. Original math.gl follow-up uses stable atan2 latitude and numeric cartographic output.

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {Vector3, Matrix4, assert, equals, _MathUtils, NumericArray} from '@math.gl/core';
import type {SpheroidParameters} from '@math.gl/types';
import {
  spheroidToCartesian,
  cartesianToSpheroid,
  type SpheroidGeometry
} from '@math.gl/core/spheroid';
import * as vec3 from '@math.gl/core/vec3';

import {WGS84_RADIUS_X, WGS84_RADIUS_Y, WGS84_RADIUS_Z} from './constants';
import {fromCartographicToRadians, toCartographicFromRadiansComponents} from './type-utils';

import type {AxisDirection} from './ellipsoid-helpers/ellipsoid-transform';
import {localFrameToFixedFrame} from './ellipsoid-helpers/ellipsoid-transform';
import {scaleToGeodeticSurface, writeResult} from './ellipsoid-helpers/scale-to-geodetic-surface';

const spheroidScratch = {x: 0, y: 0, z: 0};
const scratchVector = new Vector3();
const scratchNormal = new Vector3();
const scratchK = new Vector3();
const scratchPosition = new Vector3();
const scratchHeight = new Vector3();
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
    assert(x >= 0.0);
    assert(y >= 0.0);
    assert(z >= 0.0);

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

    if (this.radiiSquared.z !== 0) {
      this.squaredXOverSquaredZ = this.radiiSquared.x / this.radiiSquared.z;
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
        eccentricitySquared: 1 - this.radiiSquared.z / this.radiiSquared.x
      });
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

  /** Creates a string representing this Ellipsoid in the format '(radii.x, radii.y, radii.z)'. */
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
    if (this.spheroidGeometry) {
      const llh = fromCartographicToRadians(cartographic, scratchCartesian);
      spheroidScratch.x = llh[0];
      spheroidScratch.y = llh[1];
      spheroidScratch.z = llh[2];
      if (!spheroidToCartesian(spheroidScratch, this.spheroidGeometry)) return undefined;
      return writeResult(result, spheroidScratch.x, spheroidScratch.y, spheroidScratch.z);
    }
    const normal = scratchNormal;
    const k = scratchK;

    const [, , height] = cartographic;
    this.geodeticSurfaceNormalCartographic(cartographic, normal);
    k.copy(this.radiiSquared).scale(normal);

    const gamma = Math.sqrt(normal.dot(k));
    k.scale(1 / gamma);

    normal.scale(height);

    k.add(normal);

    return k.to(result);
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
    // Shared inverse is qualified for the unambiguous surface/exterior domain.
    // Interior/radial-fallback and non-spheroid behavior retain the Cesium kernel.
    const a = this.radii.x,
      b = this.radii.z;
    const normSquared = (x / a) ** 2 + (y / a) ** 2 + (z / b) ** 2;
    if (
      this.spheroidGeometry &&
      Number.isFinite(normSquared) &&
      normSquared >= 1 - 16 * Number.EPSILON &&
      Number.isFinite(x * x + y * y + z * z)
    ) {
      spheroidScratch.x = x;
      spheroidScratch.y = y;
      spheroidScratch.z = z;
      if (!cartesianToSpheroid(spheroidScratch, this.spheroidGeometry)) return undefined;
      // Preserve signed-zero atan2 at exact poles rather than projection's canonical zero.
      const longitude = x === 0 && y === 0 ? Math.atan2(y, x) : spheroidScratch.x;
      return toCartographicFromRadiansComponents(
        longitude,
        spheroidScratch.y,
        spheroidScratch.z,
        result
      );
    }
    scratchCartesian.set(x, y, z);
    const point = this.scaleToGeodeticSurface(scratchCartesian, scratchPosition);

    if (!point) {
      return undefined;
    }

    const normal = this.geodeticSurfaceNormal(point, scratchNormal);

    const h = scratchHeight;
    h.copy(scratchCartesian).subtract(point);

    const longitude = Math.atan2(normal.y, normal.x);
    // atan2 retains latitude precision when the normal is almost vertical.
    const latitude = Math.atan2(normal.z, Math.hypot(normal.x, normal.y));
    const height = Math.sign(vec3.dot(h, scratchCartesian)) * vec3.length(h);

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
    return scratchVector.from(cartesian).normalize().to(result);
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
    const cartographicVectorRadians = fromCartographicToRadians(cartographic);

    const longitude = cartographicVectorRadians[0];
    const latitude = cartographicVectorRadians[1];

    const cosLatitude = Math.cos(latitude);

    scratchVector
      .set(cosLatitude * Math.cos(longitude), cosLatitude * Math.sin(longitude), Math.sin(latitude))
      .normalize();

    return scratchVector.to(result);
  }

  /** Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position. */
  geodeticSurfaceNormal<NumArrayT>(cartesian: number[], result: NumArrayT): NumArrayT;
  geodeticSurfaceNormal(cartesian: number[]): number[];
  geodeticSurfaceNormal(cartesian: Readonly<NumericArray>, result = [0, 0, 0]) {
    return scratchVector.from(cartesian).scale(this.oneOverRadiiSquared).normalize().to(result);
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
    scratchPosition.from(cartesian);

    const positionX = scratchPosition.x;
    const positionY = scratchPosition.y;
    const positionZ = scratchPosition.z;
    const oneOverRadiiSquared = this.oneOverRadiiSquared;

    const beta =
      1.0 /
      Math.sqrt(
        positionX * positionX * oneOverRadiiSquared.x +
          positionY * positionY * oneOverRadiiSquared.y +
          positionZ * positionZ * oneOverRadiiSquared.z
      );

    return scratchPosition.multiplyByScalar(beta).to(result);
  }

  /** Transforms a Cartesian X, Y, Z position to the ellipsoid-scaled space by multiplying
   * its components by the result of `Ellipsoid#oneOverRadii` */
  transformPositionToScaledSpace(position: number[], result: number[] = [0, 0, 0]): number[] {
    return scratchPosition.from(position).scale(this.oneOverRadii).to(result);
  }

  /** Transforms a Cartesian X, Y, Z position from the ellipsoid-scaled space by multiplying
   * its components by the result of `Ellipsoid#radii`. */
  transformPositionFromScaledSpace(position: number[], result: number[] = [0, 0, 0]): number[] {
    return scratchPosition.from(position).scale(this.radii).to(result);
  }

  /** Computes a point which is the intersection of the surface normal with the z-axis. */
  getSurfaceNormalIntersectionWithZAxis(
    position: number[],
    buffer: number = 0,
    result: number[] = [0, 0, 0]
  ): number[] {
    // Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y)
    assert(equals(this.radii.x, this.radii.y, _MathUtils.EPSILON15));
    assert(this.radii.z > 0);

    scratchPosition.from(position);
    const z = scratchPosition.z * (1 - this.squaredXOverSquaredZ);

    if (Math.abs(z) >= this.radii.z - buffer) {
      return undefined;
    }

    return scratchPosition.set(0.0, 0.0, z).to(result);
  }
}

// Original parameter adapter; conversion and surface kernels above retain Cesium attribution.
function validateSpheroid(a: number, b: number): void {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0 || b > a)
    throw new Error('Spheroid requires finite positive axes with semiMinorAxis <= semiMajorAxis');
}
