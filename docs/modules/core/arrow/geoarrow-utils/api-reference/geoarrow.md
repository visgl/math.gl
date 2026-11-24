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
`GeoArrowCoordinateLayout`, `GeoArrowDecodedGeometry`, and `GeoArrowBounds`.

#### `mergeGeoArrowDimensions(left, right)`

Combines XYZ and XYM semantics without treating M as Z.
`inferGeoArrowGeometryDimension(geometry)` inspects tagged geometry coordinate arrays, including
nested collections, and returns their combined dimension. Three ordinates imply XYZ; callers with
XYM data should use their declared semantic dimension instead of inferring it from tuple length.

## Inspection, validation, traversal, and slicing

#### `inspectGeoArrowColumn(column)`

Returns encoding, row/chunk/null/coordinate counts, storage kinds, and validation diagnostics. It
does not decode WKB/WKT or construct per-row geometry objects.

#### `validateGeoArrowColumn(column)`

Returns `{valid, issues}`. Each issue has a stable `code`, physical `path`, and human-readable
`message`.

#### `visitGeoArrowCoordinates(column, visitor)`

Visits native coordinate tuples in logical row order. The callback receives `(coordinate,
rowIndex)`. The returned callback value is ignored; use `mapGeoArrowCoordinates` to allocate mapped
output.

#### `getGeoArrowColumnView(column, start?, end?)`

Borrows the half-open range `[start, end)` while retaining chunk boundaries and the source
encoding. Bounds default to the start and end of the column. Negative bounds count backwards
from the end. A view of the full range returns `column`.

#### `sliceGeoArrowArray(array, begin, end)`

Creates a zero-copy physical view by advancing logical offsets and bitmap bit offsets.

#### `getGeoArrowRowCount(column)`

Returns the number of logical rows in the column.

#### `getGeoArrowVertexCount(column)`

Returns the number of native coordinate tuples.

Count logical rows or native coordinate tuples directly over descriptors. Serialized columns report
zero native vertices until decoded with the `/wkb` bridge.

## Borrowed geometry batches and rows

These native-geometry APIs create only JavaScript descriptors and reference lists: no new typed
arrays, subarray views, coordinate copies, rebased offsets, or expanded feature IDs. Existing
`getGeoArrowColumnView` and `sliceGeoArrowArray` also retain the original typed-array objects.
Use valid descriptors; call `validateGeoArrowColumn` separately for untrusted physical input.

Storage is borrowed, not immutable: callers must not mutate, recycle, or transfer/detach buffers
while any view is in use. Retained streaming batches must keep their original buffers alive.
Small slices may retain large buffers. Cloning, decoding WKB/WKT, filtering/compaction, interleaving,
reprojection, and renderer preparation are separate operations outside this allocation guarantee.

#### `iterateGeoArrowBatches(column)`

Lazily yields `GeoArrowBatchView` objects containing `column` (a single-chunk envelope), `chunkIndex`,
and `rowOffset` relative to the input column. Empty chunks are retained; no chunks means no views.
This iterates physical chunks, not a loader streaming protocol. One loader batch may contain several
chunks. Row offsets are not feature IDs, byte cursors, or batch sequence numbers.

#### `getGeoArrowRowView(column, rowIndex)`

Returns a `GeoArrowRowView` with a one-row `column`, the input `rowIndex`, `chunkIndex`, and
`chunkRowIndex` before union dispatch. The index must be an in-range nonnegative integer.
Top-level dense-union dispatch is resolved by type ID, preserving the child's encoding, dimension,
and coordinate layout. Collection contents remain list/union descriptors, not flattened families.
Null rows remain null in the returned column; empty and one-part Multi geometries retain identity.
Parent-masked union rows retain their union descriptor because their dispatch entries may be unused.
Null or omitted child layout metadata inherits the parent layout, matching descriptor validation.
The returned column can be passed directly to existing bounds and traversal kernels.

```typescript
import {getGeoArrowRowView, getGeoArrowBounds} from '@math.gl/core/arrow';

const view = getGeoArrowRowView(column, 10);
const bounds = getGeoArrowBounds(view.column);
```

#### `concatenateGeoArrowColumns(columns)`

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

#### `materializeGeoArrowRows(column)`

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

#### `getGeoArrowBounds(column)`

Returns `[minX, minY, maxX, maxY]`, or `null` when no finite native coordinate exists.

#### `getGeoArrowRowBounds(column)`

Returns one XY bound (or `null`) per logical row in a single descriptor traversal. This is the
preferred primitive for loaders and query engines that need conservative row pruning.

#### `mapGeoArrowCoordinates(column, mapper, options?)`

Allocates a new native column and applies `mapper(coordinate, rowIndex)` to each coordinate. Options
select output dimension/layout and resource limits.

#### `mapGeoArrowCoordinatesInto(target, source, mapper, options?)`

Maps into caller-owned coordinate buffers. Source and target must have compatible physical
topology. The function returns `target` and never replaces its descriptors.

## Physical conversion

#### `interleaveGeoArrowCoordinates(column)`

Converts separated coordinates to fixed-size interleaved tuples. Already interleaved and
non-coordinate columns are returned unchanged.

#### `convertGeoArrowColumn(column, options?)`

Converts native geometry family, semantic dimension, coordinate layout, coordinate type, or offset
width. Options are `encoding`, `dimension`, `coordinateLayout` (`preserve`, `interleaved`, or
`separated`), `coordinateType` (`preserve`, `float32`, or `float64`), and `offsetType`
(`preserve`, `int32`, or `int64`). Semantic ordinates map by name, preserving the distinction
between M and Z. Requests for `geoarrow.wkb` or `geoarrow.wkt` encode native geometry as
variable-width values. Decode serialized input before changing its encoding.

For a dense-union stream, set `unionChildren` to ordered, empty `GeoArrowDenseUnionChild`
descriptors. Populated children are matched by encoding and dimension and must match the target's
physical layout after any requested conversions. Missing families reuse the target's empty children.
The result borrows compatible geometry and rewrites selectors only when their type IDs change.

#### `sortGeoArrowUnionChildren(column)`

Sorts dense-union child descriptors by type ID. Dispatch and child buffers are retained. Non-union
columns and already normalized unions are identity operations.

#### `rewindGeoArrow(column, options?)`

Normalizes Polygon and MultiPolygon winding. `outer` is `counter-clockwise` by default; holes use
the opposite orientation. If no ring changes, the original column is returned.

## GeoArrowBuilder

`GeoArrowBuilder` constructs homogeneous native columns through matching measure and
write passes. Results borrow the supplied target buffers.

### Properties

| Property | Type | Description |
| --- | --- | --- |
| `encoding` | `GeoArrowBuilderEncoding` | Homogeneous geometry family. Readonly. |
| `dimension` | `GeoArrowDimension` | XY, XYZ, XYM, or XYZM semantics. Readonly. |
| `coordinateLayout` | `GeoArrowCoordinateLayout` | Interleaved or separated coordinates. Readonly. |
| `offsetType` | `'int32'` or `'int64'` | Offset buffer width. Readonly. |
| `coordinateType` | `'float32'` or `'float64'` | Coordinate storage precision. Readonly. |

### Constructor

```typescript
new GeoArrowBuilder(options);
```

`options` selects the geometry encoding, dimension, coordinate layout/storage, and
`mode: 'measure' | 'write'`. Write mode receives a previously allocated target.
Append the same geometry sequence in both passes.

### Static methods

#### build(rows, options)

`GeoArrowBuilder.build(rows, options)` performs both passes with internal allocation.

### Methods

| Method | Description |
| --- | --- |
| `append(geometry)` | Append one geometry value or null. Returns the builder. |
| `getMeasurement()` | Return exact row, null, coordinate, part, and ring counts from the measure pass. |
| `allocateTarget()` | Allocate matching validity, coordinate, and offset buffers from measured counts. |
| `finish()` | Return the completed borrowed column from a write pass. |
| `beginGeometry(type, dimension, count?)` | Begin one geometry in the incremental event API. |
| `beginPolygon()` | Begin a polygon part of a MultiPolygon. |
| `beginRing(count?)` | Begin a linear ring. |
| `writeCoordinate(x, y, z?, m?)` | Append a coordinate; the overload also accepts a coordinate tuple. |
| `writeCoordinateFromDimension(x, y, z, m, sourceDimension)` | Map Z/M by semantic name without creating an intermediate tuple. |
| `endGeometry()` | Complete the current event-stream geometry. |

Events let streaming parsers avoid intermediate geometry objects. A MultiPolygon
without `beginPolygon()` calls is treated as one polygon for compatibility.

## Construction functions

#### allocateGeoArrowBuilderTarget(measurement, options)

Allocates exact validity, coordinate, and offset buffers without a builder instance.

#### makeGeoArrowColumnFromGeometryRows(rows, options?)

Builds homogeneous, geometry-collection, or mixed dense-union storage from materialized
values. Set `encoding: 'geoarrow.geometry'` to force a dense union for homogeneous rows.

## WKB and WKT

#### `decodeGeoArrowWKB(column, options?)`

Decodes serialized WKB chunks into native GeoArrow descriptors.

#### `decodeGeoArrowWKT(column, options?)`

Decodes each serialized WKT chunk into one native GeoArrow chunk, including empty
and all-null chunks. Mixed-family and collection output use stable union children
across chunks. Invalid WKT and mismatches with an explicit concrete family throw.

`DecodeGeoArrowWKTOptions` accepts a native geometry `encoding`, output
`dimension`, `coordinateLayout`, `coordinateType`, and `offsetType`. By default,
the decoder chooses the encoding from the column's geometry families and uses the
declared dimension, interleaved Float64 coordinates, and Int32 list offsets.
Dense-union indexes retain their Arrow-defined Int32 width.

```ts
import {decodeGeoArrowWKT} from '@math.gl/core/arrow';

const lines = decodeGeoArrowWKT(wktColumn, {
  encoding: 'geoarrow.linestring',
  coordinateLayout: 'separated',
  coordinateType: 'float32',
  offsetType: 'int64'
});
```

Import these functions from `@math.gl/core/arrow`. They decode serialized chunks into native
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
| `traversal` | `@math.gl/core/arrow` traversal/resource limits | none |

`infer` reads semantic dimensions from WKB headers rather than trusting the placeholder dimension
on a Binary descriptor. Concrete family rows use header-only classification plus exact measure and
write traversals. Mixed unions receive a stable schema across all chunks, and GeometryCollections
are built recursively without materialized geometry rows. A concrete target supports the canonical
single-to-multi promotions and rejects incompatible families.

WKT accepts explicit Z/M/ZM tokens and the established three/four-ordinate compatibility form.

#### `getGeoArrowWKBVertexCount(column, traversal?)`

Counts vertices across WKB chunks without materializing rows or decoding coordinate ordinates.
Geometry and ring count fields are sufficient for Point, LineString, Polygon, all multi-geometries,
and recursive GeometryCollections. Regular binary and BinaryView storage are supported. The
optional traversal limits are the same as `decodeGeoArrowWKB`.

#### `encodeGeoArrowWKB(column)`

Encodes native GeoArrow descriptors into WKB chunks.

#### `encodeGeoArrowWKT(column)`

Encodes native GeoArrow descriptors into WKT chunks.

Import these functions from `@math.gl/core/arrow`. Both encoders traverse physical descriptors
directly, retain chunk boundaries, and represent dense-union child nulls in the serialized validity
bitmap. WKT uses the semantic dimension of each native union row. A column already in the requested
encoding is returned unchanged.

Individual geometry parsing and formatting live in `@math.gl/core/arrow`. GeoArrow's four codec functions
adapt those neutral codecs to serialized column descriptors, validity, offsets, chunks, CRS, and
metadata.

## Polygon tessellation

#### `tessellateGeoArrowPolygons(column, options?)`

Import this function from `@math.gl/geometry/arrow`. It returns `GeoArrowTessellation`:

| Field | Description |
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

#### `assertGeoArrowResourceLimits(column, options?)`

Checks optional maximum rows, coordinates, chunks, nesting depth, and estimated output bytes.

#### `getGeoArrowTransferList(column)`

Returns unique `ArrayBuffer` instances reachable from the descriptor tree. Shared buffers are
omitted and no buffer is detached.

#### `prepareGeoArrowTransfer(column)`

Available from `@math.gl/core/arrow`. Returns `{column, transferList}` for explicit use with
`postMessage` or another structured-clone transport.
