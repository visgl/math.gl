# GeodesicPolygon

Streaming geodesic polygons and open polylines on revolution ellipsoids. This
optional class retains compensated area/perimeter sums, not a vertex list.

```typescript
import {GeodesicPolygon, EllipsoidGeodesic} from '@math.gl/geospatial/ellipsoid';

const axes = {semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179};
const polygon = new GeodesicPolygon(axes);
polygon.addPoint(0, 0).addPoint(0, 90).addPoint(90, 0);
const {area, perimeter} = polygon.compute();
const preview = polygon.testPoint(20, 30); // does not insert the point
polygon.clear();

const geodesic = new EllipsoidGeodesic(axes);
const edge = geodesic.inverse(10, 20, 30, 40, {area: true});
console.log(edge.S12); // signed edge area in square metres
```

All point arguments are **latitude, longitude in degrees**. Axis lengths and
perimeters share caller units; areas use squared units. Axes are snapshotted by
the existing series geodesic engine. Qualified G4 shapes are the sphere, WGS84,
and a prolate shape with b/a = 1.01; accepting other positive axes does not imply
arbitrary-flattening accuracy.

| Member | Behavior |
| --- | --- |
| `new GeodesicPolygon(axes, {polyline?: boolean})` | Polygon by default; `polyline: true` suppresses closure and area |
| `addPoint(latitude, longitude)` | Add a shortest-geodesic edge from the previous point; first point starts the path |
| `addEdge(azimuth, distance)` | Add a direct geodesic from the last point; azimuth is degrees clockwise from north; signed distance is retained in perimeter |
| `number` | Number of inserted points/edges, including repeated points |
| `compute({reverse?, unsigned?})` | Owned `{number, perimeter, area?}` result without changing the accumulator |
| `testPoint(latitude, longitude, options?)` | Nonmutating compensated preview of point insertion |
| `testEdge(azimuth, distance, options?)` | Nonmutating compensated preview of edge insertion |
| `clear()` | Reset all sums, crossings and endpoints; returns the accumulator |

Default polygon area is algebraic, counterclockwise positive, in
(-surfaceArea/2, surfaceArea/2]. `reverse: true` makes clockwise positive.
`unsigned: true` returns [0, surfaceArea), selecting the complementary area for a
negative winding. Self-intersections cancel algebraically. Meridian transits
handle pole/dateline crossings and unrolled direct edges; repeated circuits are
reduced modulo total area. Empty/one-point results have zero perimeter and area.
Polylines omit `area` and retain their open perimeter.

Invalid coordinates/azimuths/distances throw before insertion; an edge or edge
preview without a starting point also throws (GeographicLib's empty-edge no-op
is intentionally not copied). Preview results and computed results are owned.
Antipodal shortest paths and pole longitudes use the existing geodesic engine's
conventions. An inverse edge's area need not equal a direct edge with a different
endpoint pole longitude or antipodal branch.

`EllipsoidGeodesic.surfaceArea` exposes the engine's total area in squared axis units, using the identical normalization as edge areas.

`GeodesicOptions.area: true` also enables optional `S12` on `direct`, `arcDirect`,
and both reusable-line position methods. Defaults retain the existing no-area
output and cost. At a pole, converting a distance to a rounded arc can change the
represented endpoint side and hence its area branch; use the intended input API.

Small-edge C4 differences use an original cancellation-free trigonometric
identity. This fixes real tiny ellipsoidal-area gaps in the underlying series
subtraction, also present in native GeographicLib 2.7. The
[G3–G4 qualification](../projection/geographiclib-g34-qualification.md) records
independent tiny-area controls, native disagreements, exact input distinctions,
and limits on near-zero and large-path claims. SPDX and packaged MIT notices
credit the adapted GeographicLib polygon transit/reduction rules and existing
accumulator/geodesic implementation. No package dependency is added.
