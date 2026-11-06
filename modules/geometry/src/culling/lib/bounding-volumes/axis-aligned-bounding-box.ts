// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Derived from Cesium. See the repository LICENSE for upstream attribution and Apache-2.0 terms.

import {BoundingVolume} from './bounding-volume';
import {Vector3} from '@math.gl/core';
import {Plane} from '../plane';
import type {CullingResult} from '../../constants';

const scratchVector = new Vector3();
const scratchNormal = new Vector3();

/**
 * An axis aligned bounding box - aligned with coordinate axes
 * @see BoundingVolume
 * @see BoundingRectangle
 * @see OrientedBoundingBox
 */
export class AxisAlignedBoundingBox implements BoundingVolume {
  /** The center point of the bounding box. */
  readonly center: Vector3;
  /** The positive half diagonal of the bounding box. */
  readonly halfDiagonal: Vector3;
  /** The minimum point defining the bounding box. [0, 0, 0] for empty box */
  readonly minimum: Vector3;
  /** The maximum point defining the bounding box. [0, 0, 0] for empty box */
  readonly maximum: Vector3;

  /**
   * Creates an instance of an AxisAlignedBoundingBox from the minimum and maximum points along the x, y, and z axes.
   * @param minimum=[0, 0, 0] The minimum point along the x, y, and z axes.
   * @param maximum=[0, 0, 0] The maximum point along the x, y, and z axes.
   * @param center The center of the box; automatically computed if not supplied.
   */
  constructor(
    minimum: readonly number[] = [0, 0, 0],
    maximum: readonly number[] = [0, 0, 0],
    center?: readonly number[]
  ) {
    // If center was not defined, compute it.
    center = center || scratchVector.copy(minimum).add(maximum).scale(0.5);
    this.center = new Vector3(center);
    this.halfDiagonal = new Vector3(maximum).subtract(this.center);

    /**
     * The minimum point defining the bounding box.
     * @type {Vector3}
     * @default {@link 0, 0, 0}
     */
    this.minimum = new Vector3(minimum);

    /**
     * The maximum point defining the bounding box.
     * @type {Vector3}
     * @default {@link 0, 0, 0}
     */
    this.maximum = new Vector3(maximum);
  }

  /**
   * Duplicates a AxisAlignedBoundingBox instance.
   *
   * @returns {AxisAlignedBoundingBox} A new AxisAlignedBoundingBox instance.
   */
  clone(): AxisAlignedBoundingBox {
    return new AxisAlignedBoundingBox(this.minimum, this.maximum, this.center);
  }

  /**
   * Compares the provided AxisAlignedBoundingBox componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {AxisAlignedBoundingBox} [right] The second AxisAlignedBoundingBox to compare with.
   * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  equals(right: AxisAlignedBoundingBox): boolean {
    return (
      this === right ||
      (Boolean(right) && this.minimum.equals(right.minimum) && this.maximum.equals(right.maximum))
    );
  }

  /**
   * Transforms an AABB by a finite affine matrix, rebuilding all bounds and extents.
   * @param transform The affine transformation matrix.
   * @returns itself, i.e. the modified bounding box.
   */
  transform(transform: readonly number[]): this {
    if (
      transform.length !== 16 ||
      transform.some(x => !Number.isFinite(x)) ||
      transform[3] !== 0 ||
      transform[7] !== 0 ||
      transform[11] !== 0 ||
      transform[15] !== 1
    ) {
      throw new RangeError('Expected a finite affine matrix');
    }
    const center = this.minimum.clone().add(this.maximum).scale(0.5);
    const extent = this.maximum.clone().subtract(this.minimum).scale(0.5);
    if (extent.some(x => x < 0)) throw new RangeError('Bounds must be ordered');
    center.transformAsPoint(transform);
    for (let row = 0; row < 3; row++) {
      this.halfDiagonal[row] =
        Math.abs(transform[row]) * extent[0] +
        Math.abs(transform[row + 4]) * extent[1] +
        Math.abs(transform[row + 8]) * extent[2];
    }
    this.center.copy(center);
    this.minimum.copy(center).subtract(this.halfDiagonal);
    this.maximum.copy(center).add(this.halfDiagonal);
    return this;
  }

  /**
   * Determines which side of a plane a box is located.
   */
  intersectPlane(plane: Plane): CullingResult {
    const {halfDiagonal} = this;
    const normal = scratchNormal.from(plane.normal);
    const e =
      halfDiagonal.x * Math.abs(normal.x) +
      halfDiagonal.y * Math.abs(normal.y) +
      halfDiagonal.z * Math.abs(normal.z);
    const s = this.center.dot(normal) + plane.distance; // signed distance from center

    if (s - e > 0) {
      return 'inside';
    }

    if (s + e < 0) {
      // Not in front because normals point inward
      return 'outside';
    }

    return 'intersecting';
  }

  /** Computes the estimated distance from the closest point on a bounding box to a point. */
  distanceTo(point: readonly number[]): number {
    return Math.sqrt(this.distanceSquaredTo(point));
  }

  /** Computes the estimated distance squared from the closest point on a bounding box to a point. */
  distanceSquaredTo(point: readonly number[]): number {
    const offset = scratchVector.from(point).subtract(this.center);
    const {halfDiagonal} = this;

    let distanceSquared = 0.0;
    let d;

    d = Math.abs(offset.x) - halfDiagonal.x;
    if (d > 0) {
      distanceSquared += d * d;
    }

    d = Math.abs(offset.y) - halfDiagonal.y;
    if (d > 0) {
      distanceSquared += d * d;
    }

    d = Math.abs(offset.z) - halfDiagonal.z;
    if (d > 0) {
      distanceSquared += d * d;
    }

    return distanceSquared;
  }
}
