// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 Uber Technologies, Inc.

import {NumericArray, NumericArray9} from '@math.gl/types';
import {Matrix} from './base/matrix';
import {Vector3} from './vector3';
import {checkVector} from '../lib/validators';

import {vec4_transformMat3} from '../lib/gl-matrix-extras';

import {
  fromQuat as mat3_fromQuat,
  determinant as mat3_determinant,
  transpose as mat3_transpose,
  invert as mat3_invert,
  multiply as mat3_multiply,
  rotate as mat3_rotate,
  scale as mat3_scale,
  translate as mat3_translate
} from '../gl-matrix/mat3';
import {transformMat3 as vec2_transformMat3} from '../gl-matrix/vec2';
import {transformMat3 as vec3_transformMat3} from '../gl-matrix/vec3';

// eslint-disable-next-line no-shadow
enum INDICES {
  COL0ROW0 = 0,
  COL0ROW1 = 1,
  COL0ROW2 = 2,
  COL1ROW0 = 3,
  COL1ROW1 = 4,
  COL1ROW2 = 5,
  COL2ROW0 = 6,
  COL2ROW1 = 7,
  COL2ROW2 = 8
}

const IDENTITY_MATRIX = Object.freeze([1, 0, 0, 0, 1, 0, 0, 0, 1]);

/** Helper type that captures array length for a 3x3 matrix */
export type Matrix3Like = Matrix3 | NumericArray9;

/**
 * A 3x3 matrix with common linear algebra operations
 * Subclass of Array<number> meaning that it is highly compatible with other libraries
 */
export class Matrix3 extends Matrix {
  static get IDENTITY(): Readonly<Matrix3> {
    return getIdentityMatrix();
  }

  static get ZERO(): Readonly<Matrix3> {
    return getZeroMatrix();
  }

  get ELEMENTS(): number {
    return 9;
  }

  get RANK(): number {
    return 3;
  }

  get INDICES(): typeof INDICES {
    return INDICES;
  }

  constructor(array?: Readonly<NumericArray>);
  /** @deprecated */
  constructor(...args: number[]);

  constructor(array?: number | Readonly<NumericArray>, ...args: number[]) {
    // PERF NOTE: initialize elements as double precision numbers
    super(-0, -0, -0, -0, -0, -0, -0, -0, -0);
    if (arguments.length === 1 && Array.isArray(array)) {
      this.copy(array);
    } else if (args.length > 0) {
      this.copy([array as number, ...args]);
    } else {
      this.identity();
    }
  }

  copy(array: Readonly<NumericArray>): this {
    // Element wise copy for performance
    this[0] = array[0];
    this[1] = array[1];
    this[2] = array[2];
    this[3] = array[3];
    this[4] = array[4];
    this[5] = array[5];
    this[6] = array[6];
    this[7] = array[7];
    this[8] = array[8];
    return this.check();
  }

  // Constructors

  identity(): this {
    return this.copy(IDENTITY_MATRIX);
  }

  /**
   *
   * @param object
   * @returns self
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fromObject(object: {[key: string]: any}): this {
    return this.check();
  }

  /** Calculates a 3x3 matrix from the given quaternion
   * q quat  Quaternion to create matrix from
   */
  fromQuaternion(q: Readonly<NumericArray>): this {
    mat3_fromQuat(this, q);
    return this.check();
  }

  /**
   * accepts column major order, stores in column major order
   */
  // eslint-disable-next-line max-params
  set(
    m00: number,
    m10: number,
    m20: number,
    m01: number,
    m11: number,
    m21: number,
    m02: number,
    m12: number,
    m22: number
  ): this {
    this[0] = m00;
    this[1] = m10;
    this[2] = m20;
    this[3] = m01;
    this[4] = m11;
    this[5] = m21;
    this[6] = m02;
    this[7] = m12;
    this[8] = m22;
    return this.check();
  }

  /**
   * accepts row major order, stores as column major
   */
  // eslint-disable-next-line max-params
  setRowMajor(
    m00: number,
    m01: number,
    m02: number,
    m10: number,
    m11: number,
    m12: number,
    m20: number,
    m21: number,
    m22: number
  ): this {
    this[0] = m00;
    this[1] = m10;
    this[2] = m20;
    this[3] = m01;
    this[4] = m11;
    this[5] = m21;
    this[6] = m02;
    this[7] = m12;
    this[8] = m22;
    return this.check();
  }

  // Accessors

  determinant(): number {
    return mat3_determinant(this);
  }

  // Modifiers
  transpose(): this {
    mat3_transpose(this, this);
    return this.check();
  }

  /** Invert a matrix. Note that this can fail if the matrix is not invertible */
  invert(): this {
    mat3_invert(this, this);
    return this.check();
  }

  // Operations
  multiplyLeft(a: NumericArray): this {
    mat3_multiply(this, a, this);
    return this.check();
  }

  multiplyRight(a: NumericArray): this {
    mat3_multiply(this, this, a);
    return this.check();
  }

  /**
   * Computes the product of this matrix and a column vector.
   *
   * @param cartesian The column.
   * @param result The object onto which to store the result.
   * @returns The modified result parameter.
   */
  multiplyByVector(cartesian: Vector3, result?: Vector3): Vector3 {
    if (!result)
      result = new Vector3()

    const vX = cartesian.x;
    const vY = cartesian.y;
    const vZ = cartesian.z;

    const x = this[0] * vX + this[3] * vY + this[6] * vZ;
    const y = this[1] * vX + this[4] * vY + this[7] * vZ;
    const z = this[2] * vX + this[5] * vY + this[8] * vZ;

    result.x = x;
    result.y = y;
    result.z = z;

    return result;
  }

  /**
   * Computes the product of this matrix times a (non-uniform) scale, as if the scale were a scale matrix.
   *
   * @param scale The non-uniform scale on the right-hand side.
   * @param result The object onto which to store the result.
   * @returns The modified result parameter.
   */
  multiplyByScale(scale: Vector3, result?: Matrix3): Matrix3 {
    if (!result)
      result = new Matrix3()

    result[0] = this[0] * scale.x;
    result[1] = this[1] * scale.x;
    result[2] = this[2] * scale.x;
    result[3] = this[3] * scale.y;
    result[4] = this[4] * scale.y;
    result[5] = this[5] * scale.y;
    result[6] = this[6] * scale.z;
    result[7] = this[7] * scale.z;
    result[8] = this[8] * scale.z;

    return result;
  }

  rotate(radians: number): this {
    mat3_rotate(this, this, radians);
    return this.check();
  }

  override scale(factor: NumericArray | number): this {
    if (Array.isArray(factor)) {
      mat3_scale(this, this, factor);
    } else {
      mat3_scale(this, this, [factor as number, factor as number]);
    }
    return this.check();
  }

  translate(vec: NumericArray): this {
    mat3_translate(this, this, vec);
    return this.check();
  }

  // Transforms
  transform(vector: Readonly<NumericArray>, result?: NumericArray): NumericArray {
    let out: NumericArray;
    switch (vector.length) {
      case 2:
        out = vec2_transformMat3(result || [-0, -0], vector, this) as NumericArray;
        break;
      case 3:
        out = vec3_transformMat3(result || [-0, -0, -0], vector, this) as NumericArray;
        break;
      case 4:
        out = vec4_transformMat3(result || [-0, -0, -0, -0], vector, this);
        break;
      default:
        throw new Error('Illegal vector');
    }
    checkVector(out, vector.length);
    return out;
  }

  /** @deprecated */
  transformVector(vector: Readonly<NumericArray>, result?: NumericArray): NumericArray {
    return this.transform(vector, result);
  }

  /** @deprecated */
  transformVector2(vector: Readonly<NumericArray>, result?: NumericArray): NumericArray {
    return this.transform(vector, result);
  }

  /** @deprecated */
  transformVector3(vector: Readonly<NumericArray>, result?: NumericArray): NumericArray {
    return this.transform(vector, result);
  }
}

let ZERO_MATRIX3: Matrix3 | null;
let IDENTITY_MATRIX3: Matrix3 | null = null;

function getZeroMatrix(): Readonly<Matrix3> {
  if (!ZERO_MATRIX3) {
    ZERO_MATRIX3 = new Matrix3([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    Object.freeze(ZERO_MATRIX3);
  }
  return ZERO_MATRIX3;
}

function getIdentityMatrix(): Matrix3 {
  if (!IDENTITY_MATRIX3) {
    IDENTITY_MATRIX3 = new Matrix3();
    Object.freeze(IDENTITY_MATRIX3);
  }
  return IDENTITY_MATRIX3;
}
