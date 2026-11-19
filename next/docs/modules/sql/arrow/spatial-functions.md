# Spatial SQL functions

Register spatial functions to calculate new columns from GeoArrow geometry. The same function declarations work with different Arrow schemas. Register the full library or import individual declarations for the functions your application uses.

## Derive columns from geometry[​](#derive-columns-from-geometry "Direct link to Derive columns from geometry")

This example loads polygon and point columns as GeoArrow WKB. A table that already has native GeoArrow columns can go straight into the query.

```
import {Binary, Field, Schema, Table, vectorFromArray} from 'apache-arrow';

import {parseWKT, writeWKB} from '@math.gl/core/arrow';

import {POSTGIS_SPATIAL_FUNCTIONS} from '@math.gl/geospatial/turf/expressions';

import {queryArrowSQL} from '@math.gl/sql';



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

The output has an area of 9, a true coverage predicate, a center at (2, 1), and a distance of 1. The center column is GeoArrow WKB, so it works as input to another registered spatial function or an Arrow geometry consumer. Use `{functions: [ST_AREA]}` when the application only needs area.

## PostGIS geometry signatures[​](#postgis-geometry-signatures "Direct link to PostGIS geometry signatures")

These functions use 2D Cartesian coordinates. Use coordinates in a suitable projected CRS when you need linear units such as meters. Area uses the square of the coordinate unit. Transform inputs to a common CRS before running a query.

| Function                         | Accepted input                                                                 | Result                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ST_X(point)`                    | Point                                                                          | X coordinate. Empty input yields null.                                                                                                              |
| `ST_Y(point)`                    | Point                                                                          | Y coordinate. Empty input yields null.                                                                                                              |
| `ST_StartPoint(line)`            | LineString                                                                     | First vertex. Empty input yields null.                                                                                                              |
| `ST_EndPoint(line)`              | LineString                                                                     | Last vertex. Empty input yields null.                                                                                                               |
| `ST_Contains(polygon, point)`    | Polygon or MultiPolygon, then Point                                            | Boolean. Points on the exterior boundary or a hole boundary are excluded.                                                                           |
| `ST_Covers(polygon, point)`      | Polygon or MultiPolygon, then Point                                            | Boolean. Boundary points are included. Points inside a hole are excluded.                                                                           |
| `ST_Within(point, polygon)`      | Point, then Polygon or MultiPolygon                                            | Interior only. Empty input yields false.                                                                                                            |
| `ST_CoveredBy(point, polygon)`   | Point, then Polygon or MultiPolygon                                            | Interior or boundary. Empty input yields false.                                                                                                     |
| `ST_DWithin(a, b, distance)`     | Two 2D Points and a nonnegative numeric radius                                 | Boolean. Includes points exactly at the radius, in planar coordinate units. Empty points yield false.                                               |
| `ST_Distance(a, b)`              | Two Points                                                                     | Float64 Cartesian distance in coordinate units. Empty points yield null.                                                                            |
| `ST_Azimuth(a, b)`               | Two Points                                                                     | Float64 radians clockwise from positive Y in `[0, 2π)`. Coincident and empty points yield null.                                                     |
| `ST_MakePoint(x, y [, z [, m]])` | Integer or floating-point ordinates                                            | GeoArrow WKB Point with XY, XYZ, or XYZM coordinates and unknown CRS. Use XY with the 2D predicates and measurements.                               |
| `ST_Area(geometry)`              | Point, LineString, Polygon, and their multi-types                              | Float64 planar polygon area with holes subtracted. Empty and non-areal inputs yield zero.                                                           |
| `ST_Length(geometry)`            | Point, LineString, Polygon, and their multi-types                              | Float64 planar line length. Empty and non-linear inputs yield zero.                                                                                 |
| `ST_Centroid(geometry)`          | Point, LineString, Polygon, and their multi-types                              | GeoArrow WKB. Points have equal weight, lines are weighted by segment length, and polygons are weighted by area. Empty inputs yield an empty Point. |
| `ST_Envelope(geometry)`          | Point, LineString, Polygon, and their multi-types, or a WKB GeometryCollection | GeoArrow WKB Point, LineString, or Polygon according to the extent. An empty input keeps its geometry type.                                         |

Each call produces one value per input row. A null argument produces null. The predicates return false for empty inputs. Native GeoArrow argument types are checked when the query binds. WKB geometry kinds are checked when a row is evaluated. An unlabelled Binary column can be labelled in SQL with `CAST(column AS GEOMETRY)`. Store CRS information in the GeoArrow field metadata. Geometry results carry that metadata forward, and inputs with conflicting declared CRSs are rejected. Embedded nonzero EWKB SRIDs and PostGIS geography overloads are outside the supported signatures.

See the PostGIS references for [`ST_Contains`](https://postgis.net/docs/ST_Contains.html), [`ST_Covers`](https://postgis.net/docs/ST_Covers.html), [`ST_Distance`](https://postgis.net/docs/ST_Distance.html), [`ST_Azimuth`](https://postgis.net/docs/ST_Azimuth.html), [`ST_Area`](https://postgis.net/docs/ST_Area.html), [`ST_Length`](https://postgis.net/docs/ST_Length.html), [`ST_Centroid`](https://postgis.net/docs/ST_Centroid.html), and [`ST_Envelope`](https://postgis.net/docs/ST_Envelope.html).

## Turf expressions[​](#turf-expressions "Direct link to Turf expressions")

Register `TURF_FUNCTIONS` from the same entry point when you want Turf semantics. Both libraries can be used in the same query with `{functions: [...POSTGIS_SPATIAL_FUNCTIONS, ...TURF_FUNCTIONS]}`.

| Function                                        | Accepted input                                    | Result                                                   |
| ----------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| `TURF_DISTANCE(a, b)`                           | Two Points                                        | Great-circle distance in kilometers.                     |
| `TURF_BEARING(a, b)`                            | Two Points                                        | Initial great-circle bearing in degrees.                 |
| `TURF_LENGTH(line)`                             | LineString or MultiLineString                     | Great-circle length in kilometers.                       |
| `TURF_AREA(polygon)`                            | Polygon or MultiPolygon                           | Spherical area in square meters.                         |
| `TURF_CENTROID(geometry)`                       | Point, LineString, Polygon, and their multi-types | Vertex-mean centroid as GeoArrow WKB.                    |
| `TURF_MIDPOINT(a, b)`                           | Two Points                                        | Great-circle midpoint as GeoArrow WKB.                   |
| `TURF_BBOX(geometry)`                           | Point, LineString, Polygon, and their multi-types | Four Float64 values in `[minX, minY, maxX, maxY]` order. |
| `TURF_BOOLEAN_POINT_IN_POLYGON(point, polygon)` | Point, then Polygon or MultiPolygon               | Boolean with boundary points included.                   |

Supply longitude and latitude in degrees for Turf's spherical measurements. The built-in Turf declarations use the options shown above. Use the [custom Turf adapter](https://visgl.github.io/math.gl/next/docs/modules/sql/arrow.md#turf-functions) to bind other units or kernel options. Operations such as explode and line segment require row expansion.
