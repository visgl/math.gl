// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {tapeEquals} from 'test/utils/tape-assertions';
import {EllipsoidTangentPlane} from '@math.gl/culling';
import {Vector2, Vector3} from '@math.gl/core';

const VECTOR3_UNIT_X = new Vector3(1.0, 0.0, 0.0);

test('EllipsoidTangentPlane#constructor sets expected values', (t) => {
    const tangentPlane = new EllipsoidTangentPlane(VECTOR3_UNIT_X);
    tapeEquals(t, tangentPlane.origin, new Vector3(6378137.0, 0.0, 0.0));
    t.end();
});

test('EllipsoidTangentPlane#projectPointToNearestOnPlane works', (t) => {
    const tangentPlane = new EllipsoidTangentPlane(VECTOR3_UNIT_X);

    const inputAndResults = [
        {input: new Vector3(1.0, 0.0, 0.0), result: new Vector2(0.0, 0.0)},
        {input: new Vector3(0.0, 0.0, 0.0), result: new Vector2(0.0, 0.0)},
        {input: new Vector3(-1.0, 0.0, 0.0), result: new Vector2(0.0, 0.0)},
        {input: new Vector3(1.0, 0.0, 1.0), result: new Vector2(0.0, 1.0)},
        {input: new Vector3(0.0, 1.0, 0.0), result: new Vector2(1.0, 0.0)},
        {input: new Vector3(0.0, 1.0, 1.0), result: new Vector2(1.0, 1.0)},
    ];

    for (const {input, result} of inputAndResults) {
        const output = tangentPlane.projectPointToNearestOnPlane(input);
        tapeEquals(t, output, result);
    }
    t.end();
});