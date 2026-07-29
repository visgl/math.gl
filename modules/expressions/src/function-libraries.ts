// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */

import {
  acos,
  asin,
  atan,
  clamp,
  cos,
  degrees,
  lerp,
  normalizeAngle,
  radians,
  safeMod,
  sin,
  tan,
  toDegrees,
  toRadians,
} from "@math.gl/core";
import { Ellipsoid, isWGS84 } from "@math.gl/geospatial";

export type ExpressionFunction = (...args: any[]) => any;
export type ExpressionFunctionLibrary = Record<string, ExpressionFunction>;

export type ExpressionEvaluationOptions = {
  libraries?: ExpressionFunctionLibrary[];
};

export const BASIC_MATH_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  abs: Math.abs,
  acos,
  asin,
  atan,
  ceil: Math.ceil,
  clamp,
  cos,
  degrees,
  exp: Math.exp,
  floor: Math.floor,
  lerp,
  log: Math.log,
  max: Math.max,
  min: Math.min,
  normalizeAngle,
  pow: Math.pow,
  radians,
  round: Math.round,
  safeMod,
  sign: Math.sign,
  sin,
  sqrt: Math.sqrt,
  tan,
  toDegrees,
  toRadians,
  trunc: Math.trunc,
};

export const GEOSPATIAL_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  cartesianToCartographic: (cartesian: number[], result?: number[]) =>
    Ellipsoid.WGS84.cartesianToCartographic(cartesian, result),
  cartographicToCartesian: (cartographic: number[], result?: number[]) =>
    Ellipsoid.WGS84.cartographicToCartesian(cartographic, result),
  eastNorthUpToFixedFrame: (origin: number[], result?: number[]) =>
    Ellipsoid.WGS84.eastNorthUpToFixedFrame(origin, result),
  geodeticSurfaceNormal: (cartesian: number[], result?: number[]) =>
    Ellipsoid.WGS84.geodeticSurfaceNormal(cartesian, result),
  geodeticSurfaceNormalCartographic: (
    cartographic: number[],
    result?: number[],
  ) => Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(cartographic, result),
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
    Ellipsoid.WGS84.transformPositionToScaledSpace(position, result),
};

export function mergeFunctionLibraries(
  context: Record<string, unknown>,
  options?: ExpressionEvaluationOptions,
): Record<string, unknown> {
  if (!options?.libraries?.length) {
    return context;
  }

  return Object.assign({}, ...options.libraries, context);
}
