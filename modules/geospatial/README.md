# @math.gl/geospatial

[math.gl](https://math.gl/docs) is a suite of math modules for 3D and geospatial applications.

This module contains geospatial math, primarly ellipsoid math for dealing with the WGS84 (World Geodetic System) coordinate system.

For documentation please visit the [website](https://math.gl).

## Batched GeoArrow operations

Import `@math.gl/geospatial/turf` for Turf-style operations on native GeoArrow columns.
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
