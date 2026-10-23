# GeodesicIntersections

```ts
import {GeodesicIntersections} from '@math.gl/geospatial/ellipsoid';
const intersections = new GeodesicIntersections({semiMajorAxis: 1, semiMinorAxis: 1});
const result = intersections.segments([0, -20], [0, 20], [-20, 0], [20, 0]);
if (result.status === 'intersection') console.log(result.point);
```

This is a bounded intersection API for revolution ellipsoids with
`0.99 <= b/a <= 1.01`. Coordinates/azimuths are degrees; distances use axis units.
A `GeodesicPath` is `{latitude, longitude, azimuth}` and defines an oriented line
with signed distance measured from its start.

| Method | Result |
| --- | --- |
| `all(pathA, pathB, {maxDistance, origin?: [s0, t0]})` | Discovered isolated crossings and coincident-line representatives inside `abs(s-s0)+abs(t-t0) <= maxDistance` |
| `closest(pathA, pathB, options)` | Same report plus `intersection`, the closest discovered isolated root in L1 distance |
| `next(lat, lon, aziA, aziB, maxDistance)` | Same report excluding the shared parameter origin; signed directions retained |
| `segments(a0, a1, b0, b1)` | `intersection`, `overlap`, `disjoint`, `not-found`, or `ambiguous` |

Each isolated crossing includes `s`, `t`, latitude, longitude, physical residual,
acute `crossingAngle` in degrees and iteration count. The residual must be at
most `5e-14 * a`. Returned arrays are owned by the caller. Coincidences are a
continuum, represented by an in-bounds `{s, t, direction}`; they are not silently
turned into isolated roots.

**Completeness is explicit.** Spherical searches enumerate both great-circle
crossings and all parameter circuits in the bounds analytically, and report
`complete: true` only when every candidate passes its residual gate. Coincident
spheres report `complete: false`. Ellipsoidal searches use deterministic tiling
and at most 100 refinement steps per seed. They always report `complete: false`:
this increment does not port GeographicLib's global conjugate-distance bounds.
`attemptedSeeds` and `failedSeeds` describe the numerical search. `closest` and
`next` rank discovered roots and do not certify global optimality when incomplete.

Search radius must be positive and at most four authalic half-circumferences;
each origin parameter must have magnitude at most that bound. The ellipsoid is
normalized internally to keep the residual criterion independent of axis scale.

Segments select shortest endpoint geodesics. Nearly antipodal/half-circuit
endpoints return `ambiguous`. Zero-length segments use a physical line residual,
rather than a poorly conditioned distance-sum equality. Overlaps expose parameter
intervals (the second interval can descend for opposite orientations). A complete
empty search returns `disjoint`; an incomplete empty search returns `not-found`.
Callers must handle these statuses rather than treating every empty search as a
proof of nonintersection.

See [G5–G6 qualification](../projection/geographiclib-g56-qualification.md).
