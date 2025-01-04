// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Vector2, Vector3, degrees, _MathUtils} from '@math.gl/core';
import {OrientedBoundingBox, Plane} from '@math.gl/culling';
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import {LngLatRectangle} from './lng-lat-rectangle';
import {Ellipsoid} from './ellipsoid';
import {EllipsoidTangentPlane} from './ellipsoid-tangent-plane';

const scratchOffset = new Vector3();

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

/**
 * Computes an OrientedBoundingBox that bounds a region on the surface of the WGS84 ellipsoid.
 * There are no guarantees about the orientation of the bounding box.
 *
 * @param {number[]} region The cartographic region ([west, south, east, north, minimum height, maximum height])
 *                          on the surface of the ellipsoid.
 * @returns {OrientedBoundingBox} The modified result parameter or a new OrientedBoundingBox instance if none was provided.
 */
// eslint-disable-next-line max-statements
export function makeOBBfromRegion(region: number[]): OrientedBoundingBox {
  const obb = new OrientedBoundingBox();

  const [west, south, east, north, minimumHeight, maximumHeight] = region;

  const northDeg = degrees(north);
  const southDeg = degrees(south);

  let maxX: number;
  let maxY: number;
  let maxZ: number;
  let minX: number;
  let minY: number;
  let minZ: number;
  let plane: Plane;

  const rectangle = new LngLatRectangle(west, south, east, north);
  const tangentPoint = LngLatRectangle.center(rectangle, scratchTangentPoint);
  const tangentPointCartographic = new Vector3([
    degrees(tangentPoint.x),
    degrees(tangentPoint.y),
    0.0
  ]);

  const lonCenter = tangentPoint.x;
  const lonCenterDeg = tangentPointCartographic.x;

  if (rectangle.width <= _MathUtils.PI) {
    const westDeg = degrees(west);

    const tangentPoint = Ellipsoid.WGS84.cartographicToCartesian(tangentPointCartographic);
    const ellipsoidTangentPlane = new EllipsoidTangentPlane(tangentPoint);

    const latCenter = southDeg < 0.0 && northDeg > 0.0 ? 0.0 : tangentPointCartographic.y;

    const perimeterCartographicNC = scratchPerimeterCartographicNC.copy([
      lonCenterDeg,
      northDeg,
      maximumHeight
    ]);
    const perimeterCartographicNW = scratchPerimeterCartographicNW.copy([
      westDeg,
      northDeg,
      maximumHeight
    ]);
    const perimeterCartographicCW = scratchPerimeterCartographicCW.copy([
      westDeg,
      latCenter,
      maximumHeight
    ]);
    const perimeterCartographicSW = scratchPerimeterCartographicSW.copy([
      westDeg,
      southDeg,
      maximumHeight
    ]);
    const perimeterCartographicSC = scratchPerimeterCartographicSC.copy([
      lonCenterDeg,
      southDeg,
      maximumHeight
    ]);

    const perimeterCartesianNC = Ellipsoid.WGS84.cartographicToCartesian(
      perimeterCartographicNC,
      scratchPerimeterCartesianNC
    );
    let perimeterCartesianNW = Ellipsoid.WGS84.cartographicToCartesian(
      perimeterCartographicNW,
      scratchPerimeterCartesianNW
    );
    const perimeterCartesianCW = Ellipsoid.WGS84.cartographicToCartesian(
      perimeterCartographicCW,
      scratchPerimeterCartesianCW
    );
    let perimeterCartesianSW = Ellipsoid.WGS84.cartographicToCartesian(
      perimeterCartographicSW,
      scratchPerimeterCartesianSW
    );
    const perimeterCartesianSC = Ellipsoid.WGS84.cartographicToCartesian(
      perimeterCartographicSC,
      scratchPerimeterCartesianSC
    );

    const perimeterProjectedNC = ellipsoidTangentPlane.projectPointToNearestOnPlane(
      perimeterCartesianNC,
      scratchPerimeterProjectedNC
    );
    const perimeterProjectedNW = ellipsoidTangentPlane.projectPointToNearestOnPlane(
      perimeterCartesianNW,
      scratchPerimeterProjectedNW
    );
    const perimeterProjectedCW = ellipsoidTangentPlane.projectPointToNearestOnPlane(
      perimeterCartesianCW,
      scratchPerimeterProjectedCW
    );
    const perimeterProjectedSW = ellipsoidTangentPlane.projectPointToNearestOnPlane(
      perimeterCartesianSW,
      scratchPerimeterProjectedSW
    );
    const perimeterProjectedSC = ellipsoidTangentPlane.projectPointToNearestOnPlane(
      perimeterCartesianSC,
      scratchPerimeterProjectedSC
    );

    minX = Math.min(perimeterProjectedNW.x, perimeterProjectedCW.x, perimeterProjectedSW.x);
    maxX = -minX;

    maxY = Math.max(perimeterProjectedNW.y, perimeterProjectedNC.y);
    minY = Math.min(perimeterProjectedSW.y, perimeterProjectedSC.y);

    perimeterCartographicNW.z = perimeterCartographicSW.z = minimumHeight;
    perimeterCartesianNW = Ellipsoid.WGS84.cartographicToCartesian(
      perimeterCartographicNW,
      scratchPerimeterCartesianNW
    );
    perimeterCartesianSW = Ellipsoid.WGS84.cartographicToCartesian(
      perimeterCartographicSW,
      scratchPerimeterCartesianSW
    );

    plane = ellipsoidTangentPlane.plane;
    minZ = Math.min(
      plane.getPointDistance(perimeterCartesianNW),
      plane.getPointDistance(perimeterCartesianSW)
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
      obb
    );
  }

  const eastDeg = degrees(east);

  const fullyAboveEquator = south > 0.0;
  const fullyBelowEquator = north < 0.0;
  const latitudeNearestToEquator = fullyAboveEquator
    ? southDeg
    : fullyBelowEquator
      ? northDeg
      : 0.0;

  const planeOrigin = Ellipsoid.WGS84.cartographicToCartesian(
    [lonCenterDeg, latitudeNearestToEquator, maximumHeight],
    scratchPlaneOrigin
  );
  planeOrigin.z = 0.0;
  const isPole =
    Math.abs(planeOrigin.x) < _MathUtils.EPSILON10 &&
    Math.abs(planeOrigin.y) < _MathUtils.EPSILON10;
  const planeNormal = !isPole ? scratchPlaneNormal.copy(planeOrigin).normalize() : VECTOR3_UNIT_X;
  const planeYAxis = VECTOR3_UNIT_Z;
  const planeXAxis = scratchPlaneXAxis.copy(planeNormal).cross(planeYAxis);
  plane = scratchPlane.fromPointNormal(planeOrigin, planeNormal);

  const horizonCartesian = Ellipsoid.WGS84.cartographicToCartesian(
    [degrees(lonCenter + _MathUtils.PI_OVER_TWO), latitudeNearestToEquator, maximumHeight],
    scratchHorizonCartesian
  );
  const projectedPoint = plane.projectPointOntoPlane(
    horizonCartesian,
    scratchHorizonProjected
  ) as Vector3;
  maxX = projectedPoint.dot(planeXAxis);
  minX = -maxX;

  maxY = Ellipsoid.WGS84.cartographicToCartesian(
    [0.0, northDeg, fullyBelowEquator ? minimumHeight : maximumHeight],
    scratchMaxY
  ).z;
  minY = Ellipsoid.WGS84.cartographicToCartesian(
    [0.0, southDeg, fullyAboveEquator ? minimumHeight : maximumHeight],
    scratchMinY
  ).z;

  const farZ = Ellipsoid.WGS84.cartographicToCartesian(
    [eastDeg, latitudeNearestToEquator, maximumHeight],
    scratchZ
  );

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
    obb
  );
}

const scratchScale = new Vector3();

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
  const center = result.center;
  const halfAxes = result.halfAxes;
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

  planeOrigin = center.copy(planeOrigin);
  result.center = planeOrigin.add(centerOffset);
  result.halfAxes = halfAxes.multiplyByScale(scale, halfAxes);

  return result;
}
