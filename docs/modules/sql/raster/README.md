# Raster functions

`@math.gl/sql/raster` provides synchronous raster sources and lazy operations without an Arrow
runtime dependency. `@math.gl/sql/arrow-raster` supplies schema-bound `RT_*` SQL functions.
Raster values are opaque handles: keep their `RasterContext` alive while consuming a result.
They are not serialized pixels and cannot be moved to another context, worker or process.

## Resident data and loaders.gl

```ts
import {RecordBatch, Schema, Struct, Table, makeData} from 'apache-arrow';
import {queryArrowSQL} from '@math.gl/sql';
import {RasterContext, createRasterSourceFromData} from '@math.gl/sql/raster';
import {createRasterField, createRasterVector, createRasterFunctions} from '@math.gl/sql/arrow-raster';

// With loaders.gl, first await source.getRaster(...) or source.getRasterForRegion(...).
// Pass that NumericRasterData payload directly instead of the small fixture below.
const source = createRasterSourceFromData({
  width: 2, height: 2, bandCount: 1, dtype: 'float32',
  data: new Float32Array([1, 2, 3, 4]),
  transform: [1, 0, 0, 0, -1, 2],
  pixelRegistration: 'area', crs: 'EPSG:4326'
});
const context = new RasterContext();
const values = createRasterVector(context, [source]);
const schema = new Schema([createRasterField('rast')]);
const table = new Table(new RecordBatch(schema, makeData({
  type: new Struct(schema.fields), length: 1, children: [values.data[0]]
})));
const result = queryArrowSQL(
  'SELECT RT_Value(RT_Multiply(rast, 2), 1, 2, 2) AS sample FROM rasters',
  new Map([['rasters', table]]),
  {functions: createRasterFunctions(context)}
);
console.log(result.getChild('sample')?.get(0)); // 8
context.clear(); // Invalidates all registered input and derived handles.
```

SQL sees the loaded payload's grid and extent, not the complete upstream dataset. Raster loading
and remote I/O happen before synchronous SQL execution. No loaders.gl runtime dependency is
required. Borrowed buffers must remain stable while the source is in use; operations never
mutate them. The adapter snapshots metadata and drops upstream declared/computed statistics,
bounds and overview metadata rather than incorrectly assigning them to derived windows.

## Source interface

A `SyncRasterSource` has immutable `metadata` and
`readWindow({x, y, width, height, bands?, signal?}): NumericRasterData`.
Window positions and band positions are zero-based integers. Bands default to all, must be
unique and address the current payload order; `bands[i].index` retains the original source index.
Windows must be in bounds. Empty windows are supported. Built-in implementations limit each
window to 16 million pixels and 256 MiB of sample/mask allocation.

Metadata includes dimensions, band count, numeric `dtype`, optional band interpretation,
NoData, CRS, transform and pixel registration. Payloads accept packed planar, separate planar
and interleaved typed arrays, including mixed per-band types (`dtype: 'mixed'`). Masks use
`offset + row * rowStride + column * pixelStride`; zero is invalid. A mask may apply to all
bands or one payload band position.

Transforms use `[a, b, c, d, e, f]`:
`x = a * column + b * row + c`, `y = d * column + e * row + f`.
Area samples are centered at grid coordinates plus 0.5; point samples at integer coordinates.
Missing registration defaults to area. Spatial operations require a finite invertible affine;
they never infer it from bounds. CRS accepts serialized definitions or PROJJSON objects
structurally, without importing geospatial into SQL. Matching accepts equal definitions
(object key order is ignored) or the same declared EPSG identity, including EPSG identifiers
and PROJJSON IDs. It does not resolve other aliases or reproject.

Validity follows loaders.gl: finite raw value, raw NoData exclusion (including Float32
rounding), then all applicable masks. Per-band NoData overrides dataset NoData; explicit null
disables that fallback. Masks cannot restore NoData. Functions operate on raw values; scale
and offset are retained for band views, clipping and resampling, but not applied implicitly.

## SQL function reference

Raster arguments use `createRasterField`, which attaches the `math.gl.raster` Arrow extension
to UTF-8 storage. Plain strings do not match raster overloads. Functions are opt-in through
`createRasterFunctions(context)`. Numeric arguments/results use Float64; explicitly cast
integer columns to `DOUBLE` when needed. SQL band/column/row indices are one-based.
All functions propagate SQL null arguments.

| Functions | Behavior |
| --- | --- |
| `RT_Width(r)`, `RT_Height(r)`, `RT_NumBands(r)` | Grid dimensions and band count |
| `RT_SRID(r)` | EPSG code from an identifier or PROJJSON ID; null if unavailable |
| `RT_ScaleX/Y(r)`, `RT_SkewX/Y(r)`, `RT_UpperLeftX/Y(r)` | Affine coefficients |
| `RT_BandPixelType(r, band)`, `RT_BandNoDataValue(r, band)` | Numeric dtype name and raw NoData |
| `RT_RasterToWorldCoordX/Y(r, column, row)` | World coordinate at the grid position; area upper-left corner, point sample position |
| `RT_WorldToRasterCoordX/Y(r, x, y)` | Floor of inverse grid coordinate, converted to one-based indexing |
| `RT_Value(r, band, column, row)` | Raw pixel value; null outside the grid or for invalid samples |
| `RT_ConvexHull(r)` | Polygon WKB footprint, including skew; EPSG identity encoded as EWKB SRID when available |
| `RT_SummaryStats(r, band)` | Struct containing count, sum, mean, population stddev, min and max |
| `RT_Band(r, band)` | Lazy single-band source |
| `RT_Clip(r, polygon[, crs])` | Same-CRS crop and sample-center mask; polygon holes excluded |
| `RT_Resample(r, reference[, method])` | Same-CRS reference grid, nearest (default) or bilinear |
| `RT_Add/Subtract/Multiply/Divide(r, other)` | Aligned raster bands or raster and scalar |

Clipping accepts Polygon WKB. Compiled queries read GeoArrow CRS metadata from the actual
geometry argument field, or use an EWKB SRID or explicit serialized CRS argument.
For direct kernel calls without bound argument fields, `createRasterFunctions` accepts
`geometryField` as fallback metadata. Footprints for non-EPSG CRS definitions have no embedded CRS and require an
explicit CRS when reused. Polygon exterior boundaries are included and hole boundaries excluded.
Empty clips have an empty grid; empty footprints are Polygon EMPTY.

Bilinear interpolation requires every nonzero-weight contributor to be valid; categorical
bands use nearest sampling. Resampled bands use Float64. Arithmetic requires identical
transforms, registration, dimensions, CRS and band counts, and returns Float64 bands without
inherited calibration, units, categories or statistics. Invalid operands, division by zero
and nonfinite arithmetic results produce invalid samples. Sources are lazy: construction
reads no pixels; window requests drive evaluation. Statistics scan bounded 128-by-128 windows.
For all-invalid/empty grids, count and sum are zero and other statistics are null.

Raster handles support projection, null checks and matching `CASE`/`COALESCE` branches.
Primitive coercion, comparison, joins on raster keys, grouping, sorting and MIN/MAX are rejected.
`COUNT(rast)` counts non-null handles. Inactive rows/branches do not read pixels or register
results. Source errors propagate; cancellation is forwarded to synchronous window reads.

## PostGIS, Sedona and future adapters

The namespace is deliberately `RT_*`. PostGIS raster SQL uses `ST_*`, whereas Sedona uses
`RS_*`. Metadata, band selection, value sampling, clipping and resampling have corresponding
functions, but signatures, pixel types, statistics conventions and processing options are not
claimed to be interchangeable. No compatibility aliases are registered.

| This API | PostGIS | Sedona |
| --- | --- | --- |
| `RT_Width`, `RT_Value` | `ST_Width`, `ST_Value` | `RS_Width`, `RS_Value` |
| `RT_Band`, `RT_Clip` | `ST_Band`, `ST_Clip` | `RS_Band`, `RS_Clip` |
| `RT_Resample`, `RT_SummaryStats` | `ST_Resample`, `ST_SummaryStats` | `RS_Resample`, `RS_SummaryStats` |
| Raster arithmetic | Map-algebra functions | Raster/array map-algebra functions |

A future loaders.gl native pixel-window capability can share this indexing and payload contract
while returning promises. It should remain separate from viewport and geographic-region reads:
axis-aligned geographic bounds cannot express exact native windows on skewed grids. Existing
loaders.gl APIs need no changes for the resident adapter. Shared types/kernels can move to a
neutral math.gl module after both interfaces are exercised. Async SQL, serialization, worker
transfer, reprojection, mosaics and terrain analysis are outside this API.
