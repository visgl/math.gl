// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Vector2, Vector3, Matrix4} from '@math.gl/core';
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import {Ellipsoid} from '@math.gl/geospatial';
import {Plane} from './plane';
import {Ray} from './ray';

const scratchOrigin = new Vector3();
const scratchCart3 = new Vector3();
const scratchEastNorthUp = new Matrix4();
const scratchPlane = new Plane();

const scratchProjectPointOntoPlaneRay = new Ray();
const scratchProjectPointOntoPlaneCartesian3 = new Vector3();
const scratchDirection = new Vector3();

/** A plane tangent to the WGS84 ellipsoid at the provided origin */
export class EllipsoidTangentPlane {
    private _origin: Vector3;
    private _xAxis: Vector3;
    private _yAxis: Vector3;
    private _plane: Plane;

    /**
     * Creates a new plane tangent to the WGS84 ellipsoid at the provided origin.
     * If origin is not on the surface of the ellipsoid, it's surface projection will be used.
     *
     * @param {Cartesian3} origin The point on the surface of the ellipsoid where the tangent plane touches.
     */
    constructor(origin: number[]) {
        origin = Ellipsoid.WGS84.scaleToGeodeticSurface(origin, scratchOrigin);

        const eastNorthUp = Ellipsoid.WGS84.eastNorthUpToFixedFrame(origin, scratchEastNorthUp);

        this._origin = origin as Vector3;
        this._xAxis = new Vector3(scratchCart3.from(eastNorthUp.getColumn(0)));
        this._yAxis = new Vector3(scratchCart3.from(eastNorthUp.getColumn(1)));
        const normal = new Vector3(scratchCart3.from(eastNorthUp.getColumn(2)));

        this._plane = scratchPlane.fromPointNormal(origin, normal);
    }

    /**
     * Computes the projection of the provided 3D position onto the 2D plane, along the plane normal.
     *
     * @param {Vector3} cartesian The point to project.
     * @param {Vector2} [result] The object onto which to store the result.
     * @returns {Vector2} The modified result parameter or a new Cartesian2 instance if none was provided.
     */
    projectPointToNearestOnPlane (cartesian: Vector3, result?: Vector2): Vector2 {
        if (!result)
            result = new Vector2();

        const plane = this._plane;

        const ray = scratchProjectPointOntoPlaneRay;
        scratchProjectPointOntoPlaneRay.origin = cartesian;
        scratchProjectPointOntoPlaneRay.direction = scratchDirection.copy(plane.normal);

        let intersectionPoint = plane.intersectWithRay(ray, scratchProjectPointOntoPlaneCartesian3);

        if (!intersectionPoint) {
            ray.direction = ray.direction.negate();
            intersectionPoint = plane.intersectWithRay(ray, scratchProjectPointOntoPlaneCartesian3);
        }

        const v = intersectionPoint.subtract(this._origin);
        const x = this._xAxis.dot(v);
        const y = this._yAxis.dot(v);

        result.x = x;
        result.y = y;
        return result;
    }

    get plane() {
        return this._plane;
    }

    get origin() {
        return this._origin;
    }

    get xAxis() {
        return this._xAxis;
    }

    get yAxis() {
        return this._yAxis;
    }

    get zAxis() {
        return this._plane.normal;
    }
}