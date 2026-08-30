# @math.gl/geoarrow

`@math.gl/geoarrow` is the Arrow-runtime-independent home for columnar geospatial math in math.gl.
It defines a small immutable descriptor ABI over borrowed typed arrays and implements synchronous
geometry kernels directly over that ABI.

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
npm install @math.gl/geoarrow
```

## First column

```typescript
import {GeoArrowBuilder, inspectGeoArrowColumn, getGeoArrowBounds} from '@math.gl/geoarrow';

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
