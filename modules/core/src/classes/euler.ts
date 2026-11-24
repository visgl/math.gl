// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright (c) 2017 Uber Technologies, Inc.
// SPDX-FileCopyrightText: Copyright 2010-2017 three.js authors
// SPDX-FileComment: Euler conversion methods adapted from three.js; see ../../LICENSE.

import {MathArray} from './base/math-array';
import {NumericArray} from '../types';
import type {EulerRotationOrder} from './euler-types';

import {checkNumber} from '../lib/validators';
import {fromQuat as mat4_fromQuat} from '../gl-matrix/mat4';

export type {EulerLike, EulerRotationOrder} from './euler-types';

// Internal constants
const ERR_UNKNOWN_ORDER = 'Unknown Euler angle order';
// Below this cosine of the middle angle, the outer angles can't be told apart (gimbal lock), so one
// of them is set to 0. Near sqrt(Number.EPSILON), both ways of extracting them lose about as much.
const GIMBAL_LOCK_COSINE = 1e-8;

/** Maps each numeric array order index to its rotation order string. */
const ROTATION_ORDERS = ['zyx', 'yxz', 'xzy', 'zxy', 'yzx', 'xyz'] as const;

export class Euler extends MathArray {
  get ELEMENTS(): number {
    return 4;
  }

  /**
   * @class
   * @param {Number | Number[]} x
   * @param {Number=} [y]
   * @param {Number=} [z]
   * @param {Number=} [order]
   */
  constructor(x = 0, y = 0, z = 0, order: EulerRotationOrder = 'zyx') {
    // PERF NOTE: initialize elements as double precision numbers
    super(-0, -0, -0, -0);
    // eslint-disable-next-line prefer-rest-params
    if (arguments.length > 0 && Array.isArray(arguments[0])) {
      // @ts-expect-error
      // eslint-disable-next-line prefer-rest-params
      this.fromVector3(...arguments);
    } else {
      this.set(x, y, z, order);
    }
  }

  fromQuaternion(quaternion: Readonly<NumericArray>, order: EulerRotationOrder = this.order): this {
    const matrix = mat4_fromQuat(new Array<number>(16), quaternion);
    return this.fromRotationMatrix(matrix, order);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fromObject(object: Record<string, unknown>): this {
    throw new Error('not implemented');
    //  return this.set(object.x, object.y, object.z, object.order);
  }

  // fromQuaternion(q, order) {
  //   this._fromRotationMat[-0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0];
  //   return this.check();
  // }
  /** Copies three angles and an optional numeric rotation order index. */
  copy(array: Readonly<NumericArray>): this {
    this[0] = array[0];
    this[1] = array[1];
    this[2] = array[2];
    if (Number.isFinite(array[3]) && validateOrder(array[3])) {
      this[3] = array[3];
    }
    return this.check();
  }

  // Sets the three angles, and optionally sets the rotation order
  // If order is not specified, preserves currently set order
  set(x = 0, y = 0, z = 0, order: EulerRotationOrder): this {
    this[0] = x;
    this[1] = y;
    this[2] = z;
    this[3] = order ? checkOrder(order) : this[3];
    return this.check();
  }

  override validate(): boolean {
    return (
      validateOrder(this[3]) &&
      Number.isFinite(this[0]) &&
      Number.isFinite(this[1]) &&
      Number.isFinite(this[2])
    );
  }

  // Does not copy the orientation element
  override toArray(array: NumericArray = [], offset: number = 0): NumericArray {
    array[offset] = this[0];
    array[offset + 1] = this[1];
    array[offset + 2] = this[2];
    return array;
  }

  /** Writes the angles and numeric rotation order index at the given offset. */
  toArray4(array: NumericArray = [], offset: number = 0): NumericArray {
    array[offset] = this[0];
    array[offset + 1] = this[1];
    array[offset + 2] = this[2];
    array[offset + 3] = this[3];
    return array;
  }

  toVector3(result: NumericArray = [-0, -0, -0]): NumericArray {
    result[0] = this[0];
    result[1] = this[1];
    result[2] = this[2];
    return result;
  }
  /* eslint-disable no-multi-spaces, brace-style, no-return-assign */
  // x, y, z angle notation (note: only corresponds to axis in XYZ orientation)

  get x(): number {
    return this[0];
  }
  set x(value: number) {
    this[0] = checkNumber(value);
  }

  get y(): number {
    return this[1];
  }
  set y(value: number) {
    this[1] = checkNumber(value);
  }

  get z(): number {
    return this[2];
  }
  set z(value: number) {
    this[2] = checkNumber(value);
  }
  // alpha, beta, gamma angle notation
  get alpha(): number {
    return this[0];
  }
  set alpha(value: number) {
    this[0] = checkNumber(value);
  }

  get beta(): number {
    return this[1];
  }
  set beta(value: number) {
    this[1] = checkNumber(value);
  }

  get gamma(): number {
    return this[2];
  }
  set gamma(value: number) {
    this[2] = checkNumber(value);
  }

  // phi, theta, psi angle notation
  get phi(): number {
    return this[0];
  }
  set phi(value: number) {
    this[0] = checkNumber(value);
  }

  get theta(): number {
    return this[1];
  }
  set theta(value: number) {
    this[1] = checkNumber(value);
  }

  get psi(): number {
    return this[2];
  }
  set psi(value: number) {
    this[2] = checkNumber(value);
  }
  // roll, pitch, yaw angle notation

  get roll(): number {
    return this[0];
  }
  set roll(value: number) {
    this[0] = checkNumber(value);
  }

  get pitch(): number {
    return this[1];
  }
  set pitch(value: number) {
    this[1] = checkNumber(value);
  }

  get yaw(): number {
    return this[2];
  }
  set yaw(value: number) {
    this[2] = checkNumber(value);
  }

  /** The axis order used to interpret the three angles. */
  get order(): EulerRotationOrder {
    return getOrder(this[3]);
  }
  /** Sets the axis order while preserving the three angles. */
  set order(value: EulerRotationOrder) {
    this[3] = checkOrder(value);
  }

  // Constructors
  fromVector3(v: Readonly<NumericArray>, order: EulerRotationOrder = this.order): this {
    return this.set(v[0], v[1], v[2], order);
  }

  // TODO - with and without 4th element
  override fromArray(array: Readonly<NumericArray>, offset: number = 0): this {
    this[0] = array[0 + offset];
    this[1] = array[1 + offset];
    this[2] = array[2 + offset];
    if (array[3] !== undefined) {
      this[3] = array[3];
    }
    return this.check();
  }

  // Common ZYX rotation order
  fromRollPitchYaw(roll: number, pitch: number, yaw: number): this {
    return this.set(roll, pitch, yaw, 'zyx');
  }

  fromRotationMatrix(m: Readonly<NumericArray>, order: EulerRotationOrder = this.order): this {
    this._fromRotationMatrix(m, order);
    return this.check();
  }

  // ACCESSORS

  getRotationMatrix(
    result: NumericArray = [-0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0]
  ): NumericArray {
    return this._getRotationMatrix(result);
  }

  // INTERNAL METHODS
  // Conversion from Euler to rotation matrix and from matrix to Euler
  // Adapted from three.js under MIT license
  // // WARNING: this discards revolution information -bhouston
  // reorder(newOrder) {
  //   const q = new Quaternion().setFromEuler(this);
  //   return this.setFromQuaternion(q, newOrder);
  /* eslint-disable complexity, max-statements, one-var */
  /** Extracts angles in the requested axis order from an unscaled rotation matrix. */
  _fromRotationMatrix(m: Readonly<NumericArray>, order: EulerRotationOrder = this.order): this {
    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
    const m11 = m[0],
      m12 = m[4],
      m13 = m[8];
    const m21 = m[1],
      m22 = m[5],
      m23 = m[9];
    const m31 = m[2],
      m32 = m[6],
      m33 = m[10];
    // The middle angle comes from atan2 of its sine and its cosine, which keeps full precision
    // close to +-90 degrees, where asin of the sine alone loses it.
    let cosine: number;
    const orderIndex = order ? checkOrder(order) : this[3];
    switch (getOrder(orderIndex)) {
      case 'xyz':
        cosine = Math.hypot(m11, m12);
        this[1] = Math.atan2(m13, cosine);
        if (cosine > GIMBAL_LOCK_COSINE) {
          this[0] = Math.atan2(-m23, m33);
          this[2] = Math.atan2(-m12, m11);
        } else {
          this[0] = Math.atan2(m32, m22);
          this[2] = 0;
        }
        break;
      case 'yxz':
        cosine = Math.hypot(m13, m33);
        this[0] = Math.atan2(-m23, cosine);
        if (cosine > GIMBAL_LOCK_COSINE) {
          this[1] = Math.atan2(m13, m33);
          this[2] = Math.atan2(m21, m22);
        } else {
          this[1] = Math.atan2(-m31, m11);
          this[2] = 0;
        }
        break;
      case 'zxy':
        cosine = Math.hypot(m31, m33);
        this[0] = Math.atan2(m32, cosine);
        if (cosine > GIMBAL_LOCK_COSINE) {
          this[1] = Math.atan2(-m31, m33);
          this[2] = Math.atan2(-m12, m22);
        } else {
          this[1] = 0;
          this[2] = Math.atan2(m21, m11);
        }
        break;
      case 'zyx':
        cosine = Math.hypot(m32, m33);
        this[1] = Math.atan2(-m31, cosine);
        if (cosine > GIMBAL_LOCK_COSINE) {
          this[0] = Math.atan2(m32, m33);
          this[2] = Math.atan2(m21, m11);
        } else {
          this[0] = 0;
          this[2] = Math.atan2(-m12, m22);
        }
        break;
      case 'yzx':
        cosine = Math.hypot(m22, m23);
        this[2] = Math.atan2(m21, cosine);
        if (cosine > GIMBAL_LOCK_COSINE) {
          this[0] = Math.atan2(-m23, m22);
          this[1] = Math.atan2(-m31, m11);
        } else {
          this[0] = 0;
          this[1] = Math.atan2(m13, m33);
        }
        break;
      case 'xzy':
        cosine = Math.hypot(m11, m13);
        this[2] = Math.atan2(-m12, cosine);
        if (cosine > GIMBAL_LOCK_COSINE) {
          this[0] = Math.atan2(m32, m22);
          this[1] = Math.atan2(m13, m11);
        } else {
          this[0] = Math.atan2(-m23, m33);
          this[1] = 0;
        }
        break;
    }
    this[3] = orderIndex;
    return this;
  }

  /** Writes the rotation matrix for the stored angles and axis order. */
  _getRotationMatrix(result: NumericArray): NumericArray {
    const te = result || [-0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0, -0];
    const x = this.x,
      y = this.y,
      z = this.z;
    const a = Math.cos(x);
    const c = Math.cos(y);
    const e = Math.cos(z);
    const b = Math.sin(x);
    const d = Math.sin(y);
    const f = Math.sin(z);
    switch (getOrder(this[3])) {
      case 'xyz': {
        const ae = a * e,
          af = a * f,
          be = b * e,
          bf = b * f;
        te[0] = c * e;
        te[4] = -c * f;
        te[8] = d;
        te[1] = af + be * d;
        te[5] = ae - bf * d;
        te[9] = -b * c;
        te[2] = bf - ae * d;
        te[6] = be + af * d;
        te[10] = a * c;
        break;
      }
      case 'yxz': {
        const ce = c * e,
          cf = c * f,
          de = d * e,
          df = d * f;
        te[0] = ce + df * b;
        te[4] = de * b - cf;
        te[8] = a * d;
        te[1] = a * f;
        te[5] = a * e;
        te[9] = -b;
        te[2] = cf * b - de;
        te[6] = df + ce * b;
        te[10] = a * c;
        break;
      }
      case 'zxy': {
        const ce = c * e,
          cf = c * f,
          de = d * e,
          df = d * f;
        te[0] = ce - df * b;
        te[4] = -a * f;
        te[8] = de + cf * b;
        te[1] = cf + de * b;
        te[5] = a * e;
        te[9] = df - ce * b;
        te[2] = -a * d;
        te[6] = b;
        te[10] = a * c;
        break;
      }
      case 'zyx': {
        const ae = a * e,
          af = a * f,
          be = b * e,
          bf = b * f;
        te[0] = c * e;
        te[4] = be * d - af;
        te[8] = ae * d + bf;
        te[1] = c * f;
        te[5] = bf * d + ae;
        te[9] = af * d - be;
        te[2] = -d;
        te[6] = b * c;
        te[10] = a * c;
        break;
      }
      case 'yzx': {
        const ac = a * c,
          ad = a * d,
          bc = b * c,
          bd = b * d;
        te[0] = c * e;
        te[4] = bd - ac * f;
        te[8] = bc * f + ad;
        te[1] = f;
        te[5] = a * e;
        te[9] = -b * e;
        te[2] = -d * e;
        te[6] = ad * f + bc;
        te[10] = ac - bd * f;
        break;
      }
      case 'xzy': {
        const ac = a * c,
          ad = a * d,
          bc = b * c,
          bd = b * d;
        te[0] = c * e;
        te[4] = -f;
        te[8] = d * e;
        te[1] = ac * f + bd;
        te[5] = a * e;
        te[9] = ad * f - bc;
        te[2] = bc * f - ad;
        te[6] = b * e;
        te[10] = bd * f + ac;
        break;
      }
    }
    // last column
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;
    // bottom row
    te[12] = 0;
    te[13] = 0;
    te[14] = 0;
    te[15] = 1;
    return te;
  }
}

// HELPER FUNCTIONS

/** Tests whether a numeric order value lies within the supported range. */
function validateOrder(value: number): boolean {
  return value >= 0 && value < ROTATION_ORDERS.length;
}

/** Looks up the array index for a rotation order. Throws for unknown orders. */
function checkOrder(value: EulerRotationOrder): number {
  const index = ROTATION_ORDERS.indexOf(value);
  if (index === -1) {
    throw new Error(ERR_UNKNOWN_ORDER);
  }
  return index;
}

/** Looks up the rotation order for an array index. Throws for unknown indices. */
function getOrder(index: number): EulerRotationOrder {
  const order = ROTATION_ORDERS[index];
  if (!Number.isInteger(index) || order === undefined) {
    throw new Error(ERR_UNKNOWN_ORDER);
  }
  return order;
}
