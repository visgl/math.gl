// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Derived from Cesium. See the repository LICENSE for upstream attribution and Apache-2.0 terms. Original math.gl follow-up bounds Newton iteration and commits numeric components without a temporary array.

/* eslint-disable */
import {Vector3, _MathUtils, isArray} from '@math.gl/core';
import type {Ellipsoid} from '../ellipsoid';

const scratchVector = new Vector3();
const scaleToGeodeticSurfaceIntersection = new Vector3();
const scaleToGeodeticSurfaceGradient = new Vector3();

// Scales the provided Cartesian position along the geodetic surface normal
// so that it is on the surface of this ellipsoid.  If the position is
// at the center of the ellipsoid, this function returns undefined.
export function scaleToGeodeticSurface(
  cartesian: number[],
  ellipsoid: Ellipsoid,
  result: number[] = []
): number[] {
  const {oneOverRadii, oneOverRadiiSquared, centerToleranceSquared} = ellipsoid;

  // Snapshot numeric inputs before touching scratch or debug-mode vectors.
  const object = cartesian as unknown as {x: number; y: number; z: number};
  const positionX = 'x' in cartesian ? object.x : cartesian[0];
  const positionY = 'x' in cartesian ? object.y : cartesian[1];
  const positionZ = 'x' in cartesian ? object.z : cartesian[2];
  if (!Number.isFinite(positionX) || !Number.isFinite(positionY) || !Number.isFinite(positionZ)) {
    return undefined;
  }
  scratchVector.set(positionX, positionY, positionZ);

  const oneOverRadiiX = oneOverRadii.x;
  const oneOverRadiiY = oneOverRadii.y;
  const oneOverRadiiZ = oneOverRadii.z;

  const x2 = positionX * positionX * oneOverRadiiX * oneOverRadiiX;
  const y2 = positionY * positionY * oneOverRadiiY * oneOverRadiiY;
  const z2 = positionZ * positionZ * oneOverRadiiZ * oneOverRadiiZ;

  // Compute the squared ellipsoid norm.
  const squaredNorm = x2 + y2 + z2;
  const ratio = Math.sqrt(1.0 / squaredNorm);

  // When very close to center or at center
  if (!Number.isFinite(ratio) || !Number.isFinite(squaredNorm)) {
    return undefined;
  }

  // As an initial approximation, assume that the radial intersection is the projection point.
  const intersection = scaleToGeodeticSurfaceIntersection;
  intersection.set(positionX, positionY, positionZ).scale(ratio);

  // If the position is near the center, the iteration will not converge.
  if (squaredNorm < centerToleranceSquared) {
    return writeResult(result, intersection.x, intersection.y, intersection.z);
  }

  const oneOverRadiiSquaredX = oneOverRadiiSquared.x;
  const oneOverRadiiSquaredY = oneOverRadiiSquared.y;
  const oneOverRadiiSquaredZ = oneOverRadiiSquared.z;

  // Use the gradient at the intersection point in place of the true unit normal.
  // The difference in magnitude will be absorbed in the multiplier.
  const gradient = scaleToGeodeticSurfaceGradient;
  gradient.set(
    intersection.x * oneOverRadiiSquaredX * 2.0,
    intersection.y * oneOverRadiiSquaredY * 2.0,
    intersection.z * oneOverRadiiSquaredZ * 2.0
  );

  // Compute the initial guess at the normal vector multiplier, lambda.
  let lambda = ((1.0 - ratio) * scratchVector.len()) / (0.5 * gradient.len());
  let correction = 0.0;

  let xMultiplier;
  let yMultiplier;
  let zMultiplier;
  let func;

  // Bound the original Newton iteration; unsupported inputs leave caller output untouched.
  for (let iteration = 0; iteration < 64; iteration++) {
    lambda -= correction;

    xMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredX);
    yMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredY);
    zMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredZ);

    const xMultiplier2 = xMultiplier * xMultiplier;
    const yMultiplier2 = yMultiplier * yMultiplier;
    const zMultiplier2 = zMultiplier * zMultiplier;

    const xMultiplier3 = xMultiplier2 * xMultiplier;
    const yMultiplier3 = yMultiplier2 * yMultiplier;
    const zMultiplier3 = zMultiplier2 * zMultiplier;

    func = x2 * xMultiplier2 + y2 * yMultiplier2 + z2 * zMultiplier2 - 1.0;

    if (!Number.isFinite(func)) return undefined;
    if (Math.abs(func) <= _MathUtils.EPSILON12) {
      // Numeric components avoid the former temporary multiplier array.
      return writeResult(
        result,
        positionX * xMultiplier,
        positionY * yMultiplier,
        positionZ * zMultiplier
      );
    }

    // "denominator" here refers to the use of this expression in the velocity and acceleration
    // computations in the sections to follow.
    const denominator =
      x2 * xMultiplier3 * oneOverRadiiSquaredX +
      y2 * yMultiplier3 * oneOverRadiiSquaredY +
      z2 * zMultiplier3 * oneOverRadiiSquaredZ;

    const derivative = -2.0 * denominator;

    if (!Number.isFinite(derivative) || derivative === 0) return undefined;
    correction = func / derivative;
    if (!Number.isFinite(correction)) return undefined;
  }
  return undefined;
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
