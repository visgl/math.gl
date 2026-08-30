# WKB and WKT API reference

All APIs are synchronous. Inputs are borrowed and never detached or mutated.

## Types

### `WellKnownGeometry`

An immutable-by-contract discriminated union for Point, LineString, Polygon, MultiPoint,
MultiLineString, MultiPolygon, and recursive GeometryCollection values.

### `WellKnownDimension`

One of `xy`, `xyz`, `xym`, or `xyzm`. M is semantically distinct from Z. Three-value coordinates
are inferred as XYZ because coordinate arrays alone cannot identify a measure.

### `WKBParseResult`

| Field | Meaning |
| --- | --- |
| `geometry` | parsed `WellKnownGeometry` |
| `byteLength` | exact number of bytes consumed |
| `dimension` | dimension declared by the root WKB/EWKB header |
| `srid` | root EWKB SRID, when present |

## Binary

### `inspectWKBHeader(bytes, byteOffset?)`

Reads endian order, geometry family, semantic dimension, dialect, and optional EWKB SRID without
traversing the coordinate payload.

### `visitWKB(bytes, visitor, options?)`

Traverses geometry, ring, and optional scalar-coordinate events without allocating geometry or
coordinate objects. When `visitor.coordinate` is omitted, coordinate payloads are bounds-checked
and skipped without decoding their Float64 ordinates. This is the fast path for structural
classification and vertex counting.

### `parseWKB(bytes, options?)`

Parses exactly one WKB value and rejects trailing data. It accepts little- or big-endian geometry,
ISO Z/M/ZM type offsets, EWKB Z/M/SRID flags, all geometry families, and nested collections.

Options:

- `maximumDepth` defaults to 64.
- `maximumElements` defaults to 100,000,000 total declared child elements.

Both limits must be non-negative safe integers and are enforced before matching arrays are
allocated.

### `writeWKB(geometry, dimension?)`

Writes deterministic little-endian ISO WKB. Dimension defaults to tuple inference. Specify `xym`
explicitly for measured three-value coordinates. Missing ordinates are written as zero.

## Text

### `parseWKT(text)`

Parses all geometry families, Z/M/ZM tokens, nested collections, both MultiPoint spellings, empty
geometry, decimal values, and exponent notation. Every non-whitespace input character must belong
to a token.

### `formatWKT(geometry, dimension?)`

Formats deterministic WKT. Dimension defaults to tuple inference. Empty non-point coordinates emit
`EMPTY`; an all-non-finite point tuple emits `POINT ... EMPTY`.

## Helpers

### `getWellKnownDimensionSize(dimension)`

Returns 2, 3, or 4.

### `inferWellKnownGeometryDimension(geometry)`

Recursively finds the widest coordinate tuple. Empty geometry is XY; three values mean XYZ.

## GeoArrow boundary

Use `@math.gl/wkb` for individual format values. Use `decodeGeoArrowWKB`, `encodeGeoArrowWKB`,
`decodeGeoArrowWKT`, and `encodeGeoArrowWKT` from `@math.gl/geoarrow` for serialized column
descriptors, offsets, validity, chunks, CRS, and metadata preservation.
