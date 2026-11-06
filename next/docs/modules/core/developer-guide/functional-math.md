# Functional math

The class and functional APIs share array-compatible storage, but expose different operations. Use classes for mutable objects and the functional API when an operation is absent from a class or when callers own the output buffers.

## Imports and output ownership[​](#imports-and-output-ownership "Direct link to Imports and output ownership")

Import namespaces or individual operations from the package root:

```
import {Matrix4, mat4, mat4FromRotationTranslationScale} from '@math.gl/core';



const rotation = [0, 0, 0, 1]; // Quaternion: x, y, z, w

const translation = [1, 2, 3];

const scale = [2, 3, 4];

const model = new Matrix4();

mat4FromRotationTranslationScale(model, rotation, translation, scale);



// The namespace exposes the same operation.

const copy = new Float64Array(16);

mat4.copy(copy, model);
```

The former imports such as `@math.gl/core/mat4` are no longer exported in v5. Individual exports such as `mat4Copy` also allow selective imports without passing a namespace object around.

Output-writing functions take the destination first. Supply an array or typed array with enough elements; the operation mutates it. Other functions, such as `quatGetAngle(a, b)`, return a scalar and have no output argument. Constructors such as `mat4Create()` allocate storage. Check each operation's aliasing and failure behavior before reusing an input as its destination. Functional operations do not provide the class API's optional debug validation.

## Find an existing operation[​](#find-an-existing-operation "Direct link to Find an existing operation")

| Task                                               | Namespace operation                                                        | Individual export                        |
| -------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| Compose translation, quaternion rotation and scale | `mat4.fromRotationTranslationScale(out, q, position, scale)`               | `mat4FromRotationTranslationScale`       |
| Compose around a pivot                             | `mat4.fromRotationTranslationScaleOrigin(out, q, position, scale, origin)` | `mat4FromRotationTranslationScaleOrigin` |
| Compute a normal matrix                            | `mat3.normalFromMat4(out, model)`                                          | `mat3NormalFromMat4`                     |
| Perspective depth in \[0, 1]                       | `mat4.perspectiveZO(out, fovy, aspect, near, far)`                         | `mat4PerspectiveZO`                      |
| Orthographic depth in \[0, 1]                      | `mat4.orthoZO(out, left, right, bottom, top, near, far)`                   | `mat4OrthoZO`                            |
| Perspective or orthographic depth in \[-1, 1]      | `mat4.perspectiveNO`, `mat4.orthoNO`                                       | `mat4PerspectiveNO`, `mat4OrthoNO`       |
| Angular distance between unit quaternions          | `quat.getAngle(a, b)`                                                      | `quatGetAngle`                           |
| Rotation between unit directions                   | `quat.rotationTo(out, a, b)`                                               | `quatRotationTo`                         |
| Vector spherical interpolation                     | `vec3.slerp(out, a, b, t)`                                                 | `vec3Slerp`                              |
| Cubic Bézier evaluation                            | `vec3.bezier(out, start, control1, control2, end, t)`                      | `vec3Bezier`                             |
| Cubic Hermite evaluation                           | `vec3.hermite(out, start, startTangent, endTangent, end, t)`               | `vec3Hermite`                            |

Quaternion angles are radians. `quatGetAngle` and `quatRotationTo` require unit inputs. Use unit directions for `vec3Slerp`; it does not normalize its inputs. Its current formula has no special branch for coincident or opposite directions, so callers must handle those cases before interpolation. Quaternion interpolation has different edge-case handling.

## Transform normals[​](#transform-normals "Direct link to Transform normals")

Normals need the inverse transpose of the linear part of the model matrix, especially with nonuniform scale. Copying its upper-left 3x3 block is not equivalent.

```
import {mat3NormalFromMat4, vec3TransformMat3, vec3Normalize} from '@math.gl/core';



const normalMatrix = new Float64Array(9);

const normal = [0, 0, 1];

const transformedNormal = new Float64Array(3);



if (mat3NormalFromMat4(normalMatrix, model) !== null) {

  vec3TransformMat3(transformedNormal, normal, normalMatrix);

  vec3Normalize(transformedNormal, transformedNormal);

}
```

A singular input returns `null`; do not consume the output as a newly computed normal matrix in that case. See [Matrix3](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/matrix3.md).

## Decomposition limits[​](#decomposition-limits "Direct link to Decomposition limits")

`mat4Decompose(rotationOut, translationOut, scaleOut, matrix)` exists, as does `mat4.decompose`. Their current implementation is not a reliable general inverse of composition: reflected transforms lose the scale sign, rotated nonuniform scales can produce an incorrect rotation, and zero scale can produce non-finite values. `mat4GetRotation` also needs qualification for scaled transforms. Keep the original rotation and scale when those cases matter rather than reconstructing them with these functions. Sheared matrices need an explicit decomposition contract as well.

## Geometry queries and curves[​](#geometry-queries-and-curves "Direct link to Geometry queries and curves")

Use the geometry package for operations beyond vector and matrix arithmetic:

* [Ray and triangle queries](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/queries.md): `intersectRayBounds`, `intersectRayTriangle`, `getClosestPointOnTriangle`, `getClosestPointsOnSegments`, and `getClosestPointsSegmentTriangle` are exported from `@math.gl/geometry` and `@math.gl/geometry/culling`.
* [Curves](https://visgl.github.io/math.gl/next/docs/modules/geometry/curves/api-reference/curves.md): line, quadratic/cubic Bézier, Hermite and Catmull–Rom curves are exported from `@math.gl/geometry`.
* [CurveArcLength](https://visgl.github.io/math.gl/next/docs/modules/geometry/curves/api-reference/curve-arc-length.md) maps distance fractions to parameters using a sampled length approximation. It is different from evaluating a timestamped animation track.

See [view and projection](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/view-and-projection.md) for depth conventions and [performance](https://visgl.github.io/math.gl/next/docs/developer-guide/performance.md) for output reuse.
