// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Matrix3, Matrix4, Vector2, Vector3, degrees, radians, _MathUtils} from '@math.gl/core';
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
const scratchZ = new Vector3();

const VECTOR3_UNIT_X = new Vector3(1, 0, 0);
const VECTOR3_UNIT_Z = new Vector3(0, 0, 1);

export type GeodeticRegion = readonly [
  west: number,
  south: number,
  east: number,
  north: number,
  minimumHeight: number,
  maximumHeight: number
];

export type MakeOBBFromRegionOptions = {
  /** Longitude and latitude units. Defaults to radians, as in 3D Tiles regions. */
  units?: 'radians' | 'degrees';
  /** Affine transform from ellipsoid-fixed coordinates into the caller's world space. */
  transform?: Matrix4;
};

/**
 * Creates a conservative oriented bounding box for a geodetic region.
 *
 * Longitudes and latitudes are radians by default. An east longitude smaller than west
 * denotes the directed eastward interval crossing the antimeridian; equal longitudes denote
 * zero width unless the original endpoints differ by a full turn.
 * Heights use the ellipsoid's linear unit. Inputs and the supplied ellipsoid and transform are
 * never mutated.
 */
// eslint-disable-next-line max-statements
export function makeOBBFromRegion(
  region: readonly number[],
  ellipsoid: Ellipsoid = Ellipsoid.WGS84,
  options: MakeOBBFromRegionOptions = {}
): OrientedBoundingBox {
  if (!region || region.length !== 6 || region.some(value => !Number.isFinite(value))) {
    throw new Error('makeOBBFromRegion: region must contain exactly six finite numbers');
  }
  const unitScale = options.units === 'degrees' ? radians(1) : 1;
  const [rawWest, rawSouth, rawEast, rawNorth, minimumHeight, maximumHeight] = region;
  if (minimumHeight > maximumHeight) {
    throw new Error('makeOBBFromRegion: minimumHeight must not exceed maximumHeight');
  }
  const south = rawSouth * unitScale;
  const north = rawNorth * unitScale;
  const west = normalizeLongitude(rawWest * unitScale);
  let east = normalizeLongitude(rawEast * unitScale);
  // Preserve a complete directed turn, which would otherwise collapse when both endpoints
  // are normalized to the same longitude. Reversed boundaries retain Cesium/3D Tiles semantics.
  const directedSpan = rawEast * unitScale - rawWest * unitScale;
  if (directedSpan >= _MathUtils.TWO_PI - 1e-12) {
    east = west + _MathUtils.TWO_PI;
  }
  const latitudeTolerance = 1e-12;
  if (
    south > north ||
    south < -_MathUtils.PI_OVER_TWO - latitudeTolerance ||
    north > _MathUtils.PI_OVER_TWO + latitudeTolerance
  ) {
    throw new Error('makeOBBFromRegion: latitude must be within [-π/2, π/2] and south ≤ north');
  }
  // Avoid passing a tiny out-of-range value to the ellipsoid conversion at a boundary.
  const clampedSouth = Math.max(-_MathUtils.PI_OVER_TWO, Math.min(_MathUtils.PI_OVER_TWO, south));
  const clampedNorth = Math.max(-_MathUtils.PI_OVER_TWO, Math.min(_MathUtils.PI_OVER_TWO, north));
  return makeOBBFromNormalizedRegion(
    [west, clampedSouth, east, clampedNorth, minimumHeight, maximumHeight],
    ellipsoid,
    options.transform
  );
}

function normalizeLongitude(value: number): number {
  const normalized =
    ((((value + Math.PI) % _MathUtils.TWO_PI) + _MathUtils.TWO_PI) % _MathUtils.TWO_PI) - Math.PI;
  return normalized === -Math.PI && value > 0 ? Math.PI : normalized;
}

function makeOBBFromNormalizedRegion(
  region: GeodeticRegion,
  ellipsoid: Ellipsoid,
  transform?: Matrix4
): OrientedBoundingBox {
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

    const tangentPoint = ellipsoid.cartographicToCartesian(tangentPointCartographic);
    const ellipsoidTangentPlane = new EllipsoidTangentPlane(tangentPoint, ellipsoid);

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

    const perimeterCartesianNC = ellipsoid.cartographicToCartesian(
      perimeterCartographicNC,
      scratchPerimeterCartesianNC
    );
    let perimeterCartesianNW = ellipsoid.cartographicToCartesian(
      perimeterCartographicNW,
      scratchPerimeterCartesianNW
    );
    const perimeterCartesianCW = ellipsoid.cartographicToCartesian(
      perimeterCartographicCW,
      scratchPerimeterCartesianCW
    );
    let perimeterCartesianSW = ellipsoid.cartographicToCartesian(
      perimeterCartographicSW,
      scratchPerimeterCartesianSW
    );
    const perimeterCartesianSC = ellipsoid.cartographicToCartesian(
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
    perimeterCartesianNW = ellipsoid.cartographicToCartesian(
      perimeterCartographicNW,
      scratchPerimeterCartesianNW
    );
    perimeterCartesianSW = ellipsoid.cartographicToCartesian(
      perimeterCartographicSW,
      scratchPerimeterCartesianSW
    );

    plane = ellipsoidTangentPlane.plane;
    minZ = Math.min(
      plane.getPointDistance(perimeterCartesianNW),
      plane.getPointDistance(perimeterCartesianSW)
    );
    maxZ = maximumHeight;

    return applyTransform(
      fromPlaneExtents(
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
      ),
      transform
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

  const planeOrigin = ellipsoid.cartographicToCartesian(
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

  const horizonCartesian = ellipsoid.cartographicToCartesian(
    [degrees(lonCenter + _MathUtils.PI_OVER_TWO), latitudeNearestToEquator, maximumHeight],
    scratchHorizonCartesian
  );
  const projectedPoint = plane.projectPointOntoPlane(
    horizonCartesian,
    scratchHorizonProjected
  ) as Vector3;
  maxX = projectedPoint.dot(planeXAxis);
  minX = -maxX;

  const northHeight = fullyBelowEquator ? minimumHeight : maximumHeight;
  const southHeight = fullyAboveEquator ? minimumHeight : maximumHeight;
  maxY = latitudeZExtent(ellipsoid, northDeg, northHeight, true);
  minY = latitudeZExtent(ellipsoid, southDeg, southHeight, false);

  const farZ = ellipsoid.cartographicToCartesian(
    [eastDeg, latitudeNearestToEquator, maximumHeight],
    scratchZ
  );

  minZ = plane.getPointDistance(farZ);
  maxZ = 0.0;

  return applyTransform(
    fromPlaneExtents(
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
    ),
    transform
  );
}

function applyTransform(obb: OrientedBoundingBox, transform?: Matrix4): OrientedBoundingBox {
  if (!transform) return obb;
  // A general affine transform turns an OBB into a parallelepiped. Refit its eight
  // corners to an axis-aligned OBB so culling methods that assume orthogonal axes remain safe.
  const axes = [0, 1, 2].map(column => obb.halfAxes.getColumn(column, new Vector3()));
  const center = transform.transformAsPoint(obb.center) as number[];
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  for (let mask = 0; mask < 8; mask++) {
    const corner = new Vector3(center);
    for (let axis = 0; axis < 3; axis++) {
      const transformedAxis = transform.transformAsVector(axes[axis]) as number[];
      corner.add(new Vector3(transformedAxis).scale((mask & (1 << axis)) === 0 ? -1 : 1));
    }
    for (let component = 0; component < 3; component++) {
      minimum[component] = Math.min(minimum[component], corner[component]);
      maximum[component] = Math.max(maximum[component], corner[component]);
    }
  }
  obb.center.copy(minimum).add(maximum).scale(0.5);
  const halfSize = new Vector3(maximum).subtract(minimum).scale(0.5);
  obb.halfAxes = new Matrix3().set(halfSize.x, 0, 0, 0, halfSize.y, 0, 0, 0, halfSize.z);
  return obb;
}

function latitudeZExtent(
  ellipsoid: Ellipsoid,
  latitude: number,
  height: number,
  maximum: boolean
): number {
  let extent = maximum ? -Infinity : Infinity;
  // A triaxial ellipsoid's fixed-latitude extrema occur at a principal longitude.
  for (const longitude of [0, 90, 180, 270]) {
    const z = ellipsoid.cartographicToCartesian([longitude, latitude, height], scratchMaxY).z;
    extent = maximum ? Math.max(extent, z) : Math.min(extent, z);
  }
  return extent;
}

/** Helper function for makeOBBFromRegion(). */
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

  const centerOffset = scratchOffset
    .set((minimumX + maximumX) / 2.0, (minimumY + maximumY) / 2.0, (minimumZ + maximumZ) / 2.0)
    .transformByMatrix3(halfAxes);

  const scaleX = (maximumX - minimumX) / 2.0;
  const scaleY = (maximumY - minimumY) / 2.0;
  const scaleZ = (maximumZ - minimumZ) / 2.0;
  halfAxes[0] *= scaleX;
  halfAxes[1] *= scaleX;
  halfAxes[2] *= scaleX;
  halfAxes[3] *= scaleY;
  halfAxes[4] *= scaleY;
  halfAxes[5] *= scaleY;
  halfAxes[6] *= scaleZ;
  halfAxes[7] *= scaleZ;
  halfAxes[8] *= scaleZ;

  center.copy(planeOrigin).add(centerOffset);

  return result;
}
