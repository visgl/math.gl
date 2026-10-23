# Ellipsoid accuracy and GeographicLib coverage

math.gl targets GeographicLib numerical quality for geodesics and independently qualified ellipsoid geometry. The claim is scoped to the operations and domains below; it is not a claim of complete GeographicLib feature parity or universally better accuracy or performance.

## Geodesics[​](#geodesics "Direct link to Geodesics")

`EllipsoidGeodesic` uses the latest GeographicLib JS 2.2.0 source commit checked on 2026-10-22 (`9c4036d6242aa997e08e43a20df789e2007fbe6f`). The algorithm is Karney's sixth-order series, also used by native PROJ. The typed math.gl facade adds validation and integrates shared axes; it does not replace that algorithm with Vincenty or a spherical approximation.

A new corpus has **819 independently compiled native PROJ 9.9.0 controls**. It tests WGS84, GRS80, Mars, a sphere, oblate/prolate flattenings near ±1/50, and a small-unit ellipsoid. Cases include seeded ordinary and nearly antipodal routes, coincident points, exact/near poles, antimeridian crossings, microscopic distances, negative distances, and four circuits in either direction. Direct, inverse, reusable lines, and auxiliary-sphere arc positions are exercised.

On the Node binary64 distance-based controls, measured maximum discrepancies against native PROJ are **3.73 nm for distance**, **2.80 nm for reduced length**, and **3.34e-16 for geodesic scale**. Length discrepancies are normalized to an Earth equatorial radius of 6,378,137 units for comparison across the seven shapes. These sampled cross-implementation measurements are not global error bounds or an independent proof of the common underlying series. Arc mode has separate checks against native endpoints and outputs.

The regression ceilings are `5e-14 * a` for distance and reduced length, `5e-14` for scales, and `2e-11` degrees for latitude and auxiliary arc. Longitude is compared through physical displacement, weighted by cosine of latitude. Bearing differences are bounded by transverse displacement, `abs(m12 * deltaAzimuth)`: bearings become ill-conditioned as reduced length vanishes, including coincident points and sphere antipodes. Scalar angle disagreements at such singularities must not be mistaken for distance errors. Longitude winding has analytic sphere controls and remains opt-in; normalized longitude is the default.

GeographicLib documents full binary64 accuracy for Earth-like flattenings `abs(f) < 1/50`, with distance errors around 15 nm for terrestrial ellipsoids. Our same-series solver has the same limitation: accepting finite positive axes is not a guarantee of full accuracy at arbitrary flattening. Very flattened, prolate or extreme-magnitude shapes outside the controls are unqualified. See [GeographicLib's parameter restrictions](https://geographiclib.sourceforge.io/html/python/interface.html#restrictions-on-the-parameters) and [PROJ's geodesic documentation](https://proj.org/en/stable/geodesic.html).

## Cartesian conversions and three-radius geometry[​](#cartesian-conversions-and-three-radius-geometry "Direct link to Cartesian conversions and three-radius geometry")

Sphere/oblate Cartesian conversion uses the shared numeric spheroid kernel. Its independent 110-digit Decimal nearest-normal oracle includes thin shapes and deep interiors. The existing qualification enforces **466 accuracy checks**; see [the full domain, ceilings and ambiguity policy](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/ellipsoid-qualification.md). This is mathematical reference evidence independent of GeographicLib/PROJ code. The current sampled ceilings are about 13 µm for Earth-scale interior heights, not a blanket nanometre claim for all ellipsoid operations.

Prolate/triaxial Cartesian conversion and `scaleToGeodeticSurface` now use an original safeguarded nearest-point solve, replacing the radial approximation. All 64 prolate/triaxial inverse controls and 625 independent surface-footpoint controls enforce accuracy, including 427 cusp controls. An original exact-dyadic fallback recovers ill-conditioned and unique boundary solutions; ambiguous interiors reject without touching outputs. The rare fallback uses built-in BigInt storage, adds no dependencies, and has an explicit iteration bound. Qualification remains sampled; extreme shapes and all unique boundary points are not universally certified. Public geometry vectors are frozen with their derived caches; construct a new ellipsoid to change shape. This tightens previously mutable nested vectors. Geodesic prolate support does not change the sphere/oblate-only `toSpheroid` contract used by projection and Cartesian conversion.

## Capability coverage and remaining work[​](#capability-coverage-and-remaining-work "Direct link to Capability coverage and remaining work")

| Capability                                                         | math.gl status                                                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Revolution-ellipsoid direct/inverse geodesics                      | GeographicLib series; native PROJ 9.9 controls                                                                                 |
| Reduced length and geodesic scales                                 | Exposed; sphere analytic and native ellipsoid controls                                                                         |
| Reusable distance/arc positions                                    | Exposed and qualified                                                                                                          |
| Longitude unrolling                                                | Opt-in, analytic multi-circuit controls                                                                                        |
| Prolate geodesics                                                  | Exposed; native controls at approximately -1/50 flattening                                                                     |
| Ellipsoidal gnomonic                                               | Shared reduced-length/scale formulation; native projection controls                                                            |
| Sphere/oblate ECEF and unique nearest-normal interiors             | Shared kernel; independent high-precision mathematical controls                                                                |
| Robust geodesic polygon area/perimeter and edge area               | Not exposed or qualified; requires compensated accumulation, pole/dateline crossing and singularity tests                      |
| Exact geodesics for arbitrary flattening                           | Not implemented; sixth-order series is not an exact elliptic-integral solver                                                   |
| General triaxial geodesics                                         | Not implemented                                                                                                                |
| Certified nearest surface point on every triaxial/prolate interior | Sampled nearest solutions and unique cusp boundaries qualified; ambiguous minima reject; no universal finite-input certificate |
| Rhumb lines and geodesic intersections                             | Not implemented                                                                                                                |
| Magnetic/gravity/geoid models                                      | Outside the ellipsoid geometry API; not implied by geodesic parity                                                             |
| Performance advantage over GeographicLib                           | No claim; shared implementation plus facade has not established an advantage                                                   |

The next accuracy work should close these measured/domain gaps and use independent mathematics where implementations share an algorithm. A claim that math.gl exceeds GeographicLib must identify the operation, domain, error metric and reproducible comparator evidence.

## Reproduce and attribution[​](#reproduce-and-attribution "Direct link to Reproduce and attribution")

Download `src/geodesic.c` and `src/geodesic.h` from PROJ tag `9.9.0` into a local source directory, then run:

```
python3 modules/geospatial/projection/scripts/generate-geodesic-qualification.py --source-dir /path/to/PROJ/src --check

node modules/geospatial/projection/scripts/qualify-geodesics.mjs
```

The generator verifies both source SHA-256 hashes before compiling a temporary C oracle. It adds no runtime or test dependency; ordinary CI reads the stored binary64 fixture and checks generator provenance. Test inputs and the driver are original math.gl work, not copied upstream test data. GeographicLib runtime SPDX credits and packaged MIT license remain intact. The oracle sources are used offline and are not included in the package.
