# GeodesicIntersections

```
import {GeodesicIntersections, type GeodesicIntersectionPath} from '@math.gl/geospatial';

const g = new GeodesicIntersections({semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179});

const a: GeodesicIntersectionPath = {latitude: 0, longitude: -30, azimuth: 90};

const b: GeodesicIntersectionPath = {latitude: -20, longitude: 0, azimuth: 0};

const closest = g.closest(a, b);

if (closest.complete && closest.intersection) console.log(closest.intersection);
```

Coordinates and azimuths are degrees; distances use axis units. The qualified revolution shape profile is `0.99 <= b/a <= 1.01`. A descriptor defines an oriented infinite line, with signed distance from its start. It is distinct from the `GeodesicPath` endpoint sampling class.

| Method                                        | Result                                                                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `all(a, b, {maxDistance, origin?: [s0, t0]})` | Every isolated crossing and canonical coincident continuum inside `abs(s-s0)+abs(t-t0) <= maxDistance`, subject to `complete` |
| `closest(a, b, {maxDistance?, origin?}?)`     | Same report plus the closest intersection; defaults to the global profile                                                     |
| `next(lat, lon, aziA, aziB, maxDistance?)`    | Next crossing excluding the shared origin; defaults to the global profile                                                     |
| `segments(a0, a1, b0, b1)`                    | `intersection`, `overlap`, `disjoint`, `not-found`, or `ambiguous`                                                            |

Search radius is positive and at most `4πR`; each origin parameter has magnitude at most `4πR`, where `R` is the authalic radius. Global defaults search the full radius. A complete smaller search with a returned closest root also establishes global closest rank; an empty smaller search only establishes an empty ball.

Each isolated point includes `s`, `t`, latitude, longitude, physical `residual`, acute `crossingAngle` in degrees, and refinement iteration count. The residual must not exceed `5e-14 * a`. Results are caller-owned.

Coincidence is a continuum, with one canonical `{s, t, direction: 1 | -1}` per in-bounds branch. `all.intersections` contains isolated crossings. The separate `closest.intersection` or `next.intersection` may instead be a continuum representative, marked `coincidence: 1 | -1`. For shared coincident starts, `next` uses GeographicLib's conjugate-point convention, considering `m12 = 0` points and other periodic/self-intersection branches. It does not invent an isolated next point for a continuum. Numerical coincidence uses the native `3ε` convention.

`complete: true` means all search tiles/candidates passed capture-bound coverage and residual checks. Ellipsoid searches use characteristic capture distances, expand the boundary by a safety margin, and retry failed tiles with at most three subdivision levels. `attemptedSeeds` includes retries; `failedSeeds` includes recovered attempts. A remaining failure withholds completeness. Spherical searches enumerate great-circle crossings and parameter circuits analytically. Boundary inclusion has the existing `5e-14 a` rounding band.

Segments use shortest endpoint geodesics. Nearly half-circuit endpoints and the native catalog of nonunique reflected-latitude/opposite-longitude routes return `ambiguous`. Complete empty searches are `disjoint`; unresolved ones are `not-found`. Complete overlaps expose parameter intervals; the second interval can descend for opposite directions. Zero-length segments use physical line residuals and membership. These statuses preserve domain and numerical failures as distinct outcomes.

See [global G6 qualification](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/geographiclib-g6-qualification.md) for independent controls, native representation differences and finite-domain limits.
