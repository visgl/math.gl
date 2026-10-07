# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From v1.0" />
</p>

`@math.gl/core` provides array-based vectors, matrices, quaternions, and coordinate helpers. Use it to compose transforms, rotate geometry, and work with reusable numeric objects.


import Example from '@site/src/components/core-transforms';

## Core transforms

<Example inline />

[Open the interactive example](/examples/core-transforms).

## Installation

```bash
npm install @math.gl/core
```

## Classes

| Class                  | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `Vector2`              | Two element vector, inherits from `Array`             |
| `Vector3`              | Three element vector, inherits from `Array`           |
| `Vector4`              | Four element vector, inherits from `Array`            |
| `Matrix3`              | 3x3 matrix, inherits from `Array`                     |
| `Matrix4`              | 4x4 matrix, inherits from `Array`                     |
| `Quaternion`           | Quaternion in `[x,y,z,w]` form, inherits from `Array` |
| `Pose` | Position and orientation with transformation matrices |
| `Euler`                | 3 Euler angles and rotation order                     |
| `SphericalCoordinates` | 2 rotations and a radius                              |

## Usage

```js
import {Vector2} from '@math.gl/core';
const vector = new Vector2(1, 2);
const x = vector[0];
const y = vector[1];
```

## Conventions

- Arithmetic methods usually mutate the receiver and return it. Clone an object before modifying it when the original is needed.
- Vector components are accessible by index and by name, such as `vector[0]` and `vector.x`.
- Matrices store elements in column-major order. Rotations use radians; Euler orders are lowercase strings.
- Matrix transform methods allocate a result array unless an output is supplied. See [performance](../../developer-guide/performance.md) for reuse patterns.
- Enable optional validation with `configure({debug: true})`. See [debugging](../../developer-guide/debugging.md) for checks and formatting.

## Learn core math

Start with [transformations](./developer-guide/transformations.md) and [3D rotations](./developer-guide/rotations.md). The guides also cover [coordinate systems](./developer-guide/coordinate-systems.md), [homogeneous coordinates](./developer-guide/homogeneous-coordinates.md), [view and projection matrices](./developer-guide/view-and-projection.md), and [floating point](./developer-guide/floating-point.md).

## Numeric local frames

The optional [`@math.gl/core/local-frame`](./api-reference/local-frame.md) entry
provides ENU/XYZ rotations and ENU/NED matrices with reusable outputs. Angles are
explicit radians, distances retain their units, and the leaf has no runtime
imports. It is not reexported from the core root.

## Interoperability

math.gl classes extend `Array`, so their components can be passed directly to array-based math APIs such as gl-matrix. Reuse vectors and matrices in hot loops to avoid repeated allocations. Low-level functions are also available through [core subpath imports](../../upgrade-guide.md#low-level-function-imports).

The vector and matrix APIs share many conventions with THREE.js, with a few differences:

- Use `vector.len()` for magnitude; `vector.length` is the array's element count.
- Matrix elements use column-major storage. Check the argument order when copying values through another library's setters.
- Methods that depend on THREE.js objects such as geometries or buffer attributes are outside the core API. Copy their numeric components into math.gl vectors or matrices instead.
