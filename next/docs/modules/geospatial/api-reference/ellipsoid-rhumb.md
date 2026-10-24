# EllipsoidRhumb and RhumbPolygon

A **rhumb line** is a route that keeps the same compass bearing throughout—for example, heading northeast at 45° the whole way. It is also called a *loxodrome*.

On a Mercator map, a rhumb line appears straight. On a globe, it usually takes a longer route than the shortest surface path, called a **geodesic**. Rhumb lines are useful when a constant heading matters; geodesics are useful when minimizing travel distance matters.

The equator and meridians are both rhumb lines and geodesics. Other lines of latitude are rhumb lines, but are not shortest routes. An oblique rhumb line that approaches a pole spirals around it. Longitude and the rhumb bearing are undefined at the pole itself.

For distance-parameterized sampling and adaptive subdivision, see [RhumbPath and subdivideRhumbPolyline](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/rhumb-path.md).

## API[​](#api "Direct link to API")

Constant-bearing geometry is available from the optional ellipsoid entry:

```
import {EllipsoidRhumb, RhumbPolygon} from '@math.gl/geospatial/ellipsoid';

const axes = {semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179};

const rhumb = new EllipsoidRhumb(axes);

const leg = rhumb.inverse(40, -73, 51, 0, {area: true});

const line = rhumb.line(40, -73, leg.azi12, {unrollLongitude: true});

const halfway = line.position(leg.s12 / 2);

const polygon = new RhumbPolygon(axes)

  .addPoint(0, 0).addPoint(0, 90).addPoint(45, 90).addPoint(45, 0)

  .compute();
```

Latitudes, longitudes and azimuths are explicit degrees, independent of global configuration. Distances use axis units; `S12` and polygon areas use squared axis units. Axes must be finite, positive, with `0.5 <= b/a <= 2` and representable surface area. The original integral solver uses meridian and isometric latitude divided integrals, including an exact east/west parallel branch. Near poles, internal colatitude retains longitude and area accuracy before the public endpoint latitude is rounded.

| Method                                                   | Contract                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| `inverse(lat1, lon1, lat2, lon2, options?)`              | Returns nonnegative `s12`, constant `azi12`, endpoints, and optional `S12` |
| `direct(lat, lon, azi, signedDistance, options?)`        | Returns endpoint, signed `s12`, `azi12`, and optional `S12`                |
| `line(lat, lon, azi, options?).position(signedDistance)` | Reusable line; snapshots options                                           |
| `surfaceArea`                                            | Full ellipsoid area                                                        |

`area: true` opts into edge area relative to the equator. `unrollLongitude: true` retains complete turns. Inverse paths use the shortest longitude difference by default; inverse-only `longitudeTurns` adds an integer number of whole turns. The sign of a 180-degree tie follows the original longitude difference.

Exact poles have undefined rhumb longitude/bearing and throw `RhumbDomainError` with `reason: 'pole'`. Direct paths crossing a pole throw `reason: 'pole-crossing'`. This differs intentionally from GeographicLib's finite epsilon-pole convention and NaN longitude/area on continuation. Other invalid inputs throw `RangeError`; a failed numerical inversion throws `Error`.

`RhumbPolygon` has the same compensated accumulation, closure, signed/unsigned area, orientation, preview, `clear`, `addEdge`, and polyline contracts as [GeodesicPolygon](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/geodesic-polygon.md). Its `addPoint(lat, lon, {longitudeTurns})` and `testPoint(lat, lon, {longitudeTurns, reverse, unsigned})` additionally support explicit winding. A whole eastward parallel at latitude 30 degrees on the unit sphere has perimeter `2π cos(30°)` and signed enclosed north-cap area `π`. At exact half/full-surface reduction boundaries, floating-point rounding can select either equivalent area representative; compare modulo `surfaceArea` when the geometry lies exactly on that discontinuity. Pole rejection also applies to the first vertex and previews. Failed insertion leaves the polygon unchanged.

See [G5–G6 qualification](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/geographiclib-g56-qualification.md) for independent controls, domains and limits.
