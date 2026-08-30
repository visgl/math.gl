# @math.gl/wkb

Dependency-free, synchronous codecs for Well-Known Binary (WKB), Extended WKB (EWKB), and
Well-Known Text (WKT) geometry.

`@math.gl/wkb` is the format layer beneath `@math.gl/geoarrow`. It parses and writes individual
geometry values without importing Arrow, GeoArrow, loaders.gl, or a geometry class hierarchy.
Applications can therefore use the codecs for row-oriented data, database values, network
messages, or as a building block for their own columnar adapters.

## Install

```bash
npm install @math.gl/wkb
```

The package has no runtime, peer, or optional dependencies.

## Quick start

```typescript
import {parseWKB, writeWKB, parseWKT, formatWKT} from '@math.gl/wkb';

const geometry = parseWKT('LINESTRING Z (0 0 5, 10 20 6)');
const bytes = writeWKB(geometry, 'xyz');

const parsed = parseWKB(bytes);
console.log(parsed.geometry);
console.log(parsed.dimension); // 'xyz'
console.log(formatWKT(parsed.geometry, parsed.dimension));
```

All APIs are synchronous. Inputs are borrowed and never detached or mutated. Returned geometry
values are plain immutable-by-contract objects and arrays.

## Geometry values

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

## WKB

### Parse

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

### Write

```typescript
const xy = writeWKB({type: 'Point', coordinates: [1, 2]});
const measured = writeWKB({type: 'Point', coordinates: [1, 2, 9]}, 'xym');
```

`writeWKB` emits deterministic little-endian ISO WKB. Missing ordinates are written as zero. It
does not emit an EWKB SRID; carry CRS/SRID metadata outside the neutral geometry value or in a
higher-level container.

### Inspect and scan without decoding

Use `inspectWKBHeader` when routing or classifying data. It reads only the endian flag, type code,
dimension flags, and optional EWKB SRID; the coordinate payload does not need to be present.

```typescript
import {inspectWKBHeader, scanWKB} from '@math.gl/wkb';

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

### Visit coordinates directly

`visitWKB` exposes the same validated traversal through callbacks. Coordinate values are passed as
individual numbers rather than temporary coordinate arrays.

```typescript
import {visitWKB} from '@math.gl/wkb';

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

### Two-pass caller-buffer writing

`WKBBuilder` supports the same geometry event sequence in measurement and write modes. Write mode
accepts an existing buffer, a sliced typed-array view, and an optional destination offset.

```typescript
import {WKBBuilder} from '@math.gl/wkb';

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

## WKT

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

`formatWKT` accepts an optional explicit dimension. As with WKB, pass `xym` when a three-value
tuple represents a measure rather than elevation.

## Empty geometry

Empty non-point geometry uses an empty coordinate array. Empty points use a tuple of `NaN` values
with the declared dimension. Formatting treats an all-non-finite coordinate tuple as `POINT EMPTY`.

## GeoArrow integration

`@math.gl/geoarrow` owns column descriptors, validity, offsets, chunks, and column metadata. Its
`decodeGeoArrowWKB`, `encodeGeoArrowWKB`, `decodeGeoArrowWKT`, and `encodeGeoArrowWKT` functions
delegate individual values to this package:

```typescript
import {parseWKB} from '@math.gl/wkb';
import {decodeGeoArrowWKB} from '@math.gl/geoarrow';

const oneGeometry = parseWKB(bytes);
const nativeColumn = decodeGeoArrowWKB(serializedColumn);
```

This dependency points one way: GeoArrow may depend on WKB, while WKB is prevented by a package
boundary check from referencing GeoArrow or Apache Arrow.

## API

- `parseWKB(bytes, options?)`
- `writeWKB(geometry, dimension?)`
- `inspectWKBHeader(bytes, byteOffset?)`
- `visitWKB(bytes, visitor, options?)`
- `scanWKB(bytes, options?)`
- `WKBBuilder`
- `parseWKT(text)`
- `formatWKT(geometry, dimension?)`
- `getWellKnownDimensionSize(dimension)`
- `inferWellKnownGeometryDimension(geometry)`
- `WellKnownGeometry`
- `WellKnownDimension`
- `WKBParseOptions`
- `WKBParseResult`
- `WKBHeader`
- `WKBVisitor`
- `WKBScanResult`
- `WKBBuilderOptions`
- `WKBGeometryArray`
