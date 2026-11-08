# Arrow-backed GeoArrow

<img src={require('./images/geoarrow-logo.png').default} alt="GeoArrow" width="128" />

`@math.gl/geospatial/geoarrow` connects real Apache Arrow JS fields and vectors to
math.gl's columnar geometry operations. It reads GeoArrow extension metadata and
adapts physical buffers to the Arrow-independent kernels in
[`@math.gl/geospatial/geoarrow-utils`](../geoarrow-utils/README.md).

## Choose an entry point

| Entry | Input | Arrow installation |
| --- | --- | --- |
| `@math.gl/core/arrow` | General Arrow tables, vectors, schemas, and transport payloads | Required for this subpath, version 17+ |
| `@math.gl/geospatial/geoarrow` | Arrow `Field`, `Schema`, and `Vector` objects with geospatial meaning | Required for this subpath, version 17+ |
| `@math.gl/geospatial/geoarrow-utils` | Plain physical descriptors over typed arrays | Not required |

Apache Arrow is an optional peer dependency of the package. Install it when using
the Arrow-backed subpath:

```sh
npm install @math.gl/geospatial apache-arrow
```

Importing the geospatial root or `geoarrow-utils` does not import Arrow. APIs with
similar names in the two subpaths accept different inputs: `/geoarrow` accepts
Arrow vectors; `/geoarrow-utils` accepts physical column descriptors.

## Start with an Arrow field

```typescript
import * as arrow from 'apache-arrow';
import {
  getGeometryColumnsFromSchema,
  makeGeoArrowColumnFromArrowVector,
  getGeoArrowBounds
} from '@math.gl/geospatial/geoarrow';

const vector = arrow.vectorFromArray(
  [[1, 2], null, [3, 4]],
  new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64()))
);
const field = new arrow.Field('geometry', vector.type, true, new Map([
  ['ARROW:extension:name', 'geoarrow.point'],
  ['ARROW:extension:metadata', JSON.stringify({edges: 'planar'})]
]));
const table = new arrow.Table(new arrow.Schema([field]), {geometry: vector});

getGeometryColumnsFromSchema(table.schema).get('geometry')?.encoding; // 'geoarrow.point'
getGeoArrowBounds(vector, {field}); // [1, 2, 3, 4]
const column = makeGeoArrowColumnFromArrowVector(vector, {field});
```

The optional `coordinateLayout` hint must match the Arrow physical type; it does
not convert storage. For layout conversion, adapt to a descriptor and use the
`geoarrow-utils` conversion APIs before exporting a new Arrow vector.

Use the actual field from `table.schema` when adapting a table column. A vector
alone has no extension metadata: LineString and MultiPoint share the same physical
list nesting, as do Polygon and MultiLineString. Those ambiguous layouts require
a field extension or explicit `encoding`; structural inference throws rather
than choosing a geometry family silently. Three-component coordinates likewise require
a named `xyz`/`xym` child or an explicit `dimension`; width alone cannot distinguish Z from M.

## API

### Metadata and discovery

- `getGeoArrowExtensionMetadata(field)` returns the recognized extension encoding
  and parsed metadata, or `null` for unrelated/unknown extensions. Malformed JSON
  or non-object extension metadata throws. CRS metadata is retained as opaque
  JSON; it is neither interpreted nor reprojected.
- `getGeoArrowFieldInfo(field)` adds native dimension and coordinate-layout facts.
  Serialized WKB/WKT has no field-level coordinate dimension, so `dimension` is
  `null` until its content is decoded.
- `getGeometryColumnsFromSchema(schema)` returns a `ReadonlyMap` keyed by geometry
  field name. It does not choose a primary geometry column.

### Borrow and reconstruct

- `makeGeoArrowColumnFromArrowVector(vector, options?)` returns a borrowed physical
  descriptor. Options include `field`, `encoding`, `dimension`, `coordinateLayout`,
  and opaque `metadata`. Explicit options override inferred metadata. A supplied
  field's physical type must match the vector.
- `makeArrowVectorFromGeoArrowColumn(column)` reconstructs a real Arrow vector.
  Contiguous values are borrowed where possible; strided coordinates, rebased
  offsets, and shifted validity bitmaps may require packing. It returns a vector,
  not a table or field: retain extension metadata and construct a field using the returned
  vector's type when assembling a table. Descriptor-to-Arrow conversion can normalize child
  field names and nullability. Descriptor union tags are remapped to canonical GeoArrow
  family/dimension IDs; this may allocate a type-ID buffer while retaining coordinate storage.
- `inferGeoArrowEncodingFromArrowType`, `inferGeoArrowDimensionFromArrowType`, and
  `inferGeoArrowCoordinateLayoutFromArrowType` provide physical inference without
  reading coordinates. Ambiguous family inference requires explicit metadata.

Canonical GeoArrow native coordinates use Float64; this adapter also accepts Float32
for interoperability. Coordinate axes in a separated tuple must use the same precision. See the [GeoArrow memory layout specification](https://geoarrow.org/format.html). Interleaved and separated
layouts, XY/XYZ/XYM/XYZM, chunks, sliced validity bitmaps, nested lists, boxes,
dense unions, and serialized binary/string arrays share the descriptor ABI. Canonical
union type IDs carry geometry-family and Z/M meaning even when child names differ.
Types added after Arrow 17, such as LargeList and variable-width view types, are
available only when the installed Arrow runtime provides them; unsupported
constructors fail clearly instead of forcing a newer Arrow dependency. Dictionary-encoded
geometry vectors must be decoded to their physical geometry storage before adaptation.

### Inspect and process

- `inspectGeoArrowVector(vector, options?)` reports physical-layout validation,
  row/chunk/null counts, and native coordinate count. It does not decode WKB/WKT
  payloads or validate geometry topology.
- `getGeoArrowBounds`, `getGeoArrowRowBounds`, and `getGeoArrowVertexCount` delegate
  to the existing descriptor kernels. Bounds are XY coordinate-space extents,
  not geodesic or antimeridian-aware envelopes. Decode serialized geometries with
  `geoarrow-utils` codecs before using native-only kernels.
- `mapGeoArrowCoordinates(vector, mapper, options?)` returns a transformed vector
  with new coordinate buffers and preserves null rows. The mapper receives the
  coordinate and logical row index. The source is unchanged. Update CRS/extent metadata yourself if the transformation changes
  its meaning; metadata is not reprojected by the mapper. Boxes are bounds, not coordinate
  tuples; map the source geometries and recompute their bounds instead.
- `rewindGeoArrow(vector, options?)` accepts `outer: 'clockwise' |
  'counter-clockwise'` and the existing resource-limit options. It returns the
  rewound vector; unchanged geometry may retain borrowed buffers. Boxes have no rings
  and are returned unchanged.

Borrowing is not an immutable snapshot. Mutating or transferring shared buffers
can affect the source Arrow vector. For worker ownership, use the generic
[Arrow transport APIs](../../core/arrow/arrow-table-transport.md) on an assembled
Arrow table, or the descriptor transfer helpers in `geoarrow-utils`.

## Examples and migration

- [Runnable Arrow-table example](https://github.com/visgl/math.gl/tree/master/examples/geospatial/geoarrow-table)
  demonstrates discovery, borrowing, bounds, coordinate mapping, and round trips.
- The [stream/task-worker example](https://github.com/visgl/math.gl/tree/master/examples/geospatial/geoarrow-stream-worker)
  now imports `geoarrow-utils` because its worker messages contain plain descriptors.
- Existing physical-descriptor callers should change imports from
  `@math.gl/geospatial/geoarrow` to `@math.gl/geospatial/geoarrow-utils`.
  Descriptor implementations and the corresponding root exports retain their behavior.

The first upstreamed layer is the Arrow adapter, metadata discovery, and thin
inspection/processing facades. Loader wrappers, GeoParquet metadata policy,
GeoJSON compatibility converters, file loading, and rendering adapters remain
outside this subpath.
