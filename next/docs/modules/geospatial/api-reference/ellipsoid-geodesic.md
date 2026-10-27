# EllipsoidGeodesic

Shortest surface geodesics on an oblate or prolate ellipsoid of revolution, or sphere. This complements the three-dimensional coordinate conversions in `Ellipsoid`.

```
import {Ellipsoid, EllipsoidGeodesic} from '@math.gl/geospatial';



const geodesic = new EllipsoidGeodesic(Ellipsoid.WGS84.toSpheroid());

const route = geodesic.inverse(40, -75, 35, 140);

const endpoint = geodesic.direct(40, -75, route.azi1, route.s12);

const midpoint = geodesic.line(40, -75, route.azi1).position(route.s12 / 2);
```

Coordinates are **latitude, longitude**, in degrees. Azimuths are degrees clockwise from north. Distances and reduced lengths use the axes' units (metres for WGS84). The constructor snapshots finite positive axes. For compatibility, `semiMajorAxis` means equatorial radius and `semiMinorAxis` polar radius, including prolate geodesics where the polar radius is larger. Triaxial geometry is unsupported; no CRS or datum transformation is inferred.

`inverse(lat1, lon1, lat2, lon2)` returns the shortest geodesic. `direct(latitude, longitude, azimuth, distance)` evaluates a geodesic endpoint. `line(latitude, longitude, azimuth)` prepares a reusable line whose `position(distance)` accepts signed finite distances. `arcDirect(latitude, longitude, azimuth, arc)` and `line(...).arcPosition(arc)` use signed auxiliary-sphere arc degrees instead of distance. Multi-circuit direct routes are not necessarily shortest paths.

`inverse`, `direct`, `arcDirect`, and `line` accept a final options argument (on `line`, options are snapshotted when creating the line). Set `{unrollLongitude: true}` to preserve longitude winding; the default normalizes longitude to \[-180, 180]. For example:

```
const line = geodesic.line(0, 170, 90, {unrollLongitude: true});

const continued = line.position(50000000); // longitude can exceed 360 degrees
```

Results include `lat1`, `lon1`, `lat2`, `lon2`, `azi1`, `azi2`, distance `s12`, reduced length `m12`, dimensionless geodesic scales `M12` and `M21`, and auxiliary sphere arc `a12` in degrees. Endpoint azimuth `azi2` is the forward direction. Coincident points, poles and antipodal symmetry can make bearings nonunique. Results allocate objects; this API does not promise allocation-free evaluation.

The solver adapts GeographicLib JS 2.2.0 under MIT, with preserved SPDX credits and packaged license text. It adds source/bundle size but no npm dependency. Its sixth-order series targets Earth-like flattenings, not arbitrary eccentricities. The [accuracy and capability audit](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/ellipsoid-accuracy.md) records 819 native PROJ 9.9.0 controls, measured results, singularity metrics and remaining gaps. Geodesic polygon/edge area and exact arbitrary-flattening algorithms are not exposed or qualified.
