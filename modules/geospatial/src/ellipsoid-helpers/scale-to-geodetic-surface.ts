// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Derived from Cesium. See the repository LICENSE for upstream attribution and Apache-2.0 terms. Original math.gl follow-up replaces radial/Newton approximation with a safeguarded nearest-point solve; retained commit adapter derives from Cesium.

/* eslint-disable */
import {isArray} from '@math.gl/core';
import type {Ellipsoid} from '../ellipsoid';

import {nearestSurface} from './nearest-surface';

const surface = {x: 0, y: 0, z: 0};

// Scales the provided Cartesian position along the geodetic surface normal
// so that it is on the surface of this ellipsoid.  If the position is
// at the center of the ellipsoid, this function returns undefined.
export function scaleToGeodeticSurface(
  cartesian: number[],
  ellipsoid: Ellipsoid,
  result: number[] = []
): number[] {
  const object = cartesian as unknown as {x: number; y: number; z: number};
  const x = 'x' in cartesian ? object.x : cartesian[0];
  const y = 'x' in cartesian ? object.y : cartesian[1];
  const z = 'x' in cartesian ? object.z : cartesian[2];
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return undefined;
  // Keep the public adapter's established finite squared-coordinate domain.
  if (!Number.isFinite(x * x + y * y + z * z)) return undefined;
  const {radii} = ellipsoid;
  if (!nearestSurface(x, y, z, radii.x, radii.y, radii.z, surface)) return undefined;
  return writeResult(result, surface.x, surface.y, surface.z);
}

/** Original numeric commit: application setters cannot overwrite remaining scratch ordinates. */
export function writeResult(result: number[], x: number, y: number, z: number): number[] {
  if (isArray(result)) {
    result[0] = x;
    result[1] = y;
    result[2] = z;
  } else {
    const point = result as unknown as {x: number; y: number; z: number};
    point.x = x;
    point.y = y;
    point.z = z;
  }
  return result;
}
