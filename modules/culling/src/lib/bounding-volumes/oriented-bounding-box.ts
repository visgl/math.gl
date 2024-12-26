// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {NumericArray} from '@math.gl/types';
import {Vector2, Vector3, Matrix3, Matrix4, Quaternion,
  degrees, _MathUtils} from '@math.gl/core';

// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import {Ellipsoid, Rectangle} from '@math.gl/geospatial';
import type {BoundingVolume} from './bounding-volume';
import {BoundingSphere} from './bounding-sphere';
import {Plane} from '../plane';
import {EllipsoidTangentPlane} from '../ellipsoid-tangent-plane'
import {INTERSECTION} from '../../constants';

const scratchVector3 = new Vector3();
const scratchOffset = new Vector3();
const scratchVectorU = new Vector3();
const scratchVectorV = new Vector3();
const scratchVectorW = new Vector3();
const scratchCorner = new Vector3();
const scratchToCenter = new Vector3();

const scratchTangentPoint = new Vector3();
const scratchPerimeterCartographicNC = new Vector3();
const scratchPerimeterCartographicNW = new Vector3();
const scratchPerimeterCartographicCW = new Vector3();
const scratchPerimeterCartographicSW = new Vector3();
const scratchPerimeterCartographicSC = new Vector3();
const scratchPerimeterCartesianNC = new Vector3();
const scratchPerimeterCartesianNW = new Vector3();
const scratchPerimeterCartesianCW = new Vector3();
const scratchPerimeterCartesianSW = new Vector3();
const scratchPerimeterCartesianSC = new Vector3();
const scratchPerimeterProjectedNC = new Vector2();
const scratchPerimeterProjectedNW = new Vector2();
const scratchPerimeterProjectedCW = new Vector2();
const scratchPerimeterProjectedSW = new Vector2();
const scratchPerimeterProjectedSC = new Vector2();

const scratchPlane = new Plane();
const scratchPlaneOrigin = new Vector3();
const scratchPlaneNormal = new Vector3();
const scratchPlaneXAxis = new Vector3();
const scratchHorizonCartesian = new Vector3();
const scratchHorizonProjected = new Vector2();
const scratchMaxY = new Vector3();
const scratchMinY = new Vector3();
const scratchZ = new Vector3();

const VECTOR3_UNIT_X = new Vector3(1, 0, 0);
const VECTOR3_UNIT_Z = new Vector3(0, 0, 1);

const MATRIX3 = {
  COLUMN0ROW0: 0,
  COLUMN0ROW1: 1,
  COLUMN0ROW2: 2,
  COLUMN1ROW0: 3,
  COLUMN1ROW1: 4,
  COLUMN1ROW2: 5,
  COLUMN2ROW0: 6,
  COLUMN2ROW1: 7,
  COLUMN2ROW2: 8
};

/**
 * An OrientedBoundingBox of some object is a closed and convex cuboid.
 * It can provide a tighter bounding volume than `BoundingSphere` or
 * `AxisAlignedBoundingBox` in many cases.
 */
export class OrientedBoundingBox implements BoundingVolume {
  center: Vector3;
  halfAxes: Matrix3;

  /**
   * An OrientedBoundingBox of some object is a closed and convex cuboid.
   * It can provide a tighter bounding volume than
   * `BoundingSphere` or `AxisAlignedBoundingBox` in many cases.
   */
  constructor(center?: Readonly<NumericArray>, halfAxes?: Readonly<NumericArray>);
  constructor(
    center: Readonly<NumericArray> = [0, 0, 0],
    halfAxes: Readonly<NumericArray> = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  ) {
    this.center = new Vector3().from(center);
    this.halfAxes = new Matrix3(halfAxes);
  }

  /** Returns an array with three halfSizes for the bounding box */
  get halfSize(): number[] {
    const xAxis = this.halfAxes.getColumn(0);
    const yAxis = this.halfAxes.getColumn(1);
    const zAxis = this.halfAxes.getColumn(2);
    return [new Vector3(xAxis).len(), new Vector3(yAxis).len(), new Vector3(zAxis).len()];
  }

  /** Returns a quaternion describing the orientation of the bounding box */
  get quaternion(): Quaternion {
    const xAxis = this.halfAxes.getColumn(0);
    const yAxis = this.halfAxes.getColumn(1);
    const zAxis = this.halfAxes.getColumn(2);
    const normXAxis = new Vector3(xAxis).normalize();
    const normYAxis = new Vector3(yAxis).normalize();
    const normZAxis = new Vector3(zAxis).normalize();
    return new Quaternion().fromMatrix3(new Matrix3([...normXAxis, ...normYAxis, ...normZAxis]));
  }

  /**
   * Create OrientedBoundingBox from quaternion based OBB,
   */
  fromCenterHalfSizeQuaternion(
    center: number[],
    halfSize: number[],
    quaternion: number[]
  ): OrientedBoundingBox {
    const quaternionObject = new Quaternion(quaternion);
    const directionsMatrix = new Matrix3().fromQuaternion(quaternionObject);
    directionsMatrix[0] = directionsMatrix[0] * halfSize[0];
    directionsMatrix[1] = directionsMatrix[1] * halfSize[0];
    directionsMatrix[2] = directionsMatrix[2] * halfSize[0];
    directionsMatrix[3] = directionsMatrix[3] * halfSize[1];
    directionsMatrix[4] = directionsMatrix[4] * halfSize[1];
    directionsMatrix[5] = directionsMatrix[5] * halfSize[1];
    directionsMatrix[6] = directionsMatrix[6] * halfSize[2];
    directionsMatrix[7] = directionsMatrix[7] * halfSize[2];
    directionsMatrix[8] = directionsMatrix[8] * halfSize[2];
    this.center = new Vector3().from(center);
    this.halfAxes = directionsMatrix;
    return this;
  }

  /**
   * Computes an OrientedBoundingBox that bounds a region on the surface of the WGS84 ellipsoid.
   * There are no guarantees about the orientation of the bounding box.
   *
   * @param {number[]} region The cartographic region ([west, south, east, north, minimum height, maximum height])
   *                          on the surface of the ellipsoid.
   * @returns {OrientedBoundingBox} The modified result parameter or a new OrientedBoundingBox instance if none was provided.
   */
  // eslint-disable-next-line max-statements
  fromRegion(region: number[]): OrientedBoundingBox {
    const [west, south, east, north, minimumHeight, maximumHeight] = region;

    const northDeg = degrees(north);
    const southDeg = degrees(south);

    let maxX: number, maxY: number, maxZ: number, minX: number, minY: number, minZ: number, plane: Plane;

    const rectangle = new Rectangle(west, south, east, north);
    const tangentPoint = Rectangle.center(rectangle, scratchTangentPoint);
    const tangentPointCartographic = new Vector3([degrees(tangentPoint.x), degrees(tangentPoint.y), 0.0]);

    const lonCenter = tangentPoint.x;
    const lonCenterDeg = tangentPointCartographic.x;

    if (rectangle.width <= _MathUtils.PI) {
      const westDeg = degrees(west);

      const tangentPoint = Ellipsoid.WGS84.cartographicToCartesian(tangentPointCartographic);
      const ellipsoidTangentPlane = new EllipsoidTangentPlane(tangentPoint);

      const latCenter = southDeg < 0.0 && northDeg > 0.0 ? 0.0 : tangentPointCartographic.y;

      const perimeterCartographicNC = scratchPerimeterCartographicNC.copy([lonCenterDeg, northDeg, maximumHeight]);
      const perimeterCartographicNW = scratchPerimeterCartographicNW.copy([westDeg, northDeg, maximumHeight]);
      const perimeterCartographicCW = scratchPerimeterCartographicCW.copy([westDeg, latCenter, maximumHeight]);
      const perimeterCartographicSW = scratchPerimeterCartographicSW.copy([westDeg, southDeg, maximumHeight]);
      const perimeterCartographicSC = scratchPerimeterCartographicSC.copy([lonCenterDeg, southDeg, maximumHeight]);

      const perimeterCartesianNC = Ellipsoid.WGS84.cartographicToCartesian(
          perimeterCartographicNC,
          scratchPerimeterCartesianNC,
      );
      let perimeterCartesianNW = Ellipsoid.WGS84.cartographicToCartesian(
          perimeterCartographicNW,
          scratchPerimeterCartesianNW,
      );
      const perimeterCartesianCW = Ellipsoid.WGS84.cartographicToCartesian(
          perimeterCartographicCW,
          scratchPerimeterCartesianCW,
      );
      let perimeterCartesianSW = Ellipsoid.WGS84.cartographicToCartesian(
          perimeterCartographicSW,
          scratchPerimeterCartesianSW,
      );
      const perimeterCartesianSC = Ellipsoid.WGS84.cartographicToCartesian(
          perimeterCartographicSC,
          scratchPerimeterCartesianSC,
      );

      const perimeterProjectedNC = ellipsoidTangentPlane.projectPointToNearestOnPlane(
          perimeterCartesianNC,
          scratchPerimeterProjectedNC,
      );
      const perimeterProjectedNW = ellipsoidTangentPlane.projectPointToNearestOnPlane(
          perimeterCartesianNW,
          scratchPerimeterProjectedNW,
      );
      const perimeterProjectedCW = ellipsoidTangentPlane.projectPointToNearestOnPlane(
          perimeterCartesianCW,
          scratchPerimeterProjectedCW,
      );
      const perimeterProjectedSW = ellipsoidTangentPlane.projectPointToNearestOnPlane(
          perimeterCartesianSW,
          scratchPerimeterProjectedSW,
      );
      const perimeterProjectedSC = ellipsoidTangentPlane.projectPointToNearestOnPlane(
          perimeterCartesianSC,
          scratchPerimeterProjectedSC,
      );

      minX = Math.min(
          perimeterProjectedNW.x,
          perimeterProjectedCW.x,
          perimeterProjectedSW.x,
      );
      maxX = -minX;

      maxY = Math.max(perimeterProjectedNW.y, perimeterProjectedNC.y);
      minY = Math.min(perimeterProjectedSW.y, perimeterProjectedSC.y);

      perimeterCartographicNW.z = perimeterCartographicSW.z =
          minimumHeight;
      perimeterCartesianNW = Ellipsoid.WGS84.cartographicToCartesian(
          perimeterCartographicNW,
          scratchPerimeterCartesianNW,
      );
      perimeterCartesianSW = Ellipsoid.WGS84.cartographicToCartesian(
          perimeterCartographicSW,
          scratchPerimeterCartesianSW,
      );

      plane = ellipsoidTangentPlane.plane;
      minZ = Math.min(
          plane.getPointDistance(perimeterCartesianNW),
          plane.getPointDistance(perimeterCartesianSW),
      );
      maxZ = maximumHeight;

      return fromPlaneExtents(
          ellipsoidTangentPlane.origin,
          ellipsoidTangentPlane.xAxis,
          ellipsoidTangentPlane.yAxis,
          ellipsoidTangentPlane.zAxis,
          minX,
          maxX,
          minY,
          maxY,
          minZ,
          maxZ,
          this
      );
    }

    const eastDeg = degrees(east);

    const fullyAboveEquator = south > 0.0;
    const fullyBelowEquator = north < 0.0;
    const latitudeNearestToEquator = fullyAboveEquator ? southDeg : fullyBelowEquator ? northDeg : 0.0;

    const planeOrigin = Ellipsoid.WGS84.cartographicToCartesian(
        [lonCenterDeg, latitudeNearestToEquator, maximumHeight], scratchPlaneOrigin
    );
    planeOrigin.z = 0.0;
    const isPole = Math.abs(planeOrigin.x) < _MathUtils.EPSILON10 && Math.abs(planeOrigin.y) < _MathUtils.EPSILON10;
    const planeNormal = !isPole ? scratchPlaneNormal.copy(planeOrigin).normalize() : VECTOR3_UNIT_X;
    const planeYAxis = VECTOR3_UNIT_Z;
    const planeXAxis = scratchPlaneXAxis.copy(planeNormal).cross(planeYAxis);
    plane = scratchPlane.fromPointNormal(planeOrigin, planeNormal);

    const horizonCartesian = Ellipsoid.WGS84.cartographicToCartesian([
      degrees(lonCenter + _MathUtils.PI_OVER_TWO), latitudeNearestToEquator, maximumHeight], scratchHorizonCartesian
    );
    const projectedPoint = plane.projectPointOntoPlane(horizonCartesian, scratchHorizonProjected) as Vector3;
    maxX = projectedPoint.dot(planeXAxis);
    minX = -maxX;

    maxY = Ellipsoid.WGS84.cartographicToCartesian(
        [0.0, northDeg, fullyBelowEquator ? minimumHeight : maximumHeight], scratchMaxY).z;
    minY = Ellipsoid.WGS84.cartographicToCartesian(
        [0.0, southDeg, fullyAboveEquator ? minimumHeight : maximumHeight], scratchMinY).z;

    const farZ = Ellipsoid.WGS84.cartographicToCartesian(
        [eastDeg, latitudeNearestToEquator, maximumHeight], scratchZ);

    minZ = plane.getPointDistance(farZ);
    maxZ = 0.0;

    return fromPlaneExtents(
        planeOrigin,
        planeXAxis,
        planeYAxis,
        planeNormal,
        minX,
        maxX,
        minY,
        maxY,
        minZ,
        maxZ,
        this
    );
  }

  /** Duplicates a OrientedBoundingBox instance. */
  clone(): OrientedBoundingBox {
    return new OrientedBoundingBox(this.center, this.halfAxes);
  }

  /** Compares the provided OrientedBoundingBox component wise and returns */
  equals(right: OrientedBoundingBox): boolean {
    return (
      this === right ||
      (Boolean(right) && this.center.equals(right.center) && this.halfAxes.equals(right.halfAxes))
    );
  }

  /** Computes a tight-fitting bounding sphere enclosing the provided oriented bounding box. */
  getBoundingSphere(result = new BoundingSphere()): BoundingSphere {
    const halfAxes = this.halfAxes;
    const u = halfAxes.getColumn(0, scratchVectorU);
    const v = halfAxes.getColumn(1, scratchVectorV);
    const w = halfAxes.getColumn(2, scratchVectorW);

    // Calculate "corner" vector
    const cornerVector = scratchVector3.copy(u).add(v).add(w);

    result.center.copy(this.center);
    result.radius = cornerVector.magnitude();

    return result;
  }

  /** Determines which side of a plane the oriented bounding box is located. */
  intersectPlane(plane: Plane): number {
    const center = this.center;
    const normal = plane.normal;
    const halfAxes = this.halfAxes;

    const normalX = normal.x;
    const normalY = normal.y;
    const normalZ = normal.z;

    // Plane is used as if it is its normal; the first three components are assumed to be normalized
    const radEffective =
      Math.abs(
        normalX * halfAxes[MATRIX3.COLUMN0ROW0] +
          normalY * halfAxes[MATRIX3.COLUMN0ROW1] +
          normalZ * halfAxes[MATRIX3.COLUMN0ROW2]
      ) +
      Math.abs(
        normalX * halfAxes[MATRIX3.COLUMN1ROW0] +
          normalY * halfAxes[MATRIX3.COLUMN1ROW1] +
          normalZ * halfAxes[MATRIX3.COLUMN1ROW2]
      ) +
      Math.abs(
        normalX * halfAxes[MATRIX3.COLUMN2ROW0] +
          normalY * halfAxes[MATRIX3.COLUMN2ROW1] +
          normalZ * halfAxes[MATRIX3.COLUMN2ROW2]
      );
    const distanceToPlane = normal.dot(center) + plane.distance;

    if (distanceToPlane <= -radEffective) {
      // The entire box is on the negative side of the plane normal
      return INTERSECTION.OUTSIDE;
    } else if (distanceToPlane >= radEffective) {
      // The entire box is on the positive side of the plane normal
      return INTERSECTION.INSIDE;
    }
    return INTERSECTION.INTERSECTING;
  }

  /** Computes the estimated distance from the closest point on a bounding box to a point. */
  distanceTo(point: readonly number[]): number {
    return Math.sqrt(this.distanceSquaredTo(point));
  }

  /**
   * Computes the estimated distance squared from the closest point
   * on a bounding box to a point.
   * See Geometric Tools for Computer Graphics 10.4.2
   */
  distanceSquaredTo(point: readonly number[]): number {
    // Computes the estimated distance squared from the
    // closest point on a bounding box to a point.
    // See Geometric Tools for Computer Graphics 10.4.2
    const offset = scratchOffset.from(point).subtract(this.center);

    const halfAxes = this.halfAxes;
    const u = halfAxes.getColumn(0, scratchVectorU);
    const v = halfAxes.getColumn(1, scratchVectorV);
    const w = halfAxes.getColumn(2, scratchVectorW);

    const uHalf = u.magnitude();
    const vHalf = v.magnitude();
    const wHalf = w.magnitude();

    u.normalize();
    v.normalize();
    w.normalize();

    let distanceSquared = 0.0;
    let d;

    d = Math.abs(offset.dot(u)) - uHalf;
    if (d > 0) {
      distanceSquared += d * d;
    }

    d = Math.abs(offset.dot(v)) - vHalf;
    if (d > 0) {
      distanceSquared += d * d;
    }

    d = Math.abs(offset.dot(w)) - wHalf;
    if (d > 0) {
      distanceSquared += d * d;
    }

    return distanceSquared;
  }

  /**
   * The distances calculated by the vector from the center of the bounding box
   * to position projected onto direction.
   *
   * - If you imagine the infinite number of planes with normal direction,
   *   this computes the smallest distance to the closest and farthest planes
   *   from `position` that intersect the bounding box.
   *
   * @param position The position to calculate the distance from.
   * @param direction The direction from position.
   * @param result An Interval (array of length 2) to store the nearest and farthest distances.
   * @returns Interval (array of length 2) with nearest and farthest distances
   *   on the bounding box from position in direction.
   */
  // eslint-disable-next-line max-statements
  computePlaneDistances(
    position: readonly number[],
    direction: Vector3,
    result: number[] = [-0, -0]
  ): number[] {
    let minDist = Number.POSITIVE_INFINITY;
    let maxDist = Number.NEGATIVE_INFINITY;

    const center = this.center;
    const halfAxes = this.halfAxes;

    const u = halfAxes.getColumn(0, scratchVectorU);
    const v = halfAxes.getColumn(1, scratchVectorV);
    const w = halfAxes.getColumn(2, scratchVectorW);

    // project first corner
    const corner = scratchCorner.copy(u).add(v).add(w).add(center);

    const toCenter = scratchToCenter.copy(corner).subtract(position);
    let mag = direction.dot(toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project second corner
    corner.copy(center).add(u).add(v).subtract(w);

    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project third corner
    corner.copy(center).add(u).subtract(v).add(w);

    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project fourth corner
    corner.copy(center).add(u).subtract(v).subtract(w);

    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project fifth corner
    center.copy(corner).subtract(u).add(v).add(w);

    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project sixth corner
    center.copy(corner).subtract(u).add(v).subtract(w);

    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project seventh corner
    center.copy(corner).subtract(u).subtract(v).add(w);

    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    // project eighth corner
    center.copy(corner).subtract(u).subtract(v).subtract(w);

    toCenter.copy(corner).subtract(position);
    mag = direction.dot(toCenter);

    minDist = Math.min(mag, minDist);
    maxDist = Math.max(mag, maxDist);

    result[0] = minDist;
    result[1] = maxDist;
    return result;
  }

  /**
   * Applies a 4x4 affine transformation matrix to a bounding sphere.
   * @param transform The transformation matrix to apply to the bounding sphere.
   * @returns itself, i.e. the modified BoundingVolume.
   */
  transform(transformation: readonly number[]): this {
    this.center.transformAsPoint(transformation);

    const xAxis = this.halfAxes.getColumn(0, scratchVectorU);
    xAxis.transformAsPoint(transformation);

    const yAxis = this.halfAxes.getColumn(1, scratchVectorV);
    yAxis.transformAsPoint(transformation);

    const zAxis = this.halfAxes.getColumn(2, scratchVectorW);
    zAxis.transformAsPoint(transformation);

    this.halfAxes = new Matrix3([...xAxis, ...yAxis, ...zAxis]);
    return this;
  }

  getTransform(): Matrix4 {
    // const modelMatrix = Matrix4.fromRotationTranslation(this.boundingVolume.halfAxes, this.boundingVolume.center);
    // return modelMatrix;
    throw new Error('not implemented');
  }
}

const scratchScale = new Vector3();
const scratchHalfAxes = new Matrix3();

/** helper function for OrientedBoundingBox.fromRegion() */
// eslint-disable-next-line max-params
function fromPlaneExtents(
    planeOrigin: Vector3,
    planeXAxis: Vector3,
    planeYAxis: Vector3,
    planeZAxis: Vector3,
    minimumX: number,
    maximumX: number,
    minimumY: number,
    maximumY: number,
    minimumZ: number,
    maximumZ: number,
    result: OrientedBoundingBox
) {
  if (!result)
    result = new OrientedBoundingBox()

  const halfAxes = new Matrix3();
  halfAxes.setColumn(0, planeXAxis);
  halfAxes.setColumn(1, planeYAxis);
  halfAxes.setColumn(2, planeZAxis);

  let centerOffset = scratchOffset;
  centerOffset.x = (minimumX + maximumX) / 2.0;
  centerOffset.y = (minimumY + maximumY) / 2.0;
  centerOffset.z = (minimumZ + maximumZ) / 2.0;
  centerOffset = halfAxes.multiplyByVector(centerOffset, scratchOffset);

  const scale = scratchScale;
  scale.x = (maximumX - minimumX) / 2.0;
  scale.y = (maximumY - minimumY) / 2.0;
  scale.z = (maximumZ - minimumZ) / 2.0;

  result.center = planeOrigin.add(centerOffset);
  result.halfAxes = halfAxes.multiplyByScale(scale, scratchHalfAxes);

  return result;
}
