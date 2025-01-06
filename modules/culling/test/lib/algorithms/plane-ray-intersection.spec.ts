// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {tapeEquals} from 'test/utils/tape-assertions';
import {intersectPlaneWithRay, Plane, Ray} from '@math.gl/culling';
import {Vector3} from '@math.gl/core';

const VECTOR3_UNIT_X = new Vector3(1.0, 0.0, 0.0);

test('rayPlane intersects', (t) => {
    const ray = new Ray(
        new Vector3(2.0, 0.0, 0.0),
        new Vector3(-1.0, 0.0, 0.0),
    );
    const plane = new Plane(VECTOR3_UNIT_X, -1.0);

    const intersectionPoint = intersectPlaneWithRay(plane, ray);
    tapeEquals(t, intersectionPoint, new Vector3(1.0, 0.0, 0.0));
    t.end();
});

test('rayPlane misses', (t) => {
    const ray = new Ray(
        new Vector3(2.0, 0.0, 0.0),
        new Vector3(1.0, 0.0, 0.0),
    );
    const plane = new Plane(VECTOR3_UNIT_X, -1.0);

    const intersectionPoint = intersectPlaneWithRay(plane, ray);
    t.equals(intersectionPoint, undefined);
    t.end();
});

test('rayPlane misses (parallel)', (t) => {
    const ray = new Ray(
        new Vector3(2.0, 0.0, 0.0),
        new Vector3(0.0, 1.0, 0.0),
    );
    const plane = new Plane(VECTOR3_UNIT_X, -1.0);

    const intersectionPoint = intersectPlaneWithRay(plane, ray);
    t.equals(intersectionPoint, undefined);
    t.end();
});