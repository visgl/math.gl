# WKB and WKT API reference

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

All APIs are synchronous. Inputs are borrowed and never detached or mutated.

## Types

### `WellKnownGeometry`

An immutable-by-contract discriminated union for Point, LineString, Polygon, MultiPoint,
MultiLineString, MultiPolygon, and recursive GeometryCollection values.

### `WellKnownDimension`

One of `xy`, `xyz`, `xym`, or `xyzm`. M is semantically distinct from Z. Three-value coordinates
are inferred as XYZ because coordinate arrays alone cannot identify a measure.

### `WKBParseResult`

| Field | Description |
| --- | --- |
| `geometry` | parsed `WellKnownGeometry` |
| `byteLength` | exact number of bytes consumed |
| `dimension` | dimension declared by the root WKB/EWKB header |
| `srid` | root EWKB SRID, when present |

## Binary

#### `inspectWKBHeader(bytes, byteOffset?)`

Reads endian order, geometry family, semantic dimension, dialect, and optional EWKB SRID without
traversing the coordinate payload.

#### `visitWKB(bytes, visitor, options?)`

Traverses geometry, ring, and optional scalar-coordinate events without allocating geometry or
coordinate objects. When `visitor.coordinate` is omitted, coordinate payloads are bounds-checked
and skipped without decoding their Float64 ordinates. This is the fast path for structural
classification and vertex counting.

#### `parseWKB(bytes, options?)`

Parses exactly one WKB value and rejects trailing data. It accepts little- or big-endian geometry,
ISO Z/M/ZM type offsets, EWKB Z/M/SRID flags, all geometry families, and nested collections.

Options:

- `maximumDepth` defaults to 64.
- `maximumElements` defaults to 100,000,000 total declared child elements.

Both limits must be non-negative safe integers and are enforced before matching arrays are
allocated.

#### `writeWKB(geometry, dimension?)`

Writes deterministic little-endian ISO WKB. Dimension defaults to tuple inference. Specify `xym`
explicitly for measured three-value coordinates. Missing ordinates are written as zero.

## Text

#### `parseWKT(text)`

Parses all geometry families, Z/M/ZM tokens, nested collections, both MultiPoint spellings, empty
geometry, decimal values, and exponent notation. Every non-whitespace input character must belong
to a token.

#### `formatWKT(geometry, dimension?)`

Formats deterministic WKT. Dimension defaults to tuple inference. Empty non-point coordinates emit
`EMPTY`; an all-non-finite point tuple emits `POINT ... EMPTY`.

## WKBBuilder

`WKBBuilder` writes geometry events in two passes: measure the byte count, then replay
the same events into caller-owned storage. It constructs no Arrow objects.

### Properties

| Property | Type | Description |
| --- | --- | --- |
| `mode` | `'measure'` or `'write'` | Current pass. Readonly. |
| `dimension` | `WellKnownDimension` | Active XY/XYZ/XYM/XYZM tuple semantics. |
| `littleEndian` | `boolean` | Selected byte order. Readonly. |
| `srid` | `number` or `undefined` | Optional EWKB SRID. Readonly. |
| `transform` | `WKBCoordinateTransform` or `undefined` | Optional coordinate transform. Readonly. |

### Constructor

```typescript
new WKBBuilder(options);
```

Options select `mode`, dimension, byte order, SRID, and an optional transform.
Write mode also requires `target` and accepts a starting `byteOffset`.

### Static methods

| Method | Description |
| --- | --- |
| `measureGeometryArray(writers, options?)` | Measure callback-written geometries and return Int32 offsets. |
| `writeGeometryArray(writers, offsets, values, options?)` | Replay callbacks into an existing values buffer; validate measured lengths. |
| `buildGeometryArray(writers, options?)` | Allocate offsets, values, and null validity through both passes. |

### Methods

| Method | Description |
| --- | --- |
| `beginGeometry(type, count?)` | Begin a geometry and write its count when required. |
| `beginPoint()` | Begin a Point. |
| `beginLineString(count)` | Begin a LineString with the declared coordinate count. |
| `beginPolygon(count)` | Begin a Polygon with the declared ring count. |
| `beginLinearRing(count)` | Write a ring's coordinate count. |
| `beginMultiPoint(count)` | Begin a MultiPoint. |
| `beginMultiLineString(count)` | Begin a MultiLineString. |
| `beginMultiPolygon(count)` | Begin a MultiPolygon. |
| `writeCoordinate(x, y, z?, m?)` | Measure or write one transformed coordinate. |
| `withDimension(dimension, callback)` | Temporarily change dimension while invoking a writer callback. |
| `finishGeometry()` | Return the measured or written geometry byte length. |

## Helpers

#### `getWellKnownDimensionSize(dimension)`

Returns 2, 3, or 4.

#### `inferWellKnownGeometryDimension(geometry)`

Recursively finds the widest coordinate tuple. Empty geometry is XY; three values mean XYZ.

## GeoArrow boundary

Use `@math.gl/arrow/wkb` for individual format values. Use `decodeGeoArrowWKB`, `encodeGeoArrowWKB`,
`decodeGeoArrowWKT`, and `encodeGeoArrowWKT` from `@math.gl/arrow/geoarrow-utils` for serialized column
descriptors, offsets, validity, chunks, CRS, and metadata preservation.
