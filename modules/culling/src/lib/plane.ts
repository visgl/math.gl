// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {Vector3, equals, assert, NumericArray, _MathUtils} from '@math.gl/core';
import {Ray} from './ray';

const scratchPosition = new Vector3();
const scratchNormal = new Vector3();

// A plane in Hessian Normal Form
export class Plane {
  readonly normal: Vector3;
  distance: number;

  constructor(normal: Readonly<NumericArray> = [0, 0, 1], distance: number = 0) {
    this.normal = new Vector3();
    this.distance = -0;
    this.fromNormalDistance(normal, distance);
  }

  /** Creates a plane from a normal and a distance from the origin. */
  fromNormalDistance(normal: Readonly<NumericArray>, distance: number): this {
    assert(Number.isFinite(distance));
    this.normal.from(normal).normalize();
    this.distance = distance;
    return this;
  }

  /** Creates a plane from a normal and a point on the plane. */
  fromPointNormal(point: Readonly<NumericArray>, normal: Readonly<NumericArray>): this {
    point = scratchPosition.from(point);
    this.normal.from(normal).normalize();
    const distance = -this.normal.dot(point);
    this.distance = distance;
    return this;
  }

  /** Creates a plane from the general equation */
  fromCoefficients(a: number, b: number, c: number, d: number): this {
    this.normal.set(a, b, c);
    assert(equals(this.normal.len(), 1));
    this.distance = d;
    return this;
  }

  /** Duplicates a Plane instance. */
  clone(): Plane {
    return new Plane(this.normal, this.distance);
  }

  /** Compares the provided Planes by normal and distance */
  equals(right: Plane): boolean {
    return equals(this.distance, right.distance) && equals(this.normal, right.normal);
  }

  /** Computes the signed shortest distance of a point to a plane.
   * The sign of the distance determines which side of the plane the point is on.
   */
  getPointDistance(point: Readonly<NumericArray>): number {
    return this.normal.dot(point) + this.distance;
  }

  /** Transforms the plane by the given transformation matrix. */
  transform(matrix4: Readonly<NumericArray>): this {
    const normal = scratchNormal.copy(this.normal).transformAsVector(matrix4).normalize();
    const point = this.normal.scale(-this.distance).transform(matrix4);
    return this.fromPointNormal(point, normal);
  }

  /** Projects a point onto the plane. */
  projectPointOntoPlane(point: Readonly<NumericArray>, result: Vector3): Vector3;
  projectPointOntoPlane(
    point: Readonly<NumericArray>,
    result?: readonly number[]
  ): readonly number[];

  projectPointOntoPlane(point: Readonly<NumericArray>, result = [0, 0, 0]) {
    const scratchPoint = scratchPosition.from(point);
    // projectedPoint = point - (normal.point + scale) * normal
    const pointDistance = this.getPointDistance(scratchPoint);
    const scaledNormal = scratchNormal.copy(this.normal).scale(pointDistance);

    return scratchPoint.subtract(scaledNormal).to(result);
  }

  /**
   * Computes the intersection of a ray and this plane.
   *
   * @param {Ray} ray The ray.
   * @param {Vector3} [result] The object onto which to store the result.
   * @returns {Vector3} The intersection point or undefined if there is no intersections.
   */
  intersectWithRay(ray: Ray, result?: Vector3): Vector3 {
    if (!result) result = new Vector3();

    const origin = ray.origin;
    const direction = ray.direction;
    const normal = this.normal;
    const denominator = normal.dot(direction);

    if (Math.abs(denominator) < _MathUtils.EPSILON15) {
      return undefined;
    }

    const t = (-this.distance - normal.dot(origin)) / denominator;

    if (t < 0) {
      return undefined;
    }

    result = result.copy(direction).multiplyByScalar(t);
    return origin.add(result);
  }
}
