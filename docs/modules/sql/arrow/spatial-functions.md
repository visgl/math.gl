# Spatial SQL functions

Register spatial functions to calculate new columns from GeoArrow geometry. The same
function declarations work with different Arrow schemas. Register the full library
or import individual declarations for the functions your application uses.

## Derive columns from geometry

This example loads polygon and point columns as GeoArrow WKB. A table that already
has native GeoArrow columns can go straight into the query.

```ts
import {Binary, Field, Schema, Table, vectorFromArray} from 'apache-arrow';
import {parseWKT, writeWKB} from '@math.gl/core/arrow';
import {POSTGIS_SPATIAL_FUNCTIONS} from '@math.gl/geospatial/st-functions';
import {queryArrowSQL} from '@math.gl/sql/query';

const extension = new Map([['ARROW:extension:name', 'geoarrow.wkb']]);
const binary = new Binary();
const schema = new Schema([
  new Field('footprint', binary, true, extension),
  new Field('location', binary, true, extension)
]);
const features = new Table(schema, {
  footprint: vectorFromArray([writeWKB(parseWKT('POLYGON((0 0,6 0,0 3,0 0))'))], binary),
  location: vectorFromArray([writeWKB(parseWKT('POINT(1 1)'))], binary)
});

const result = queryArrowSQL(
  `SELECT ST_Area(footprint) AS area,
          ST_Covers(footprint, location) AS covered,
          ST_Centroid(footprint) AS center,
          ST_Distance(ST_Centroid(footprint), location) AS center_distance
   FROM features`,
  new Map([['features', features]]),
  {functions: POSTGIS_SPATIAL_FUNCTIONS}
);
```

The output has an area of 9, a true coverage predicate, a center at (2, 1), and a
distance of 1. The center column is GeoArrow WKB, so it works as input to another
registered spatial function or an Arrow geometry consumer. Use
`{functions: [ST_AREA]}` when the application only needs area.

## Snap an observation to a route

For a table with a planar `route` LineString and an `observation` Point, use the
closest point as a marker and the shortest line as the gap to the route. The
fraction from `ST_LineLocatePoint` can drive a highlight along the same route.

```sql
SELECT ST_ClosestPoint(route, observation) AS snapped,
       ST_ShortestLine(observation, route) AS gap,
       ST_LineLocatePoint(route, observation) AS route_fraction,
       ST_DWithin(route, observation, 20) AS on_route
FROM observations
```

The radius is in the projected CRS's coordinate units. For a route with equally
close candidates, the first along the route is selected.

The snapped point and the gap segment use native GeoArrow coordinates. Feed them
into another spatial function in the same batch, or use the columns to prepare
deck.gl marker and path layers. Use `GEOARROW_TO_WKB` from the
[GeoArrow conversion package](../geoarrow-functions.md) when exporting WKB.

## Stitch and densify routes

Use `ST_LineMerge(route)` to assemble XY line parts that share exact endpoints.
It merges through junctions with two incident paths and leaves branches as
separate line parts. A connected chain is a LineString. Multiple chains and
empty multipart inputs are MultiLineStrings.

Use `ST_Segmentize(route, max_length)` to split long segments into equal pieces
in the input CRS units. Existing vertices and component boundaries are
preserved. The maximum must be finite and positive. Each call can insert up to
1,000,000 vertices per row.

```sql
SELECT id, ST_Segmentize(ST_LineMerge(segments), 50) AS route
FROM roads
```

Inputs can use native XY GeoArrow or WKB. When the result family is known from
the input field, output uses specialized native GeoArrow. Calls with variable
LineString or MultiLineString results use a dense GeoArrow union.

## Clip features to a tile or viewport

Register `ST_CLIPBYBOX2D` from `@math.gl/geospatial/st-viewport-functions`.
Use the XY bounds of a geometry as the clipping rectangle. For example, if
`geom` is in EPSG:3857, clip it to a Web Mercator tile for a local Arrow-backed
tile layer. Use `ST_MakeEnvelope` with viewport bounds for an untiled layer.

```sql
SELECT id, ST_ClipByBox2D(geom, ST_TileEnvelope(11, 327, 791)) AS geom
FROM features
```

Clipping can change a LineString or Polygon into its multipart type when the
rectangle leaves disjoint pieces. Features outside the box produce an empty
GeometryCollection. Features that lie only on the boundary are excluded. Keep the original feature ID for picking.

## Subdivide large polygons for rendering

Register `ST_SUBDIVIDE` from `@math.gl/geospatial/st-viewport-functions` in the query's
`functions` list. The lateral table function accepts a polygon or multipolygon
column and returns one WKB Polygon per part, with at most 256 vertices including
ring closures. The input CRS and parent feature ID are available on each part.

```sql
SELECT f.id, p.geometry
FROM features AS f
CROSS JOIN LATERAL ST_Subdivide(f.geom) AS p(geometry)
```

Null and empty geometries emit zero parts. Use `LEFT JOIN LATERAL ... ON TRUE`
to retain those parent rows. The SQL signature takes one column and uses the
default vertex limit.

## Play back measured routes

Store one measure (M) per route vertex. For recorded trips, use the original
vertex timestamps relative to a common origin. To animate a route with no
timestamps, use `ST_AddMeasure(route, 0, duration)` to synthesize values
proportional to distance along the route.

```sql
SELECT id,
       ST_LocateAlong(measured_route, 30) AS marker,
       ST_LocateBetween(measured_route, 20, 30) AS trail
FROM trips
```

Render the point results as markers and the line components as a trail. To feed
a deck.gl `TripsLayer`, decode the measured source path and pass its XY or XYZ
coordinates and the M values as separate path and timestamp arrays. A route can
visit the same measure more than once. These functions retain separate hits
and preserve route direction when clipping, even if measures decrease.

## Build footprints from point clouds

Register `ST_CONVEXHULL` and `ST_CONCAVEHULL` from
`@math.gl/geospatial/st-hull-functions`. Supply one planar MultiPoint per
cloud, with a stable feature ID for deck.gl picking.

```sql
SELECT id,
       ST_ConvexHull(points) AS convex,
       ST_ConcaveHull(points, 0.2) AS footprint
FROM clouds
```

Use the Polygon output as a fill or an extrusion in a `GeoJsonLayer`.
Handle degenerate clouds as Point or LineString results. The concave hull is
a single hole-free polygon when the points span an area. Its ratio runs from
0 for the tightest supported hull to 1 for the convex hull. It uses a
Delaunay edge-length threshold and preserves all input sites. Equal-length
edges can admit more than one valid hull.

## Buffer points and compare polygon footprints

Register `ST_BUFFER`, `ST_INTERSECTION`, `ST_DIFFERENCE`, `ST_UNION`, and `ST_SYMDIFFERENCE` from
`@math.gl/geospatial/st-overlay-functions`. Use a projected CRS so the
buffer radius is in the desired coordinate units.

```sql
SELECT id,
       ST_Intersection(ST_Buffer(sensor, 250), parcels) AS covered,
       ST_Difference(parcels, ST_Buffer(sensor, 250)) AS uncovered
FROM features
```

| Function | Supported input | Native GeoArrow output |
| --- | --- | --- |
| `ST_Buffer(point, radius)` | Planar Point and finite radius | `geoarrow.polygon` with eight segments per quadrant. Empty points and nonpositive radii return empty polygons. |
| `ST_Buffer(line, radius)` | Native planar LineString or MultiLineString and finite radius | `geoarrow.multipolygon` with round caps and joins. Empty lines and nonpositive radii return empty multipolygons. |
| `ST_Intersection(a, b)` | Planar Polygon or MultiPolygon | `geoarrow.multipolygon` containing shared area. Boundary-only contact returns an empty multipolygon. |
| `ST_Intersection(line, area)` | Native planar LineString or MultiLineString paired with Polygon or MultiPolygon in either order | Native XY `geoarrow.geometry` containing the retained linework, isolated boundary contacts, or both. Disjoint inputs return an empty geometry collection. |
| `ST_Difference(a, b)` | Planar Polygon or MultiPolygon | `geoarrow.multipolygon` containing the portion of the first geometry outside the second. |
| `ST_Union(a, b)` | Planar Polygon or MultiPolygon | `geoarrow.multipolygon` containing the combined area of both inputs. |
| `ST_SymDifference(a, b)` | Planar Polygon or MultiPolygon | `geoarrow.multipolygon` containing the area covered by exactly one input. Identical inputs yield an empty multipolygon. |

For a route corridor, pass a native `geoarrow.linestring` or `geoarrow.multilinestring`
column to `ST_Buffer(route, radius)`. The result uses the input CRS and can feed
`ST_Intersection` or `ST_Area` in the same batch. For a WKB route column, first
convert it with `GEOARROW_TO_LINESTRING` or `GEOARROW_TO_MULTILINESTRING` from
[`@math.gl/sql/geoarrow-functions`](../geoarrow-functions.md) so SQL can bind the
native multipolygon result schema before reading any rows.

Point buffers and areal overlays accept specialized native encodings, WKB,
or a native XY dense union (`geoarrow.geometry`) whose selected rows match the
function signature.
Outputs use interleaved XY coordinates and retain the first input's CRS
metadata. Chained expressions pass native Arrow vectors between kernels.
For streamed inputs, run the projection with `queryArrowTableInBatches`.
Each output batch uses the same geometry schema, including all-null batches.

For line clipping, use a native line column so SQL can bind the mixed result
schema before reading rows. Convert WKB routes with `GEOARROW_TO_LINESTRING`
or `GEOARROW_TO_MULTILINESTRING`. The polygon argument accepts a native column
or WKB. Retained linework follows input component order, with isolated point
contacts returned separately when the result contains both dimensions.
Clipping preserves route traversal. Repeated or overlapping segments contribute
to length each time the route travels them.

## Validate polygon imports

`ST_IsValid(geometry)` checks Polygon and MultiPolygon topology in XY, with
native GeoArrow or WKB inputs. Use `ST_IsValidReason(geometry)` to retrieve the
first diagnostic, such as an unclosed ring, a self-intersection, a hole outside
its shell, disconnected interior, or overlapping polygon components.

```sql
SELECT id, ST_IsValidReason(geometry) AS reason
FROM parcels
WHERE NOT ST_IsValid(geometry)
```

Empty polygons are valid. Both functions propagate nulls and evaluate per record
batch. `ST_IsValidReason` returns `Valid Geometry` when the topology passes.

## Dissolve polygons by group

Register `ST_UNION_AGGREGATE` and `ST_UNARYUNION` from
`@math.gl/geospatial/st-overlay-functions`. Register `ST_UNION` alongside
`ST_UNION_AGGREGATE` to use both SQL arities in the same query.

```sql
SELECT district, ST_Union(parcel) AS footprint
FROM parcels
GROUP BY district
```

- `ST_Union(geometry)` dissolves planar Polygon and MultiPolygon rows within
  each group. It ignores nulls and returns null for a group with no non-null
  inputs. A group containing only empty geometries returns an empty multipolygon.
- `ST_UnaryUnion(geometry)` dissolves overlapping components within each row.
  Null rows remain null.

Both functions return interleaved XY `geoarrow.multipolygon` and preserve
the input CRS metadata. Grouped SQL uses the table query engine. Each group
reduces one batch at a time and compacts partial unions as it reads rows.

## Transform with a projection engine

Register `createSTTransform(engine)` from `@math.gl/geospatial/st-functions` to
use CRS definitions available synchronously in a projection engine. The result
retains specialized native GeoArrow layouts and additional ordinates. WKB
input is supported for planar XY geometries and produces WKB.

```ts
import {projectionEngine} from '@math.gl/geospatial/projection';
import {createSTTransform} from '@math.gl/geospatial/st-functions';
import {queryArrowSQL} from '@math.gl/sql/query';

const projected = queryArrowSQL(
  'SELECT ST_Transform(geometry, 32631) AS utm FROM features',
  tables,
  {functions: [createSTTransform(projectionEngine)]}
);
```

Supply the source CRS in the GeoArrow field metadata and a constant target
EPSG code in SQL. To register the rest of `POSTGIS_SPATIAL_FUNCTIONS` alongside
this overload, omit `ST_TRANSFORM` from that list.

## Measure geodesic distances in meters

Register `GEODESIC_SPATIAL_FUNCTIONS` from `@math.gl/geospatial/st-functions`.
These row-wise functions accept native GeoArrow or WKB with an explicit WGS84
CRS (`EPSG:4326` or `OGC:CRS84`). Coordinates are longitude and latitude in
degrees, in that order. Measures use the WGS84 ellipsoid and the shortest
geodesic between vertices, including across the antimeridian. Z and M are
ignored.

| SQL function | Inputs | Result |
| --- | --- | --- |
| `ST_GeodesicDistance(a, b)` | Point or MultiPoint for each input, or a Point and a LineString or MultiLineString in either order | Shortest distance in meters. Empty inputs yield null. |
| `ST_GeodesicLength(route)` | LineString or MultiLineString | Sum of segment lengths in meters. Empty lines yield zero. |
| `ST_GeodesicSegmentize(route, max_length)` | XY LineString or MultiLineString and a finite positive maximum length in meters | Native line geometry with equal-length subdivisions along the WGS84 ellipsoid. |
| `ST_GeodesicDWithin(a, b, radius)` | Same geometry pairs as `ST_GeodesicDistance` and a finite nonnegative radius in meters | True when distance is at most the radius. Empty inputs yield false. |

For Point and MultiPoint pairs, the distance is the minimum across all component
point pairs. Point-to-route proximity measures to the interiors as well as the endpoints
of the route's geodesic segments. MultiLineString parts are searched independently.
The point-to-route threshold comparison allows 0.1 micrometers for
numerical error. Null arguments propagate. Use `queryArrowTableInBatches` to
evaluate these functions on streamed record batches.

```sql
SELECT id, ST_GeodesicDistance(observation, route) AS meters
FROM observations
WHERE ST_GeodesicDWithin(observation, route, 25)
```

## Simplify shared boundaries in a polygon coverage

Register `createSTCoverageSimplify({geometry: 'footprint', tolerance: 2})`
from `@math.gl/geospatial/st-functions`, then query the entire native XY coverage.

```sql
SELECT id, footprint
FROM ST_CoverageSimplify(parcels)
```

The table function simplifies shared borders across record batches while
preserving the outer boundary, row order, CRS, nulls, and Polygon or
MultiPolygon encoding. Supply a valid coverage with matching vertices on
both sides of shared edges. Tolerance is in the source coordinate units.
This implementation removes eligible shared vertices in one pass and skips
edits that could meet another boundary or interfere with an accepted edit.
It evaluates the whole relation before returning the output batches.

## PostGIS geometry signatures

These functions use 2D Cartesian coordinates. Use coordinates in a suitable
projected CRS when you need linear units such as meters. Area uses the square of
the coordinate unit. Transform inputs to a common CRS before running a query.

| Function | Accepted input | Result |
| --- | --- | --- |
| `ST_X(point)` | Point | X coordinate. Empty input yields null. |
| `ST_Z(point)`, `ST_M(point)` | Point of any dimension | Elevation or measure. A missing ordinate or empty Point yields null. |
| `ST_Y(point)` | Point | Y coordinate. Empty input yields null. |
| `ST_StartPoint(line)` | LineString | First vertex. Empty input yields null. |
| `ST_EndPoint(line)` | LineString | Last vertex. Empty input yields null. |
| `ST_Contains(polygon, point)` | Polygon or MultiPolygon, then Point | Boolean. Points on the exterior boundary or a hole boundary are excluded. |
| `ST_Covers(polygon, point)` | Polygon or MultiPolygon, then Point | Boolean. Boundary points are included. Points inside a hole are excluded. |
| `ST_Within(point, polygon)` | Point, then Polygon or MultiPolygon | Interior only. Empty input yields false. |
| `ST_CoveredBy(point, polygon)` | Point, then Polygon or MultiPolygon | Interior or boundary. Empty input yields false. |
| `ST_PointN(line, n)` | 2D LineString and signed integer position | WKB Point. Positions start at 1, or at -1 from the end. Zero and out-of-range positions yield null. |
| `ST_MakeEnvelope(xmin, ymin, xmax, ymax)` | Four numeric bounds | Closed 2D WKB Polygon with unknown CRS. |
| `ST_DWithin(a, b, distance)` | Two Points, Point and LineString, Point and Polygon or MultiPolygon, or two linear geometries (LineString or MultiLineString), in either order, with a nonnegative radius | Boolean. Includes geometries exactly at the radius, in planar coordinate units. Interior points and boundary contact have zero distance. For points in holes, distance is measured to the nearest boundary. Empty inputs yield false. |
| `ST_ClosestPoint(a, b)` | Two 2D Points or a Point and LineString in either order | Native `geoarrow.point` on the first geometry nearest to the second. Empty inputs yield null. |
| `ST_ShortestLine(a, b)` | Two 2D Points or a Point and LineString in either order | Two-vertex native `geoarrow.linestring` from the first geometry to the second. Intersecting inputs produce coincident endpoints. Empty inputs yield null. |
| `ST_Distance(a, b)` | Two Points | Float64 Cartesian distance in coordinate units. Empty points yield null. |
| `ST_Intersects(a, b)` | Two planar geometries, including multi-types and WKB collections | True for shared interiors, edges, or vertices. Empty geometries yield false. |
| `ST_Touches(a, b)` | Planar Point, LineString, Polygon, or their multi-types | True when the inputs share a point and their interiors are disjoint. Point and MultiPoint pairs return false. Empty geometries yield false. |
| `ST_SRID(g)` | 2D geometry | EPSG code from field metadata, or zero for an unidentified CRS. |
| `ST_SetSRID(g, srid)` | 2D geometry and constant integer | GeoArrow WKB with the assigned EPSG identifier and original coordinates. Zero clears the CRS. |
| `ST_Transform(g, srid)` | 2D planar geometry and constant target EPSG code | Reprojects between 4326 (longitude, latitude) and 3857 (meters). Forward projection accepts the Web Mercator tile latitude range (about ±85.0511°). |
| `ST_Azimuth(a, b)` | Two Points | Float64 radians clockwise from positive Y in `[0, 2π)`. Coincident and empty points yield null. |
| `ST_MakePoint(x, y [, z [, m]])` | Integer or floating-point ordinates | Native interleaved `geoarrow.point` with XY, XYZ, or XYZM coordinates and unknown CRS. Use XY with the 2D predicates and measurements. |
| `ST_ClipByBox2D(geometry, bounds)` | 2D geometry and a geometry whose XY extent supplies the clipping rectangle | Clipped WKB, with the input CRS. Excludes boundary-only points and line segments. Empty bounds yield null. |
| `ST_TileEnvelope(z, x, y [, bounds [, margin]])` | XYZ indices (zoom 0–31), optional root geometry and fractional margin | WKB Polygon. Defaults to EPSG:3857. Custom root bounds supply the output CRS. Positive margins expand the tile and negative margins shrink it. |
| `ST_Area(geometry)` | Point, LineString, Polygon, and their multi-types | Float64 planar polygon area with holes subtracted. Empty and non-areal inputs yield zero. |
| `ST_LineInterpolatePoint(line, fraction)` | 2D LineString and fraction in [0, 1] | GeoArrow WKB Point at the given fraction of route length. |
| `ST_LineLocatePoint(line, point)` | 2D LineString and Point | Fraction of route length at the nearest point on the route. |
| `ST_AddMeasure(line, start, end)` | LineString or MultiLineString and two finite measures | WKB with M interpolated by accumulated XY length. Keeps Z and overwrites existing M. |
| `ST_LocateAlong(line, measure)` | Measured LineString or MultiLineString | WKB MultiPoint with every match, preserving M and Z. A segment constant at the requested measure contributes its midpoint. |
| `ST_LocateBetween(line, start, end)` | Measured LineString or MultiLineString | WKB MultiLineString or GeometryCollection with the portions in the inclusive interval. Reversed bounds are normalized. |
| `ST_LineSubstring(line, start, end)` | 2D LineString and ordered fractions in [0, 1] | WKB LineString including intermediate vertices, or Point for equal fractions or a zero-length route. Empty lines yield null. |
| `ST_RemoveRepeatedPoints(line [, tolerance])` | 2D LineString or MultiLineString | WKB line with consecutive duplicates removed. A positive tolerance also removes nearby vertices. Retains route endpoints. |
| `ST_Simplify(line, tolerance)` | 2D LineString or MultiLineString | WKB line simplified in planar coordinate units. Drops collapsed components and returns null if none survive. |
| `ST_SimplifyPreserveTopology(geometry, tolerance)` | 2D Polygon or MultiPolygon, finite nonnegative tolerance | Simplifies boundaries in planar coordinate units, retaining shell and hole counts, winding, component boundaries, and nesting. Native Polygon and MultiPolygon inputs keep their respective native encodings. WKB inputs return WKB. |
| `ST_Length(geometry)` | Point, LineString, Polygon, and their multi-types | Float64 planar line length. Empty and non-linear inputs yield zero. |
| `ST_PointOnSurface(polygon)` | Polygon or MultiPolygon | Native `geoarrow.point` for label placement inside a valid polygon. Empty inputs yield an empty Point. |
| `ST_Centroid(geometry)` | Point, LineString, Polygon, and their multi-types | GeoArrow WKB. Points have equal weight, lines are weighted by segment length, and polygons are weighted by area. Empty inputs yield an empty Point. |
| `ST_NPoints(g)` | Native geometry or WKB, including dimensional points and WKB collections | Vertex count including polygon ring closures. |
| `ST_NumGeometries(g)` | Native geometry or WKB, including dimensional points and WKB collections | Number of top-level components, or zero for empty geometry. |
| `ST_IsEmpty(g)` | Native geometry or WKB, including dimensional points and WKB collections | Whether the geometry contains no vertices. |
| `ST_GeometryType(g)` | Native geometry or WKB, including dimensional points and WKB collections | Geometry type name with the ST_ prefix. |
| `ST_Force2D(g)` | Native geometry or WKB, including dimensional points and WKB collections | WKB geometry containing only XY ordinates. |
| `ST_GeometryN(g, n)` | Native geometry or WKB, including dimensional points and WKB collections | One-based component as WKB with the input dimension. |
| `ST_MakeLine(a, b)` | Two 2D Point, MultiPoint or LineString inputs | WKB LineString in argument order. An incoming line shares its first vertex with a coincident previous endpoint. |
| `ST_Collect(a, b)` | Two 2D geometries | WKB MultiPoint, MultiLineString or MultiPolygon for matching atomic types. Mixed and multipart inputs form a GeometryCollection retaining both members. |
| `ST_Envelope(geometry)` | Point, LineString, Polygon, and their multi-types, or a WKB GeometryCollection | GeoArrow WKB Point, LineString, or Polygon according to the extent. An empty input keeps its geometry type. |

`ST_SimplifyPreserveTopology` keeps individual rings that would collapse or
reverse winding. It retains the input geometry when the candidate would change
nesting or introduce boundary contact, and when input boundaries already touch.
Use a projected CRS for a tolerance in meters.

`ST_Extent(geometry)` is an aggregate. It returns the planar box of all nonempty geometries in each group as a four-element Float64 list `[xmin, ymin, xmax, ymax]`. An empty or null-only group yields null.

Each scalar call produces one value per input row. A null argument produces null except in the two-argument `ST_Collect`, which returns the other geometry when just one argument is null.
The predicates return false for empty inputs. Native GeoArrow argument types are
checked when the query binds. WKB geometry kinds are checked when a row is
evaluated. An unlabelled Binary column can be labelled in SQL with
`CAST(column AS GEOMETRY)`. Store CRS information in the GeoArrow field metadata.
Geometry results carry that metadata forward, and inputs with conflicting
declared CRSs are rejected. Embedded nonzero EWKB SRIDs and PostGIS geography
overloads are outside the supported signatures.

See the PostGIS references for
[`ST_Contains`](https://postgis.net/docs/ST_Contains.html),
[`ST_Covers`](https://postgis.net/docs/ST_Covers.html),
[`ST_Distance`](https://postgis.net/docs/ST_Distance.html),
[`ST_Azimuth`](https://postgis.net/docs/ST_Azimuth.html),
[`ST_Area`](https://postgis.net/docs/ST_Area.html),
[`ST_Length`](https://postgis.net/docs/ST_Length.html),
[`ST_Centroid`](https://postgis.net/docs/ST_Centroid.html), and
[`ST_Envelope`](https://postgis.net/docs/ST_Envelope.html).

## Turf expressions

Register `TURF_FUNCTIONS` from the same entry point when you want Turf semantics.
Both libraries can be used in the same query with
`{functions: [...POSTGIS_SPATIAL_FUNCTIONS, ...TURF_FUNCTIONS]}`.

| Function | Accepted input | Result |
| --- | --- | --- |
| `TURF_DISTANCE(a, b)` | Two Points | Great-circle distance in kilometers. |
| `TURF_BEARING(a, b)` | Two Points | Initial great-circle bearing in degrees. |
| `TURF_LENGTH(line)` | LineString or MultiLineString | Great-circle length in kilometers. |
| `TURF_AREA(polygon)` | Polygon or MultiPolygon | Spherical area in square meters. |
| `TURF_CENTROID(geometry)` | Point, LineString, Polygon, and their multi-types | Vertex-mean centroid as GeoArrow WKB. |
| `TURF_MIDPOINT(a, b)` | Two Points | Great-circle midpoint as GeoArrow WKB. |
| `TURF_BBOX(geometry)` | Point, LineString, Polygon, and their multi-types | Four Float64 values in `[minX, minY, maxX, maxY]` order. |
| `TURF_BOOLEAN_POINT_IN_POLYGON(point, polygon)` | Point, then Polygon or MultiPolygon | Boolean with boundary points included. |

Supply longitude and latitude in degrees for Turf's spherical measurements.
The built-in Turf declarations use the options shown above. Use the
[custom Turf adapter](README.md#turf-functions) to bind other units or kernel
options. Operations such as explode and line segment require row expansion.
