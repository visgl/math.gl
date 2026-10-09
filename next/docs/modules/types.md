# Overview

![From v3.6](https://img.shields.io/badge/From-v3.6-blue.svg?style=flat-square)

`@math.gl/types` provides shared numeric array, bounds, and spheroid types, plus runtime array checks and Float16 support detection.

Use `import type` for declarations that add no runtime code:

```
import type {NumericArray, NumberArray3, Bounds3D} from '@math.gl/types';
```

`NumberArray` covers JavaScript number arrays; `NumericArray` also includes numeric typed arrays. Sized variants describe fixed component counts. See [array types](https://visgl.github.io/math.gl/next/docs/modules/types/api-reference/array-types.md) and [bounds](https://visgl.github.io/math.gl/next/docs/modules/types/api-reference/bounds.md) for the contracts and runtime helpers.

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/types
```

## SpheroidParameters[​](#spheroidparameters "Direct link to SpheroidParameters")

A type-only geometry contract with `semiMajorAxis` and `semiMinorAxis` in metres. Both axes must be finite and positive, with `semiMinorAxis <= semiMajorAxis`. Equal axes describe a sphere. It contains no datum, axis order, coordinate units or epoch metadata. The type is also exported by core, geospatial and projection.

Use [`Ellipsoid.fromSpheroid` and `toSpheroid`](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/ellipsoid.md) to exchange this geometry with the geospatial class. The type adds no runtime code.
