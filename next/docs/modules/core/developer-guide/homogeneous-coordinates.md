# Homogeneous Coordinates

A four-component vector lets a 4×4 matrix represent translation and perspective along with rotation and scale. Use `Vector4` when the homogeneous component `w` must remain explicit.

## Points and directions[​](#points-and-directions "Direct link to Points and directions")

| Value          | Meaning for an affine transform                                 |
| -------------- | --------------------------------------------------------------- |
| `[x, y, z, 1]` | A point: rotation, scale, and translation apply                 |
| `[x, y, z, 0]` | A direction: rotation and scale apply, but translation does not |

A zero W is valid for a direction. It cannot be divided by W to recover a finite Cartesian point.

```
import {Matrix4} from '@math.gl/core';



const matrix = new Matrix4().translate([10, 0, 0]);

matrix.transform([1, 2, 3, 1]); // [11, 2, 3, 1]

matrix.transform([1, 2, 3, 0]); // [1, 2, 3, 0]
```

For three-component inputs, `transformAsPoint()` and `transformAsVector()` make this distinction explicit. See [transformations](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/transformations.md).

## Perspective division[​](#perspective-division "Direct link to Perspective division")

A projective transform can change W. For a result `[x, y, z, w]` with nonzero W, recover Cartesian coordinates as `[x / w, y / w, z / w]`. Scaling all four components by the same nonzero factor represents the same Cartesian point.

`Matrix4.transform()` returns all four components without division. This is useful when passing clip coordinates to a renderer or doing clipping before perspective division. On the CPU, check W before dividing and handle points outside the application's visible domain separately.

See [view and projection matrices](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/view-and-projection.md) for a complete camera example.
