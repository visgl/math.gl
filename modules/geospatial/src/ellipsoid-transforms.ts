// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Extracted Cesium-derived frame adapters; see ../LICENSE for attribution.

import {Matrix4} from '@math.gl/core';
import type {NumericArray} from '@math.gl/core';
import type {Ellipsoid} from './ellipsoid';
import {localFrameToFixedFrame as computeLocalFrame} from './ellipsoid-helpers/ellipsoid-transform';
import type {AxisDirection} from './ellipsoid-helpers/ellipsoid-transform';

export type {AxisDirection} from './ellipsoid-helpers/ellipsoid-transform';

/** Compute an east-north-up frame at a Cartesian origin on the given ellipsoid. */
export function eastNorthUpToFixedFrame(
  ellipsoid: Ellipsoid,
  origin: Readonly<NumericArray>,
  result?: Matrix4
): Matrix4;
export function eastNorthUpToFixedFrame<T extends number[]>(
  ellipsoid: Ellipsoid,
  origin: Readonly<NumericArray>,
  result: T
): T;
export function eastNorthUpToFixedFrame(
  ellipsoid: Ellipsoid,
  origin: Readonly<NumericArray>,
  result = new Matrix4()
): number[] {
  return computeLocalFrame(ellipsoid, 'east', 'north', 'up', origin, result);
}

/** Compute a frame with the specified axes at a Cartesian origin. */
export function localFrameToFixedFrame(
  ellipsoid: Ellipsoid,
  firstAxis: AxisDirection,
  secondAxis: AxisDirection,
  thirdAxis: AxisDirection,
  origin: Readonly<NumericArray>,
  result?: Matrix4
): Matrix4;
export function localFrameToFixedFrame<T extends number[]>(
  ellipsoid: Ellipsoid,
  firstAxis: AxisDirection,
  secondAxis: AxisDirection,
  thirdAxis: AxisDirection,
  origin: Readonly<NumericArray>,
  result: T
): T;
// eslint-disable-next-line max-params
export function localFrameToFixedFrame(
  ellipsoid: Ellipsoid,
  firstAxis: AxisDirection,
  secondAxis: AxisDirection,
  thirdAxis: AxisDirection,
  origin: Readonly<NumericArray>,
  result = new Matrix4()
): number[] {
  return computeLocalFrame(ellipsoid, firstAxis, secondAxis, thirdAxis, origin, result);
}
