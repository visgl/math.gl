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

## Expressions

[![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)](https://math.gl/docs)
[![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)](https://math.gl/docs)

[math.gl](https://math.gl/docs) expression parsing and evaluation helpers.

The parser, evaluator, registry, and basic math library are implemented in this core subpath.
Import the WGS84 function library from `@math.gl/geospatial` and DGGS function
libraries from `@math.gl/dggs`.

## Types

This module contains basic typescript types for math.gl.

## Tiny Well-Known Binary

Import `parseTWKB` and `writeTWKB` from `@math.gl/core/twkb`. This entry point works without
Apache Arrow. The codec accepts buffer views and all seven TWKB geometry families.

```typescript
import {parseTWKB, writeTWKB} from '@math.gl/core/twkb';

const bytes = writeTWKB({type: 'Point', coordinates: [1.25, 2.5]}, {precision: 2});
const {geometry, dimension} = parseTWKB(bytes);
```

Encoding quantizes coordinates at the requested decimal precision. Use `dimension: 'xym'` to
encode a three-ordinate measured geometry. The decoder restores implicit polygon ring closure,
preserves collection-member dimensions, and consumes optional size, bounds, and ID attributes.
The writer emits the geometry payload without optional attributes.
