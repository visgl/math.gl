# Transformations

Use `Matrix4` to combine translation, rotation, and scale. Use a quaternion when only rotation is needed. Core vector methods mutate their receiver; matrix transform methods write to a supplied result or allocate a new array.

## Transform points and directions[​](#transform-points-and-directions "Direct link to Transform points and directions")

Points include translation; directions do not:

```
import {Matrix4, Vector3} from '@math.gl/core';



const matrix = new Matrix4().translate([10, 0, 0]);

const point = matrix.transformAsPoint([1, 2, 3]); // [11, 2, 3]

const direction = matrix.transformAsVector([1, 2, 3]); // [1, 2, 3]



const result = new Vector3();

matrix.transformAsPoint([1, 2, 3], result); // Reuses result
```

For four-component homogeneous coordinates, use `matrix.transform(vector4)`. See [homogeneous coordinates](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/homogeneous-coordinates.md) for the role of `w` and perspective division.

## Compose transforms[​](#compose-transforms "Direct link to Compose transforms")

`translate()`, `rotateX/Y/Z()`, and `scale()` multiply a new transform on the right. With column-vector transforms, the rightmost operation acts first:

```
const matrix = new Matrix4()

  .translate([10, 0, 0])

  .rotateZ(Math.PI / 2)

  .scale([2, 2, 2]);



matrix.transformAsPoint([1, 0, 0]); // Approximately [10, 2, 0]
```

This scales the point, rotates it, then translates it. Use `multiplyRight(other)` for `matrix * other`, or `multiplyLeft(other)` for `other * matrix`.

To rotate around a point, translate that point to the origin, rotate, then translate back. See [3D rotations](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/rotations.md) for Euler angles, quaternions, and interpolation.

## Inspect a transform[​](#inspect-a-transform "Direct link to Inspect a transform")

`getTranslation()` and `getScale()` extract translation and axis magnitudes. `getRotation()` and `getRotationMatrix3()` extract a normalized rotation matrix from transforms composed of translation, rotation, and positive uniform scale. Rotation extraction does not reliably remove nonuniform scale and is not a general decomposition of shear or reflection.

```
const matrix = new Matrix4().translate([10, 10, 0]).rotateX(Math.PI / 4).scale(5);

matrix.getScale(); // [5, 5, 5]

matrix.getTranslation(); // [10, 10, 0]
```

See [Matrix4](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/matrix4.md) for the complete API.
