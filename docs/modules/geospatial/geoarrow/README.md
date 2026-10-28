# @math.gl/geospatial/geoarrow

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`@math.gl/geospatial/geoarrow` is the Arrow-runtime-independent home for columnar geospatial math in math.gl.
It defines a small immutable descriptor ABI over borrowed typed arrays and implements synchronous
geometry kernels directly over that ABI.

## Feature support

Columnar geometry capabilities over a runtime-neutral borrowed-buffer ABI.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature | math.gl support | Notes |
| --- | --- | --- |
| Native and mixed geometry layouts | ✅ Implemented | [Physical layouts](./physical-layouts.md) cover homogeneous geometries, dense unions and collections with explicit XY/XYZ/XYM/XYZM semantics. |
| Null, empty, sliced and chunked arrays | ✅ Implemented | Logical offsets, validity bitmaps and safe Int64 offsets preserve ownership and null/empty distinctions. |
| Validation, traversal and bounds | ✅ Implemented | [Inspection and kernels](./api-reference/geoarrow.md) operate on column descriptors without requiring per-row geometry materialization. |
| Builders and physical-layout conversion | ✅ Implemented | Two-pass builders, interleave/separate conversion, union normalization and rewinding have explicit allocation/identity rules. |
| Coordinate mapping and reusable destinations | ✅ Implemented | Coordinate transforms can write caller-owned targets with validated layouts. |
| WKB/WKT column codecs | ✅ Implemented | Serialized columns retain offsets, validity, chunks and metadata through the documented codecs. |
| Polygon tessellation and transfer preparation | ✅ Implemented | Flat positions/indices include row attribution; explicit resource limits and transfer helpers bound supported operations. |
| Direct Arrow Table/RecordBatch integration | ◐ Partial | The descriptor ABI is runtime-neutral. Applications or loaders adapt their Arrow runtime at the boundary. |
| Complete GIS topology/overlay engine | ❌ Not implemented | No general GEOS-style union, overlay, topology-repair or spatial-database engine is provided by these column kernels. |
| GPU-resident column execution | ❌ Not implemented | The kernels are synchronous CPU operations; GPU upload/compute and device memory ownership belong to consumers. |

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

- [Physical layouts](./physical-layouts.md) explains every descriptor, nesting, offset, slice,
  validity, union, and ownership rule.
- [API reference](./api-reference/geoarrow.md) groups the public functions by task and documents
  allocation and identity behavior.
- [Migration guide](./migration-guide.md) maps the loaders.gl and luma.gl prototypes onto the
  runtime-neutral API.

The package README also contains complete examples for two-pass building, codecs, tessellation,
resource limits, worker transfers, and runtime adapters.

See [Geometry streams and task workers](./geometry-streams.md) for external-engine clipping,
polygon tessellation and source-row attribution without materializing GeoJSON.
