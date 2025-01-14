// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Vector3, normalizeAngle, _MathUtils} from '@math.gl/core'

/** A two dimensional region specified as longitude and latitude coordinates. */
export class GeoRectangle {
    west: number;
    south: number;
    east: number;
    north: number;

    /**
     * Creates a new two dimensional region specified as longitude and latitude coordinates.
     *
     * @param [west=0.0] The westernmost longitude, in radians, in the range [-Pi, Pi].
     * @param [south=0.0] The southernmost latitude, in radians, in the range [-Pi/2, Pi/2].
     * @param [east=0.0] The easternmost longitude, in radians, in the range [-Pi, Pi].
     * @param [north=0.0] The northernmost latitude, in radians, in the range [-Pi/2, Pi/2].
     */
    constructor(west: number = 0.0, south: number = 0.0, east: number = 0.0, north: number = 0.0) {
        this.west = west;
        this.south = south;
        this.east = east;
        this.north = north;
    }

    /**
     * Computes the center of a rectangle.
     *
     * @param rectangle The rectangle for which to find the center
     * @param [result] The object onto which to store the result.
     * @returns The modified result parameter or a new Cartographic instance if none was provided.
     */
    static center(rectangle: GeoRectangle, result?: Vector3) {
        if (!result)
            result = new Vector3()

        let east = rectangle.east;
        const west = rectangle.west;

        if (east < west) {
            east += _MathUtils.TWO_PI;
        }

        const longitude = normalizeAngle((west + east) * 0.5, 'negative-pi-to-pi');
        const latitude = (rectangle.south + rectangle.north) * 0.5;

        result.x = longitude;
        result.y = latitude;
        result.z = 0.0;
        return result;
    };

    get width() {
        let east = this.east;
        const west = this.west;

        if (east < west) {
            east += _MathUtils.TWO_PI;
        }
        return east - west;
    }
}