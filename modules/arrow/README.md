# @math.gl/arrow

Utilities for working efficiently with Arrow and GeoArrow binary data in browsers and Node.js.

## Install

```sh
npm install @math.gl/arrow
# Required only for the root and /geoarrow entries:
npm install apache-arrow
```

Apache Arrow is an optional peer dependency supporting version 17 and newer.
The independent utility subpaths work without it. The package does not depend on loaders.gl
or geospatial projections; CRS metadata is retained opaquely.

## Entry points

| Import | Purpose | Apache Arrow required |
| --- | --- | --- |
| `@math.gl/arrow` | Indexed tables/vectors, schema validation, renaming, buffer ownership, hydration and IPC | Yes |
| `@math.gl/arrow/expressions` | Schema-bound predicates, computed columns and typed functions | Yes |
| `@math.gl/arrow/utf8` | Compare UTF-8 byte ranges and parse ASCII scalar values | No |
| `@math.gl/arrow/geoarrow` | Borrow Arrow geometry buffers, inspect metadata, compute bounds, map coordinates, and rewind rings | Yes |
| `@math.gl/arrow/geoarrow-utils` | Runtime-independent geometry descriptors, builders, kernels, codecs, tessellation, and streaming | No |
| `@math.gl/arrow/wkb` | Parse/write WKB, EWKB, and WKT; traverse geometry buffers | No |

```typescript
import {parseWKT, writeWKB} from '@math.gl/arrow/wkb';
import {GeoArrowBuilder, getGeoArrowBounds} from '@math.gl/arrow/geoarrow-utils';

const point = parseWKT('POINT (1 2)');
const bytes = writeWKB(point, 'xy');
const column = GeoArrowBuilder.build([point], {encoding: 'geoarrow.point', dimension: 'xy'});
getGeoArrowBounds(column); // [1, 2, 1, 2]
```

## Documentation and examples

- [Arrow utilities](https://math.gl/docs/modules/arrow)
- [UTF-8](https://math.gl/docs/modules/arrow/utf8)
- [Arrow-backed GeoArrow](https://math.gl/docs/modules/arrow/geoarrow)
- [Physical GeoArrow descriptors](https://math.gl/docs/modules/arrow/geoarrow-utils)
- [WKB and WKT](https://math.gl/docs/modules/arrow/wkb)
- [Runnable examples](../../examples/README.md): Arrow table processing, worker streaming, and the WKB workbench.

Geographic calculations and CRS interpretation belong in `@math.gl/geospatial`.
Task execution is provided by `@math.gl/tasks`.
