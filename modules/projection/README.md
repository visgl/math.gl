# @math.gl/projection

[math.gl](https://math.gl/docs) is a suite of math modules for 3D and geospatial applications.

This module transforms coordinates between geospatial coordinate reference systems.
`Projection` uses the math.gl projection engine with the full projection catalogue and shared
math.gl/crs WKT/PROJJSON readers. The package has no runtime dependency on proj4js.
The v5 alpha package was renamed from `@math.gl/proj4`; use `Projection` instead
of the former `Proj4Projection` alias. The `/classic` wrapper is removed.

For selective bundles, use `ProjectionEngine` from `@math.gl/projection/core` with
explicit projection plugins. `LazyProjection` from `@math.gl/projection/projections/lazy`
loads algorithms on demand. The engine supports geocentric/Helmert transforms and
prepared horizontal datum grids. `projectFlat` and `unprojectFlat` transform interleaved
Float32/Float64 buffers without temporary coordinate arrays in the built-in pipeline.
Unsupported CRS variants fail explicitly; the documented support profile defines
compatibility boundaries.

For documentation please visit the [website](https://math.gl).

## Attribution

The engine is derived from proj4js, with an independently designed modular runtime
and additional coordinate operations. Direct ports and adaptations retain their
upstream notices; see [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) and the
[documentation](https://visgl.github.io/math.gl/next/docs/modules/projection).
