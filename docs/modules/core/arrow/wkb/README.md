# @math.gl/core/arrow

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`@math.gl/core/arrow` provides synchronous codecs for individual WKB, EWKB, and WKT geometry values. The codec implementation operates independently of GeoArrow descriptors, while importing the combined Arrow entry point requires the application-provided Apache Arrow peer.

## Usage

```typescript
import {parseWKB, writeWKB, parseWKT, formatWKT} from '@math.gl/core/arrow';

const geometry = parseWKT('POINT Z (1 2 3)');
const bytes = writeWKB(geometry, 'xyz');
const decoded = parseWKB(bytes);

console.log(decoded.dimension); // 'xyz'
console.log(formatWKT(decoded.geometry, decoded.dimension));
```

The shared `WellKnownGeometry` union covers Point, LineString, Polygon, all Multi families, and
nested GeometryCollection values. Semantic dimensions are `xy`, `xyz`, `xym`, and `xyzm`.

The WKB parser supports both endian orders, ISO dimension offsets, and EWKB Z/M/SRID flags. The WKT
parser supports dimension tokens, nested collections, both MultiPoint spellings, and empties. Both
parsers reject malformed or trailing input rather than silently skipping it.

See the [API reference](./api-reference/wkb.md) for contracts, limits, and interoperability
guidance.

## Features

| Feature | Support | Notes |
| --- | --- | --- |
| Standard Simple Features geometry families | ✅ | [Point through GeometryCollection](./api-reference/wkb.md), including Multi families, nested collections and empty values. |
| XY, XYZ, XYM and XYZM semantics | ✅ | Dimension tokens/flags stay distinct; callers specify XYM when three numeric ordinates alone are ambiguous. |
| WKB endian and ISO/EWKB decoding | ✅ | Both byte orders, ISO dimension offsets and EWKB Z/M/SRID flags are read. |
| Strict WKT parsing and deterministic writing | ✅ | Complete-input parsing rejects malformed/trailing syntax; WKT and ISO WKB writers use documented conventions. |
| Bounded binary parsing | ✅ | Geometry/coordinate limits are checked before matching allocations. |
| Lossless EWKB dialect/SRID re-emission | ◐ | Decoding exposes EWKB metadata; writeWKB emits deterministic little-endian ISO WKB rather than the original wire dialect. |
| Curved geometries, TINs and polyhedral surfaces | ❌ | The public WellKnownGeometry union covers the standard linear geometry families, not these extended SQL/MM types. |
| Incremental streaming of a single geometry | ❌ | Codecs process individual complete values synchronously; [GeoArrow](../geoarrow-utils/README.md) handles column/chunk envelopes. |
| Topology validation and CRS transformation | ❌ | Syntax decoding does not validate polygon topology, repair geometry, or transform coordinates. |

### Mixed-dimension collections

Pass a `parseWKTWithMetadata` result to `writeWKB` to retain each collection
member's declared coordinate dimension. An explicit second argument applies
one dimension to the whole collection.

```typescript
const geometry = parseWKTWithMetadata('GEOMETRYCOLLECTION (POINT Z (1 2 3), POINT (4 5))');
const bytes = writeWKB(geometry);
```

### WKT vertex counts and WKB empty points

Use `countWKTVertices(text, {maximumVertices})` for a grammar-checked count without
building coordinate arrays. The optional limit stops scanning at the first
vertex above the budget. The scanner accepts up to 64 nested collection levels.

Set `normalizeEmptyPoints: true` in `parseWKB` options to return an empty
coordinate array for an all-NaN point tuple, including inside collections.
