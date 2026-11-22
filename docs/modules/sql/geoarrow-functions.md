# @math.gl/sql/geoarrow-functions

Register `createGeoArrowConversionFunctions()` to convert geometry columns between
WKB and native Arrow encodings. The input field must carry an `ARROW:extension:name`
for its GeoArrow encoding. Conversions preserve row order, nulls, and field metadata
such as the CRS. They do not reproject coordinates.

| SQL function | Output extension |
| --- | --- |
| `GEOARROW_TO_WKB(geometry)` | `geoarrow.wkb` (Arrow Binary) |
| `GEOARROW_TO_POINT(geometry)` | `geoarrow.point` |
| `GEOARROW_TO_LINESTRING(geometry)` | `geoarrow.linestring` |
| `GEOARROW_TO_POLYGON(geometry)` | `geoarrow.polygon` |
| `GEOARROW_TO_MULTIPOINT(geometry)` | `geoarrow.multipoint` |
| `GEOARROW_TO_MULTILINESTRING(geometry)` | `geoarrow.multilinestring` |
| `GEOARROW_TO_MULTIPOLYGON(geometry)` | `geoarrow.multipolygon` |
| `GEOARROW_TO_UNION(geometry)` | `geoarrow.geometry` (Arrow dense union) |

Each specialized function accepts its own family. A Multi function also accepts
the corresponding single geometry. A row from another family raises an error.
Specialized results use the input's dimension for specialized input and XY for
WKB or union input. Pass `{dimension: 'xyz'}` (or `'xy'`, `'xym'`, `'xyzm'`) to
the factory to set the specialized result dimension explicitly. An output drops
ordinates outside its target dimension and fills missing ordinates with zero.

A new dense union has a stable schema with children for all six families in
XY, XYZ, XYM, and XYZM. It preserves each row's dimension. Existing unions
pass through with their schema and buffers. Geometry collections in native
columns or unions can be serialized to WKB. Creating new native union children
for collections is outside the supported conversion set.

## Stream a conversion

Use the package with [the batch query API](query.md#querying-a-stream-of-record-batches)
to convert WKB footprints into native multipolygons for deck.gl.

```ts
import {createGeoArrowConversionFunctions} from '@math.gl/sql/geoarrow-functions';
import {queryArrowTableInBatches} from '@math.gl/sql/query';

for await (const batch of queryArrowTableInBatches(inputBatches, inputSchema, {
  select: [
    {column: 'id'},
    {expression: 'GEOARROW_TO_MULTIPOLYGON(footprint)', as: 'footprint'}
  ],
  functions: [createGeoArrowConversionFunctions()]
})) {
  consume(batch);
}
```

The query binds the output schema before reading data and converts one input
batch at a time. Matching encodings reuse input buffers. Wrapping compatible
native vectors in a union allocates selectors while borrowing coordinates,
list offsets, and validity. A contiguous union child can also be returned as
a specialized vector without copying those buffers. Conversions that change
coordinate layout, dimensionality, or row order allocate the required buffers.
