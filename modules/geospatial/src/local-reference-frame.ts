// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original geodetic frame and pose composition over math.gl local-frame kernels.

import {Matrix4, Quaternion, Vector3} from '@math.gl/core';
import {
  createLocalFrameBasis,
  eastNorthUpBasis,
  localFrameToMatrix
} from '@math.gl/core/local-frame';
import type {LocalFrameAxis} from '@math.gl/core/local-frame';
import type {NumericArray} from '@math.gl/core/types';
import {Ellipsoid} from './ellipsoid';

export type LocalReferenceFrameOptions = {
  ellipsoid?: Ellipsoid;
  /** Right-handed signed geographic axes. Default east/north/up. */
  axes?: readonly [LocalFrameAxis, LocalFrameAxis, LocalFrameAxis];
};
/** Radians: Rz(-heading) Ry(-pitch) Rx(roll) in the selected local axes.
 * Zero attitude aligns model XYZ with local XYZ (ENU by default).
 */
export type HeadingPitchRoll = {heading: number; pitch: number; roll: number};

type Coordinate = Readonly<NumericArray>;

/** A snapshot of a rigid local geodetic frame on a sphere or oblate spheroid.
 * Origins/positions use fixed Cartesian axis units; vectors retain their input units.
 * The basis follows geodetic longitude/latitude, including elevated origins.
 */
export class LocalReferenceFrame {
  private readonly matrix: readonly number[];
  private readonly up: readonly number[];

  constructor(origin: Coordinate, options: LocalReferenceFrameOptions = {}) {
    finiteCoordinate(origin);
    const ellipsoid = options.ellipsoid || Ellipsoid.WGS84;
    const {x: a, y, z: b} = ellipsoid.radii;
    if (!(a > 0 && a === y && b > 0 && b <= a && Number.isFinite(a))) {
      throw new RangeError('LocalReferenceFrame requires a positive sphere or oblate spheroid');
    }
    const llh = ellipsoid.cartesianToCartographic(origin);
    if (!llh) throw new RangeError('Origin has no unique geodetic frame');
    const basis = createLocalFrameBasis();
    eastNorthUpBasis((llh[0] * Math.PI) / 180, (llh[1] * Math.PI) / 180, basis);
    const axes = options.axes || ['east', 'north', 'up'];
    const matrix: number[] = [];
    if (!localFrameToMatrix(basis, {x: origin[0], y: origin[1], z: origin[2]}, ...axes, matrix)) {
      throw new RangeError('Expected three right-handed geographic axes');
    }
    this.matrix = Object.freeze(matrix);
    this.up = Object.freeze([basis.upX, basis.upY, basis.upZ]);
  }

  /** Independent copies: callers cannot mutate the cached frame. */
  get localToFixedMatrix(): Matrix4 {
    return new Matrix4(this.matrix);
  }

  get fixedToLocalMatrix(): Matrix4 {
    return new Matrix4(this.matrix).invert();
  }

  localToFixedPoint(point: Coordinate, result = new Vector3()): Vector3 {
    return this.transform(point, result, false, true);
  }

  fixedToLocalPoint(point: Coordinate, result = new Vector3()): Vector3 {
    return this.transform(point, result, true, true);
  }

  localToFixedVector(vector: Coordinate, result = new Vector3()): Vector3 {
    return this.transform(vector, result, false, false);
  }

  fixedToLocalVector(vector: Coordinate, result = new Vector3()): Vector3 {
    return this.transform(vector, result, true, false);
  }

  /** Model-to-fixed affine pose, with unit scale. Angles are radians. */
  headingPitchRollToFixedFrame(attitude: HeadingPitchRoll, result = new Matrix4()): Matrix4 {
    const {heading, pitch, roll} = attitude;
    if (![heading, pitch, roll].every(Number.isFinite)) throw new RangeError('Nonfinite attitude');
    return result.copy(this.matrix).rotateZ(-heading).rotateY(-pitch).rotateX(roll);
  }

  headingPitchRollQuaternion(attitude: HeadingPitchRoll, result = new Quaternion()): Quaternion {
    const m = this.headingPitchRollToFixedFrame(attitude);
    return result.fromMatrix3([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]).normalize();
  }

  /** Extract attitude from a rigid model-to-fixed pose. Translation is ignored.
   * Pitch is canonicalized to [-pi/2, pi/2]. At gimbal lock, roll is zero.
   */
  fixedFrameToHeadingPitchRoll(pose: Coordinate): HeadingPitchRoll {
    validateRigidPose(pose);
    // Rotation extraction must not multiply irrelevant (possibly huge) translations.
    const local = new Matrix4();
    const m = this.matrix;
    for (let column = 0; column < 3; column++) {
      for (let row = 0; row < 3; row++) {
        local[column * 4 + row] =
          m[row * 4] * pose[column * 4] +
          m[row * 4 + 1] * pose[column * 4 + 1] +
          m[row * 4 + 2] * pose[column * 4 + 2];
      }
    }
    const pitchY = Math.atan2(-local[2], Math.hypot(local[0], local[1]));
    const locked = Math.hypot(local[0], local[1]) < 1e-12;
    const roll = locked ? 0 : Math.atan2(local[6], local[10]);
    const yaw = locked ? Math.atan2(-local[4], local[5]) : Math.atan2(local[1], local[0]);
    return {heading: -yaw, pitch: -pitchY, roll};
  }

  /** Fixed-space velocity defines model +X. +Z is as close as possible to geodetic up.
   * Returns undefined without writing result for zero or nearly vertical velocity.
   * Stateless: callers own temporal continuity across these singularities.
   */
  velocityQuaternion(velocity: Coordinate, result = new Quaternion()): Quaternion | undefined {
    finiteCoordinate(velocity);
    const length = Math.hypot(velocity[0], velocity[1], velocity[2]);
    if (!(length > 0 && Number.isFinite(length))) return undefined;
    const x = new Vector3(velocity[0] / length, velocity[1] / length, velocity[2] / length);
    const y = new Vector3(this.up).cross(x);
    if (y.len() < 1e-12) return undefined;
    y.normalize();
    const z = new Vector3(x).cross(y).normalize();
    return result.fromMatrix3([...x, ...y, ...z]).normalize();
  }

  private transform(
    point: Coordinate,
    result: Vector3,
    inverse: boolean,
    position: boolean
  ): Vector3 {
    finiteCoordinate(point);
    const m = this.matrix;
    const x = point[0] - (inverse && position ? m[12] : 0);
    const y = point[1] - (inverse && position ? m[13] : 0);
    const z = point[2] - (inverse && position ? m[14] : 0);
    const ox = inverse
      ? m[0] * x + m[1] * y + m[2] * z
      : m[0] * x + m[4] * y + m[8] * z + (position ? m[12] : 0);
    const oy = inverse
      ? m[4] * x + m[5] * y + m[6] * z
      : m[1] * x + m[5] * y + m[9] * z + (position ? m[13] : 0);
    const oz = inverse
      ? m[8] * x + m[9] * y + m[10] * z
      : m[2] * x + m[6] * y + m[10] * z + (position ? m[14] : 0);
    if (!Number.isFinite(ox) || !Number.isFinite(oy) || !Number.isFinite(oz))
      throw new RangeError('Frame transformation overflow');
    return result.set(ox, oy, oz);
  }
}

function finiteCoordinate(point: Coordinate): void {
  if (
    point.length !== 3 ||
    !Number.isFinite(point[0]) ||
    !Number.isFinite(point[1]) ||
    !Number.isFinite(point[2])
  ) {
    throw new RangeError('Expected three finite coordinates');
  }
}

function validateRigidPose(pose: Coordinate): void {
  if (
    pose.length !== 16 ||
    !Array.from(pose).every(Number.isFinite) ||
    pose[3] !== 0 ||
    pose[7] !== 0 ||
    pose[11] !== 0 ||
    pose[15] !== 1
  ) {
    throw new RangeError('Expected a finite affine pose');
  }
  const x = new Vector3(pose[0], pose[1], pose[2]);
  const y = new Vector3(pose[4], pose[5], pose[6]);
  const z = new Vector3(pose[8], pose[9], pose[10]);
  // Reject oversized/scaled columns before vector cross products can overflow,
  // including when math.gl debug validation is enabled.
  for (const axis of [x, y, z]) {
    if (Math.abs(Math.hypot(axis[0], axis[1], axis[2]) - 1) > 1e-6) {
      throw new RangeError('Pose rotation must be orthonormal and right-handed');
    }
  }
  const errors = [
    Math.abs(x.len() - 1),
    Math.abs(y.len() - 1),
    Math.abs(z.len() - 1),
    Math.abs(x.dot(y)),
    Math.abs(x.dot(z)),
    Math.abs(y.dot(z)),
    Math.abs(new Vector3(x).cross(y).dot(z) - 1)
  ];
  if (!errors.every(Number.isFinite) || Math.max(...errors) > 1e-6) {
    throw new RangeError('Pose rotation must be orthonormal and right-handed');
  }
}
