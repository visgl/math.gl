// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Vector2, Vector3, Matrix4} from '@math.gl/core';
import {Plane} from '@math.gl/culling';
import {Ellipsoid} from './ellipsoid';

const scratchOrigin = new Vector3();
const scratchCart3 = new Vector3();
const scratchEastNorthUp = new Matrix4();
const scratchProjectPointOntoPlaneCartesian3 = new Vector3();

/** A two-dimensional east-north plane tangent to the WGS84 ellipsoid. */
export class EllipsoidTangentPlane {
  private _origin: Vector3;
  private _xAxis: Vector3;
  private _yAxis: Vector3;
  private _plane: Plane;

  /**
   * Creates a new plane tangent to the WGS84 ellipsoid at the provided origin.
   * If origin is not on the surface of the ellipsoid, its surface projection will be used.
   *
   * @param origin A nonzero WGS84 Cartesian point.
   */
  constructor(origin: number[]) {
    const originOnSurface = Ellipsoid.WGS84.scaleToGeodeticSurface(origin, scratchOrigin);

    const eastNorthUp = Ellipsoid.WGS84.eastNorthUpToFixedFrame(
      originOnSurface,
      scratchEastNorthUp
    );

    this._origin = new Vector3(originOnSurface);
    this._xAxis = new Vector3(scratchCart3.from(eastNorthUp.getColumn(0)));
    this._yAxis = new Vector3(scratchCart3.from(eastNorthUp.getColumn(1)));
    const normal = new Vector3(scratchCart3.from(eastNorthUp.getColumn(2)));

    this._plane = new Plane().fromPointNormal(this._origin, normal);
  }

  /**
   * Computes the projection of the provided 3D position onto the 2D plane, along the plane normal.
   *
   * @param cartesian The WGS84 Cartesian point to project.
   * @param result The optional object in which to store the local east-north coordinates.
   * @returns The supplied result or a new Vector2.
   */
  projectPointToNearestOnPlane(cartesian: Vector3, result?: Vector2): Vector2 {
    if (!result) result = new Vector2();

    const intersectionPoint = this._plane.projectPointOntoPlane(
      cartesian,
      scratchProjectPointOntoPlaneCartesian3
    );

    const v = intersectionPoint.subtract(this._origin);
    const x = this._xAxis.dot(v);
    const y = this._yAxis.dot(v);

    result.x = x;
    result.y = y;
    return result;
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
