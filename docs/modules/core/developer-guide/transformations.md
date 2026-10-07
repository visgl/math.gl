# Transformations

Use `Matrix4` to combine translation, rotation, and scale. Use a quaternion when only rotation is needed. Core vector methods mutate their receiver; matrix transform methods write to a supplied result or allocate a new array.

## Transform points and directions

Points include translation; directions do not:

```js
import {Matrix4, Vector3} from '@math.gl/core';

const matrix = new Matrix4().translate([10, 0, 0]);
const point = matrix.transformAsPoint([1, 2, 3]); // [11, 2, 3]
const direction = matrix.transformAsVector([1, 2, 3]); // [1, 2, 3]

const result = new Vector3();
matrix.transformAsPoint([1, 2, 3], result); // Reuses result
```

For four-component homogeneous coordinates, use `matrix.transform(vector4)`. See [homogeneous coordinates](./homogeneous-coordinates.md) for the role of `w` and perspective division.

## Compose transforms

`translate()`, `rotateX/Y/Z()`, and `scale()` multiply a new transform on the right. With column-vector transforms, the rightmost operation acts first:

```js
const matrix = new Matrix4()
  .translate([10, 0, 0])
  .rotateZ(Math.PI / 2)
  .scale([2, 2, 2]);

matrix.transformAsPoint([1, 0, 0]); // Approximately [10, 2, 0]
```

This scales the point, rotates it, then translates it. Use `multiplyRight(other)` for `matrix * other`, or `multiplyLeft(other)` for `other * matrix`.

To rotate around a point, translate that point to the origin, rotate, then translate back. See [3D rotations](./rotations.md) for Euler angles, quaternions, and interpolation.

## Inspect a transform

`getTranslation()` and `getScale()` extract translation and axis magnitudes. `getRotation()` and `getRotationMatrix3()` extract the normalized rotation matrix. These are useful for transforms composed from translation, rotation, and positive scale; they are not a general decomposition of shear or reflection.

```js
const matrix = new Matrix4().translate([10, 10, 0]).rotateX(Math.PI / 4).scale(5);
matrix.getScale(); // [5, 5, 5]
matrix.getTranslation(); // [10, 10, 0]
```

See [Matrix4](../api-reference/matrix4.md) for the complete API.
