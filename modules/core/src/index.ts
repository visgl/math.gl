// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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
} from './types';

export type {isTypedArray, isNumberArray, isNumericArray} from './types';

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

export type {SpheroidParameters} from './types';

// Public named exports. Implementations remain in independently tree-shakable files.
export {
  createLocalFrameBasis,
  eastNorthUpBasis,
  eastNorthUpBasisFromDirections,
  localToFixed,
  fixedToLocal,
  localFrameToMatrix
} from './local-frame';
export type {LocalFramePoint, LocalFrameAxis, LocalFrameBasis} from './local-frame';
export {spheroidToCartesian, cartesianToSpheroid} from './spheroid';
export type {SpheroidGeometry, SpheroidPoint} from './spheroid';
export {
  isUint16Array,
  NativeFloat16ArrayConstructor,
  getFloat16ArrayConstructor,
  isFloat16ArrayConstructor,
  isFloat16Array
} from './types';
export type {
  BigTypedArray,
  BigTypedArrayConstructor,
  NumberArray1,
  NumericArray1,
  NumericArray2,
  NumericArray3,
  NumericArray4,
  NumericArray6,
  NumericArray8,
  NumericArray9,
  NumericArray12,
  NumericArray16,
  Bounds,
  Bounds2D,
  Bounds3D
} from './types';
export {
  ExpressionFunctionRegistry,
  addBinaryOp,
  addUnaryOp,
  compile,
  compileAsync,
  eval,
  evalAsync,
  parse,
  BASIC_MATH_FUNCTION_LIBRARY,
  mergeFunctionLibraries,
  parseExpressionString
} from './expressions/index';
export type {
  ExpressionEvaluationOptions,
  ExpressionFunction,
  ExpressionFunctionLibrary,
  FunctionRegistrationOptions,
  BinaryOperator,
  Expression,
  ExpressionContext,
  UnaryOperator,
  AccessorFunction
} from './expressions/index';

export * as mat3 from './mat3';
export * as mat4 from './mat4';
export * as quat from './quat';
export * as vec2 from './vec2';
export * as vec3 from './vec3';
export * as vec4 from './vec4';

// Individual operations avoid retaining a whole namespace in selective bundles.
export {
  create as mat3Create,
  fromMat4 as mat3FromMat4,
  clone as mat3Clone,
  copy as mat3Copy,
  fromValues as mat3FromValues,
  set as mat3Set,
  identity as mat3Identity,
  transpose as mat3Transpose,
  invert as mat3Invert,
  adjoint as mat3Adjoint,
  determinant as mat3Determinant,
  multiply as mat3Multiply,
  translate as mat3Translate,
  rotate as mat3Rotate,
  scale as mat3Scale,
  fromTranslation as mat3FromTranslation,
  fromRotation as mat3FromRotation,
  fromScaling as mat3FromScaling,
  fromMat2d as mat3FromMat2d,
  fromQuat as mat3FromQuat,
  normalFromMat4 as mat3NormalFromMat4,
  projection as mat3Projection,
  str as mat3Str,
  frob as mat3Frob,
  add as mat3Add,
  subtract as mat3Subtract,
  multiplyScalar as mat3MultiplyScalar,
  multiplyScalarAndAdd as mat3MultiplyScalarAndAdd,
  exactEquals as mat3ExactEquals,
  equals as mat3Equals,
  mul as mat3Mul,
  sub as mat3Sub
} from './mat3';
export {
  create as mat4Create,
  clone as mat4Clone,
  copy as mat4Copy,
  fromValues as mat4FromValues,
  set as mat4Set,
  identity as mat4Identity,
  transpose as mat4Transpose,
  invert as mat4Invert,
  adjoint as mat4Adjoint,
  determinant as mat4Determinant,
  multiply as mat4Multiply,
  translate as mat4Translate,
  scale as mat4Scale,
  rotate as mat4Rotate,
  rotateX as mat4RotateX,
  rotateY as mat4RotateY,
  rotateZ as mat4RotateZ,
  fromTranslation as mat4FromTranslation,
  fromScaling as mat4FromScaling,
  fromRotation as mat4FromRotation,
  fromXRotation as mat4FromXRotation,
  fromYRotation as mat4FromYRotation,
  fromZRotation as mat4FromZRotation,
  fromRotationTranslation as mat4FromRotationTranslation,
  fromQuat2 as mat4FromQuat2,
  getTranslation as mat4GetTranslation,
  getScaling as mat4GetScaling,
  getRotation as mat4GetRotation,
  decompose as mat4Decompose,
  fromRotationTranslationScale as mat4FromRotationTranslationScale,
  fromRotationTranslationScaleOrigin as mat4FromRotationTranslationScaleOrigin,
  fromQuat as mat4FromQuat,
  frustum as mat4Frustum,
  perspectiveNO as mat4PerspectiveNO,
  perspectiveZO as mat4PerspectiveZO,
  perspectiveFromFieldOfView as mat4PerspectiveFromFieldOfView,
  orthoNO as mat4OrthoNO,
  orthoZO as mat4OrthoZO,
  lookAt as mat4LookAt,
  targetTo as mat4TargetTo,
  str as mat4Str,
  frob as mat4Frob,
  add as mat4Add,
  subtract as mat4Subtract,
  multiplyScalar as mat4MultiplyScalar,
  multiplyScalarAndAdd as mat4MultiplyScalarAndAdd,
  exactEquals as mat4ExactEquals,
  equals as mat4Equals,
  perspective as mat4Perspective,
  ortho as mat4Ortho,
  mul as mat4Mul,
  sub as mat4Sub
} from './mat4';
export {
  create as quatCreate,
  identity as quatIdentity,
  setAxisAngle as quatSetAxisAngle,
  getAxisAngle as quatGetAxisAngle,
  getAngle as quatGetAngle,
  multiply as quatMultiply,
  rotateX as quatRotateX,
  rotateY as quatRotateY,
  rotateZ as quatRotateZ,
  calculateW as quatCalculateW,
  exp as quatExp,
  ln as quatLn,
  pow as quatPow,
  slerp as quatSlerp,
  invert as quatInvert,
  conjugate as quatConjugate,
  fromMat3 as quatFromMat3,
  str as quatStr,
  equals as quatEquals,
  clone as quatClone,
  fromValues as quatFromValues,
  copy as quatCopy,
  set as quatSet,
  add as quatAdd,
  mul as quatMul,
  scale as quatScale,
  dot as quatDot,
  lerp as quatLerp,
  length as quatLength,
  len as quatLen,
  squaredLength as quatSquaredLength,
  sqrLen as quatSqrLen,
  normalize as quatNormalize,
  exactEquals as quatExactEquals,
  rotationTo as quatRotationTo,
  sqlerp as quatSqlerp,
  setAxes as quatSetAxes
} from './quat';
export {
  create as vec2Create,
  clone as vec2Clone,
  fromValues as vec2FromValues,
  copy as vec2Copy,
  set as vec2Set,
  add as vec2Add,
  subtract as vec2Subtract,
  multiply as vec2Multiply,
  divide as vec2Divide,
  ceil as vec2Ceil,
  floor as vec2Floor,
  min as vec2Min,
  max as vec2Max,
  round as vec2Round,
  scale as vec2Scale,
  scaleAndAdd as vec2ScaleAndAdd,
  distance as vec2Distance,
  squaredDistance as vec2SquaredDistance,
  length as vec2Length,
  squaredLength as vec2SquaredLength,
  negate as vec2Negate,
  inverse as vec2Inverse,
  normalize as vec2Normalize,
  dot as vec2Dot,
  cross as vec2Cross,
  lerp as vec2Lerp,
  random as vec2Random,
  transformMat2 as vec2TransformMat2,
  transformMat2d as vec2TransformMat2d,
  transformMat3 as vec2TransformMat3,
  transformMat4 as vec2TransformMat4,
  rotate as vec2Rotate,
  angle as vec2Angle,
  zero as vec2Zero,
  str as vec2Str,
  exactEquals as vec2ExactEquals,
  equals as vec2Equals,
  len as vec2Len,
  sub as vec2Sub,
  mul as vec2Mul,
  div as vec2Div,
  dist as vec2Dist,
  sqrDist as vec2SqrDist,
  sqrLen as vec2SqrLen,
  forEach as vec2ForEach
} from './vec2';
export {
  create as vec3Create,
  clone as vec3Clone,
  length as vec3Length,
  fromValues as vec3FromValues,
  copy as vec3Copy,
  set as vec3Set,
  add as vec3Add,
  subtract as vec3Subtract,
  multiply as vec3Multiply,
  divide as vec3Divide,
  ceil as vec3Ceil,
  floor as vec3Floor,
  min as vec3Min,
  max as vec3Max,
  round as vec3Round,
  scale as vec3Scale,
  scaleAndAdd as vec3ScaleAndAdd,
  distance as vec3Distance,
  squaredDistance as vec3SquaredDistance,
  squaredLength as vec3SquaredLength,
  negate as vec3Negate,
  inverse as vec3Inverse,
  normalize as vec3Normalize,
  dot as vec3Dot,
  cross as vec3Cross,
  lerp as vec3Lerp,
  slerp as vec3Slerp,
  hermite as vec3Hermite,
  bezier as vec3Bezier,
  random as vec3Random,
  transformMat4 as vec3TransformMat4,
  transformMat3 as vec3TransformMat3,
  transformQuat as vec3TransformQuat,
  rotateX as vec3RotateX,
  rotateY as vec3RotateY,
  rotateZ as vec3RotateZ,
  angle as vec3Angle,
  zero as vec3Zero,
  str as vec3Str,
  exactEquals as vec3ExactEquals,
  equals as vec3Equals,
  sub as vec3Sub,
  mul as vec3Mul,
  div as vec3Div,
  dist as vec3Dist,
  sqrDist as vec3SqrDist,
  len as vec3Len,
  sqrLen as vec3SqrLen,
  forEach as vec3ForEach
} from './vec3';
export {
  create as vec4Create,
  clone as vec4Clone,
  fromValues as vec4FromValues,
  copy as vec4Copy,
  set as vec4Set,
  add as vec4Add,
  subtract as vec4Subtract,
  multiply as vec4Multiply,
  divide as vec4Divide,
  ceil as vec4Ceil,
  floor as vec4Floor,
  min as vec4Min,
  max as vec4Max,
  round as vec4Round,
  scale as vec4Scale,
  scaleAndAdd as vec4ScaleAndAdd,
  distance as vec4Distance,
  squaredDistance as vec4SquaredDistance,
  length as vec4Length,
  squaredLength as vec4SquaredLength,
  negate as vec4Negate,
  inverse as vec4Inverse,
  normalize as vec4Normalize,
  dot as vec4Dot,
  cross as vec4Cross,
  lerp as vec4Lerp,
  random as vec4Random,
  transformMat4 as vec4TransformMat4,
  transformQuat as vec4TransformQuat,
  zero as vec4Zero,
  str as vec4Str,
  exactEquals as vec4ExactEquals,
  equals as vec4Equals,
  sub as vec4Sub,
  mul as vec4Mul,
  div as vec4Div,
  dist as vec4Dist,
  sqrDist as vec4SqrDist,
  len as vec4Len,
  sqrLen as vec4SqrLen,
  forEach as vec4ForEach
} from './vec4';
