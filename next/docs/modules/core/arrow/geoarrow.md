# GeoArrow in math.gl

![GeoArrow](/math.gl/next/assets/images/geoarrow-logo-245a65f7a58463f92a51dff44685e384.png)

Use `@math.gl/core/arrow` to work with geometry columns from Apache Arrow feature tables. You can inspect one geometry, pass a range of rows to another consumer, or run a kernel such as bounds calculation directly on the column. In native layouts, a geometry view borrows coordinate buffers, offsets, and validity from the source.

## Start with a feature table[​](#start-with-a-feature-table "Direct link to Start with a feature table")

A GeoArrow feature table is an Arrow `Table` or `RecordBatch` with a geometry field and one row per feature. IDs and properties live in sibling columns. Many polygons and rings can belong to one row, so use the source row index to look up attributes.

```
import type {Table} from 'apache-arrow';

import {

  getGeoArrowColumnView,

  getGeoArrowRowView,

  iterateGeoArrowBatches,

  makeGeoArrowColumnFromArrowVector,

  materializeGeoArrowRows

} from '@math.gl/core/arrow';



function inspectFeatures(table: Table, rowIndex: number) {

  const field = table.schema.fields.find(field => field.name === 'geometry');

  const vector = table.getChild('geometry');

  if (!field || !vector) throw new Error('Missing geometry column');



  const column = makeGeoArrowColumnFromArrowVector(vector, {field});

  const row = getGeoArrowRowView(column, rowIndex);

  const featureId = table.getChild('id')?.get(row.rowIndex);



  // Borrow five rows starting at rowIndex, clamped at the end of the column.

  const range = getGeoArrowColumnView(column, rowIndex, rowIndex + 5);

  const batches = iterateGeoArrowBatches(range);



  // Decode just the selected geometry for JavaScript code that needs coordinates.

  const [geometry] = materializeGeoArrowRows(row.column);

  return {featureId, geometry, batches};

}
```

For streamed records, adapt each incoming batch independently and track its row base when looking up source features. The batch iterator reports offsets relative to the column you pass to it. In the example, add `rowIndex` to a batch's `rowOffset` to recover its start in the original table.

## Choose the view that matches the task[​](#choose-the-view-that-matches-the-task "Direct link to Choose the view that matches the task")

| Task                                              | API                                                  | Result                                                                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Keep a column for bounds, traversal or conversion | `makeGeoArrowColumnFromArrowVector(vector, {field})` | A `GeoArrowColumn` with semantic metadata and physical chunks.                                                                           |
| Inspect a single native geometry                  | `getGeoArrowRowView(column, i)`                      | A `GeoArrowRowView` with the original row and chunk indices. A mixed union row resolves to its concrete child.                           |
| Pass a row range onward in the source layout      | `getGeoArrowColumnView(column, start, end)`          | A column view over `[start, end)`. A one-row range of a mixed column retains the dense union, including its selectors and child buffers. |
| Consume existing physical chunks                  | `iterateGeoArrowBatches(column)`                     | A lazy sequence of `GeoArrowBatchView` objects with chunk indices and logical row offsets.                                               |
| Read nested JavaScript coordinate arrays          | `materializeGeoArrowRows(column)`                    | Decoded `GeoArrowDecodedGeometry` values and nulls. A decoded GeometryCollection has a `geometries` array.                               |

Homogeneous columns store one geometry family. A mixed `geoarrow.geometry` column uses a dense union. Its type ID identifies the geometry child and its offset locates the row in that child. A MultiPolygon or GeometryCollection still occupies one feature row. Null rows and empty geometries keep their distinct meanings.

## What borrows and what allocates[​](#what-borrows-and-what-allocates "Direct link to What borrows and what allocates")

Row, range, and batch views allocate small JavaScript descriptors and share their source storage. Range views use chunk lengths and advance offsets without scanning features or vertices. Keep the backing storage alive and avoid mutating or transferring it while views are in use.

When wrapping a view back into an Arrow vector, canonical dense-union selectors and compatible coordinate and offset layouts share backing buffers. A sliced validity bitmap can also be reused at its original bit offset. Converting noncanonical union IDs, packing strided coordinates, or normalizing an offset base can allocate. Preserve the geometry field's extension metadata when constructing a new Arrow field or schema.

| Consumer operation                                            | Work involved                                                                                      |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Read positions and path or ring boundaries                    | Borrow coordinate and list-offset buffers when the consumer supports their layout, width and base. |
| Request interleaved positions from separate coordinate arrays | Pack the requested coordinates into a new layout.                                                  |
| Build flat polygon starts or per-vertex picking IDs           | Compose nested offsets or expand the source-row mapping when the consumer needs these arrays.      |
| Draw polygon fills                                            | Run tessellation if matching triangle indices are unavailable. Outlines can use ring offsets.      |
| Read WKB/WKT as native coordinates                            | Decode serialized geometries before using native row views or coordinate kernels.                  |

These are CPU-side borrowing rules. GPU uploads and renderer-specific attributes depend on the consuming application.

## Convert geometry for another consumer[​](#convert-geometry-for-another-consumer "Direct link to Convert geometry for another consumer")

Use `convertGeoArrowColumn` to choose the output layout and encoding.

| Goal                                                  | Options                                                                           | Work involved                                                             |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Keep the geometry encoding and interleave coordinates | `{coordinateLayout: 'interleaved'}`                                               | Pack separate ordinates where the layout changes.                         |
| Send mixed geometries as native Arrow across batches  | `{encoding: 'geoarrow.geometry', coordinateLayout: 'interleaved', unionChildren}` | Reuse compatible geometry storage. Create or remap selectors when needed. |
| Send geometry to a WKB consumer                       | `{encoding: 'geoarrow.wkb'}`                                                      | Encode bytes per source chunk. Every batch uses a binary field.           |

For a stream, declare the ordered target children once. A point-only batch and a polygon-only batch then expose the same union type even though each batch contains an empty child. This example uses XY and interleaved Float64 storage for both children.

```
import {convertGeoArrowColumn, GeoArrowBuilder} from '@math.gl/core/arrow';

import type {GeoArrowDenseUnionChild} from '@math.gl/core/arrow';



const unionChildren: readonly GeoArrowDenseUnionChild[] = [

  {

    encoding: 'geoarrow.point',

    name: 'Point',

    typeId: 1,

    dimension: 'xy',

    coordinateLayout: 'interleaved',

    data: GeoArrowBuilder.build([], {encoding: 'geoarrow.point'}).chunks[0]

  },

  {

    encoding: 'geoarrow.polygon',

    name: 'Polygon',

    typeId: 3,

    dimension: 'xy',

    coordinateLayout: 'interleaved',

    data: GeoArrowBuilder.build([], {encoding: 'geoarrow.polygon'}).chunks[0]

  }

];



const geometry = convertGeoArrowColumn(batchGeometry, {

  encoding: 'geoarrow.geometry',

  coordinateLayout: 'interleaved',

  unionChildren

});
```

Populate the target with every family and dimension you expect in the stream. An undeclared populated child or physical mismatch raises an error. Choose the desired coordinate precision and offset width explicitly when inputs vary. Keep each GeometryCollection child's nested union layout consistent with its target descriptor. `sortGeoArrowUnionChildren` only orders existing children by ID within a chunk. Use `unionChildren` when the schema must match across chunks.

## Geometry field metadata[​](#geometry-field-metadata "Direct link to Geometry field metadata")

GeoArrow `edges: 'planar' | 'spherical'` metadata is preserved on the descriptor's semantic envelope as well as in its metadata. Other declared edge modes are rejected; missing edges retain the GeoArrow planar default. Bounds remain coordinate-space extents.

The optional `coordinateLayout` hint must match the Arrow physical type; it does not convert storage. For layout conversion, adapt to a descriptor and use the `geoarrow-utils` conversion APIs before exporting a new Arrow vector.

Use the actual field from `table.schema` when adapting a table column. A vector alone has no extension metadata: LineString and MultiPoint share the same physical list nesting, as do Polygon and MultiLineString. Those ambiguous layouts require a field extension or explicit `encoding`; structural inference throws rather than choosing a geometry family silently. Three-component coordinates likewise require a named `xyz`/`xym` child or an explicit `dimension`; width alone cannot distinguish Z from M.

## Features[​](#features "Direct link to Features")

| Feature                                | Support | Notes                                                                            |
| -------------------------------------- | ------- | -------------------------------------------------------------------------------- |
| GeoArrow extension discovery           | ✅      | Inspect Arrow fields and schemas; retain opaque CRS and supported edge metadata. |
| Borrowed native and serialized buffers | ✅      | Preserve nulls, slices, chunks, dimensions, and mixed coordinate layouts.        |
| Inspection, bounds, and vertex counts  | ✅      | Operate through the physical descriptor kernels.                                 |
| Coordinate mapping and ring rewinding  | ✅      | Preserve the input; return compatible Arrow vectors.                             |
| Apache Arrow versions                  | ✅      | Optional peer supporting 17+; checked on 17–21.                                  |
| Geodesic bounds and CRS reprojection   | ❌      | Bounds use coordinate space; geographic interpretation belongs to geospatial.    |

## Installation and input models[​](#installation-and-input-models "Direct link to Installation and input models")

Install core and its optional Apache Arrow peer when using the combined Arrow entry point:

```
npm install @math.gl/core apache-arrow
```

`@math.gl/core/arrow` exposes both physical descriptor kernels and Arrow vector adapters. Descriptor kernels retain names such as `getGeoArrowBounds`; the vector equivalent is `getGeoArrowVectorBounds`. Only `@math.gl/core/utf8`, matrix, and color entry points can be imported without Apache Arrow.

## API[​](#api "Direct link to API")

### Metadata and discovery[​](#metadata-and-discovery "Direct link to Metadata and discovery")

* `getGeoArrowExtensionMetadata(field)` returns the recognized extension encoding and parsed metadata, or `null` for unrelated/unknown extensions. Malformed JSON or non-object extension metadata throws. CRS metadata is retained as opaque JSON; it is neither interpreted nor reprojected.
* `getGeoArrowFieldInfo(field)` adds native dimension and coordinate-layout facts. Serialized WKB/WKT has no field-level coordinate dimension, so `dimension` is `null` until its content is decoded.
* `getGeometryColumnsFromSchema(schema)` returns a `ReadonlyMap` keyed by geometry field name. It does not choose a primary geometry column.

### Borrow and reconstruct[​](#borrow-and-reconstruct "Direct link to Borrow and reconstruct")

* `makeGeoArrowColumnFromArrowVector(vector, options?)` returns a borrowed physical descriptor. Options include `field`, `encoding`, `dimension`, `coordinateLayout`, and opaque `metadata`. Explicit options override inferred metadata. A supplied field's physical type must match the vector.
* `makeArrowVectorFromGeoArrowColumn(column)` reconstructs a real Arrow vector. Contiguous values are borrowed where possible; strided coordinates, rebased offsets, and shifted validity bitmaps may require packing. It returns a vector, not a table or field: retain extension metadata and construct a field using the returned vector's type when assembling a table. Descriptor-to-Arrow conversion can normalize child field names and nullability. Descriptor union tags are remapped to canonical GeoArrow family/dimension IDs; this may allocate a type-ID buffer while retaining coordinate storage.
* `inferGeoArrowEncodingFromArrowType`, `inferGeoArrowDimensionFromArrowType`, and `inferGeoArrowCoordinateLayoutFromArrowType` provide physical inference without reading coordinates. Ambiguous family inference requires explicit metadata.

Canonical GeoArrow native coordinates use Float64; this adapter also accepts Float32 for interoperability. Coordinate axes in a separated tuple must use the same precision. See the [GeoArrow memory layout specification](https://geoarrow.org/format.html). Interleaved and separated layouts, XY/XYZ/XYM/XYZM, chunks, sliced validity bitmaps, nested lists, boxes, dense unions, and serialized binary/string arrays share the descriptor ABI. Canonical union type IDs carry geometry-family and Z/M meaning even when child names differ. Types added after Arrow 17, such as LargeList and variable-width view types, are available only when the installed Arrow runtime provides them; unsupported constructors fail clearly instead of forcing a newer Arrow dependency. Dictionary-encoded geometry vectors must be decoded to their physical geometry storage before adaptation.

### Inspect and process[​](#inspect-and-process "Direct link to Inspect and process")

* `inspectGeoArrowVector(vector, options?)` reports physical-layout validation, row/chunk/null counts, and native coordinate count. It does not decode WKB/WKT payloads or validate geometry topology.
* `getGeoArrowVectorBounds`, `getGeoArrowVectorRowBounds`, and `getGeoArrowVectorVertexCount` delegate to the existing descriptor kernels. Bounds are XY coordinate-space extents, not geodesic or antimeridian-aware envelopes. Decode serialized geometries with `geoarrow-utils` codecs before using native-only kernels.
* `mapGeoArrowVectorCoordinates(vector, mapper, options?)` returns a transformed vector with new coordinate buffers and preserves null rows. The mapper receives the coordinate and logical row index. The source is unchanged. Update CRS/extent metadata yourself if the transformation changes its meaning; metadata is not reprojected by the mapper. Boxes are bounds, not coordinate tuples; map the source geometries and recompute their bounds instead.
* `rewindGeoArrowVector(vector, options?)` accepts `outer: 'clockwise' | 'counter-clockwise'` and the existing resource-limit options. It returns the rewound vector; unchanged geometry may retain borrowed buffers. Boxes have no rings and are returned unchanged.

Borrowing is not an immutable snapshot. Mutating or transferring shared buffers can affect the source Arrow vector. For worker ownership, use the generic [Arrow transport APIs](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/arrow-table-transport.md) on an assembled Arrow table, or the descriptor transfer helpers in `geoarrow-utils`.

## Examples[​](#examples "Direct link to Examples")

* [Runnable Arrow-table example](https://github.com/visgl/math.gl/tree/master/examples/core/geoarrow-table) demonstrates discovery, borrowing, bounds, coordinate mapping, and round trips.
* The [stream/task-worker example](https://github.com/visgl/math.gl/tree/master/examples/core/geoarrow-stream-worker) imports `geoarrow-utils` for the plain descriptors in its worker messages.

The first upstreamed layer is the Arrow adapter, metadata discovery, and thin inspection/processing facades. Loader wrappers, GeoParquet metadata policy, GeoJSON compatibility converters, file loading, and rendering adapters remain outside this subpath.
