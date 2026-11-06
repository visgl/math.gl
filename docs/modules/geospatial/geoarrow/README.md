# @math.gl/geospatial/geoarrow

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`@math.gl/geospatial/geoarrow` is the Arrow-runtime-independent home for columnar geospatial math in math.gl.
It defines a small immutable descriptor ABI over borrowed typed arrays and implements synchronous
geometry kernels directly over that ABI.

## Feature Card

| Feature | Support | Notes |
| --- | --- | --- |
| Native and mixed geometry layouts | ✅ | [Physical layouts](../developer-guide/geoarrow.md#understand-the-physical-layout) cover homogeneous geometries, dense unions and collections with explicit XY/XYZ/XYM/XYZM semantics. |
| Null, empty, sliced and chunked arrays | ✅ | Logical offsets, validity bitmaps and safe Int64 offsets preserve ownership and null/empty distinctions. |
| Validation, traversal and bounds | ✅ | [Inspection and kernels](./api-reference/geoarrow.md) operate on column descriptors without requiring per-row geometry materialization. |
| Builders and physical-layout conversion | ✅ | Two-pass builders, interleave/separate conversion, union normalization and rewinding have explicit allocation/identity rules. |
| Coordinate mapping and reusable destinations | ✅ | Coordinate transforms can write caller-owned targets with validated layouts. |
| WKB/WKT column codecs | ✅ | Serialized columns retain offsets, validity, chunks and metadata through the documented codecs. |
| Polygon tessellation and transfer preparation | ✅ | Flat positions/indices include row attribution; explicit resource limits and transfer helpers bound supported operations. |
| XY geometry streaming and streamed tessellation | ✅ | [Geometry streams](../developer-guide/geoarrow.md#stream-clip-and-tessellate) accept external geometry engines and retain source-row attribution, with a task-worker recipe. Z/M and serialized input are outside this stream profile. |
| Direct Arrow Table/RecordBatch integration | ◐ | The descriptor ABI is runtime-neutral. Applications or loaders adapt their Arrow runtime at the boundary. |
| Complete GIS topology/overlay engine | ❌ | No general GEOS-style union, overlay, topology-repair or spatial-database engine is provided by these column kernels. |
| GPU-resident column execution | ❌ | The kernels are synchronous CPU operations; GPU upload/compute and device memory ownership belong to consumers. |

## Design goals

- **Columnar first:** inspection, counting, and bounds do not create per-row geometry objects.
- **Runtime neutral:** loaders and dataframe libraries adapt buffers at the package boundary.
- **Zero-copy when possible:** slices and identity conversions retain descriptor and buffer identity.
- **Complete geometry semantics:** XY, XYZ, XYM, and XYZM remain distinct; native, mixed, serialized,
  null, empty, sliced, and chunked columns share one contract.
- **Renderer ready:** polygon tessellation returns flat positions, row attribution, and indices
  without importing a graphics runtime.
- **Safe by default:** stable validation diagnostics and opt-in work/output limits guard untrusted
  inputs.

## Installation

```bash
npm install @math.gl/geospatial
```

## First column

```typescript
import {GeoArrowBuilder, inspectGeoArrowColumn, getGeoArrowBounds} from '@math.gl/geospatial/geoarrow';

const points = GeoArrowBuilder.build(
  [
    {type: 'Point', coordinates: [-122.4, 37.8]},
    null,
    {type: 'Point', coordinates: [-73.9, 40.7]}
  ],
  {encoding: 'geoarrow.point', dimension: 'xy'}
);

inspectGeoArrowColumn(points);
// {rowCount: 3, nullCount: 1, coordinateCount: 2, valid: true, ...}

getGeoArrowBounds(points);
// [-122.4, 37.8, -73.9, 40.7]
```

## Where to go next

- [Physical layouts](../developer-guide/geoarrow.md#understand-the-physical-layout) explains every descriptor, nesting, offset, slice,
  validity, union, and ownership rule.
- [API reference](./api-reference/geoarrow.md) groups the public functions by task and documents
  allocation and identity behavior.
- [Migration guide](../developer-guide/geoarrow.md#replace-an-existing-runtime-integration) maps the loaders.gl and luma.gl prototypes onto the
  runtime-neutral API.

The package README also contains complete examples for two-pass building, codecs, tessellation,
resource limits, worker transfers, and runtime adapters.

See [Geometry streams and task workers](../developer-guide/geoarrow.md#stream-clip-and-tessellate) for external-engine clipping,
polygon tessellation and source-row attribution without materializing GeoJSON.
