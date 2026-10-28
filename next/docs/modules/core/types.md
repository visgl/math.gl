# Overview

![From v3.6](https://img.shields.io/badge/From-v3.6-blue.svg?style=flat-square)

`@math.gl/core` provides shared numeric array, bounds, and spheroid types, plus runtime array checks and Float16 support detection.

## Feature support[​](#feature-support "Direct link to Feature support")

Numeric representation and shape contracts shared by the math.gl packages.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature                                   | math.gl support    | Notes                                                                                                                                                                                                      |
| ----------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Number and typed-array declarations       | ✅ Implemented     | [NumericArray, TypedArray and constructor types](https://visgl.github.io/math.gl/next/docs/modules/core/types/api-reference/array-types.md), with BigInt typed arrays represented separately. |
| Fixed-component array types               | ✅ Implemented     | Sized NumberArray/NumericArray variants cover commonly used vector, matrix, and bounds lengths.                                                                                                            |
| Runtime representation guards             | ✅ Implemented     | [Array and typed-array guards](https://visgl.github.io/math.gl/next/docs/modules/core/types/api-reference/array-types.md) include intrinsic, cross-realm Uint16 and Float16 checks.           |
| Half-float storage capability detection   | ✅ Implemented     | Native Float16Array detection and constructor selection; the Uint16 fallback stores encoded bits rather than decoded numeric values.                                                                       |
| Bounds and spheroid contracts             | ✅ Implemented     | [Bounds2D/3D](https://visgl.github.io/math.gl/next/docs/modules/core/types/api-reference/bounds.md) and SpheroidParameters describe geometry independently of renderers and CRS engines.      |
| Runtime enforcement of sized declarations | ❌ Not implemented | Type declarations do not validate buffer length, coordinate units, or physical meaning at runtime.                                                                                                         |
| Bundled Float16 arithmetic polyfill       | ❌ Not implemented | The helpers select/detect storage. They do not supply numeric half-float array semantics when the runtime lacks them.                                                                                      |

## Usage[​](#usage "Direct link to Usage")

Use `import type` for declarations that add no runtime code:

```
import type {NumericArray, NumberArray3, Bounds3D} from '@math.gl/core';
```

`NumberArray` covers JavaScript number arrays; `NumericArray` also includes numeric typed arrays. Sized variants describe fixed component counts. See [array types](https://visgl.github.io/math.gl/next/docs/modules/core/types/api-reference/array-types.md) and [bounds](https://visgl.github.io/math.gl/next/docs/modules/core/types/api-reference/bounds.md) for the contracts and runtime helpers.

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/core
```

## SpheroidParameters[​](#spheroidparameters "Direct link to SpheroidParameters")

A type-only geometry contract with `semiMajorAxis` and `semiMinorAxis` in metres. Both axes must be finite and positive, with `semiMinorAxis <= semiMajorAxis`. Equal axes describe a sphere. It contains no datum, axis order, coordinate units or epoch metadata. The type is also exported by core, geospatial and projection.

Use [`Ellipsoid.fromSpheroid` and `toSpheroid`](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/ellipsoid.md) to exchange this geometry with the geospatial class. The type adds no runtime code.
