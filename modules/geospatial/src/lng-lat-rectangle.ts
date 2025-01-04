// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Vector3, normalizeAngle, _MathUtils} from '@math.gl/core';

/** A two dimensional region specified as longitude and latitude coordinates. */
export class LngLatRectangle {
  west: number;
  south: number;
  east: number;
  north: number;

  /**
   * Creates a new two dimensional region specified as longitude and latitude coordinates.
   *
   * @param west The westernmost longitude, in radians, in the range [-Pi, Pi].
   * @param south The southernmost latitude, in radians, in the range [-Pi/2, Pi/2].
   * @param east The easternmost longitude, in radians, in the range [-Pi, Pi].
   * @param north The northernmost latitude, in radians, in the range [-Pi/2, Pi/2].
   */
  constructor(west: number, south: number, east: number, north: number) {
    this.west = west;
    this.south = south;
    this.east = east;
    this.north = north;
  }

  /**
   * Computes the center of a rectangle.
   *
   * @param rectangle The rectangle for which to find the center
   * @param  [result] The object onto which to store the result.
   * @returns  The modified result parameter or a new Cartographic instance if none was provided.
   */
  static center(rectangle: LngLatRectangle, result?: Vector3): Vector3 {
    if (!result) result = new Vector3();

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
  }

  get width() {
    let east = this.east;
    const west = this.west;

    if (east < west) {
      east += _MathUtils.TWO_PI;
    }
    return east - west;
  }
}
