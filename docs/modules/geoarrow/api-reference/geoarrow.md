# GeoArrow API reference

All root functions are synchronous. Unless a function explicitly returns a new column or fills a
caller-provided target, it treats descriptors and buffers as read-only.

## Descriptors

`GeoArrowColumn` is the semantic column envelope. `GeoArrowArray` is the union of the physical
descriptor types:

- `GeoArrowPrimitive`
- `GeoArrowFixedSizeList`
- `GeoArrowList`
- `GeoArrowStruct`
- `GeoArrowDenseUnion` and `GeoArrowDenseUnionChild`
- `GeoArrowSerialized`
- `GeoArrowValidity`

Related semantic types include `GeoArrowEncoding`, `GeoArrowDimension`,
`GeoArrowCoordinateLayout`, `GeoArrowGeometryValue`, and `GeoArrowBounds`.

## Inspection, validation, traversal, and slicing

### `inspectGeoArrowColumn(column)`

Returns encoding, row/chunk/null/coordinate counts, storage kinds, and validation diagnostics. It
does not decode WKB/WKT or construct per-row geometry objects.

### `validateGeoArrowColumn(column)`

Returns `{valid, issues}`. Each issue has a stable `code`, physical `path`, and human-readable
`message`.

### `visitGeoArrowCoordinates(column, visitor)`

Visits native coordinate tuples in logical row order. The callback receives `(coordinate,
rowIndex)`. The returned callback value is ignored; use `mapGeoArrowCoordinates` to allocate mapped
output.

### `sliceGeoArrowColumn(column, begin?, end?)`

Returns a zero-copy logical slice while preserving chunk boundaries. A full slice returns `column`.

### `sliceGeoArrowArray(array, begin, end)`

Creates a zero-copy physical view by advancing logical offsets and bitmap bit offsets.

### `getGeoArrowRowCount(column)` / `getGeoArrowVertexCount(column)`

Count logical rows or native coordinate tuples directly over descriptors. Serialized columns report
zero native vertices until decoded with the `/wkb` bridge.

## Bounds and coordinate transforms

### `getGeoArrowBounds(column)`

Returns `[minX, minY, maxX, maxY]`, or `null` when no finite native coordinate exists.

### `getGeoArrowRowBounds(column)`

Returns one XY bound (or `null`) per logical row in a single descriptor traversal. This is the
preferred primitive for loaders and query engines that need conservative row pruning.

### `mapGeoArrowCoordinates(column, mapper, options?)`

Allocates a new native column and applies `mapper(coordinate, rowIndex)` to each coordinate. Options
select output dimension/layout and resource limits.

### `mapGeoArrowCoordinatesInto(target, source, mapper, options?)`

Maps into caller-owned coordinate buffers. Source and target must have compatible physical
topology. The function returns `target` and never replaces its descriptors.

## Physical conversion

### `interleaveGeoArrowCoordinates(column)`

Converts separated coordinates to fixed-size interleaved tuples. Already interleaved and
non-coordinate columns are returned unchanged.

### `convertGeoArrowColumn(column, options?)`

Converts native geometry family, semantic dimension, coordinate layout, coordinate type, or offset
width. Options are `encoding`, `dimension`, `coordinateLayout` (`preserve`, `interleaved`, or
`separated`), `coordinateType` (`preserve`, `float32`, or `float64`), and `offsetType`
(`preserve`, `int32`, or `int64`). Use `/wkb` for serialized targets. Semantic ordinates map by
name, so M is not reinterpreted as Z.

### `normalizeGeoArrowUnion(column)`

Sorts dense-union child descriptors by type ID. Dispatch and child buffers are retained. Non-union
columns and already normalized unions are identity operations.

### `rewindGeoArrow(column, options?)`

Normalizes Polygon and MultiPolygon winding. `outer` is `counter-clockwise` by default; holes use
the opposite orientation. If no ring changes, the original column is returned.

## Builder

### `new GeoArrowBuilder(options)`

Creates a homogeneous native builder in `measure` or `write` mode. Append the same rows to both
passes. Measure mode exposes exact `GeoArrowBuilderMeasurement` counts and can allocate a matching
`GeoArrowBuilderTarget`. Write mode fills its target and `finish()` returns a borrowed column.

### `GeoArrowBuilder.build(rows, options)`

Convenience two-pass build with internal allocation.

### `allocateGeoArrowBuilderTarget(measurement, options)`

Allocates exact validity, coordinate, and offset buffers independently of a builder instance.

The builder also accepts an incremental event stream. Call `beginGeometry(type, dimension, count?)`,
`beginPolygon()` for each MultiPolygon part, `beginRing(count?)`,
`writeCoordinate(x, y, z?, m?)`, and `endGeometry()`. Events are useful for loaders that already
have a streaming parser and avoid constructing intermediate geometry rows. For backward
compatibility, a MultiPolygon with no `beginPolygon()` calls is treated as one polygon.

### `makeGeoArrowColumnFromGeometryRows(rows, options?)`

Builds homogeneous, geometry-collection, or mixed dense-union storage from materialized geometry
values. Set `encoding: 'geoarrow.geometry'` to force a dense union for homogeneous values.

## WKB and WKT

### `decodeGeoArrowWKB(column)` / `decodeGeoArrowWKT(column)`

Import these functions from `@math.gl/geoarrow/wkb`. They decode serialized chunks into native
descriptors while preserving nulls, metadata, CRS, edge semantics, and (where possible) source
chunking. WKB accepts mixed endianness and WKB/EWKB/ISO dimensions. WKT accepts explicit Z/M/ZM
tokens and the established three/four-ordinate compatibility form.

### `encodeGeoArrowWKB(column)` / `encodeGeoArrowWKT(column)`

Import these functions from `@math.gl/geoarrow/wkb`. They encode native descriptors into
variable-width serialized descriptors using a measure/write pass. A column already in the requested
encoding is returned unchanged.

Individual geometry parsing and formatting live in `@math.gl/wkb`. GeoArrow's four codec functions
adapt those neutral codecs to serialized column descriptors, validity, offsets, chunks, CRS, and
metadata.

## Polygon tessellation

### `tessellateGeoArrowPolygons(column, options?)`

Import this optional function from `@math.gl/geoarrow/tessellation`. It returns `GeoArrowTessellation`:

| Field | Meaning |
| --- | --- |
| `positions` | flat Float32 positions |
| `sourceRowIndices` | top-level source row for each output vertex |
| `indices` | Uint16 or Uint32 triangle indices |
| `sourceDimension` | input tuple size |
| `positionSize` | output tuple size |
| `rowCount` | input logical rows |
| `polygonCount` | primitive polygons tessellated |
| `vertexCount` | output vertices |
| `triangleCount` | output triangles |

Options set `positionSize`, global `sourceRowOffset`, and resource limits. Polygon holes and
MultiPolygon row attribution are preserved.

## Limits and transfer

### `assertGeoArrowResourceLimits(column, options?)`

Checks optional maximum rows, coordinates, chunks, nesting depth, and estimated output bytes.

### `getGeoArrowTransferList(column)`

Returns unique `ArrayBuffer` instances reachable from the descriptor tree. Shared buffers are
omitted and no buffer is detached.

### `prepareGeoArrowTransfer(column)`

Available from `@math.gl/geoarrow/worker`. Returns `{column, transferList}` for explicit use with
`postMessage` or another structured-clone transport.
