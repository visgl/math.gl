// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Ray} from '../ray';
import {Plane} from "../plane";
import {Vector3, _MathUtils} from "@math.gl/core";

/**
 * Computes the intersection of a plane and a ray.
 *
 * @param ray The plane.
 * @param ray The ray.
 * @param [result] The object onto which to store the result.
 * @returns The intersection point or undefined if there is no intersections.
 */
export function intersectPlaneWithRay(plane: Plane, ray: Ray, result?: Vector3): Vector3 {
    if (!result)
        result = new Vector3()

    const origin = ray.origin;
    const direction = ray.direction;
    const normal = plane.normal;
    const denominator = normal.dot(direction);

    if (Math.abs(denominator) < _MathUtils.EPSILON15) {
        return undefined;
    }

    const t = (-plane.distance - normal.dot(origin)) / denominator;

    if (t < 0) {
        return undefined;
    }

    result = result.copy(direction).multiplyByScalar(t);
    return origin.add(result);
}