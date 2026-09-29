# @math.gl/proj4

[math.gl](https://math.gl/docs) is a suite of math modules for 3D and geospatial applications.

This module contains support for conversion between geospatial coordinate systems.

`Proj4Projection` wraps proj4js. The separate `@math.gl/proj4/experimental` entry point
provides an independent TypeScript engine with explicitly supplied projection plugins.
It supports the documented projection catalogue, shared math.gl/crs WKT/PROJJSON
readers, geocentric/Helmert transforms and prepared horizontal datum grids.
`projectInPlace` and `unprojectInPlace` transform interleaved Float32/Float64 buffers
without temporary coordinate arrays in the built-in pipeline. The engine remains
experimental; unsupported CRS variants fail explicitly.
The versioned parity inventory and roadmap track remaining compatibility work.

For documentation please visit the [website](https://math.gl).
