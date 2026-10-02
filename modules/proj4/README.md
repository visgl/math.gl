# @math.gl/proj4

[math.gl](https://math.gl/docs) is a suite of math modules for 3D and geospatial applications.

This module transforms coordinates between geospatial coordinate reference systems.
`Projection` uses the math.gl projection engine with the full projection catalogue and shared
math.gl/crs WKT/PROJJSON readers. `Proj4Projection` is a deprecated alias of the same
class. The original proj4js wrapper remains available at `@math.gl/proj4/classic`.

For selective bundles, use `ProjectionEngine` from `@math.gl/proj4/core` with
explicit projection plugins. `LazyProjection` from `@math.gl/proj4/projections/lazy`
loads algorithms on demand. The engine supports geocentric/Helmert transforms and
prepared horizontal datum grids. `projectFlat` and `unprojectFlat` transform interleaved
Float32/Float64 buffers without temporary coordinate arrays in the built-in pipeline.
Unsupported CRS variants fail explicitly; the documented support profile defines
compatibility boundaries.

For documentation please visit the [website](https://math.gl).
