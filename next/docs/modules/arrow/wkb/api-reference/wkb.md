# WKB and WKT API reference

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

All APIs are synchronous. Inputs are borrowed and never detached or mutated.

## Types[​](#types "Direct link to Types")

### `WellKnownGeometry`[​](#wellknowngeometry "Direct link to wellknowngeometry")

An immutable-by-contract discriminated union for Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, and recursive GeometryCollection values.

### `WellKnownDimension`[​](#wellknowndimension "Direct link to wellknowndimension")

One of `xy`, `xyz`, `xym`, or `xyzm`. M is semantically distinct from Z. Three-value coordinates are inferred as XYZ because coordinate arrays alone cannot identify a measure.

### `WKBParseResult`[​](#wkbparseresult "Direct link to wkbparseresult")

| Field        | Description                                    |
| ------------ | ---------------------------------------------- |
| `geometry`   | parsed `WellKnownGeometry`                     |
| `byteLength` | exact number of bytes consumed                 |
| `dimension`  | dimension declared by the root WKB/EWKB header |
| `srid`       | root EWKB SRID, when present                   |

## Binary[​](#binary "Direct link to Binary")

#### `inspectWKBHeader(bytes, byteOffset?)`[​](#inspectwkbheaderbytes-byteoffset "Direct link to inspectwkbheaderbytes-byteoffset")

Reads endian order, geometry family, semantic dimension, dialect, and optional EWKB SRID without traversing the coordinate payload.

#### `visitWKB(bytes, visitor, options?)`[​](#visitwkbbytes-visitor-options "Direct link to visitwkbbytes-visitor-options")

Traverses geometry, ring, and optional scalar-coordinate events without allocating geometry or coordinate objects. When `visitor.coordinate` is omitted, coordinate payloads are bounds-checked and skipped without decoding their Float64 ordinates. This is the fast path for structural classification and vertex counting.

#### `parseWKB(bytes, options?)`[​](#parsewkbbytes-options "Direct link to parsewkbbytes-options")

Parses exactly one WKB value and rejects trailing data. It accepts little- or big-endian geometry, ISO Z/M/ZM type offsets, EWKB Z/M/SRID flags, all geometry families, and nested collections.

Options:

* `maximumDepth` defaults to 64.
* `maximumElements` defaults to 100,000,000 total declared child elements.

Both limits must be non-negative safe integers and are enforced before matching arrays are allocated.

#### `writeWKB(geometry, dimension?)`[​](#writewkbgeometry-dimension "Direct link to writewkbgeometry-dimension")

Writes deterministic little-endian ISO WKB. Dimension defaults to tuple inference. Specify `xym` explicitly for measured three-value coordinates. Missing ordinates are written as zero.

## Text[​](#text "Direct link to Text")

#### `parseWKT(text)`[​](#parsewkttext "Direct link to parsewkttext")

Parses all geometry families, Z/M/ZM tokens, nested collections, both MultiPoint spellings, empty geometry, decimal values, and exponent notation. Every non-whitespace input character must belong to a token.

#### `formatWKT(geometry, dimension?)`[​](#formatwktgeometry-dimension "Direct link to formatwktgeometry-dimension")

Formats deterministic WKT. Dimension defaults to tuple inference. Empty non-point coordinates emit `EMPTY`; an all-non-finite point tuple emits `POINT ... EMPTY`.

## WKBBuilder[​](#wkbbuilder "Direct link to WKBBuilder")

`WKBBuilder` writes geometry events in two passes: measure the byte count, then replay the same events into caller-owned storage. It constructs no Arrow objects.

### Properties[​](#properties "Direct link to Properties")

| Property       | Type                                    | Description                              |
| -------------- | --------------------------------------- | ---------------------------------------- |
| `mode`         | `'measure'` or `'write'`                | Current pass. Readonly.                  |
| `dimension`    | `WellKnownDimension`                    | Active XY/XYZ/XYM/XYZM tuple semantics.  |
| `littleEndian` | `boolean`                               | Selected byte order. Readonly.           |
| `srid`         | `number` or `undefined`                 | Optional EWKB SRID. Readonly.            |
| `transform`    | `WKBCoordinateTransform` or `undefined` | Optional coordinate transform. Readonly. |

### Constructor[​](#constructor "Direct link to Constructor")

```
new WKBBuilder(options);
```

Options select `mode`, dimension, byte order, SRID, and an optional transform. Write mode also requires `target` and accepts a starting `byteOffset`.

### Static methods[​](#static-methods "Direct link to Static methods")

| Method                                                   | Description                                                                 |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `measureGeometryArray(writers, options?)`                | Measure callback-written geometries and return Int32 offsets.               |
| `writeGeometryArray(writers, offsets, values, options?)` | Replay callbacks into an existing values buffer; validate measured lengths. |
| `buildGeometryArray(writers, options?)`                  | Allocate offsets, values, and null validity through both passes.            |

### Methods[​](#methods "Direct link to Methods")

| Method                               | Description                                                    |
| ------------------------------------ | -------------------------------------------------------------- |
| `beginGeometry(type, count?)`        | Begin a geometry and write its count when required.            |
| `beginPoint()`                       | Begin a Point.                                                 |
| `beginLineString(count)`             | Begin a LineString with the declared coordinate count.         |
| `beginPolygon(count)`                | Begin a Polygon with the declared ring count.                  |
| `beginLinearRing(count)`             | Write a ring's coordinate count.                               |
| `beginMultiPoint(count)`             | Begin a MultiPoint.                                            |
| `beginMultiLineString(count)`        | Begin a MultiLineString.                                       |
| `beginMultiPolygon(count)`           | Begin a MultiPolygon.                                          |
| `writeCoordinate(x, y, z?, m?)`      | Measure or write one transformed coordinate.                   |
| `withDimension(dimension, callback)` | Temporarily change dimension while invoking a writer callback. |
| `finishGeometry()`                   | Return the measured or written geometry byte length.           |

## Helpers[​](#helpers "Direct link to Helpers")

#### `getWellKnownDimensionSize(dimension)`[​](#getwellknowndimensionsizedimension "Direct link to getwellknowndimensionsizedimension")

Returns 2, 3, or 4.

#### `inferWellKnownGeometryDimension(geometry)`[​](#inferwellknowngeometrydimensiongeometry "Direct link to inferwellknowngeometrydimensiongeometry")

Recursively finds the widest coordinate tuple. Empty geometry is XY; three values mean XYZ.

## GeoArrow boundary[​](#geoarrow-boundary "Direct link to GeoArrow boundary")

Use `@math.gl/arrow/wkb` for individual format values. Use `decodeGeoArrowWKB`, `encodeGeoArrowWKB`, `decodeGeoArrowWKT`, and `encodeGeoArrowWKT` from `@math.gl/arrow/geoarrow-utils` for serialized column descriptors, offsets, validity, chunks, CRS, and metadata preservation.
