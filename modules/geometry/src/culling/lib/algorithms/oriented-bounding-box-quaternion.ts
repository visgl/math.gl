// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Extracted Cesium-derived OBB quaternion operations; see ../../../../LICENSE for attribution.

import {Matrix3, Quaternion, Vector3} from '@math.gl/core';
import {OrientedBoundingBox} from '../bounding-volumes/oriented-bounding-box';

/**
 * Return a unit rotation quaternion for the box, excluding half-axis scale.
 * Reflected half axes use an equivalent right-handed basis without mutating the box.
 */
export function getOrientedBoundingBoxQuaternion(box: OrientedBoundingBox): Quaternion {
  const x = new Vector3(box.halfAxes.getColumn(0)).normalize();
  const y = new Vector3(box.halfAxes.getColumn(1)).normalize();
  const z = new Vector3(box.halfAxes.getColumn(2)).normalize();
  // Reversing one half-axis preserves the box while removing a reflection,
  // which cannot be represented by a rotation quaternion.
  if (box.halfAxes.determinant() < 0) z.negate();
  return new Quaternion().fromMatrix3(new Matrix3([...x, ...y, ...z])).normalize();
}

/** Construct a box from its center, half sizes and quaternion, optionally reusing a box. */
export function makeOrientedBoundingBoxFromQuaternion(
  center: readonly number[],
  halfSize: readonly number[],
  quaternion: readonly number[],
  result = new OrientedBoundingBox()
): OrientedBoundingBox {
  const halfAxes = new Matrix3().fromQuaternion(quaternion);
  for (let column = 0; column < 3; column++) {
    for (let row = 0; row < 3; row++) halfAxes[column * 3 + row] *= halfSize[column];
  }
  result.center = new Vector3(center);
  result.halfAxes = halfAxes;
  return result;
}
