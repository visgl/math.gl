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
