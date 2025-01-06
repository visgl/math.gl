// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {tapeEquals} from 'test/utils/tape-assertions';
import {makeOrientedBoundingBoxFromRegion} from '@math.gl/culling';
import {radians, Vector3} from '@math.gl/core';

test('makeOrientedBoundingBoxFromRegion zeros', (t) => {
    const region = [0, 0, 0, 0, 0, 0];
    const obb = makeOrientedBoundingBoxFromRegion(region);
    tapeEquals(t, obb.center, new Vector3(6378137, 0, 0));
    tapeEquals(t, obb.halfAxes.getColumn(0), new Vector3(0, 0, 0));
    tapeEquals(t, obb.halfAxes.getColumn(1), new Vector3(0, 0, 0));
    tapeEquals(t, obb.halfAxes.getColumn(2), new Vector3(0, 0, 0));
    t.end();
});

test('makeOrientedBoundingBoxFromRegion full extent', (t) => {
    const region = [radians(-180), radians(-90), radians(180), radians(90), 0, 0];
    const obb = makeOrientedBoundingBoxFromRegion(region);
    tapeEquals(t, obb.center, new Vector3(0, 0, 0));
    tapeEquals(t, obb.halfAxes.getColumn(0), new Vector3(0, 6378137, 0));
    tapeEquals(t, obb.halfAxes.getColumn(1), new Vector3(0, 0, 6356752.31424518));
    tapeEquals(t, obb.halfAxes.getColumn(2), new Vector3(6378137, 0, 0));
    t.end();
});

//TODO: add more tests