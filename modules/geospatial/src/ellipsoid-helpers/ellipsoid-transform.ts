// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Derived from Cesium. See the repository LICENSE for upstream attribution and Apache-2.0 terms.

import {NumericArray} from '@math.gl/types';
import {Vector3, assert, equals as equalsEpsilon} from '@math.gl/core';
import {
  createLocalFrameBasis,
  eastNorthUpBasisFromDirections,
  localFrameToMatrix
} from '@math.gl/core/local-frame';

import type {Ellipsoid} from '../ellipsoid';

const EPSILON14 = 1e-14;

const scratchOrigin = new Vector3();
const scratchBasis = createLocalFrameBasis();

export type AxisDirection = 'up' | 'down' | 'north' | 'east' | 'south' | 'west';

// Caclulate third axis from given two axii
const VECTOR_PRODUCT_LOCAL_FRAME: Record<
  AxisDirection,
  Partial<Record<AxisDirection, AxisDirection>>
> = {
  up: {
    south: 'east',
    north: 'west',
    west: 'south',
    east: 'north'
  },
  down: {
    south: 'west',
    north: 'east',
    west: 'north',
    east: 'south'
  },
  south: {
    up: 'west',
    down: 'east',
    west: 'down',
    east: 'up'
  },
  north: {
    up: 'east',
    down: 'west',
    west: 'up',
    east: 'down'
  },
  west: {
    up: 'north',
    down: 'south',
    north: 'down',
    south: 'up'
  },
  east: {
    up: 'south',
    down: 'north',
    north: 'up',
    south: 'down'
  }
} as const;

const degeneratePositionLocalFrame = {
  north: [-1, 0, 0],
  east: [0, 1, 0],
  up: [0, 0, 1],
  south: [1, 0, 0],
  west: [0, -1, 0],
  down: [0, 0, -1]
} as const;

const scratchAxisVectors = {
  east: new Vector3(),
  north: new Vector3(),
  up: new Vector3(),
  west: new Vector3(),
  south: new Vector3(),
  down: new Vector3()
};

const scratchVector1 = new Vector3();
const scratchVector2 = new Vector3();
const scratchVector3 = new Vector3();

// Computes a 4x4 transformation matrix from a reference frame
// centered at the provided origin to the provided ellipsoid's fixed reference frame.
// eslint-disable-next-line max-statements, max-params, complexity
export function localFrameToFixedFrame(
  ellipsoid: Ellipsoid,
  firstAxis: AxisDirection,
  secondAxis: AxisDirection,
  thirdAxis: AxisDirection,
  cartesianOrigin: Readonly<NumericArray>,
  result: number[]
): number[] {
  const thirdAxisInferred =
    VECTOR_PRODUCT_LOCAL_FRAME[firstAxis] && VECTOR_PRODUCT_LOCAL_FRAME[firstAxis][secondAxis];
  // firstAxis and secondAxis must be east, north, up, west, south or down.');
  assert(thirdAxisInferred && (!thirdAxis || thirdAxis === thirdAxisInferred));

  let firstAxisVector: Vector3;
  let secondAxisVector: Vector3;
  let thirdAxisVector: Vector3;

  const origin = scratchOrigin.copy(cartesianOrigin);

  // If x and y are zero, assume origin is at a pole, which is a special case.
  const atPole = equalsEpsilon(origin.x, 0.0, EPSILON14) && equalsEpsilon(origin.y, 0.0, EPSILON14);

  // Only the qualified sphere/oblate basis is shared. Three-radius and center
  // conventions keep the retained Cesium path, without changing its normal choice.
  const radii = ellipsoid.radii;
  if (
    radii.x === radii.y &&
    radii.x > 0 &&
    radii.z > 0 &&
    radii.z <= radii.x &&
    (!atPole || origin.z !== 0)
  ) {
    const {east, up} = scratchAxisVectors;
    if (atPole) {
      east.set(0, 1, 0);
      up.set(0, 0, Math.sign(origin.z));
    } else {
      east.set(-origin.y, origin.x, 0).normalize();
      ellipsoid.geodeticSurfaceNormal(origin, up);
    }
    if (
      !eastNorthUpBasisFromDirections(east, up, scratchBasis) ||
      !localFrameToMatrix(scratchBasis, origin, firstAxis, secondAxis, thirdAxis, result)
    )
      throw new Error('Unsupported local frame');
    return result;
  }

  if (atPole) {
    // Look up axis value and adjust
    const sign = Math.sign(origin.z);

    firstAxisVector = scratchVector1.fromArray(degeneratePositionLocalFrame[firstAxis]);
    if (firstAxis !== 'east' && firstAxis !== 'west') {
      firstAxisVector.scale(sign);
    }

    secondAxisVector = scratchVector2.fromArray(degeneratePositionLocalFrame[secondAxis]);
    if (secondAxis !== 'east' && secondAxis !== 'west') {
      secondAxisVector.scale(sign);
    }

    thirdAxisVector = scratchVector3.fromArray(degeneratePositionLocalFrame[thirdAxis]);
    if (thirdAxis !== 'east' && thirdAxis !== 'west') {
      thirdAxisVector.scale(sign);
    }
  } else {
    // Calculate all axis
    const {up, east, north} = scratchAxisVectors;

    east.set(-origin.y, origin.x, 0.0).normalize();
    ellipsoid.geodeticSurfaceNormal(origin, up);
    north.copy(up).cross(east);

    const {down, west, south} = scratchAxisVectors;

    down.copy(up).scale(-1);
    west.copy(east).scale(-1);
    south.copy(north).scale(-1);

    // Pick three axis based on desired orientation
    firstAxisVector = scratchAxisVectors[firstAxis];
    secondAxisVector = scratchAxisVectors[secondAxis];
    thirdAxisVector = scratchAxisVectors[thirdAxis];
  }

  // Snapshot the retained three-radius/center path too: application result setters
  // can recursively invoke either path and overwrite all module scratch vectors.
  const ax = firstAxisVector.x,
    ay = firstAxisVector.y,
    az = firstAxisVector.z;
  const bx = secondAxisVector.x,
    by = secondAxisVector.y,
    bz = secondAxisVector.z;
  const cx = thirdAxisVector.x,
    cy = thirdAxisVector.y,
    cz = thirdAxisVector.z;
  const x = origin.x,
    y = origin.y,
    z = origin.z;
  result[0] = ax;
  result[1] = ay;
  result[2] = az;
  result[3] = 0.0;
  result[4] = bx;
  result[5] = by;
  result[6] = bz;
  result[7] = 0.0;
  result[8] = cx;
  result[9] = cy;
  result[10] = cz;
  result[11] = 0.0;
  result[12] = x;
  result[13] = y;
  result[14] = z;
  result[15] = 1.0;
  return result;
}
