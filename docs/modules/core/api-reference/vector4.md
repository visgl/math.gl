# Vector4

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From v1.0" />
</p>

Stores four numeric components `[x, y, z, w]`. For homogeneous coordinates, W = 1 represents a point and W = 0 represents a direction under an affine transform.


Use `Matrix4.transform(vector4, result)` for a full homogeneous transform. `Vector4.transform(matrix4)` has legacy point-transform behavior: it transforms XYZ with implicit W = 1 and leaves the stored W unchanged. See [homogeneous coordinates](../developer-guide/homogeneous-coordinates.md) for points, directions, and perspective division.

## Usage

```js
import {Vector4} from '@math.gl/core';
const vector = new Vector4(1, 1, 1, 0);
const point = new Vector4(0, 0, 0, 1);
```

## Inheritance

`Vector4` extends [`Vector`](./vector) extends [`MathArray`](./math-array) extends [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

## Members

### x, y, z, w

Gets or sets element 0, 1, 2 or 3 respectively

## Methods

Many of the most commonly used `Vector2` methods are inherited from [`MathArray`](./math-array):

- `Vector4.clone()`
- `Vector4.copy(array)`
- `Vector4.set(...args)`
- `Vector4.fromArray(array, offset = 0)`
- `Vector4.toString()`
- `Vector4.toArray(array = [], offset = 0)`
- `Vector4.equals(array)`
- `Vector4.exactEquals(array)`
- `Vector4.validate()`
- `Vector4.check()`
- `Vector4.normalize()`

Note that `Vector2` is a subclass of the built in JavaScript `Array` and can thus e.g. be supplied as a parameter to any function expecting an `Array`.

### constructor(x?: number, y?: number, z?: number, w?: number)

`new Vector4(x = 0, y = 0, z = 0, w = 0)`

Creates a new, empty `Vector4`

### set(x?: number, y?: number, z?: number, w?: number): thos

Updates a `Vector4`

### distance(vector: number[4]): number

Returns the distance to the specifed Vector.

### distanceSquared(vector: number[4]): number

Returns the squared distance to the specifed Vector. Fast to calculate than distance and often sufficient for e.g. sorting etc.

### dot(vector: number[4]): number

Calculates the dot product with the supplied `vector`.

### add(vector: number[4]): this

`add(...vectors)`

### subtract(vector: number[4]): this

`subtract(...vectors)`

### multiply(vector: number[4]): this

`multiply(...vectors)`

### divide(vector: number[4]): this

`divide(...vectors)`

### scale(vector: number[4]): this

`scale(scale)`

### negate(): this

Negates each element in the vector.

### inverse(): this

Inverses (`x = 1/x`) each element in the vector.

### normalize(): this

Normalizes the vector. Same direction but `len()` will now return `1`.

### lerp(vector: number[4], coefficient: number): this

Linearly interpolates between the vectors current value and the supplied `vector`.

### transform(matrix4: number[16]): this

Transforms XYZ as a three-component point, including translation and perspective division, and leaves the stored W component unchanged. Use `matrix4.transform(vector4, result)` when all four homogeneous components must participate.

### transformByMatrix3(matrix3: number[9]): this

Transforms the vector's `x`, `y` and `z` values by the provided 3x3 matrix.

### transformByMatrix2(matrix2: number[4]): this

Transform the vector's `x` and `y` values by the provided 2x2 matrix.

### transformByQuaternion(quaternion: number[4]): this

Transform the vector by the provided `quaternion`.
