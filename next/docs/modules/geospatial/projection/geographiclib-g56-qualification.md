# GeographicLib G5–G6 qualification

This report records the initial G5–G6 delivery. The follow-up [global G6 qualification](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/geographiclib-g6-qualification.md) closes its ellipsoidal capture/completeness gate; initial limitations below are historical.

This increment adds original rhumb inverse/direct/line geometry, compensated rhumb polygons, and a bounded geodesic intersection API. It starts G6; it does not close the global ellipsoidal completeness gate or claim all GeographicLib features. G0–G4 budgets and projection bundle ceilings are unchanged.

## Controls and budgets[​](#controls-and-budgets "Direct link to Controls and budgets")

The checked-in original-input fixture compares with pinned GeographicLib C++ **2.7**, tag `r2.7`, archive SHA256 `5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5`. Native precision is **53 significant bits**, even though the precision-3 type is named `long double` on the generation machine. It is not a higher-precision oracle. Rhumb uses `exact=true` for the full flattening domain. The generator also computes original 80-digit Decimal meridian/isometric integrals and area potentials, independently of production quadrature and native rhumb series.

| Family                               | Domain                                                                                                                    | Gate                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Rhumb inverse/direct/lines           | b/a = .5, .99, WGS84, 1, near sphere, 1.01, 2; a = 1 and 6378137; dateline, near poles, tiny legs, signed direct distance | 5e-14 a length, 2e-11 degree angle/endpoint (longitude weighted by cos(latitude)), 5e-14 a² area                               |
| Rhumb polygons                       | Same axes, dateline and tiny rectangles                                                                                   | 5e-14 a perimeter, 5e-14 a² area                                                                                               |
| Independent rhumbs                   | Five ratios; meridian/isometric integrals, tiny paths, parallels approaching poles and whole circuits                     | Stricter of ordinary budget and 2e-8 relative, floor 1e-28 for unit-scale length/area; 2e-11 degree bearing                    |
| Intersections                        | Sphere, WGS84, b/a=.99 and 1.01; ordinary/polar/dateline starts, near-parallel crossings                                  | Native bounded root counts; 5e-14 a physical residual; 5e-14 a / abs(sin(crossingAngle)) parameter error with 1e-12 sine floor |
| Independent spherical/contract tests | Analytic meridian/equator roots and repeated circuits, segment membership, coincidence, overlap and ambiguity             | Physical residual and analytic parameter controls; explicit completeness/status assertions                                     |

Parameter sensitivity grows without bound for parallel lines. Conditioning the parameter comparison does not relax the physical residual requirement. Native constructed near-parallel paths start from independently specified intersections and signed displacements. Counts are compared on the checked bounds, not inferred from a local iteration alone.

## Findings and deliberate differences[​](#findings-and-deliberate-differences "Direct link to Findings and deliberate differences")

* Polar geodesic crossing tangents must be compared in a common Cartesian frame; subtracting longitude-dependent azimuths can mislabel a right-angle crossing as parallel.
* Pole-relative meridian gaps and start-relative inversion preserve valid tiny steps moving away from a pole; absolute meridian ordinates can round to the pole even when the endpoint is representable.
* Tiny meridian displacements need a relative Newton inversion; fixed absolute latitude bisection loses meaningful tiny endpoints. The rhumb solver preserves the displacement and independently tests it.
* Near-east/west rhumbs need divided integrals rather than subtraction of nearly equal meridian/isometric quantities. Exact parallels keep their input latitude.
* Isometric integration handles logarithmic pole approach; bracket endpoint stagnation is a representable solution, not an endless convergence failure.
* GeographicLib substitutes finite epsilon latitudes at exact poles. This API throws a typed domain error, including pole continuation, instead of returning arbitrary finite longitude/bearing or NaNs.
* Coincident geodesics are reported separately. Empty incomplete ellipsoid searches are `not-found`, not certified disjoint. Spherical candidates failing residual checks invalidate completeness.
* A distance-sum segment test can accept points slightly off a line. Degenerate segments instead check an actual geodesic endpoint residual and membership.
* Global ellipsoidal all/closest/next completeness, conjugate-distance bounds and a broader flattening domain remain G6 work. No performance/G7 claim is made.

## Reproduction[​](#reproduction "Direct link to Reproduction")

```
python3 modules/geospatial/projection/scripts/generate-g56-reference.py --check

node modules/geospatial/projection/scripts/qualify-g56.mjs --output /tmp/g56.json

node modules/geospatial/projection/scripts/qualify-g56.mjs --browser chromium --output /tmp/g56-chromium.json
```

CI uses stored native controls and recomputes independent Decimal controls. It never downloads or builds GeographicLib or PROJ. Node and Chromium/Firefox/WebKit run the same source workload; reports include source fingerprints and comparator provenance. Existing package/type/license and projection bundle gates still run.

For native regeneration, use the same pinned archive/build instructions as [G3–G4](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/geographiclib-g34-qualification.md), additionally compile `Intersect.cpp`, and link the companion `geographiclib-g56-oracle.cpp` with `PolygonArea.cpp`, `Rhumb.cpp`, `Intersect.cpp` and the static GeographicLib library. Then run:

```
python3 modules/geospatial/projection/scripts/generate-g56-reference.py \

  --archive /path/to/geographiclib-r2.7.tar.gz --oracle /path/to/g56-oracle
```

No runtime or development dependencies were added. Rhumb geometry is original math.gl source. The small spherical intersection correction is adapted from GeographicLib `Intersect.cpp`, with MIT SPDX/Charles Karney acknowledgements and full module license notices; existing vendored geodesic code is reused.

Endpoint segments also reject the native GeographicLib catalog of nonunique shortest paths (latitude-reflected routes and opposite-longitude prolate routes), which cannot be detected by an auxiliary-arc cutoff alone. Compensated rhumb longitude differences retain representable tiny legs across the dateline.

## Tiny polar direct paths[​](#tiny-polar-direct-paths "Direct link to Tiny polar direct paths")

Near a pole, a nearly east/west course can have a meaningful isometric/longitude change even when its endpoint latitude rounds to the starting latitude. The solver retains colatitude internally in this region before rounding public latitude. Forty-two original native direct controls also expose cancellation in the 53-bit native comparator: native area discrepancies reach roughly `1.5e-9 a²`. Those native results remain in the fixture and reports as diagnostics. Their gates use independent 80-digit, 12-node polar meridian/isometric/area integrals; four additional spherical direct controls use analytic logarithmic formulas. The existing `5e-14 a²` area and angular budgets remain unchanged. The distinct high-precision rule operates on colatitudes below `2e-8` radians, where its truncation error is below the working Decimal precision. CI recomputes these controls without native software.

Direct paths approaching a pole from ordinary latitudes retain the remaining meridian distance and endpoint isometric latitude through longitude and area integration. If subtraction of the full meridian arc and northing is ill conditioned, an original internal 48-decimal fixed-point binomial integral computes that difference from the exact binary inputs. This bounded slow path adds no dependency. Another 46 independent controls cover starts at 0°, 30°, 60° and 80°, both hemispheres and signed distances, unit/Earth and 1e±100 axes and b/a from 0.5 through 2. Spherical controls use analytic logarithms; ellipsoidal controls use 80-digit quadrature with the polar singularity removed analytically. The area budget remains `5e-14 a²`.

Cancellation-sensitive domain classification uses the high-precision remaining distance before rejecting a pole or pole crossing. This preserves representable endpoints when rounded northing equals the rounded full pole distance; endpoints whose public latitude rounds to an exact pole still raise the explicit domain error.
