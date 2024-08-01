// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// types
export type {
  TypedArray,
  TypedArrayConstructor,
  NumericArray,
  NumberArray,
  NumberArray2,
  NumberArray3,
  NumberArray4,
  NumberArray6,
  NumberArray8,
  NumberArray9,
  NumberArray12,
  NumberArray16
} from '@math.gl/types';

export type {isTypedArray, isNumberArray, isNumericArray} from '@math.gl/types';

// classes
export {Vector2} from './classes/vector2';
export {Vector3} from './classes/vector3';
export {Vector4} from './classes/vector4';
export {Matrix3} from './classes/matrix3';
export {Matrix4} from './classes/matrix4';
export {Quaternion} from './classes/quaternion';

export type {Vector2Like} from './classes/vector2';
export type {Vector3Like} from './classes/vector3';
export type {Vector4Like} from './classes/vector4';
export type {Matrix3Like} from './classes/matrix3';
export type {Matrix4Like} from './classes/matrix4';

// experimental
export {SphericalCoordinates} from './classes/spherical-coordinates';
export {Pose} from './classes/pose';
export {Euler} from './classes/euler';

export * as _MathUtils from './lib/math-utils';

// lib
export {assert} from './lib/assert';

export {
  // math.gl global utility methods
  config,
  configure,
  formatValue,
  isArray,
  clone,
  equals,
  exactEquals,
  toRadians,
  toDegrees,
  // math.gl "GLSL"-style functions
  radians,
  degrees,
  sin,
  cos,
  tan,
  asin,
  acos,
  atan,
  clamp,
  lerp,
  withEpsilon
} from './lib/common';

// DEPRECATED
export {SphericalCoordinates as _SphericalCoordinates} from './classes/spherical-coordinates';
export {Pose as _Pose} from './classes/pose';
export {Euler as _Euler} from './classes/euler';

/** @deprecated Use Matrix3 */
export * as mat3 from './gl-matrix/mat3';
/** @deprecated Use Matrix4 */
export * as mat4 from './gl-matrix/mat4';
/** @deprecated Use Quaterinion */
export * as quat from './gl-matrix/quat';
/** @deprecated UseVector */
export * as vec2 from './gl-matrix/vec2';
/** @deprecated Use Vector3 */
export * as vec3 from './gl-matrix/vec3';
/** @deprecated Use Vector4 */
export * as vec4 from './gl-matrix/vec4';
