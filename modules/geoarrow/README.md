# @math.gl/geoarrow

Arrow-independent columnar geometry descriptors and synchronous buffer algorithms for
GeoArrow-compatible memory layouts.

`@math.gl/geoarrow` works directly over borrowed typed arrays. It deliberately does not require an
Arrow runtime: a loader, dataframe, database client, or application can adapt its buffers to the
small descriptor ABI and use the same validation, conversion, and coordinate algorithms. Optional
format and mesh capabilities are isolated behind subpaths so consumers only bundle what they use.

## Install

```bash
npm install @math.gl/geoarrow
# Only needed when using the /wkb subpath directly.
npm install @math.gl/wkb
```

## Why descriptors?

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

## Quick start

```typescript
import {
  getGeoArrowBounds,
  getGeoArrowVertexCount,
  mapGeoArrowCoordinates
} from '@math.gl/geoarrow';
import {GeoArrowBuilder} from '@math.gl/geoarrow/builder';

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

## Physical nesting

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
import type {GeoArrowColumn} from '@math.gl/geoarrow';

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

## Slices, validity, and chunks

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

## Two-pass building

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
one `beginRing` per ring. Event writes do not create coordinate arrays or Arrow objects.

## Inspection and read-only kernels

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

## Conversion and winding

```typescript
import {
  convertGeoArrowColumn,
  interleaveGeoArrowCoordinates,
  rewindGeoArrow
} from '@math.gl/geoarrow';

const interleaved = interleaveGeoArrowCoordinates(separatedPoints);
const xyz = convertGeoArrowColumn(interleaved, {dimension: 'xyz'});
const normalized = rewindGeoArrow(polygons, {outer: 'counter-clockwise'});
```

Semantic dimensions are mapped by ordinate name. Converting XYM to XYZ produces a zero Z; it does
not reinterpret M as elevation. Requesting `geoarrow.geometry` always produces a dense union, even
when every current row has the same geometry family.

## WKB and WKT

The codecs consume and produce the same plain descriptors:

```typescript
import {
  decodeGeoArrowWKB,
  encodeGeoArrowWKB,
  decodeGeoArrowWKT,
  encodeGeoArrowWKT
} from '@math.gl/geoarrow/wkb';

const wkb = encodeGeoArrowWKB(polygons);
const decoded = decodeGeoArrowWKB(wkb);
const wkt = encodeGeoArrowWKT(decoded);
const nativeAgain = decodeGeoArrowWKT(wkt);
```

WKB decoding accepts little- or big-endian geometry, ISO Z/M/ZM type offsets, EWKB Z/M/SRID flags,
BinaryView-style serialized buffers, nulls, and mixed concrete families. Concrete rows are scanned
with `@math.gl/wkb`'s header inspector and visitor, measured, and written directly into native
buffers. Mixed family or mixed-dimension input becomes a dense union whose children retain their
own encoding and dimension metadata; no conversion through GeoJSON or nested coordinate arrays is
needed. GeometryCollection remains on the compatibility path until its nested event topology is
available.
multi-geometries, and nested geometry collections. WKT supports all corresponding geometry
families, dimension tokens, both MultiPoint spellings, and empties. Decoding normalizes mixed-size
serialized coordinates to the column's declared semantic dimension.

Parsing or formatting one geometry is intentionally provided by the dependency-free
`@math.gl/wkb` package. The GeoArrow `/wkb` bridge consumes its visitors and two-pass builder:

```typescript
import {parseWKB, writeWKB, parseWKT, formatWKT} from '@math.gl/wkb';
```

The descriptor and buffer-algorithm implementation does not require Apache Arrow. The `/wkb`
subpath (and the legacy root codec re-exports) uses `@math.gl/wkb`; install it when using those
functions.

## Polygon tessellation

```typescript
import {tessellateGeoArrowPolygons} from '@math.gl/geoarrow/tessellation';

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
vertex retains its top-level source row. Tessellation uses `@math.gl/polygon` and is synchronous.

## Resource limits

Potentially allocating operations accept limits, and limits can also be checked directly:

```typescript
import {assertGeoArrowResourceLimits} from '@math.gl/geoarrow';

assertGeoArrowResourceLimits(column, {
  maximumRows: 1_000_000,
  maximumCoordinates: 50_000_000,
  maximumChunks: 10_000,
  maximumNestingDepth: 8,
  maximumOutputBytes: 1_000_000_000
});
```

## Workers and transfer ownership

Root APIs are synchronous. Worker-specific payload preparation is isolated in the optional subpath:

```typescript
import {prepareGeoArrowTransfer} from '@math.gl/geoarrow/worker';

const payload = prepareGeoArrowTransfer(column);
worker.postMessage(payload.column, {transfer: payload.transferList});
```

`prepareGeoArrowTransfer` only lists unique transferable buffers; it does not detach them. The
explicit `postMessage` call transfers ownership. Shared buffers are omitted because they are not
transferable.

## Loaders.gl integration

The intended loaders.gl architecture keeps Apache Arrow at the boundary:

```text
Arrow Data / Vector / Table
        │  loaders.gl adapter
        ▼
GeoArrowColumn descriptors  ──►  @math.gl/geoarrow buffer algorithms
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

## Adapting another columnar runtime

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

## API groups

- Descriptors: `GeoArrowColumn`, `GeoArrowArray`, all physical array descriptor types
- Layout: `inspectGeoArrowColumn`, `validateGeoArrowColumn`, slicing and traversal
- Buffer algorithms: count, bounds, row bounds, map, interleave, convert, rewind, union
  normalization, resource limits
- Construction: `@math.gl/geoarrow/builder`
- Column codecs: `@math.gl/geoarrow/wkb` (individual parsing/formatting is provided by
  `@math.gl/wkb`)
- Meshes: `@math.gl/geoarrow/tessellation`
- Transfer: `getGeoArrowTransferList`, plus `@math.gl/geoarrow/worker`

See the math.gl documentation for the full [physical-layout guide](../../docs/modules/geoarrow/physical-layouts.md),
[API reference](../../docs/modules/geoarrow/api-reference/geoarrow.md), and
[migration guide](../../docs/modules/geoarrow/migration-guide.md).
