# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.6-blue.svg?style=flat-square" alt="From v3.6" />
</p>

`@math.gl/types` provides shared numeric array, bounds, and spheroid types, plus runtime array checks and Float16 support detection.

Use `import type` for declarations that add no runtime code:

```typescript
import type {NumericArray, NumberArray3, Bounds3D} from '@math.gl/types';
```

`NumberArray` covers JavaScript number arrays; `NumericArray` also includes numeric typed arrays. Sized variants describe fixed component counts. See [array types](./api-reference/array-types.md) and [bounds](./api-reference/bounds.md) for the contracts and runtime helpers.


## Installation

```bash
npm install @math.gl/types
```

## SpheroidParameters

A type-only geometry contract with `semiMajorAxis` and `semiMinorAxis` in metres.
Both axes must be finite and positive, with `semiMinorAxis <= semiMajorAxis`.
Equal axes describe a sphere. It contains no datum, axis order, coordinate units
or epoch metadata. The type is also exported by core, geospatial and projection.

Use [`Ellipsoid.fromSpheroid` and `toSpheroid`](../geospatial/api-reference/ellipsoid.md)
to exchange this geometry with the geospatial class. The type adds no runtime code.
