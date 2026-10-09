# GeoArrow API reference

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

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

## Borrowed geometry batches and rows

These native-geometry APIs create only JavaScript descriptors and reference lists: no new typed
arrays, subarray views, coordinate copies, rebased offsets, or expanded feature IDs. Existing
`sliceGeoArrowColumn` and `sliceGeoArrowArray` also retain the original typed-array objects.
Use valid descriptors; call `validateGeoArrowColumn` separately for untrusted physical input.

Storage is borrowed, not immutable: callers must not mutate, recycle, or transfer/detach buffers
while any view is in use. Retained streaming batches must keep their original buffers alive.
Small slices may retain large buffers. Cloning, decoding WKB/WKT, filtering/compaction, interleaving,
reprojection, and renderer preparation are separate operations outside this allocation guarantee.

### `iterateGeoArrowBatches(column)`

Lazily yields `GeoArrowBatchView` objects containing `column` (a single-chunk envelope), `chunkIndex`,
and `rowOffset` relative to the input column. Empty chunks are retained; no chunks means no views.
This iterates physical chunks, not a loader streaming protocol. One loader batch may contain several
chunks. Row offsets are not feature IDs, byte cursors, or batch sequence numbers.

### `getGeoArrowRowView(column, rowIndex)`

Returns a `GeoArrowRowView` with a one-row `column`, the input `rowIndex`, `chunkIndex`, and
`chunkRowIndex` before union dispatch. The index must be an in-range nonnegative integer.
Top-level dense-union dispatch is resolved by type ID, preserving the child's encoding, dimension,
and coordinate layout. Collection contents remain list/union descriptors, not flattened families.
Null rows remain null in the returned column; empty and one-part Multi geometries retain identity.
Parent-masked union rows retain their union descriptor because their dispatch entries may be unused.
Null or omitted child layout metadata inherits the parent layout, matching descriptor validation.
The returned column can be passed directly to existing bounds and traversal kernels.

```typescript
import {getGeoArrowRowView, getGeoArrowBounds} from '@math.gl/geoarrow';

const view = getGeoArrowRowView(column, 10);
const bounds = getGeoArrowBounds(view.column);
```

### `concatenateGeoArrowColumns(columns)`

Assembles a nonempty iterable of native columns into one envelope and chunk-reference list, without
concatenating buffers. Encoding, dimension, and coordinate layout must match. Missing `edges` means
`planar`. CRS and opaque metadata must share references (or be absent); this conservative check
does not infer semantic equivalence or merge metadata. Explicit null CRS and absent CRS are distinct.
Equivalent separately constructed metadata
must be reconciled explicitly by the caller. Union chunks may have different child ordering or
populated families because each chunk retains its own dispatch descriptors.

Empty columns and chunks are permitted. An empty iterable throws because it supplies no semantic
envelope. Conflicting semantics throw rather than silently converting coordinates or losing metadata.
All three helpers reject WKB/WKT and box columns; decode serialized geometry explicitly first.

## Geometry materialization

### `materializeGeoArrowRows(column)`

Returns newly allocated geometry values in logical chunk and row order, with one value per row.
Null rows remain `null`; empty points have `coordinates: []`, and empty list geometries retain
empty coordinate arrays. Interleaved/separated coordinates, slices, chunks, dense unions, and
geometry collections follow the same descriptor contract as the columnar kernels.

`GeoArrowBuilder` and `makeGeoArrowColumnFromGeometryRows` accept empty Point coordinate arrays
and empty MultiPoint members, writing dimension-sized non-finite tuples. WKB and WKT encoding
preserve these empty members, including within collections.

This operation allocates per-row objects and coordinate arrays. Use descriptor traversal and kernels
for columnar processing. Decode serialized WKB/WKT columns first with `decodeGeoArrowWKB` or
`decodeGeoArrowWKT`; direct serialized materialization throws. Box columns do not have a geometry
value representation and materialize as null rows. Input buffers remain borrowed and untouched.

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
`writeCoordinateFromDimension(x, y, z, m, sourceDimension)` is the scalar fast path when source and
target dimensions differ; it maps Z and M by name and does not allocate a coordinate tuple.

### `makeGeoArrowColumnFromGeometryRows(rows, options?)`

Builds homogeneous, geometry-collection, or mixed dense-union storage from materialized geometry
values. Set `encoding: 'geoarrow.geometry'` to force a dense union for homogeneous values.

## WKB and WKT

### `decodeGeoArrowWKB(column, options?)` / `decodeGeoArrowWKT(column)`

Import these functions from `@math.gl/geoarrow/wkb`. They decode serialized chunks into native
descriptors while preserving nulls, metadata, CRS, edge semantics, and source chunking. WKB accepts
mixed endianness, WKB/EWKB/ISO dimensions, mixed families and dimensions, recursive collections,
regular binary storage, and Arrow BinaryView-style storage.

`DecodeGeoArrowWKBOptions` controls final allocation:

| Option | Values | Default |
| --- | --- | --- |
| `encoding` | native concrete encoding, `geoarrow.geometry`, `geoarrow.geometrycollection`, or `native` | `native` |
| `dimension` | `infer`, `preserve`, `xy`, `xyz`, `xym`, or `xyzm` | `infer` |
| `coordinateLayout` | `interleaved` or `separated` | `interleaved` |
| `coordinateType` | `float32` or `float64` | `float64` |
| `offsetType` | `int32` or `int64` | `int32` |
| `traversal` | `@math.gl/wkb` traversal/resource limits | none |

`infer` reads semantic dimensions from WKB headers rather than trusting the placeholder dimension
on a Binary descriptor. Concrete family rows use header-only classification plus exact measure and
write traversals. Mixed unions receive a stable schema across all chunks, and GeometryCollections
are built recursively without materialized geometry rows. A concrete target supports the canonical
single-to-multi promotions and rejects incompatible families.

WKT accepts explicit Z/M/ZM tokens and the established three/four-ordinate compatibility form.

### `getGeoArrowWKBVertexCount(column, traversal?)`

Counts vertices across WKB chunks without materializing rows or decoding coordinate ordinates.
Geometry and ring count fields are sufficient for Point, LineString, Polygon, all multi-geometries,
and recursive GeometryCollections. Regular binary and BinaryView storage are supported. The
optional traversal limits are the same as `decodeGeoArrowWKB`.

### `encodeGeoArrowWKB(column)` / `encodeGeoArrowWKT(column)`

Import these functions from `@math.gl/geoarrow/wkb`. They encode native descriptors into
variable-width serialized descriptors using an exact measure/write pass per source chunk. WKB
encoding traverses physical descriptors directly, retains chunk boundaries, and represents
dense-union child nulls in the serialized validity bitmap. A column already in the requested
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
