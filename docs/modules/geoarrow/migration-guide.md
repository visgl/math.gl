# Migrating GeoArrow work into math.gl

`@math.gl/geoarrow` consolidates the reusable math from the loaders.gl GeoArrow tentpole work and
luma.gl's private polygon/interleaving prototype. The key architectural change is that math.gl owns
the runtime-neutral descriptor ABI and pure kernels; adapters remain with the runtime that owns the
table objects.

## Responsibility split

| Concern | New owner |
| --- | --- |
| File/network loading, schemas, GeoParquet metadata | loaders.gl |
| Adapting table/vector buffers to descriptors | loaders.gl or the table runtime integration |
| Physical validation, traversal, bounds, mapping, winding | `@math.gl/geoarrow` |
| Individual WKB/WKT parsing and formatting | `@math.gl/wkb` |
| WKB/WKT column descriptors and adapters | `@math.gl/geoarrow` |
| Polygon/MultiPolygon tessellation | `@math.gl/geoarrow` |
| GPU buffer creation and rendering | luma.gl/deck.gl |
| Worker scheduling and ownership policy | the application or loader |

This boundary prevents a graphics package from owning general-purpose geospatial math and prevents
math.gl from acquiring a table-runtime dependency.

## From loaders.gl

The tentpole implementation established the important conformance matrix: all geometry families,
XY/XYZ/XYM/XYZM, separated/interleaved coordinates, regular/large offsets, null/empty/chunked rows,
dense unions, geometry collections, WKB/WKT, bounds, mapping, winding, resource budgets, and
transfer-list deduplication. Those semantics are represented directly in `GeoArrowColumn`.

| Loader-facing concept | Runtime-neutral equivalent |
| --- | --- |
| Arrow `Vector` or `Data` | `GeoArrowColumn` / `GeoArrowArray` descriptor tree |
| Arrow field layout oracle | adapter validation plus `validateGeoArrowColumn` |
| `inspectGeoArrowVector` | `inspectGeoArrowColumn` |
| `getGeoarrowVertexCount` | `getGeoArrowVertexCount` |
| Arrow bounds kernel | `getGeoArrowBounds` |
| Arrow coordinate mapper | `mapGeoArrowCoordinates` or `mapGeoArrowCoordinatesInto` |
| Arrow builder output | `GeoArrowBuilderTarget` and borrowed descriptors |
| Arrow WKB/WKT construction | plain serialized/native descriptors |
| Arrow transfer traversal | descriptor `getGeoArrowTransferList` |

The loaders adapter should inspect Arrow schema/type metadata, then expose the physical buffers. It
should preserve chunking, view offsets, validity bit offsets, list offset width, union type IDs and
child names, semantic dimension, coordinate layout, CRS, and edge metadata. It should not iterate
rows through scalar accessors.

## From luma.gl

The private prototype coupled tessellation and interleaving to Arrow vectors, worker lifecycle, and
renderer-oriented options. The math.gl API separates these layers:

| luma prototype | New API |
| --- | --- |
| Arrow-specific interleaving | `interleaveGeoArrowCoordinates` |
| Arrow dense-union normalization | `normalizeGeoArrowUnion` |
| `tessellateArrowPolygons` | `tessellateGeoArrowPolygons` |
| implicit worker fallback | explicit `@math.gl/geoarrow/worker` transfer payload |
| renderer-owned result assumptions | positions, row indices, indices, dimensions, and counts |

The tessellation kernel retains the prototype's important behavior: Polygon/MultiPolygon and dense
union support, holes, source-row identity across multipolygon primitives, Float64-to-Float32 output,
separated/interleaved equivalence, ZM preservation, large polygons, and Uint16/Uint32 index choice.
Color expansion and GPU resource creation stay in the renderer because they are not geometry math.

## Adapter pattern

An integration should have one narrow conversion function:

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

`adaptPhysicalArray` should return borrowed views. Validate once:

```typescript
const column = adaptGeometryColumn(runtimeColumn);
const validation = validateGeoArrowColumn(column);
if (!validation.valid) throw new Error(validation.issues[0].message);
```

All downstream consumers can then share math.gl kernels without importing the runtime adapter.

## Behavioral differences to account for

- Root math.gl APIs are synchronous. Schedule them in a worker when necessary rather than making
  the math API itself conditionally asynchronous.
- Transfer-list creation does not transfer ownership. Only the caller's transport operation may
  detach buffers.
- `dimension` is semantic. XYM and XYZ are not interchangeable despite both having three values.
- Serialized columns are decoded explicitly before native coordinate traversal.
- Identity operations return the original descriptor. Preserve this when wrapping the API.
- Tessellation omits duplicate closing coordinates and attributes every output vertex to the
  top-level source row.
- Runtime-specific field negotiation and metadata merge policy remain outside math.gl.

## Suggested integration sequence

1. Add a zero-copy adapter and fixture tests in loaders.gl.
2. Compare descriptor inspection, count, bounds, conversion, WKB/WKT, and tessellation against the
   existing Arrow-backed fixtures.
3. Replace luma's private interleaving and tessellation imports with `@math.gl/geoarrow`.
4. Keep worker orchestration in luma/loaders and use `prepareGeoArrowTransfer` for payloads.
5. Delete the duplicated kernels only after exact output fixtures and buffer-identity assertions
   pass in the consumer repositories.
