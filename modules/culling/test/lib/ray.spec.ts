// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {tapeEquals} from 'test/utils/tape-assertions';
import {Ray} from "@math.gl/culling";
import {Vector3} from "@math.gl/core";

const VECTOR3_ZERO = new Vector3(0.0, 0.0, 0.0);
const VECTOR3_UNIT_X = new Vector3(1.0, 0.0, 0.0);
const VECTOR3_UNIT_Y = new Vector3(0.0, 1.0, 0.0);

test("Ray#default constructor create zero valued Ray", (t) => {
    const ray = new Ray();
    tapeEquals(t, ray.origin, VECTOR3_ZERO);
    tapeEquals(t, ray.direction, VECTOR3_ZERO);
    t.end();
});

test("Ray#constructor sets expected properties", (t) => {
    const origin = VECTOR3_UNIT_Y;
    const direction = VECTOR3_UNIT_X;
    const ray = new Ray(origin, direction);
    tapeEquals(t, ray.origin, VECTOR3_UNIT_Y);
    tapeEquals(t, ray.direction, VECTOR3_UNIT_X);
    t.end();
});

test("Ray#constructor normalizes direction", (t) => {
    const origin = VECTOR3_UNIT_Y;
    const direction = new Vector3(18., 0, 0);
    const ray = new Ray(origin, direction);
    tapeEquals(t, ray.origin, VECTOR3_UNIT_Y);
    tapeEquals(t, ray.direction, VECTOR3_UNIT_X);
    t.end();
});