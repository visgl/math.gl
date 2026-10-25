// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Extracted Cesium-derived OBB quaternion operations; see ../../../../LICENSE for attribution.

import {Matrix3, Quaternion, Vector3} from '@math.gl/core';
import {OrientedBoundingBox} from '../bounding-volumes/oriented-bounding-box';

/** Return the orientation of a box, excluding the scale of its half axes. */
export function getOrientedBoundingBoxQuaternion(box: OrientedBoundingBox): Quaternion {
  const x = new Vector3(box.halfAxes.getColumn(0)).normalize();
  const y = new Vector3(box.halfAxes.getColumn(1)).normalize();
  const z = new Vector3(box.halfAxes.getColumn(2)).normalize();
  return new Quaternion().fromMatrix3(new Matrix3([...x, ...y, ...z]));
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
