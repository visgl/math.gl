// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */

import {eastNorthUpToFixedFrame} from './ellipsoid-transforms';
import {Ellipsoid} from './ellipsoid';
import {isWGS84} from './type-utils';
import {toDegrees, toRadians} from '@math.gl/core';
import type {ExpressionFunctionLibrary} from '@math.gl/core';

/** WGS84 ellipsoid helpers available to the expression evaluator. */
export const GEOSPATIAL_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  cartesianToCartographic: (cartesian: number[], result?: number[]) =>
    Ellipsoid.WGS84.cartesianToCartographic(cartesian, result),
  cartographicToCartesian: (cartographic: number[], result?: number[]) =>
    Ellipsoid.WGS84.cartographicToCartesian(cartographic, result),
  eastNorthUpToFixedFrame: (origin: number[], result?: number[]) =>
    eastNorthUpToFixedFrame(Ellipsoid.WGS84, origin, result),
  geodeticSurfaceNormal: (cartesian: number[], result?: number[]) =>
    Ellipsoid.WGS84.geodeticSurfaceNormal(cartesian, result),
  geodeticSurfaceNormalCartographic: (cartographic: number[], result?: number[]) =>
    Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(cartographic, result),
  isWGS84,
  scaleToGeocentricSurface: (cartesian: number[], result?: number[]) =>
    Ellipsoid.WGS84.scaleToGeocentricSurface(cartesian, result),
  scaleToGeodeticSurface: (cartesian: number[], result?: number[]) =>
    Ellipsoid.WGS84.scaleToGeodeticSurface(cartesian, result),
  toDegrees,
  toRadians,
  transformPositionFromScaledSpace: (position: number[], result?: number[]) =>
    Ellipsoid.WGS84.transformPositionFromScaledSpace(position, result),
  transformPositionToScaledSpace: (position: number[], result?: number[]) =>
    Ellipsoid.WGS84.transformPositionToScaledSpace(position, result)
};
