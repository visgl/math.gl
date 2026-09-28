# @math.gl/proj4

[math.gl](https://math.gl/docs) is a suite of math modules for 3D and geospatial applications.

This module contains support for conversion between geospatial coordinate systems.

`Proj4Projection` wraps proj4js. The separate `@math.gl/proj4/experimental` entry point
provides an independent TypeScript engine with explicitly supplied projection plugins.
It supports geographic coordinates, Mercator, UTM, and common conic/azimuthal
projections. Datum shifts, WKT, and PROJJSON are not yet supported by that engine.
The versioned parity inventory and roadmap track remaining compatibility work.

For documentation please visit the [website](https://math.gl).
