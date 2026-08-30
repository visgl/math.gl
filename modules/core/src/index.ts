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
export {MathArray as _MathArray} from './classes/base/math-array';
export {Matrix as _Matrix} from './classes/base/matrix';
export {Vector as _Vector} from './classes/base/vector';
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
export type {EulerLike, EulerRotationOrder} from './classes/euler-types';

export * as _MathUtils from './lib/math-utils';

// lib
export {assert} from './lib/assert';

export {
  // math.gl global utility methods
  config,
  configure,
  safeMod,
  normalizeAngle,
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
  clamp,
  lerp,
  withEpsilon
} from './lib/common';
