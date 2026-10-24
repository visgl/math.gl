# Vector3

![From v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

`Vector3` extends JavaScript `Array` through its core base classes.

## Usage[​](#usage "Direct link to Usage")

```
import {Vector3} from '@math.gl/core';

const vector = new Vector3(1, 1, 1);
```

Accessors

```
v.x = 2;

assert(v[0] === v.x);
```

Simple rotations

```
const v = new Vector3([1, 0, 0]);

v.rotateX({radians: Math.PI / 4}); // Rotate around the origin

v.rotateX({radians: Math.PI / 4, origin: [1, 1, 0]}); // Rotate around the specified point
```

Scaling with constants

```
const u = v.scale(-1); // Reverse direction vector
```

Scaling with vectors is very flexible, you can e.g. set a component to zero, or flip a component's sign.

```
const u = v.scale([1, 1, 0]); // Set z component to zero

const w = v.scale([1, -1, 1]); // Flip y component
```

## Inheritance[​](#inheritance "Direct link to Inheritance")

`Vector3` extends [`Vector`](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/vector.md) extends [`MathArray`](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/math-array.md) extends [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

## Members[​](#members "Direct link to Members")

### x, y, z[​](#x-y-z "Direct link to x, y, z")

Gets or sets element 0, 1 or 2 respectively

## Methods[​](#methods "Direct link to Methods")

Many of the most commonly used `Vector3` methods are inherited from [`MathArray`](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/math-array.md):

* `Vector3.clone()`
* `Vector3.copy(array)`
* `Vector3.set(...args)`
* `Vector3.fromArray(array, offset = 0)`
* `Vector3.toString()`
* `Vector3.toArray(array = [], offset = 0)`
* `Vector3.equals(array)`
* `Vector3.exactEquals(array)`
* `Vector3.validate()`
* `Vector3.check()`
* `Vector3.normalize()`

Note that `Vector3` is a subclass of the built in JavaScript `Array` and can thus e.g. be supplied as a parameter to any function expecting an `Array`.

### constructor(x = 0, y = 0, z = 0)[​](#constructorx--0-y--0-z--0 "Direct link to constructor(x = 0, y = 0, z = 0)")

### set(x, y, z)[​](#setx-y-z "Direct link to set(x, y, z)")

### len()[​](#len "Direct link to len()")

Returns the magnitude. `length` is the array component count.

### distance(vector)[​](#distancevector "Direct link to distance(vector)")

### angle(vector)[​](#anglevector "Direct link to angle(vector)")

### dot(vector)[​](#dotvector "Direct link to dot(vector)")

// MODIFIERS

### add(...vectors)[​](#addvectors "Direct link to add(...vectors)")

### subtract(...vectors)[​](#subtractvectors "Direct link to subtract(...vectors)")

### multiply(...vectors)[​](#multiplyvectors "Direct link to multiply(...vectors)")

### divide(...vectors)[​](#dividevectors "Direct link to divide(...vectors)")

### scale(scale)[​](#scalescale "Direct link to scale(scale)")

Scale component wise with a scalar or another `Vector3`.

* `scale` (Number|Vector3) - scale component wise with a scalar or another `Vector3`.

### negate[​](#negate "Direct link to negate")

`negate()`

### inverse[​](#inverse "Direct link to inverse")

`inverse()`

### normalize[​](#normalize "Direct link to normalize")

`normalize()`

### cross[​](#cross "Direct link to cross")

`cross(vector)`

### lerp[​](#lerp "Direct link to lerp")

`lerp(vector, coeff)`

### rotateX[​](#rotatex "Direct link to rotateX")

Rotate a 3D vector around the x-axis

`rotateX({radians, origin})`

* `radians` (Number) - angle to rotate.
* `origin`=`[0, 0, 0]` (Vector3) - the origin of the rotation (optional)

### rotateY[​](#rotatey "Direct link to rotateY")

Rotate a 3D vector around the y-axis

`rotateY({radians, origin})`

* `radians` (Number) - angle to rotate.
* `origin`=`[0, 0, 0]` (Vector3) - the origin of the rotation (optional)

### rotateZ(radians)[​](#rotatezradians "Direct link to rotateZ(radians)")

Rotate a 3D vector around the z-axis

`rotateZ({radians, origin})`

* `radians` (Number) - angle to rotate.
* `origin`=`[0, 0, 0]` (Vector3) - the origin of the rotation (optional)

### transform(matrix4 : Number\[16]) : this[​](#transformmatrix4--number16--this "Direct link to transform(matrix4 : Number\[16]) : this")

Transforms the vector by the provided 4x4 matrix.

Note: Scales the resulting vector to ensure that `w`, if non-zero, is set to `1`.

### transformByMatrix3(matrix3 : Number\[9]) : this[​](#transformbymatrix3matrix3--number9--this "Direct link to transformByMatrix3(matrix3 : Number\[9]) : this")

Transforms the vector by the provided 3x3 matrix.

### transformByMatrix2(matrix2 : Number\[4]) : this[​](#transformbymatrix2matrix2--number4--this "Direct link to transformByMatrix2(matrix2 : Number\[4]) : this")

Transform the vector's `x` and `y` values by the provided 2x2 matrix.

### transformByQuaternion(quaternion : Number\[4]) : this[​](#transformbyquaternionquaternion--number4--this "Direct link to transformByQuaternion(quaternion : Number\[4]) : this")

Transform the vector by the provided `quaternion`.
