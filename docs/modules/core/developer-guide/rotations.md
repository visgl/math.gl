# 3D Rotations

Use `Euler` angles to specify an orientation, `Quaternion` to compose or interpolate rotations, and `Matrix4` to combine rotation with translation and scale. All rotation angles in math.gl are in radians.

## Choose a representation

| Representation | Use it for |
| --- | --- |
| Euler angles | Orientations expressed as rotations around the X, Y, and Z axes |
| Axis and angle | A rotation around a known axis, converted with `Quaternion.fromAxisRotation()` |
| Unit quaternion | Composing rotations and smoothly interpolating orientations |
| Matrix4 | Applying rotation together with other transforms |

## Specify and apply a rotation

Convert Euler angles to a quaternion, then transform a vector directly or build a matrix:

```js
import {Euler, Quaternion, Matrix4, Vector3} from '@math.gl/core';

const euler = new Euler(0, 0, Math.PI / 2, 'xyz');
const rotation = new Quaternion().fromEuler(euler);
const rotated = new Vector3(1, 0, 0).transformByQuaternion(rotation);
// Approximately [0, 1, 0]

const matrix = new Matrix4().fromQuaternion(rotation);
const transformed = matrix.transformAsVector([1, 0, 0]);
```

For an axis-angle rotation, use a normalized axis:

```js
const rotation = new Quaternion().fromAxisRotation([0, 0, 1], Math.PI / 2);
```

## Compose and interpolate

Rotation order matters: applying X then Y generally differs from applying Y then X. Use `multiplyRight()` or `multiplyLeft()` to make the composition order explicit. With column-vector transforms, `A * B` applies B first, then A.

For smooth orientation changes, interpolate unit quaternions with `slerp()`:

```js
const start = new Quaternion(); // Identity rotation
const target = new Quaternion().fromEuler(new Euler(0, Math.PI / 2, 0, 'xyz'));
const halfway = new Quaternion().slerp(start, target, 0.5);
```

Avoid interpolating Euler components for general orientation changes: angle wrapping and gimbal lock can produce unexpected paths. Normalize quaternions constructed from arbitrary components before using them as rotations.

## Euler conventions

math.gl uses intrinsic Tait-Bryan angles: rotations around the local axes. Specify the order explicitly when exchanging orientations with another library. Supported orders are `'xyz'`, `'xzy'`, `'yxz'`, `'yzx'`, `'zxy'`, and `'zyx'`; the default is `'zyx'`.

To convert back, use `new Euler().fromQuaternion(rotation, 'xyz')`. The resulting angles describe the orientation but may differ from the original angles because Euler representations are not unique.

See [Euler](../api-reference/euler.md), [Quaternion](../api-reference/quaternion.md), and [Matrix4](../api-reference/matrix4.md) for the complete APIs.
