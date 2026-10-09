# Quaternion

![From v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

`Quaternion` extends JavaScript `Array` through its core base classes.

Stores quaternion components as `[x, y, z, w]`. Use unit quaternions for rotations, composition, and interpolation. Methods mutate the receiver unless stated otherwise; angles are radians.

## Usage[​](#usage "Direct link to Usage")

```
import {Quaternion} from '@math.gl/core';
```

## Members[​](#members "Direct link to Members")

### x, y, z, w[​](#x-y-z-w "Direct link to x, y, z, w")

Gets or sets element 0, 1, 2 or 3 respectively

## Methods[​](#methods "Direct link to Methods")

Many of the most commonly used methods are inherited from [`MathArray`](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/math-array.md):

* `quaternion.clone()`
* `quaternion.copy(array)`
* `quaternion.set(...args)`
* `quaternion.fromArray(array, offset = 0)`
* `quaternion.toString()`
* `quaternion.toArray(array = [], offset = 0)`
* `quaternion.equals(array)`
* `quaternion.exactEquals(array)`
* `quaternion.validate()`
* `quaternion.check()`
* `quaternion.normalize()`

Note that `Quaternion` is a subclass of the built in JavaScript `Array` and can thus technically be supplied as a parameter to any function expecting an `Array`.

### constructor[​](#constructor "Direct link to constructor")

`constructor(x = 0, y = 0, z = 0, w = 1)`

### fromMatrix3(m: number\[9]): this[​](#frommatrix3m-number9-this "Direct link to fromMatrix3(m: number\[9]): this")

Creates a quaternion from the given 3x3 rotation matrix. NOTE: The resultant quaternion is not normalized, so you should be sure to renormalize the quaternion yourself where necessary.

`fromMatrix3(m)`

### fromEuler(euler: EulerLike): this[​](#fromeulereuler-eulerlike-this "Direct link to fromEuler(euler: EulerLike): this")

Sets this quaternion from Euler angles and returns it. `EulerLike` is a structural type containing numeric `x`, `y`, and `z` fields plus an `order` string.

### fromAxisRotation(axis, radians): this[​](#fromaxisrotationaxis-radians-this "Direct link to fromAxisRotation(axis, radians): this")

Set a rotation from a normalized axis and an angle in radians. `setAxisAngle(axis, radians)` is an alias.

### identity(): this[​](#identity-this "Direct link to identity(): this")

Set the identity rotation `[0, 0, 0, 1]`.

### len(): number[​](#len-number "Direct link to len(): number")

Return the quaternion magnitude. `length` is the array component count.

### lengthSquared(): number[​](#lengthsquared-number "Direct link to lengthSquared(): number")

Return the squared magnitude.

### dot(other): number[​](#dotother-number "Direct link to dot(other): number")

Return the dot product with another quaternion.

### rotationTo[​](#rotationto "Direct link to rotationTo")

Sets a quaternion to represent the shortest rotation from one vector to another. Both vectors are assumed to be unit length.

`quaternion.rotationTo(vectorA, vectorB)`

### add[​](#add "Direct link to add")

Adds two quaternions

`quaternion.add(other)`

### calculateW[​](#calculatew "Direct link to calculateW")

Calculates the W component of a quat from the X, Y, and Z components. Any existing W component will be ignored.

`quaternion.calculateW()`

### conjugate[​](#conjugate "Direct link to conjugate")

Calculates the conjugate of a quat If the quaternion is normalized, this function is faster than quat\_inverse and produces the same result.

`quaternion.conjugate()`

### invert(): this[​](#invert-this "Direct link to invert(): this")

Calculates the inverse of a quat

`quaternion.invert()`

### lerp[​](#lerp "Direct link to lerp")

Linearly interpolate components. Use `slerp()` for rotation interpolation.

`quaternion.lerp(a, b, t)`

### multiplyRight(other): this[​](#multiplyrightother-this "Direct link to multiplyRight(other): this")

Set the receiver to `this * other`. `multiply(other)` is an alias.

### multiplyLeft(other): this[​](#multiplyleftother-this "Direct link to multiplyLeft(other): this")

Set the receiver to `other * this`. `premultiply(other)` is an alias.

### normalize[​](#normalize "Direct link to normalize")

Normalize a quat

### rotateX[​](#rotatex "Direct link to rotateX")

Rotates a quaternion by the given angle about the X axis

`rotateX(rad)`

### rotateY[​](#rotatey "Direct link to rotateY")

Rotates a quaternion by the given angle about the Y axis

`rotateY(rad)`

### rotateZ[​](#rotatez "Direct link to rotateZ")

Rotates a quaternion by the given angle about the Z axis

`rotateZ(rad)`

### scale[​](#scale "Direct link to scale")

Scales a quat by a scalar number

`scale(b)`

### set[​](#set "Direct link to set")

Set the components of a quat to the given values

`set(i, j, k, l)`

### setAxisAngle[​](#setaxisangle "Direct link to setAxisAngle")

Sets a quat from the given angle and rotation axis, then returns it.

`setAxisAngle(axis, rad)`

### slerp[​](#slerp "Direct link to slerp")

Performs a spherical linear interpolation between two quaternions

`quaternion.slerp(target, ratio)`

`quaternion.slerp(start, target, ratio)`
