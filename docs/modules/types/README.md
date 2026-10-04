# Overview

Minimal set of math types, intended to be used with very low cost (bundle size impact)
across other frameworks.

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
