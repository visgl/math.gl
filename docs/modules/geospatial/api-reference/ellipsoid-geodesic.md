# EllipsoidGeodesic

Shortest surface geodesics on an oblate ellipsoid or sphere. This complements the
three-dimensional coordinate conversions in `Ellipsoid`.

```typescript
import {Ellipsoid, EllipsoidGeodesic} from '@math.gl/geospatial/ellipsoid';

const geodesic = new EllipsoidGeodesic(Ellipsoid.WGS84.toSpheroid());
const route = geodesic.inverse(40, -75, 35, 140);
const endpoint = geodesic.direct(40, -75, route.azi1, route.s12);
const midpoint = geodesic.line(40, -75, route.azi1).position(route.s12 / 2);
```

Coordinates are **latitude, longitude**, in degrees. Azimuths are degrees clockwise
from north. Distances and reduced lengths use the axes' units (metres for WGS84).
The constructor snapshots finite positive axes and requires minor ≤ major.
Triaxial geometry is unsupported; no CRS or datum transformation is inferred.

`inverse(lat1, lon1, lat2, lon2)` returns the shortest geodesic.
`direct(latitude, longitude, azimuth, distance)` evaluates a geodesic endpoint.
`line(latitude, longitude, azimuth)` prepares a reusable line whose
`position(distance)` accepts signed finite distances.

Results include `lat1`, `lon1`, `lat2`, `lon2`, `azi1`, `azi2`, distance `s12`,
reduced length `m12`, dimensionless geodesic scales `M12` and `M21`, and auxiliary
sphere arc `a12` in degrees. Endpoint azimuth `azi2` is the forward direction.
Coincident points, poles and antipodal symmetry can make bearings nonunique.
Results allocate objects; this API does not promise allocation-free evaluation.

The solver adapts GeographicLib JS 2.2.0 under MIT, with preserved SPDX credits and
packaged license text. It adds source/bundle size but no npm dependency. Its series
are intended for Earth-like flattenings; tests cover WGS84 and a sphere, not an
accuracy guarantee for arbitrary eccentricities. Native PROJ 9.5.1 supplies
independent reference distances and endpoints, including nearly antipodal cases.
