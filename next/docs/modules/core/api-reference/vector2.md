# Vector2

![From v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

A two dimensional vector

## Usage[​](#usage "Direct link to Usage")

```
import {Vector2} from '@math.gl/core';

const vector = new Vector2(1, 1);
```

## Inheritance[​](#inheritance "Direct link to Inheritance")

`Vector2` extends [`Vector`](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/vector.md) extends [`MathArray`](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/math-array.md) extends [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

Many commonly used `Vector2` methods are inherited from `Vector` and `MathArray`:

* `Vector2.clone()`
* `Vector2.copy(array)`
* `Vector2.set(...args)`
* `Vector2.fromArray(array, offset = 0)`
* `Vector2.toString()`
* `Vector2.toArray(array = [], offset = 0)`
* `Vector2.equals(array)`
* `Vector2.exactEquals(array)`
* `Vector2.validate()`
* `Vector2.check()`
* `vector2.normalize()`

Also note that `Vector2` is a subclass of the built in JavaScript `Array` and can thus be used wherever an Array is expected. It can e.g. supplied as a parameter to any function expecting an `Array`.

## Members[​](#members "Direct link to Members")

### x, y[​](#x-y "Direct link to x, y")

Gets or sets element 0 or 1 respectively

### constructor[​](#constructor "Direct link to constructor")

Creates a new, empty `Vector2`, or copies an existing `Vector2`

```
constructor((x = 0), (y = 0));

constructor([x, y]);
```

### set[​](#set "Direct link to set")

`set(x, y)`

### add[​](#add "Direct link to add")

Add zero or more vectors to current vector.

`add(...vectors)`

### subtract[​](#subtract "Direct link to subtract")

Subtract zero or more vectors from current vector

`subtract(...vectors)`

### multiply[​](#multiply "Direct link to multiply")

Multiply zero or more vectors with current vector

`multiply(...vectors)`

### divide[​](#divide "Direct link to divide")

Divide zero or more vectors with current vector

`divide(...vectors)`

### scale[​](#scale "Direct link to scale")

`scale(scale)`

### scaleAndAdd[​](#scaleandadd "Direct link to scaleAndAdd")

`scaleAndAdd(vector, scale)`

### negate[​](#negate "Direct link to negate")

`negate()`

### normalize[​](#normalize "Direct link to normalize")

`normalize()`

### dot[​](#dot "Direct link to dot")

`dot(vector)`

### lerp[​](#lerp "Direct link to lerp")

`lerp(vector, coeff)`

### horizontalAngle[​](#horizontalangle "Direct link to horizontalAngle")

Calculates counterclockwise angle in radians starting from positive x axis

`horizontalAngle()`

Note: returns `Math.atan2(this.y, this.x)`

### verticalAngle[​](#verticalangle "Direct link to verticalAngle")

Calculates clockwise angle in radians starting from positive y axis

`verticalAngle()`

Note: returns `Math.atan2(this.x, this.y)`

### transform(matrix4 : Number\[16]) : this[​](#transformmatrix4--number16--this "Direct link to transform(matrix4 : Number\[16]) : this")

Equivalent to `transformAsPoint`.

### transformAsPoint(matrix4 : Number\[16]) : this[​](#transformaspointmatrix4--number16--this "Direct link to transformAsPoint(matrix4 : Number\[16]) : this")

Transforms this vector by the provided 4x4 matrix as a point (i.e includes translations).

Note: Implicitly extends the vector to `[x, y, 0, 1]` before applying the 4x4 transformation.

### transformAsVector(matrix4 : Number\[16]) : this[​](#transformasvectormatrix4--number16--this "Direct link to transformAsVector(matrix4 : Number\[16]) : this")

Transforms this vector by the provided 4x4 matrix as a vector (i.e does not include translations).

Note: Implicitly extends the vector to `[x, y, 0, 0]` before applying the 4x4 transformation.

### transformByMatrix3(matrix3 : Number\[9]) : this[​](#transformbymatrix3matrix3--number9--this "Direct link to transformByMatrix3(matrix3 : Number\[9]) : this")

Transforms this vector by the provided 3x3 matrix.

### transformByMatrix2x3(matrix2 : Number\[6]) : this[​](#transformbymatrix2x3matrix2--number6--this "Direct link to transformByMatrix2x3(matrix2 : Number\[6]) : this")

Transforms this vector by the provided 2x3 matrix (A pure 2D transform that can incorporate translations).

### transformByMatrix2(matrix2 : Number\[4]) : this[​](#transformbymatrix2matrix2--number4--this "Direct link to transformByMatrix2(matrix2 : Number\[4]) : this")

Transforms this vector by the provided 2x2 matrix.
