# Matrix3

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.1-blue.svg?style=flat-square" alt="From v1.1" />
</p>

A 3x3 matrix. Any arguments can be plain JavaScript arrays or other `math.gl` objects.

## Usage

```js
import {Matrix3} from '@math.gl/core';
```

Copy a matrix to a `Matrix3` so that it can be manipulated (and mutated) with `Matrix3` methods:

```js
const m = new Matrix3().translate([1, 0]);
```

Invert a matrix

```js
const inverse = matrix.invert();
```

Transform a two-, three-, or four-element vector

```js
const transform = new Matrix3();
const vector2 = transform.transform([1, 2]);
const vector3 = transform.transform([1, 2, 1]);
const vector4 = transform.transform([1, 2, 3, 1]); // Transforms XYZ; preserves W
```

## Inheritance

`Matrix3` extends [Matrix](./matrix.md), [MathArray](./math-array.md), and JavaScript `Array`.

## Methods

Many of the most commonly used methods are inherited from [`MathArray`](./math-array.md):

- `matrix3.clone()`
- `matrix3.copy(array)`
- `matrix3.set(...args)`
- `matrix3.fromArray(array, offset = 0)`
- `matrix3.toString()`
- `matrix3.toArray(array = [], offset = 0)`
- `matrix3.equals(array)`
- `matrix3.exactEquals(array)`
- `matrix3.validate()`
- `matrix3.check()`

Note that `Matrix3` is a subclass of the built in JavaScript `Array` and can thus e.g. be supplied as a parameter to any function expecting an `Array`.

### constructor()

Creates an identity matrix; pass an array to copy its elements.

`new Matrix3()`

### identity(): this

Sets the matrix to the multiplicative identity matrix.

`matrix3.identity()`

### set(...number): this

Sets the elements of the matrix.

`matrix3.set(m00, m01, m02, m10, m11, m12, m20, m21, m22)`

### fromQuaternion(q: Quaternion): this

Sets the matrix to a transformation corresponding to the rotations represented by the given quaternion.

`matrix3.fromQuaternion(quaternion)`

- `quaternion` (`Quaternion`) - the quaternion to create matrix from

### fromMatrix4(matrix4: Matrix4 | number[16]): this

Copies the upper-left 3x3 elements of `matrix4`, including any scale, and returns this matrix. This differs from `Matrix4.getRotationMatrix3()`, which removes scale.

### determinant(): number

Returns the determinant of the matrix (does not modify the matrix).

`const determinant = matrix3.determinant()`

Returns (`Number`) - the determinant

- If the determinant is zero, the matrix is not invertible.
- Determinant calculation is somewhat expensive.

### transpose(): this

Sets this matrix to its transpose matrix.

`matrix3.transpose()`

- The transpose matrix mirrors the original matrix elements in the diagonal.

### invert(): this

Sets this matrix to its inverse matrix.

`matrix3.invert()`

- The inverse matrix times its original matrix is an identity matrix of the same size.

### multiplyLeft(matrix: number[9]): this

Multiplies in another matrix from the left

`matrix3.multiplyLeft(matrix3)`

- When using `Matrix3` to transform vectors, the vectors are multiplied in from the right. This means that the multiplying in a matrix from the left will cause it to be applied last during transformation (unless additional matrices are multiplied in from the left of course).

### multiplyRight(matrix: number[9]): this

`matrix3.multiplyRight(matrix3)`

- When using `Matrix3` to transform vectors, the vectors are multiplied in from the right. This means that the multiplying in a matrix from the left will cause it to be applied last during transformation (unless additional matrices are multiplied in from the left of course).

### rotate(): this

Adds a rotation by the given angle. Equivalent to right multiplying the new transform into the matrix but more performant.

`matrix3.rotate(radians)`

### scale(factor: number[2]): this

Adds a scaling transform, each axis can be scaled independently.

`matrix3.scale(factor)`

- `factor` (Number) - scale factor to be applied to each axis.

`matrix3.scale([x, y])`

- `x` (Number) - scale factor to be multiplied into x component
- `y` (Number) - scale factor to be multiplied into y component

Equivalent to right multiplying the new transform into the matrix but more performant.

- During vector transformation all coordinates will be multiplied with the given factors.
- Scale with `-1` will flip the coordinate system in that axis.
- Scale with `0` will drop that component.

### translate(offset: number[2]): this

Adds a translation to the matrix.

`matrix3.translate([x, y])`

- `x` (Number) - translation to be added to the x component
- `y` (Number) - translation to be added to the y component

Equivalent to right multiplying the new transform into the matrix but more performant.

During vector transformation the given translation values are added to each component of the vector being transformed.

### transform(vector, result?)

Transform a two-, three-, or four-component input. For four components, transform XYZ and preserve W. Write to the supplied result, or allocate a plain array matching the input length. The input is unchanged unless it is also the result.

## Remarks

- All transforms are effectively "right multiplied" onto the matrix (meaning that during transform they will be applied in opposite order).
- `Matrix3` is stored internally in column major format (per WebGL conventions). This only matters when you read out the matrix to use it with other software.
