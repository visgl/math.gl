# Vector4

![From v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

Stores four numeric components `[x, y, z, w]`. For homogeneous coordinates, W = 1 represents a point and W = 0 represents a direction under an affine transform.

Use `Matrix4.transform(vector4, result)` for a full homogeneous transform. `Vector4.transform(matrix4)` has legacy point-transform behavior: it transforms XYZ with implicit W = 1 and leaves the stored W unchanged. See [homogeneous coordinates](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/homogeneous-coordinates.md) for points, directions, and perspective division.

## Usage[​](#usage "Direct link to Usage")

```
import {Vector4} from '@math.gl/core';

const vector = new Vector4(1, 1, 1, 0);

const point = new Vector4(0, 0, 0, 1);
```

## Inheritance[​](#inheritance "Direct link to Inheritance")

`Vector4` extends [`Vector`](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/vector.md) extends [`MathArray`](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/math-array.md) extends [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

## Members[​](#members "Direct link to Members")

### x, y, z, w[​](#x-y-z-w "Direct link to x, y, z, w")

Gets or sets element 0, 1, 2 or 3 respectively

## Methods[​](#methods "Direct link to Methods")

Many of the most commonly used `Vector2` methods are inherited from [`MathArray`](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/math-array.md):

* `Vector4.clone()`
* `Vector4.copy(array)`
* `Vector4.set(...args)`
* `Vector4.fromArray(array, offset = 0)`
* `Vector4.toString()`
* `Vector4.toArray(array = [], offset = 0)`
* `Vector4.equals(array)`
* `Vector4.exactEquals(array)`
* `Vector4.validate()`
* `Vector4.check()`
* `Vector4.normalize()`

Note that `Vector2` is a subclass of the built in JavaScript `Array` and can thus e.g. be supplied as a parameter to any function expecting an `Array`.

### constructor(x?: number, y?: number, z?: number, w?: number)[​](#constructorx-number-y-number-z-number-w-number "Direct link to constructor(x?: number, y?: number, z?: number, w?: number)")

`new Vector4(x = 0, y = 0, z = 0, w = 0)`

Creates a new, empty `Vector4`

### set(x?: number, y?: number, z?: number, w?: number): thos[​](#setx-number-y-number-z-number-w-number-thos "Direct link to set(x?: number, y?: number, z?: number, w?: number): thos")

Updates a `Vector4`

### distance(vector: number\[4]): number[​](#distancevector-number4-number "Direct link to distance(vector: number\[4]): number")

Returns the distance to the specifed Vector.

### distanceSquared(vector: number\[4]): number[​](#distancesquaredvector-number4-number "Direct link to distanceSquared(vector: number\[4]): number")

Returns the squared distance to the specifed Vector. Fast to calculate than distance and often sufficient for e.g. sorting etc.

### dot(vector: number\[4]): number[​](#dotvector-number4-number "Direct link to dot(vector: number\[4]): number")

Calculates the dot product with the supplied `vector`.

### add(vector: number\[4]): this[​](#addvector-number4-this "Direct link to add(vector: number\[4]): this")

`add(...vectors)`

### subtract(vector: number\[4]): this[​](#subtractvector-number4-this "Direct link to subtract(vector: number\[4]): this")

`subtract(...vectors)`

### multiply(vector: number\[4]): this[​](#multiplyvector-number4-this "Direct link to multiply(vector: number\[4]): this")

`multiply(...vectors)`

### divide(vector: number\[4]): this[​](#dividevector-number4-this "Direct link to divide(vector: number\[4]): this")

`divide(...vectors)`

### scale(vector: number\[4]): this[​](#scalevector-number4-this "Direct link to scale(vector: number\[4]): this")

`scale(scale)`

### negate(): this[​](#negate-this "Direct link to negate(): this")

Negates each element in the vector.

### inverse(): this[​](#inverse-this "Direct link to inverse(): this")

Inverses (`x = 1/x`) each element in the vector.

### normalize(): this[​](#normalize-this "Direct link to normalize(): this")

Normalizes the vector. Same direction but `len()` will now return `1`.

### lerp(vector: number\[4], coefficient: number): this[​](#lerpvector-number4-coefficient-number-this "Direct link to lerp(vector: number\[4], coefficient: number): this")

Linearly interpolates between the vectors current value and the supplied `vector`.

### transform(matrix4: number\[16]): this[​](#transformmatrix4-number16-this "Direct link to transform(matrix4: number\[16]): this")

Transforms XYZ as a three-component point, including translation and perspective division, and leaves the stored W component unchanged. Use `matrix4.transform(vector4, result)` when all four homogeneous components must participate.

### transformByMatrix3(matrix3: number\[9]): this[​](#transformbymatrix3matrix3-number9-this "Direct link to transformByMatrix3(matrix3: number\[9]): this")

Transforms the vector's `x`, `y` and `z` values by the provided 3x3 matrix.

### transformByMatrix2(matrix2: number\[4]): this[​](#transformbymatrix2matrix2-number4-this "Direct link to transformByMatrix2(matrix2: number\[4]): this")

Transform the vector's `x` and `y` values by the provided 2x2 matrix.

### transformByQuaternion(quaternion: number\[4]): this[​](#transformbyquaternionquaternion-number4-this "Direct link to transformByQuaternion(quaternion: number\[4]): this")

Transform the vector by the provided `quaternion`.
