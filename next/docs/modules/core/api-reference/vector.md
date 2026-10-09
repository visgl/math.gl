# Vector

![From v1.1](https://img.shields.io/badge/From-v1.1-blue.svg?style=flat-square)

`Vector` is the base class for [Vector2](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/vector2.md), [Vector3](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/vector3.md), and [Vector4](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/vector4.md). It extends [MathArray](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/math-array.md) and JavaScript `Array`; use a concrete vector class.

## Magnitude and distance[​](#magnitude-and-distance "Direct link to Magnitude and distance")

| Method                                    | Result                               |
| ----------------------------------------- | ------------------------------------ |
| `len()` or `magnitude()`                  | Vector magnitude                     |
| `lengthSquared()` or `magnitudeSquared()` | Squared magnitude                    |
| `distance(other)`                         | Euclidean distance to another vector |
| `distanceSquared(other)`                  | Squared distance                     |
| `dot(other)`                              | Dot product                          |

`vector.length` is the number of components. It is not callable.

## Mutating operations[​](#mutating-operations "Direct link to Mutating operations")

`normalize()` scales a nonzero vector to unit magnitude and leaves a zero vector unchanged. `multiply(...vectors)` and `divide(...vectors)` operate component by component.

Copying, addition, subtraction, scaling, interpolation, comparisons, and validation are documented on [MathArray](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/math-array.md). Mutating methods return the receiver.
