// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {tapeEquals} from 'test/utils/tape-assertions';
import {Vector3, radians, _MathUtils} from '@math.gl/core';
import {GeoRectangle} from '@math.gl/geospatial';

const west = -0.9;
const south = 0.5;
const east = 1.4;
const north = 1.0;
const center = new Vector3((west + east) / 2.0, (south + north) / 2.0, 0.0);

test('GeoRectangle#default constructor sets expected values.', (t) => {
    const rectangle = new GeoRectangle();
    t.equals(rectangle.west, 0.0);
    t.equals(rectangle.south, 0.0);
    t.equals(rectangle.north, 0.0);
    t.equals(rectangle.east, 0.0);
    t.end();
});

test('GeoRectangle#constructor sets expected parameter values.', (t) => {
    const rectangle = new GeoRectangle(west, south, east, north);
    t.equals(rectangle.west, west);
    t.equals(rectangle.south, south);
    t.equals(rectangle.north, north);
    t.equals(rectangle.east, east);
    t.end();
});

test('GeoRectangle#width works', (t) => {
    let rectangle = new GeoRectangle(west, south, east, north);
    t.equals(rectangle.width, east - west);

    rectangle = new GeoRectangle(2.0, -1.0, -2.0, 1.0);
    t.equals(rectangle.width, rectangle.east - rectangle.west + _MathUtils.TWO_PI);
    t.end();
});

test('GeoRectangle#center works', (t) => {
    const rectangle = new GeoRectangle(west, south, east, north);
    const returnedResult = GeoRectangle.center(rectangle);
    tapeEquals(t, returnedResult, center);
    t.end();
});

test('GeoRectangle#center works across IDL', (t) => {
    const inputAndResults = [
        {input: [170, 0, -170, 0], result: [180, 0]},
        {input: [160, 0, -170, 0], result: [175, 0]},
        {input: [170, 0, -160, 0], result: [-175, 0]},
        {input: [160, 0, 140, 0], result: [-30, 0]},
    ]

    for (const {input, result} of inputAndResults) {
        const rectangle = new GeoRectangle(...radians(input));
        const returnedResult = GeoRectangle.center(rectangle);
        tapeEquals(t, returnedResult, new Vector3(...radians(result), 0));
    }

    t.end();
});