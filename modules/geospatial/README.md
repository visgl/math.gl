# @math.gl/geospatial

[math.gl](https://math.gl/docs) is a suite of math modules for 3D and geospatial applications.

This module contains geospatial math, primarly ellipsoid math for dealing with the WGS84 (World Geodetic System) coordinate system.

For documentation please visit the [website](https://math.gl).

The grouped subpaths include `@math.gl/geospatial`, `/globe`, `/tiles`, `/crs`, `/projection`, `/web-mercator`,
`/expressions`, and the experimental `/discontinuous`. DGGS remains a separate module at `@math.gl/dggs`.
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

Import `@math.gl/geospatial/turf` for Turf-style operations on native GeoArrow columns from `@math.gl/arrow/geoarrow-utils`.
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

## Binary geometry representations

Arrow and GeoArrow adapters, physical descriptor kernels, tessellation, and WKB/WKT
codecs are provided by [`@math.gl/arrow`](../arrow/README.md). Geographic operations
in this package can consume its descriptors without requiring Apache Arrow.
