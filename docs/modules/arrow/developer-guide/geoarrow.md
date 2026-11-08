# GeoArrow

GeoArrow stores geometry in typed-array buffers rather than one JavaScript object per row. math.gl describes those buffers with plain TypeScript objects, so the same geometry kernels can work with Apache Arrow, a loader, or application-owned storage without depending on a table runtime.

Import the APIs from `@math.gl/arrow/geoarrow-utils`. The [API reference](../geoarrow-utils/api-reference/geoarrow.md) lists the descriptor types and operations.

## Adapt buffers once

A `GeoArrowColumn` describes the encoding, dimension, coordinate layout, and chunks, with optional spatial-reference, edge, and application metadata:

```typescript
function adaptGeometryColumn(runtimeColumn: RuntimeColumn): GeoArrowColumn {
  return {
    encoding: readExtensionEncoding(runtimeColumn),
    dimension: readSemanticDimension(runtimeColumn),
    coordinateLayout: readCoordinateLayout(runtimeColumn),
    chunks: runtimeColumn.chunks.map(adaptPhysicalArray),
    spatialReference: readSpatialReference(runtimeColumn),
    edges: readEdgeSemantics(runtimeColumn)
  };
}
```

The adapter belongs with the runtime that owns the table. It reads schema metadata and exposes borrowed buffers; it should preserve chunking, offsets, validity bits, offset widths, union IDs, dimensions, CRS, and edge semantics. Avoid iterating rows through scalar accessors just to reconstruct the same arrays.

Validate external descriptors before passing them to kernels:

```typescript
const column = adaptGeometryColumn(runtimeColumn);
const validation = validateGeoArrowColumn(column);
if (!validation.valid) throw new Error(validation.issues[0].message);
```

Validation reports stable codes and physical paths for inconsistent lengths, bitmap coverage, primitive views, coordinate fields, list nesting and bounds, serialized storage, and union dispatch. Descriptors are immutable; their buffers remain caller-owned. Do not mutate borrowed data during a calculation. Concurrent writers require application-level synchronization or snapshots.

## Understand the physical layout

Let `C` mean one coordinate tuple and `L<T>` a variable-size list.

| Encoding | Storage | One row represents |
| --- | --- | --- |
| `geoarrow.point` | `C` | a point |
| `geoarrow.linestring` | `L<C>` | a line |
| `geoarrow.multipoint` | `L<C>` | a set of points |
| `geoarrow.polygon` | `L<L<C>>` | polygon rings |
| `geoarrow.multilinestring` | `L<L<C>>` | multiple lines |
| `geoarrow.multipolygon` | `L<L<L<C>>>` | polygons and their rings |
| `geoarrow.geometry` | dense union | one selected child geometry |
| `geoarrow.geometrycollection` | `L<dense union>` | a collection of child geometries |

Some encodings share a storage shape. The encoding distinguishes LineString from MultiPoint, and Polygon from MultiLineString.

### Coordinates and views

Dimensions are semantic: `xy`, `xyz`, `xym`, and `xyzm` distinguish height Z from measure M. Three ordinates alone cannot tell you whether a tuple is XYZ or XYM. Interleaved coordinates use a fixed-size list over a numeric primitive; separated coordinates use a struct with named `x`, `y`, and optional `z`/`m` children.

A primitive view reads logical value `i` at `values[offset + i * stride]`. This can expose a component of an interleaved buffer without slicing or copying. Variable lists borrow Int32 or BigInt64 offsets. Their child range for a row is:

```text
first = offsets[offset + row]     - offsetBase
last  = offsets[offset + row + 1] - offsetBase
```

Offsets must be monotonic and within child storage. Int64 offsets must fit safe JavaScript integers before indexing. Each chunk has its own logical length and physical views.

Validity is a bitmap with an optional `bitOffset`; bit `bitOffset + i` describes logical value `i`. Slices advance logical and bitmap offsets while retaining backing buffers. A full slice returns the original descriptor. Null and empty differ: a null row is invalid, an empty list is valid with equal adjacent offsets, and an empty point conventionally uses non-finite ordinates.

### Mixed geometry and collections

A dense union has `typeIds`, `valueOffsets`, and named children with stable integer IDs. Each row selects a child and a value inside that child. Children stay compact and may specify their own encoding, dimension, and coordinate layout; populate that metadata to preserve distinctions such as Point Z versus Point M. Legacy descriptors without it fall back to the column declaration.

Arrow dense unions have no root validity buffer. A null geometry selects a real child slot whose child validity bit is cleared. Builders and decoders emit this form. Readers also accept legacy descriptor-level validity, but Arrow adapters must not use that legacy form to construct a dense union. Geometry collections are lists of the same union representation. `normalizeGeoArrowUnion` orders children by ID without changing dispatch buffers or backing-buffer identity.

### Serialized geometry and boxes

WKB uses binary storage and WKT uses UTF-8 storage, with the same offset, validity, slicing, and chunk rules. BinaryView descriptors can borrow four-word view records and out-of-line buffers, retaining short values inline. Inspection does not decode payloads: call `decodeGeoArrowWKB` or `decodeGeoArrowWKT` before coordinate processing.

Pass borrowed Binary, LargeBinary, or BinaryView storage directly to decoding; do not consolidate chunks first. Use the default dimension-inference policy unless trusted metadata requires normalization, and request the final coordinate layout, float width, and offset width in that call. `getGeoArrowWKBVertexCount` can count serialized vertices before allocating decoded storage.

Boxes use struct fields in minimum-then-maximum order: `xmin`, `ymin`, optional `zmin`/`mmin`, followed by `xmax`, `ymax`, and optional `zmax`/`mmax`.

## Process geometry without changing ownership

Inspection, counts, bounds, coordinate mapping, winding, interleaving, union normalization, and polygon tessellation operate on descriptors. Materialize JavaScript rows only when the consumer needs them, using `materializeGeoArrowRows`.

Read-only kernels do not write or detach buffers. Identity operations retain descriptor identity; allocating operations return new buffers. Builder write mode borrows application-provided targets. `getGeoArrowTransferList` reports transferable buffers but does not transfer them. Only the caller's transport operation can detach the sender's buffers.

Loaders.gl owns file/network loading, schema interpretation, GeoParquet metadata, and Arrow adaptation. math.gl owns physical validation and geometry calculations. Renderers own GPU buffers, color expansion, and drawing. Worker scheduling and ownership policy belong to the application or loader. Keeping these boundaries explicit avoids duplicating kernels or adding a renderer/table dependency to math.gl.

## Stream, clip, and tessellate

`streamGeoArrow(column, sink, options)` emits synchronous `point`, `lineStart`, `lineEnd`, `polygonStart`, and `polygonEnd` events compatible with D3 streams. It traverses native XY points, lines, polygons, multipart geometry, mixed columns, and collections directly, including slices and chunks. Null rows emit no geometry; row callbacks still include them. Polygon rings omit their repeated closing coordinate.

Decode serialized inputs and convert Z/M dimensions or boxes explicitly. Streaming preserves winding, CRS units, and planar/spherical edge semantics. D3 expects longitude/latitude degrees and its spherical ring convention; projecting individual points does not replace clipping a geometry stream.

```typescript
import {tessellateGeoArrowStream} from '@math.gl/arrow/geoarrow-utils';
import {geoOrthographic} from 'd3-geo'; // An optional application dependency.

const projection = geoOrthographic().rotate([-20, 30]);
const mesh = tessellateGeoArrowStream(column, {
  createStream: sink => projection.stream(sink),
  maxVertices: 65536,
  maxTriangles: 131072
});
```

The transform must synchronously flush each source row and emit finite planar simple rings with disjoint or nested interiors. The tessellator identifies holes and disconnected exteriors; it does not repair self-intersections or perform spherical clipping. Interrupted projections need clipping-aware factories, such as those from `d3-geo-polygon`. Native MapEngine spherical clipping is a separate path.

Results include Float64 XY `positions`, Uint32 `indices`, vertex-offset `polygonStarts` with a terminal sentinel, `polygonSourceRows`, and per-vertex `sourceRowIndices`. Several clipped polygons can retain the same input-row identity. This polygon tessellator ignores standalone points and lines and does not silently interpolate Z/M or arbitrary attributes.

Bound both input and output work. `maxVertices` includes emitted coordinates in discarded rings, `maxTriangles` bounds triangles, and `maxRingComparisons` defaults to 1,000,000 containment attempts. Exhaustion throws without returning a partial mesh. Source row IDs must fit Uint32. Sink exceptions propagate and may leave partial events in a caller-owned sink. Use `sourceRowOffset`, row callbacks, and input `limits` where appropriate.

## Run expensive work in a task

The [worker example](https://github.com/visgl/math.gl/tree/master/examples/arrow/geoarrow-stream-worker) uses the existing [task runtime](../../tasks/README.md). Send a plain column and a projection factory name, construct the stream inside the worker, and return transferable typed arrays. Do not send functions or live projection objects.

Transfer ownership detaches input buffers; create fresh input or retain a separate copy before another request. `prepareGeoArrowTransfer` prepares payloads. Copy/shared ownership and cancellation follow the task API. Synchronous processing cannot observe cooperative cancellation while blocking the event loop: terminate the worker or yield asynchronously between batches of rows.

External WASM engines can use persistent worker resources and asynchronous batches, but must provide geometry clipping/topology themselves. A scalar or batch point converter is not a stream and is not adapted into the synchronous CRS descriptor contract. See the [proj-wasm example](https://github.com/visgl/math.gl/tree/master/examples/geospatial/proj-wasm-crs).

For deck.gl, supply returned offsets, positions, and indices as binary attributes under a Cartesian view, and map picking through `polygonSourceRows`. Apply projection only once. See the [deck.gl integration](https://github.com/visgl/deck.gl/pull/10966).

## Replace an existing runtime integration

When moving Arrow-backed work from a loader or renderer, introduce one buffer adapter first. Compare inspection, vertex counts, bounds, mapping, winding, WKB/WKT decoding, tessellation, and buffer identity against the existing fixtures before deleting old kernels.

Use `interleaveGeoArrowCoordinates`, `normalizeGeoArrowUnion`, and `tessellateGeoArrowPolygons` for the corresponding renderer prototypes. Tessellation supports Polygon/MultiPolygon and dense unions, holes, source-row identity, ZM preservation, float-width conversion, and Uint16/Uint32 indices. The stream tessellator's XY-only contract is separate. Runtime-specific field negotiation, metadata merging, color expansion, and GPU creation remain with their consumers.
