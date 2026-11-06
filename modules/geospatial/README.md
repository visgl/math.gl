# @math.gl/geospatial

[math.gl](https://math.gl/docs) is a suite of math modules for 3D and geospatial applications.

This module contains geospatial math, primarly ellipsoid math for dealing with the WGS84 (World Geodetic System) coordinate system.

For documentation please visit the [website](https://math.gl).

The grouped subpaths include `@math.gl/geospatial`, `/globe`, `/tiles`, `/crs`, `/projection`, `/web-mercator`,
`/wkb`, `/geoarrow`, `/expressions`, and the experimental `/discontinuous`. DGGS remains a separate module at `@math.gl/dggs`.
`@math.gl/web-mercator` remains available for existing applications.

Use `@math.gl/geospatial` for ellipsoid coordinate math and local tangent frames,
`@math.gl/geospatial` for geographic regions, bounding boxes, horizon bounds, occlusion, and globe mesh subdivision,
and `@math.gl/geospatial` for geographic tile queries and tile-matrix utilities.
The package root continues to export these APIs for compatibility. The existing `/tile-matrix`
subpath remains available for applications that only need tile-matrix utilities.

[`subdivideGlobeMesh`](https://math.gl/docs/modules/geospatial/api-reference/subdivide-globe-mesh) refines geographic meshes onto a sphere or oblate ellipsoid while preserving shared edges and attribute provenance. Import it from `@math.gl/geospatial`.

## Sources and credits

See [the packaged source and license index](./THIRD-PARTY-NOTICES.md) and
[math.gl references and credits](https://math.gl/docs/references-and-credits).

Use `@math.gl/geospatial` for [ellipsoidal/rhumb latitude clipping](https://math.gl/docs/modules/geospatial/api-reference/latitude-geographic-cuts) and adaptive projection that preserves generated parallel boundaries.

Use `@math.gl/geospatial` for [oblique ellipsoidal visibility and shared cut graphs](https://math.gl/docs/modules/geospatial/api-reference/geographic-atlas), including an octahedral faceted-map consumer.

## Batched GeoArrow operations

Import `@math.gl/geospatial/turf` for Turf-style operations on native GeoArrow columns from `@math.gl/geospatial/geoarrow`.
The entry point processes physical coordinate buffers without materializing GeoJSON rows.
`bbox`, `distance`, `bearing`, `length`, `area`, and `booleanPointInPolygon` return
`{values, validity}`: values are typed arrays in row order and validity is an Arrow bitmap
(least significant bit first). Bounds use four consecutive values per row. `centroid`
returns a GeoArrow point column and preserves the input spatial reference and metadata.
Null input rows yield null output rows. Binary operations pair rows or broadcast a
single row; other length mismatches throw.

Coordinates are longitude and latitude in degrees. Distance and length default to
kilometers and accept `units` of `kilometers`, `meters`, `miles`, `nauticalmiles`,
`radians`, or `degrees`; bearing is in degrees and area in square meters. The calculations
follow Turf's spherical model. Point-in-polygon is planar in coordinate space and accepts
`ignoreBoundary`. Measurements use XY only; Z and M do not affect results.

`distance` and `bearing` accept points, `length` accepts lines and multilines, `area`
and the polygon argument of `booleanPointInPolygon` accept polygons and multipolygons,
and `bbox` and `centroid` accept those families plus points and multipoints. Serialized,
mixed, box and collection encodings are rejected; decode or convert them first. Empty
lines and polygons have zero length or area, and an empty polygon contains no points;
empty geometries have null bounds and centroid. Polygon rings follow the GeoJSON convention
of repeating their first coordinate at the end. Inputs should have compatible spatial
references; these operations do not reproject or validate CRS compatibility.

Future phases can add transformations and derived geometries, further predicates, and
then topology operations such as intersection, union, difference, and buffer. Each phase
will need explicit geometry support and numerical compatibility guarantees.

## CRS

Proj4-independent coordinate reference system definitions shared by math.gl integrations.

PROJJSON is an OSGeo/PROJ specification, not an independently published OGC or ISO standard. It
is designed as a lossless JSON encoding of OGC WKT2:2019 / ISO 19162:2019 and is referenced by OGC
standards. This package uses strict PROJJSON v0.7 as its semantic CRS object model. Authority codes,
PROJ strings, WKT2, WKT1, and vendor WKT dialects remain string serializations. WKT and PROJ
syntax trees preserve the serializations without claiming semantic conversion to PROJJSON.

```ts
import {parsePROJString, parseWKTCRS} from '@math.gl/geospatial/crs';
import type {CRSDefinition, PROJJSONCRS} from '@math.gl/geospatial/crs';

const authorityCode: CRSDefinition = 'EPSG:4326';
const projString: CRSDefinition = '+proj=longlat +datum=WGS84 +no_defs';
const projjson: PROJJSONCRS = {
  type: 'GeographicCRS',
  name: 'WGS 84',
  datum: {
    name: 'World Geodetic System 1984',
    ellipsoid: {
      name: 'WGS 84',
      semi_major_axis: 6378137,
      inverse_flattening: 298.257223563
    }
  }
};

const wkt = parseWKTCRS('GEOGCRS["WGS 84",ID["EPSG",4326]]');
const proj = parsePROJString('+proj=longlat +datum=WGS84 +no_defs');
```

`SpatialReference` adds format-neutral discovery state around those definitions. It distinguishes
explicit definitions, specification defaults, explicitly unknown CRS values, and absent metadata;
it can also retain alternate representations, coordinate epoch, coordinate frame, stored
component order, and units.

```ts
import {createSpatialReference} from '@math.gl/geospatial/crs';

const spatialReference = createSpatialReference({
  crs: {
    state: 'explicit',
    definition: 'EPSG:4326',
    representation: 'identifier',
    provenance: 'metadata'
  },
  coordinateFrame: 'geographic',
  coordinateOrder: ['x', 'y']
});
```

The official PROJJSON v0.7 JSON Schema is vendored unchanged under its MIT license and exported as
`@math.gl/geospatial/crs/projjson.schema.json`. It is the source of truth for the checked-in generated
TypeScript declarations. Its runtime APIs parse, encode,
and validate serialization syntax and identify already-resolved metadata. They do not perform registry lookup, semantic equivalence,
coordinate transformation, or general conversion between WKT, PROJ, and PROJJSON.

The `ProjectionTransform` in `@math.gl/geospatial/projection/core` directly accepts
these readonly definitions, `CRSReference`, and `SpatialReference` descriptors. Its optional
WKT/PROJJSON adapters use this package's types and parsers; execution support is checked
by `checkProjectionCompatibility`. Unknown/absent metadata remains unresolved.
See the [projection API](https://math.gl/docs/modules/geospatial/projection/api-reference/typescript-projection)
for the supported transformation subset and storage-order behavior.

See the [PROJJSON specification](https://proj.org/en/stable/specifications/projjson.html).
See the math.gl [Coordinate Reference Systems guide](https://math.gl/docs/modules/geospatial/crs/developer-guide/coordinate-reference-systems)
for representations, epochs, axis order, vertical CRS, and transformation guidance.

`linearUnits` provides names and metre conversion factors keyed by PROJ unit
identifier. For example, `linearUnits.ft` is `{name: 'feet', metersPerUnit: 0.3048}`.

`getCRSSignature(metadata)` returns a deterministic signature for resolved
`CRSMetadata`. It tracks projection parameters, ellipsoid, effective axis order,
units, and horizontal extraction. Parameter order and object identity do not
matter. This is an identity of resolved execution conventions, not a semantic
equivalence test for arbitrary CRS definitions. Projection descriptors use this
result as `signature` when structured input or overrides require resolved metadata;
default string definitions retain the original string.

Import `getCRSSignature`, `linearUnits`, `CRSMetadata` and `CRSUnit` from
`@math.gl/geospatial/crs` when only resolved metadata is needed. This entry keeps
WKT/PROJ syntax readers out of the initial graph of code-split applications.

## GeoArrow

Arrow-independent columnar geometry descriptors and synchronous buffer algorithms for
GeoArrow-compatible memory layouts.

`@math.gl/geospatial/geoarrow` works directly over borrowed typed arrays. It deliberately does not require an
Arrow runtime: a loader, dataframe, database client, or application can adapt its buffers to the
small descriptor ABI and use the same validation, conversion, and coordinate algorithms. Optional
format and mesh capabilities are isolated behind subpaths so consumers only bundle what they use.

### Install

```bash
npm install @math.gl/geospatial
# Only needed when using the /wkb subpath directly.
npm install @math.gl/geospatial
```

### Why descriptors?

Columnar geometry should not need to become GeoJSON objects before useful work can begin. A
`GeoArrowColumn` describes the physical buffers that already exist:

- primitive numeric buffers;
- interleaved fixed-size coordinate tuples or separated coordinate structs;
- Int32 or Int64 variable-list offsets;
- validity bitmaps with non-byte-aligned slice offsets;
- dense unions for mixed geometry and list-of-union geometry collections;
- binary WKB and UTF-8 WKT buffers;
- one or more chunks.

Descriptors borrow their buffers. Read-only kernels never mutate or detach them. Identity
conversions return the original column object, so callers can use descriptor and `ArrayBuffer`
identity as a reliable zero-copy signal.

### Quick start

```typescript
import {
  getGeoArrowBounds,
  getGeoArrowVertexCount,
  mapGeoArrowCoordinates
} from '@math.gl/geospatial/geoarrow';
import {GeoArrowBuilder} from '@math.gl/geospatial/geoarrow';

const column = GeoArrowBuilder.build(
  [
    {type: 'LineString', coordinates: [[-122.4, 37.8], [-73.9, 40.7]]},
    null
  ],
  {
    encoding: 'geoarrow.linestring',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    offsetType: 'int32'
  }
);

getGeoArrowVertexCount(column); // 2
getGeoArrowBounds(column); // [-122.4, 37.8, -73.9, 40.7]

const shifted = mapGeoArrowCoordinates(column, ([x, y]) => [x + 360, y]);
```

### Physical nesting

`coord` below is either an interleaved `fixed-size-list` or a separated `struct`.

| Encoding | Physical descriptor tree |
| --- | --- |
| Point | `coord` |
| LineString | `list<coord>` |
| MultiPoint | `list<coord>` |
| Polygon | `list<list<coord>>` |
| MultiLineString | `list<list<coord>>` |
| MultiPolygon | `list<list<list<coord>>>` |
| Geometry | `dense-union<geometry children>` |
| GeometryCollection | `list<dense-union<geometry children>>` |
| Box | `struct<minimum and maximum ordinates>` |
| WKB | `serialized<binary>` |
| WKT | `serialized<utf8>` |

This example describes two XY points without copying the source coordinates:

```typescript
import type {GeoArrowColumn} from '@math.gl/geospatial/geoarrow';

const values = new Float64Array([10, 20, 30, 40]);
const points: GeoArrowColumn = {
  encoding: 'geoarrow.point',
  dimension: 'xy',
  coordinateLayout: 'interleaved',
  chunks: [{
    kind: 'fixed-size-list',
    length: 2,
    size: 2,
    child: {kind: 'primitive', length: 4, values}
  }]
};
```

For separated coordinates, use canonical ordinate names. `x` and `y` are always present; `z` and
`m` follow the semantic dimension and are never treated as interchangeable.

```typescript
const separatedPoints: GeoArrowColumn = {
  encoding: 'geoarrow.point',
  dimension: 'xym',
  coordinateLayout: 'separated',
  chunks: [{
    kind: 'struct',
    length: 2,
    children: {
      x: {kind: 'primitive', length: 2, values: new Float64Array([10, 30])},
      y: {kind: 'primitive', length: 2, values: new Float64Array([20, 40])},
      m: {kind: 'primitive', length: 2, values: new Float64Array([100, 200])}
    }
  }]
};
```

### Slices, validity, and chunks

Every physical descriptor has a logical `length` and may have a validity bitmap. A set bit means
valid. `bitOffset` makes sliced null bitmaps explicit, including slices that do not begin at a byte
boundary.

Variable-width descriptors have an `offset` into their offsets buffer and an optional `offsetBase`.
The child range for row `i` is:

```text
[offsets[offset + i] - offsetBase, offsets[offset + i + 1] - offsetBase)
```

Both `Int32Array` and `BigInt64Array` offsets are supported. Int64 values are checked before
conversion to JavaScript numbers; values outside the safe integer range are rejected.

`sliceGeoArrowColumn` creates zero-copy descriptor views and preserves chunk boundaries.
`validateGeoArrowColumn` checks physical bounds, validity coverage, monotonic offsets, coordinate
layout, list depth, and dense-union dispatch before an expensive operation is attempted.

### Two-pass building

`GeoArrowBuilder` has a measure pass and a write pass. This avoids growing arrays and lets an owner
allocate buffers in a pool, shared arena, or renderer-specific allocator.

```typescript
const rows = [
  {type: 'Polygon' as const, coordinates: [[[0, 0], [4, 0], [0, 4], [0, 0]]]},
  null
];
const options = {
  encoding: 'geoarrow.polygon' as const,
  dimension: 'xy' as const,
  coordinateLayout: 'separated' as const,
  offsetType: 'int64' as const
};

const measure = new GeoArrowBuilder({...options, mode: 'measure'});
rows.forEach(row => measure.append(row));

const target = measure.allocateTarget();
const write = new GeoArrowBuilder({...options, mode: 'write', target});
rows.forEach(row => write.append(row));

const polygons = write.finish(); // borrows target; no Arrow objects are constructed
```

`GeoArrowBuilder.build(rows, options)` is the convenient form when custom allocation is not needed.

For serialized loaders and streaming producers, the builder also accepts geometry events. A measure
builder and a write builder must receive the same event sequence; the write pass fills the caller's
buffers directly:

```typescript
builder.beginGeometry('Polygon', 'xy');
builder.beginRing(5);
builder.writeCoordinate(0, 0);
builder.writeCoordinate(4, 0);
builder.writeCoordinate(4, 4);
builder.writeCoordinate(0, 4);
builder.writeCoordinate(0, 0);
builder.endGeometry();
```

`MultiLineString` uses one `beginRing` per line and `MultiPolygon` uses `beginPolygon` followed by
one `beginRing` per ring. Parsers that already expose scalar ordinates can call
`writeCoordinateFromDimension(x, y, z, m, sourceDimension)` to map Z and M into the target
dimension without allocating a temporary coordinate tuple. Event writes do not create coordinate
arrays or Arrow objects.

### Inspection and read-only kernels

The following operations traverse descriptors directly and do not create per-row geometry objects:

- `inspectGeoArrowColumn`
- `validateGeoArrowColumn`
- `getGeoArrowVertexCount`
- `getGeoArrowBounds`
- `getGeoArrowRowBounds`
- `visitGeoArrowCoordinates`
- `getGeoArrowTransferList`

Allocating transforms such as coordinate mapping, physical conversion, and winding normalization
return new descriptors. Their inputs remain unchanged. Serialized codecs are isolated in the
`/wkb` subpath.

### Conversion and winding

```typescript
import {
  convertGeoArrowColumn,
  interleaveGeoArrowCoordinates,
  rewindGeoArrow
} from '@math.gl/geospatial/geoarrow';

const interleaved = interleaveGeoArrowCoordinates(separatedPoints);
const xyz = convertGeoArrowColumn(interleaved, {dimension: 'xyz'});
const normalized = rewindGeoArrow(polygons, {outer: 'counter-clockwise'});
```

Semantic dimensions are mapped by ordinate name. Converting XYM to XYZ produces a zero Z; it does
not reinterpret M as elevation. Requesting `geoarrow.geometry` always produces a dense union, even
when every current row has the same geometry family.

### WKB and WKT

The codecs consume and produce the same plain descriptors:

```typescript
import {
  decodeGeoArrowWKB,
  encodeGeoArrowWKB,
  decodeGeoArrowWKT,
  encodeGeoArrowWKT
} from '@math.gl/geospatial/geoarrow';

const wkb = encodeGeoArrowWKB(polygons);
const decoded = decodeGeoArrowWKB(wkb, {
  encoding: 'native',
  dimension: 'infer',
  coordinateLayout: 'interleaved',
  coordinateType: 'float64',
  offsetType: 'int32'
});
const wkt = encodeGeoArrowWKT(decoded);
const nativeAgain = decodeGeoArrowWKT(wkt);
```

WKB decoding accepts little- or big-endian geometry, ISO Z/M/ZM type offsets, EWKB Z/M/SRID flags,
BinaryView-style serialized buffers, nulls, mixed concrete families, multi-geometries, and recursive
GeometryCollections. The default dimension policy is `infer`: WKB headers are authoritative because
Arrow Binary storage has no physical coordinate dimension. Use `preserve` to force the descriptor's
declared dimension, or request `xy`, `xyz`, `xym`, or `xyzm` explicitly.

Ordinary rows use a header-only classification pass followed by one measurement traversal and one
write traversal. Scalar ordinates are written directly into the final interleaved or separated
Float32/Float64 buffers. GeometryCollections use a recursive schema-discovery pass and the same
two-pass child builders; they do not fall back to `parseWKB`, GeoJSON values, or nested coordinate
arrays. Input chunk boundaries are retained, and every mixed chunk receives the same union schema
even when a family first occurs in a later chunk.

`encoding` defaults to `native`, which selects a concrete family when all valid rows agree and a
dense union otherwise. A concrete target may also perform Point-to-MultiPoint,
LineString-to-MultiLineString, or Polygon-to-MultiPolygon promotion. `coordinateLayout`,
`coordinateType`, and `offsetType` select the final buffers directly, avoiding a decode-then-convert
copy. Dense-union nulls are represented by a valid child dispatch whose selected child value is
null; no Arrow-incompatible union validity bitmap is emitted.

WKT supports all corresponding geometry families, dimension tokens, both MultiPoint spellings, and
empties. WKT conversion currently prioritizes semantic compatibility; the WKB visitor path is the
allocation-sensitive path intended for high-volume loaders.

WKB encoding likewise preserves native chunk boundaries. Each chunk is measured into an offsets
buffer and then written into one exact byte allocation by replaying the physical descriptors; it
does not allocate a closure, geometry object, or coordinate array for every row.

`getGeoArrowWKBVertexCount(column)` counts serialized WKB vertices directly from headers and list
counts. It advances over coordinate payloads without decoding float ordinates, preserves all
traversal limits, and supports regular offset storage and BinaryView storage. Use it in loaders that
need counts before deciding whether to allocate native buffers.

Parsing or formatting one geometry is intentionally provided by the dependency-free
`@math.gl/geospatial` package. The GeoArrow `/wkb` bridge consumes its visitors and two-pass builder:

```typescript
import {parseWKB, writeWKB, parseWKT, formatWKT} from '@math.gl/geospatial';
```

The descriptor and buffer-algorithm implementation does not require Apache Arrow. The `/wkb`
subpath (and the legacy root codec re-exports) uses `@math.gl/geospatial`; install it when using those
functions.

### Polygon tessellation

```typescript
import {tessellateGeoArrowPolygons} from '@math.gl/geospatial/geoarrow';

const mesh = tessellateGeoArrowPolygons(polygons, {
  positionSize: 3,
  sourceRowOffset: 1000
});

// mesh.positions        Float32Array
// mesh.sourceRowIndices Uint32Array
// mesh.indices          Uint16Array or Uint32Array
```

Polygon, MultiPolygon, and polygon members of dense unions or geometry collections are supported.
Holes are retained, duplicate closing coordinates are omitted from mesh vertices, and every output
vertex retains its top-level source row. Tessellation uses `@math.gl/geometry` and is synchronous.

### Resource limits

Potentially allocating operations accept limits, and limits can also be checked directly:

```typescript
import {assertGeoArrowResourceLimits} from '@math.gl/geospatial/geoarrow';

assertGeoArrowResourceLimits(column, {
  maximumRows: 1_000_000,
  maximumCoordinates: 50_000_000,
  maximumChunks: 10_000,
  maximumNestingDepth: 8,
  maximumOutputBytes: 1_000_000_000
});
```

### Workers and transfer ownership

Root APIs are synchronous. Worker-specific payload preparation is isolated in the optional subpath:

```typescript
import {prepareGeoArrowTransfer} from '@math.gl/geospatial/geoarrow';

const payload = prepareGeoArrowTransfer(column);
worker.postMessage(payload.column, {transfer: payload.transferList});
```

`prepareGeoArrowTransfer` only lists unique transferable buffers; it does not detach them. The
explicit `postMessage` call transfers ownership. Shared buffers are omitted because they are not
transferable.

### Loaders.gl integration

The intended loaders.gl architecture keeps Apache Arrow at the boundary:

```text
Arrow Data / Vector / Table
        │  loaders.gl adapter
        ▼
GeoArrowColumn descriptors  ──►  @math.gl/geospatial/geoarrow buffer algorithms
        │
        └── loaders.gl Arrow field + extension metadata
```

The adapter should borrow Arrow buffers and preserve chunking, offsets, validity, dense-union
dispatch, dimensions, layouts, CRS, and extension metadata. It should not call Arrow scalar
accessors in conversion paths. Keep GeoJSON conversion, adaptive target policy, Arrow schema
construction, and row-shaped compatibility values in loaders.gl.

Use the optional `/wkb` bridge only for serialized columns and `/builder` when emitting native
descriptors from a feature stream. For event-built MultiPolygons, call `beginPolygon()` before each
part; omitting it retains the compatibility behavior of treating all rings as one polygon. This
keeps the common Arrow-to-native path independent of text and binary codec code.

### Adapting another columnar runtime

Keep runtime-specific objects at the boundary. Read their physical buffers and construct a
`GeoArrowColumn`; do not call scalar `get(row)` methods. The adapter should preserve:

1. chunk boundaries and logical lengths;
2. typed-array byte offsets and strides;
3. list offsets, including 64-bit offsets;
4. validity bitmap plus bit offset;
5. dense-union type IDs, value offsets, and child names;
6. extension encoding, semantic dimension, coordinate layout, CRS, and edge metadata.

Run `validateGeoArrowColumn` once at the trust boundary. Downstream math then remains independent of
the producer runtime.

### API groups

- Descriptors: `GeoArrowColumn`, `GeoArrowArray`, all physical array descriptor types
- Layout: `inspectGeoArrowColumn`, `validateGeoArrowColumn`, slicing and traversal
- Buffer algorithms: count, bounds, row bounds, map, interleave, convert, rewind, union
  normalization, resource limits
- Construction: `@math.gl/geospatial/geoarrow`
- Column codecs: `@math.gl/geospatial/geoarrow` (individual parsing/formatting is provided by
  `@math.gl/geospatial`)
- Meshes: `@math.gl/geospatial/geoarrow`
- Transfer: `getGeoArrowTransferList`, plus `@math.gl/geospatial/geoarrow`

See the math.gl documentation for the full [physical-layout guide](https://github.com/visgl/math.gl/blob/master/docs/modules/geospatial/geoarrow/physical-layouts.md),
[API reference](https://github.com/visgl/math.gl/blob/master/docs/modules/geospatial/geoarrow/api-reference/geoarrow.md), and
[migration guide](https://github.com/visgl/math.gl/blob/master/docs/modules/geospatial/geoarrow/migration-guide.md).

## Projection

This module transforms coordinates between geospatial coordinate reference systems.
`projectionEngine` uses the math.gl projection engine with the full projection catalogue and shared
math.gl/crs WKT/PROJJSON readers. The package has no runtime dependency on proj4js.
The v5 alpha package was renamed from `@math.gl/proj4`. Create transforms through
`projectionEngine.createProjection({from, to})` instead of the former `Proj4Projection`
constructor. The `/classic` wrapper is removed.

The runtime-free `@math.gl/geospatial/projection/types` entry exports the `ProjectionEngine` factory
and `Projection` transform contracts. Concrete engines are `FullProjectionEngine`,
`ConfigurableProjectionEngine`, `LazyProjectionEngine` and the minimal
`WebMercatorProjectionEngine` (`@math.gl/geospatial/projection/web-mercator`).

```typescript
import {projectionEngine} from '@math.gl/geospatial/projection';

const projection = projectionEngine.createProjection({to: 'EPSG:3857'});
const meters = projection.project([12, 55]);
```

For selective bundles, use `ProjectionTransform` from `@math.gl/geospatial/projection/core` with
explicit projection plugins. `lazyProjectionEngine` from `@math.gl/geospatial/projection/projections/lazy`
creates transforms that load algorithms on demand. The engine supports
geocentric/Helmert transforms and prepared horizontal datum grids. `projectFlat` and `unprojectFlat` transform interleaved
Float32/Float64 buffers without temporary coordinate arrays in the built-in pipeline.
Unsupported CRS variants fail explicitly; the documented support profile defines
compatibility boundaries.

Native PROJ is the numerical accuracy reference; proj4js 2.22.0 remains a
compatibility and benchmark reference. Independent forward/inverse fixtures cover
documented domains, with a separate pole and spherical-approximation audit. This
does not establish full-domain parity with modern PROJ; see the
[projection accuracy audit](https://github.com/visgl/math.gl/blob/master/docs/modules/geospatial/projection/modern-proj-audit.md)
for the supported numerical domains and remaining gaps.

### Attribution

The engine is derived from proj4js, with an independently designed modular runtime
and additional coordinate operations. Direct ports and adaptations retain their
upstream notices. Source headers use `SPDX-License-Identifier` for the license,
`SPDX-FileCopyrightText` for ownership and `SPDX-FileComment` for provenance; see
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md#projection-sources-and-notices) and the
[documentation](https://visgl.github.io/math.gl/next/docs/modules/projection).

## Terrain

Experimental renderer-independent height fields, sampling, derivatives, and regular
terrain meshes. The main entry point has no runtime imports from other packages.
Mesh construction is available separately from `@math.gl/geospatial/terrain`.

```ts
import {HeightField, TerrainSampleStatus} from '@math.gl/geospatial/terrain';
import {HeightFieldGeometry} from '@math.gl/geospatial/terrain';

const field = new HeightField({
  width: 2,
  height: 2,
  heights: new Float32Array([0, 2, 1, 4]),
  columnStep: [10, 0],
  rowStep: [0, 10],
  registration: 'vertex',
  heightReference: 'local-survey'
});

const sample = field.sample(5, 5);
if (sample.status === TerrainSampleStatus.VALID) {
  console.log(sample.height); // 1.75 meters, using bilinear interpolation
}

const mesh = new HeightFieldGeometry(field);
// POSITION is relative to mesh.origin; NORMAL is a smooth shading normal.
// Use field.sample(x, y, {interpolation: 'triangle'}) for the mesh's linear surface.
```

The main entry uses affine local Cartesian coordinates and heights in
meters, with Z up. The optional `/terrain/geographic` entry adds longitude/latitude
queries and physical east/north derivatives for geographic and Web Mercator rasters.
The `/terrain/tiled` entry adds cell-registered local-metric tile snapshots, seam
sampling, residency-aware fallback, incremental snapshot updates and transferable halo buffers.
The `/terrain/packed` entry adds a versioned f32/u32 upload layout with byte and
height-error budgets and validated CPU reconstruction. Shader implementations, GPU
resources and compute graph integration belong in luma.gl; math.gl contains no
shader code. No entry converts
height references. Input arrays are copied; missing samples are stored as finite zeros
with a separate mask. Query status must be checked before using a result.

See the [API and numerical contract](https://github.com/visgl/math.gl/blob/master/docs/modules/geospatial/terrain/README.md) and
[implementation roadmap](https://github.com/visgl/math.gl/blob/master/dev-docs/terrain-roadmap.md).

The optional `/terrain/surface` entry adds indexed triangle surfaces, barycentric
height sampling, explicit halfedge topology and BVH ray/segment/nearest queries.
Bounded query variants report completion and work counts; sphere queries return
face/edge/vertex contacts with explicit work and contact-capacity limits.
Segment-clearance and capsule queries cover the full axis, including interior
contacts missed by endpoint-only sphere tests. They do not report first-impact time.
`/terrain/bounds` adds conservative min/max hierarchies over height-field cells.
These are CPU/data APIs; shader and device execution stay in luma.gl.

## WKB

Dependency-free, synchronous codecs for Well-Known Binary (WKB), Extended WKB (EWKB), and
Well-Known Text (WKT) geometry.

`@math.gl/geospatial` is the format layer beneath `@math.gl/geospatial/geoarrow`. It parses and writes individual
geometry values without importing Arrow, GeoArrow, loaders.gl, or a geometry class hierarchy.
Applications can therefore use the codecs for row-oriented data, database values, network
messages, or as a building block for their own columnar adapters.

### Install

```bash
npm install @math.gl/geospatial
```



### Quick start

```typescript
import {parseWKB, writeWKB, parseWKT, formatWKT} from '@math.gl/geospatial';

const geometry = parseWKT('LINESTRING Z (0 0 5, 10 20 6)');
const bytes = writeWKB(geometry, 'xyz');

const parsed = parseWKB(bytes);
console.log(parsed.geometry);
console.log(parsed.dimension); // 'xyz'
console.log(formatWKT(parsed.geometry, parsed.dimension));
```

All APIs are synchronous. Inputs are borrowed and never detached or mutated. Returned geometry
values are plain immutable-by-contract objects and arrays.

### Geometry values

Both formats use the same `WellKnownGeometry` discriminated union:

```typescript
type WellKnownGeometry =
  | {type: 'Point'; coordinates: readonly number[]}
  | {type: 'LineString'; coordinates: readonly (readonly number[])[]}
  | {type: 'Polygon'; coordinates: readonly (readonly (readonly number[])[])[]}
  | {type: 'MultiPoint'; coordinates: readonly (readonly number[])[]}
  | {type: 'MultiLineString'; coordinates: readonly (readonly (readonly number[])[])[]}
  | {type: 'MultiPolygon'; coordinates: readonly (readonly (readonly (readonly number[])[])[])[]}
  | {type: 'GeometryCollection'; geometries: readonly WellKnownGeometry[]};
```

Coordinates use semantic dimensions `xy`, `xyz`, `xym`, or `xyzm`. Three-number tuples are
inferred as XYZ because tuple width alone cannot distinguish Z from M; pass `xym` explicitly when
writing measured geometry.

### WKB

#### Parse

```typescript
const result = parseWKB(bytes);

result.geometry;  // WellKnownGeometry
result.byteLength; // exact bytes consumed
result.dimension; // 'xy' | 'xyz' | 'xym' | 'xyzm'
result.srid;      // EWKB root SRID, when present
```

`parseWKB` accepts:

- little- and big-endian WKB;
- ISO SQL/MM Z, M, and ZM type offsets;
- EWKB Z/M/SRID header flags;
- Point, LineString, Polygon, all Multi geometries, and nested GeometryCollection values.

The parser requires exactly one complete geometry. It rejects trailing bytes, truncated buffers,
invalid byte order, wrong child families inside Multi geometries, excessive nesting, and excessive
declared element counts.

```typescript
const result = parseWKB(untrustedBytes, {
  maximumDepth: 32,
  maximumElements: 1_000_000
});
```

Limits are checked before the corresponding geometry arrays are allocated. Defaults are 64 levels
and 100 million total declared child elements.

#### Write

```typescript
const xy = writeWKB({type: 'Point', coordinates: [1, 2]});
const measured = writeWKB({type: 'Point', coordinates: [1, 2, 9]}, 'xym');
```

`writeWKB` emits deterministic little-endian ISO WKB. Missing ordinates are written as zero. It
does not emit an EWKB SRID; carry CRS/SRID metadata outside the neutral geometry value or in a
higher-level container.

#### Inspect and scan without decoding

Use `inspectWKBHeader` when routing or classifying data. It reads only the endian flag, type code,
dimension flags, and optional EWKB SRID; the coordinate payload does not need to be present.

```typescript
import {inspectWKBHeader, scanWKB} from '@math.gl/geospatial';

const header = inspectWKBHeader(bytes);
console.log(header.geometryType, header.dimension, header.srid);

const statistics = scanWKB(bytes, {maximumElements: 1_000_000});
console.log(statistics.coordinateCount);
console.log(statistics.geometryCounts);
console.log(statistics.bounds); // XYZM-aware finite bounds
```

`scanWKB` validates exactly one complete value and reports its byte length, geometry families,
per-family counts, coordinate and ring counts, maximum nesting depth, and finite coordinate bounds.
It accepts sliced typed-array views and mixed-endian nested geometries.

#### Visit coordinates directly

`visitWKB` exposes the same validated traversal through callbacks. Coordinate values are passed as
individual numbers rather than temporary coordinate arrays.

```typescript
import {visitWKB} from '@math.gl/geospatial';

visitWKB(bytes, {
  geometry: (header, count, depth) => {
    console.log(header.geometryType, count, depth);
  },
  ring: (pointCount, ringIndex) => {
    console.log(pointCount, ringIndex);
  },
  coordinate: (x, y, z, m, dimension, byteOffset) => {
    // Inspect, copy, transform, or aggregate directly from the source buffer.
  }
});
```

The visitor does not detach or mutate the input and does not create `WellKnownGeometry` rows.

#### Two-pass caller-buffer writing

`WKBBuilder` supports the same geometry event sequence in measurement and write modes. Write mode
accepts an existing buffer, a sliced typed-array view, and an optional destination offset.

```typescript
import {WKBBuilder} from '@math.gl/geospatial';

function emitLine(builder: WKBBuilder): void {
  builder.beginLineString(2);
  builder.writeCoordinate(0, 0, 5);
  builder.writeCoordinate(10, 20, 6);
}

const measure = new WKBBuilder({mode: 'measure', dimension: 'xyz'});
emitLine(measure);

const target = new Uint8Array(measure.finishGeometry());
const writer = new WKBBuilder({mode: 'write', target, dimension: 'xyz'});
emitLine(writer);
```

Builder options include little- or big-endian output, XY/XYZ/XYM/XYZM dimensions, EWKB SRID, and
coordinate transformation. `WKBBuilder.buildGeometryArray()` additionally returns plain Int32
offsets, contiguous bytes, and an optional validity bitmap for columnar adapters. It never creates
Arrow objects.

### WKT

```typescript
const polygon = parseWKT('POLYGON ((0 0, 4 0, 0 4, 0 0))');
const text = formatWKT(polygon);
```

The parser supports:

- all seven geometry families;
- Z, M, and ZM dimension tokens, inherited through nested collections;
- both `MULTIPOINT (1 2, 3 4)` and `MULTIPOINT ((1 2), (3 4))`;
- `EMPTY`, including dimension-sized empty points;
- decimal and exponent notation;
- arbitrary whitespace while rejecting every unrecognized non-whitespace character.

`parseWKT` returns the geometry value. Use `parseWKTWithMetadata` when the semantic dimension must
survive parsing, especially for measured coordinates and collections with mixed child dimensions.
Its result is accepted directly by `formatWKT`, which then writes each geometry with its own
declared dimension. Set `inferDimensions: true` to accept legacy unmarked XYZ/XYZM coordinates;
three-value tuples are inferred as XYZ because tuple width alone cannot distinguish Z from M.

For geometry values without parse metadata, `formatWKT` accepts an optional explicit dimension.
Pass `xym` when a three-value tuple represents a measure rather than elevation.

### Empty geometry

Empty non-point geometry uses an empty coordinate array. Empty points use a tuple of `NaN` values
with the declared dimension. Formatting treats an all-non-finite coordinate tuple as `POINT EMPTY`.

### GeoArrow integration

`@math.gl/geospatial/geoarrow` owns column descriptors, validity, offsets, chunks, and column metadata. Its
`decodeGeoArrowWKB`, `encodeGeoArrowWKB`, `decodeGeoArrowWKT`, and `encodeGeoArrowWKT` functions
delegate individual values to this package:

```typescript
import {parseWKB} from '@math.gl/geospatial';
import {decodeGeoArrowWKB} from '@math.gl/geospatial/geoarrow';

const oneGeometry = parseWKB(bytes);
const nativeColumn = decodeGeoArrowWKB(serializedColumn);
```

This dependency points one way: GeoArrow may depend on WKB, while WKB is prevented by a package
boundary check from referencing GeoArrow or Apache Arrow.

### API

- `parseWKB(bytes, options?)`
- `writeWKB(geometry, dimension?)`
- `inspectWKBHeader(bytes, byteOffset?)`
- `visitWKB(bytes, visitor, options?)`
- `scanWKB(bytes, options?)`
- `WKBBuilder`
- `parseWKT(text, options?)`
- `parseWKTWithMetadata(text, options?)`
- `formatWKT(geometryOrResult, dimension?)`
- `getWellKnownDimensionSize(dimension)`
- `inferWellKnownGeometryDimension(geometry)`
- `WellKnownGeometry`
- `WellKnownDimension`
- `WKBParseOptions`
- `WKBParseResult`
- `WKTParseOptions`
- `WKTParseResult`
- `WKBHeader`
- `WKBVisitor`
- `WKBScanResult`
- `WKBBuilderOptions`
- `WKBGeometryArray`
