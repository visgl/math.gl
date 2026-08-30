// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 Uber Technologies, Inc.

import {MathArray} from './base/math-array';
import {NumericArray} from '@math.gl/types';
import type {EulerRotationOrder} from './euler-types';

import {clamp} from '../lib/common';
import {checkNumber} from '../lib/validators';
import {fromQuat as mat4_fromQuat} from '../gl-matrix/mat4';

export type {EulerLike, EulerRotationOrder} from './euler-types';

// Internal constants
const ERR_UNKNOWN_ORDER = 'Unknown Euler angle order';
const ALMOST_ONE = 0.99999;

enum RotationOrderIndex {
  ZYX = 0,
  YXZ = 1,
  XZY = 2,
  ZXY = 3,
  YZX = 4,
  XYZ = 5
}

const ROTATION_ORDER_INDICES: Record<EulerRotationOrder, RotationOrderIndex> = {
  zyx: RotationOrderIndex.ZYX,
  yxz: RotationOrderIndex.YXZ,
  xzy: RotationOrderIndex.XZY,
  zxy: RotationOrderIndex.ZXY,
  yzx: RotationOrderIndex.YZX,
  xyz: RotationOrderIndex.XYZ
};

const ROTATION_ORDERS = {
  ZYX: 'zyx',
  YXZ: 'yxz',
  XZY: 'xzy',
  ZXY: 'zxy',
  YZX: 'yzx',
  XYZ: 'xyz'
} as const;

export class Euler extends MathArray {
  // Constants
  /** @deprecated Pass the string `'zyx'` directly. */
  static get ZYX(): EulerRotationOrder {
    return 'zyx';
  }
  /** @deprecated Pass the string `'yxz'` directly. */
  static get YXZ(): EulerRotationOrder {
    return 'yxz';
  }
  /** @deprecated Pass the string `'xzy'` directly. */
  static get XZY(): EulerRotationOrder {
    return 'xzy';
  }
  /** @deprecated Pass the string `'zxy'` directly. */
  static get ZXY(): EulerRotationOrder {
    return 'zxy';
  }
  /** @deprecated Pass the string `'yzx'` directly. */
  static get YZX(): EulerRotationOrder {
    return 'yzx';
  }
  /** @deprecated Pass the string `'xyz'` directly. */
  static get XYZ(): EulerRotationOrder {
    return 'xyz';
  }
  /** @deprecated Pass the string `'zyx'` directly. */
  static get RollPitchYaw(): EulerRotationOrder {
    return 'zyx';
  }
  /** @deprecated Pass the string `'zyx'` directly. */
  static get DefaultOrder(): EulerRotationOrder {
    return 'zyx';
  }
  /** @deprecated Pass an {@link EulerRotationOrder} string directly. */
  static get RotationOrders(): typeof ROTATION_ORDERS {
    return ROTATION_ORDERS;
  }
  /** @deprecated Euler rotation orders are already represented as strings. */
  static rotationOrder(order: EulerRotationOrder): EulerRotationOrder {
    return order;
  }
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
  // If copied array does contain fourth element, preserves currently set order
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

  // Copies the orientation element
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

  // rotation order, in all three angle notations
  get order(): EulerRotationOrder {
    return getOrder(this[3]);
  }
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
    const orderIndex = order ? checkOrder(order) : this[3];
    switch (orderIndex) {
      case RotationOrderIndex.XYZ:
        this[1] = Math.asin(clamp(m13, -1, 1));
        if (Math.abs(m13) < ALMOST_ONE) {
          this[0] = Math.atan2(-m23, m33);
          this[2] = Math.atan2(-m12, m11);
        } else {
          this[0] = Math.atan2(m32, m22);
          this[2] = 0;
        }
        break;
      case RotationOrderIndex.YXZ:
        this[0] = Math.asin(-clamp(m23, -1, 1));
        if (Math.abs(m23) < ALMOST_ONE) {
          this[1] = Math.atan2(m13, m33);
          this[2] = Math.atan2(m21, m22);
        } else {
          this[1] = Math.atan2(-m31, m11);
          this[2] = 0;
        }
        break;
      case RotationOrderIndex.ZXY:
        this[0] = Math.asin(clamp(m32, -1, 1));
        if (Math.abs(m32) < ALMOST_ONE) {
          this[1] = Math.atan2(-m31, m33);
          this[2] = Math.atan2(-m12, m22);
        } else {
          this[1] = 0;
          this[2] = Math.atan2(m21, m11);
        }
        break;
      case RotationOrderIndex.ZYX:
        this[1] = Math.asin(-clamp(m31, -1, 1));
        if (Math.abs(m31) < ALMOST_ONE) {
          this[0] = Math.atan2(m32, m33);
          this[2] = Math.atan2(m21, m11);
        } else {
          this[0] = 0;
          this[2] = Math.atan2(-m12, m22);
        }
        break;
      case RotationOrderIndex.YZX:
        this[2] = Math.asin(clamp(m21, -1, 1));
        if (Math.abs(m21) < ALMOST_ONE) {
          this[0] = Math.atan2(-m23, m22);
          this[1] = Math.atan2(-m31, m11);
        } else {
          this[0] = 0;
          this[1] = Math.atan2(m13, m33);
        }
        break;
      case RotationOrderIndex.XZY:
        this[2] = Math.asin(-clamp(m12, -1, 1));
        if (Math.abs(m12) < ALMOST_ONE) {
          this[0] = Math.atan2(m32, m22);
          this[1] = Math.atan2(m13, m11);
        } else {
          this[0] = Math.atan2(-m23, m33);
          this[1] = 0;
        }
        break;
      default:
        throw new Error(ERR_UNKNOWN_ORDER);
    }
    this[3] = orderIndex;
    return this;
  }

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
    switch (this[3]) {
      case RotationOrderIndex.XYZ: {
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
      case RotationOrderIndex.YXZ: {
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
      case RotationOrderIndex.ZXY: {
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
      case RotationOrderIndex.ZYX: {
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
      case RotationOrderIndex.YZX: {
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
      case RotationOrderIndex.XZY: {
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
      default:
        throw new Error(ERR_UNKNOWN_ORDER);
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

function validateOrder(value: number): boolean {
  return value >= 0 && value < 6;
}

function checkOrder(value: EulerRotationOrder): RotationOrderIndex {
  const order = ROTATION_ORDER_INDICES[value];
  if (order === undefined) {
    throw new Error(ERR_UNKNOWN_ORDER);
  }
  return order;
}

function getOrder(value: number): EulerRotationOrder {
  switch (value) {
    case RotationOrderIndex.ZYX:
      return 'zyx';
    case RotationOrderIndex.YXZ:
      return 'yxz';
    case RotationOrderIndex.XZY:
      return 'xzy';
    case RotationOrderIndex.ZXY:
      return 'zxy';
    case RotationOrderIndex.YZX:
      return 'yzx';
    case RotationOrderIndex.XYZ:
      return 'xyz';
    default:
      throw new Error(ERR_UNKNOWN_ORDER);
  }
}
