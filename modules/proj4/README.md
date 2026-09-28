# @math.gl/proj4

[math.gl](https://math.gl/docs) is a suite of math modules for 3D and geospatial applications.

This module contains support for conversion between geospatial coordinate systems.

`Proj4Projection` wraps proj4js. The separate `@math.gl/proj4/experimental` entry point
provides an independent TypeScript engine with explicitly supplied projection plugins.
Its initial subset covers geographic coordinates, Mercator, and equidistant cylindrical
projections; datum shifts, WKT, and PROJJSON are not yet supported by that engine.

For documentation please visit the [website](https://math.gl).
