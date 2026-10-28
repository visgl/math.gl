# Overview

![From v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

`@math.gl/core` provides array-based vectors, matrices, quaternions, and coordinate helpers. Use it to compose transforms, rotate geometry, and work with reusable numeric objects.

The optional [`@math.gl/core/tasks`](https://visgl.github.io/math.gl/next/docs/modules/core/tasks.md) entry provides typed worker processing, bounded scheduling, persistent resources, cancellation, and shared state.

Shared types and expression parsing are available at `@math.gl/core` and `@math.gl/core`. The basic math expression library is included there; geospatial and DGGS expression functions live at `@math.gl/geospatial` and `@math.gl/dggs`.

<!-- -->

## Feature support[​](#feature-support "Direct link to Feature support")

Core numerical capabilities for graphics, transforms, and reusable coordinate objects.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature                                                | math.gl support    | Notes                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vectors and small dense matrices                       | ✅ Implemented     | [Vector2/3/4](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/vector.md) and [Matrix3/4](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/matrix.md), with mutable array-compatible storage.                                     |
| Quaternion and Euler rotations                         | ✅ Implemented     | [Quaternions](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/quaternion.md), [Euler angles](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/euler.md), interpolation, and rotation-order conventions.                          |
| Rigid poses and local frames                           | ✅ Implemented     | [Pose](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/pose.md) and [local frames](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/local-frame.md); units and coordinate conventions remain explicit.                           |
| Spherical and spheroid coordinates                     | ✅ Implemented     | [SphericalCoordinates](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/spherical-coordinates.md) and [spheroid conversions](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/spheroid.md) within their documented shape domains. |
| Reusable outputs and numeric interoperability          | ✅ Implemented     | [MathArray](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/math-array.md) operations interoperate with arrays and typed arrays; individual methods document ownership.                                                                                           |
| Expressions and worker execution                       | ✅ Implemented     | Optional [expression](https://visgl.github.io/math.gl/next/docs/modules/core/expressions.md) and [task](https://visgl.github.io/math.gl/next/docs/modules/core/tasks.md) capabilities have their own contracts and feature cards.                                         |
| General dense/sparse linear algebra                    | ❌ Not implemented | No public general-size QR/SVD, sparse factorization, or tensor engine. The matrix classes target graphics-sized transforms.                                                                                                                                                                         |
| Arbitrary-precision arithmetic and autodifferentiation | ❌ Not implemented | Numerical classes use JavaScript numbers; no arbitrary-precision scalar or gradient-tape backend.                                                                                                                                                                                                   |
| Built-in SIMD, WASM, or GPU numeric backend            | ❌ Not implemented | CPU JavaScript math is implemented; accelerated numerical backends remain [roadmap research](https://github.com/visgl/math.gl/blob/master/dev-docs/ROADMAP.md). Worker scheduling is a separate capability.                                                                                         |

## Core transforms[​](#core-transforms "Direct link to Core transforms")

Loading <!-- -->Core transforms<!-- -->…

⛶⛶ Explore fullscreen

[Open the interactive example](https://visgl.github.io/math.gl/next/examples/core-transforms).

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/core
```

## Classes[​](#classes "Direct link to Classes")

| Class                  | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `Vector2`              | Two element vector, inherits from `Array`             |
| `Vector3`              | Three element vector, inherits from `Array`           |
| `Vector4`              | Four element vector, inherits from `Array`            |
| `Matrix3`              | 3x3 matrix, inherits from `Array`                     |
| `Matrix4`              | 4x4 matrix, inherits from `Array`                     |
| `Quaternion`           | Quaternion in `[x,y,z,w]` form, inherits from `Array` |
| `Pose`                 | Position and orientation with transformation matrices |
| `Euler`                | 3 Euler angles and rotation order                     |
| `SphericalCoordinates` | 2 rotations and a radius                              |

## Usage[​](#usage "Direct link to Usage")

```
import {Vector2} from '@math.gl/core';

const vector = new Vector2(1, 2);

const x = vector[0];

const y = vector[1];
```

## Conventions[​](#conventions "Direct link to Conventions")

* Arithmetic methods usually mutate the receiver and return it. Clone an object before modifying it when the original is needed.
* Vector components are accessible by index and by name, such as `vector[0]` and `vector.x`.
* Matrices store elements in column-major order. Rotations use radians; Euler orders are lowercase strings.
* Matrix transform methods allocate a result array unless an output is supplied. See [performance](https://visgl.github.io/math.gl/next/docs/developer-guide/performance.md) for reuse patterns.
* Enable optional validation with `configure({debug: true})`. See [debugging](https://visgl.github.io/math.gl/next/docs/developer-guide/debugging.md) for checks and formatting.

## Learn core math[​](#learn-core-math "Direct link to Learn core math")

Start with [transformations](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/transformations.md) and [3D rotations](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/rotations.md). The guides also cover [coordinate systems](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/coordinate-systems.md), [homogeneous coordinates](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/homogeneous-coordinates.md), [view and projection matrices](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/view-and-projection.md), and [floating point](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/floating-point.md).

## Numeric local frames[​](#numeric-local-frames "Direct link to Numeric local frames")

The optional [`@math.gl/core`](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/local-frame.md) entry provides ENU/XYZ rotations and ENU/NED matrices with reusable outputs. Angles are explicit radians, distances retain their units, and the leaf has no runtime imports. It is not reexported from the core root.

## Interoperability[​](#interoperability "Direct link to Interoperability")

math.gl classes extend `Array`, so their components can be passed directly to array-based math APIs such as gl-matrix. Reuse vectors and matrices in hot loops to avoid repeated allocations. Low-level functions are also available through [core subpath imports](https://visgl.github.io/math.gl/next/docs/upgrade-guide.md#low-level-function-imports).

The vector and matrix APIs share many conventions with THREE.js, with a few differences:

* Use `vector.len()` for magnitude; `vector.length` is the array's element count.
* Matrix elements use column-major storage. Check the argument order when copying values through another library's setters.
* Methods that depend on THREE.js objects such as geometries or buffer attributes are outside the core API. Copy their numeric components into math.gl vectors or matrices instead.
