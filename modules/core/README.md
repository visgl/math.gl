# @math.gl/core

[math.gl](https://math.gl/docs) is a suite of math modules for 3D applications.

This module contains classes for vectors and matrices etc.

For documentation please visit the [website](https://math.gl).

The optional `@math.gl/core` numeric entry supports the shared sphere/oblate
conversion paths used by geospatial and projection. It does not import vector/matrix
classes or global configuration. Its existing proj4js-derived arithmetic retains
MIT attribution and the full terms in [PROJ4-LICENSE.md](./PROJ4-LICENSE.md).

Expression parsing and evaluation are available at `@math.gl/core`. The core entry
includes the basic math function library. Earth-specific and DGGS function libraries are exposed
separately by `@math.gl/geospatial` and `@math.gl/dggs`.

## Sources and credits

See [the packaged source and license index](./THIRD-PARTY-NOTICES.md) and
[math.gl references and credits](https://math.gl/docs/references-and-credits).
