# Global ellipsoidal intersections (G6)

The G6 global search gate is delivered for the existing numerical profile: `0.99 <= b/a <= 1.01`, explicit degrees, caller axis units, finite positive axes and representable parameters. All searches retain the existing radius `0 < maxDistance <= 4πR` and origin bounds `abs(s0), abs(t0) <= 4πR`, with `R` the authalic radius. Tests scale axes from `1e-6` through Earth size. This is a numerical completeness contract for this profile, rather than an arbitrary-flattening or exact-topology claim below floating-point resolution.

## Coverage algorithm[​](#coverage-algorithm "Direct link to Coverage algorithm")

The search uses the capture-distance construction in [Karney, Geodesic intersections (2024), sections 3, 6 and 7](https://visgl.github.io/math.gl/next/docs/bibliography.md#karney2024 "Geodesic Intersections") and pinned GeographicLib C++ **2.7** `Intersect.cpp`. The oblate capture bound is `πb`; the prolate bound comes from minimizing polar semi-conjugate distance. The native safety margin is `δ = πR ε^(1/5)`.

The requested L1 ball is expanded by `δ`, then covered with rotated square tiles of radius at most `capture - δ`. Every tile is refined; this implementation omits native seed-pruning optimizations. A failed tile is covered again by four half-radius tiles, for at most three subdivision levels. Completeness is withheld if any leaf remains unresolved. There are at most 2,125 attempts in the declared profile and at most 100 refinement iterations per attempt.

This replaces the initial G6 sampled search, whose converged roots alone could not certify coverage. Native capture bounds and their numerical qualification are reused; no new proof for arbitrary eccentricity is claimed. The safety and repeat-identity margin `δ` is separate from the much smaller physical residual gate. It does not relax coordinate accuracy.

## API and coincidence contracts[​](#api-and-coincidence-contracts "Direct link to API and coincidence contracts")

See [GeodesicIntersections](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/geodesic-intersections.md). `closest(a, b)` and `next(lat, lon, aziA, aziB)` now have global defaults; supplied smaller bounds still work. A closest root from a complete centered L1 search is also globally closest, since any point outside that ball has greater L1 distance. The default radius exceeds the upstream closest/next distance bounds in the qualified shape profile.

* `all` separates isolated roots from coincident continua. Each continuum has one canonical representative nearest the search origin, including periodic branches. It reports completeness after coverage and residual checks.
* `closest.intersection` can represent a continuum, marked `coincidence: 1 | -1`.
* For a shared coincident start, `next` follows the native convention of considering successive conjugate points (`m12 = 0`) alongside other intersection branches. A continuum has no isolated mathematical “next” point; the flag preserves that distinction. Closed-curve periodic branches can rank before a conjugate point.
* Native `All` emits multiple conjugate representatives of a continuum. Fixtures retain them; comparison collapses them to canonical continuum offsets. Isolated root sets are compared without collapsing distinct crossings.
* Accepted unique shortest segments now return complete `intersection`, `overlap` or `disjoint` results. Existing antipodal/nonunique endpoint ambiguity is retained. Unresolved searches return `not-found`; ambiguity and failure are not disjointness.
* `attemptedSeeds` includes subdivisions. `failedSeeds` counts failed attempts, including recovered ones; `complete` is true only after all tiles are covered.
* Closed-boundary inclusion retains the existing `5e-14 a` rounding band. Native exact floating-point trimming can select a different representative at a bound.

The path descriptor is exported as `GeodesicIntersectionPath`, preserving the `GeodesicPath` sampling class added on master. There are no new dependencies.

## Accuracy and independent controls[​](#accuracy-and-independent-controls "Direct link to Accuracy and independent controls")

The existing gates are unchanged:

| Check                                             | Budget                                                  |
| ------------------------------------------------- | ------------------------------------------------------- |
| Physical separation of returned endpoints         | `5e-14 a`                                               |
| Native parameter comparison                       | `5e-14 a / abs(sin(crossingAngle))`, sine floor `1e-12` |
| Independent meridian lattice and conjugate limits | `5e-14 a`                                               |
| Segment membership and continuum offsets          | `5e-14 a`                                               |
| Root/continuum counts and complete flags          | Exact                                                   |

The fixture has **348 original native controls** for full root sets, global closest/next rankings, coincident/antiparallel paths, shifted origins, multiple circuits and segment modes. Shapes include oblate/prolate endpoints, WGS84, sphere and near-sphere limits. Near-antipodal starts and nearly parallel paths have multiple competing roots; tests compare the whole returned set rather than one local solution. Two such cases require adaptive tile recovery.

**48 independent controls** use 80-digit meridian integration to enumerate every pole intersection in a finite parameter lattice, first pole conjugates and analytic equatorial conjugate/periodic limits. These check counts and global rankings independently of the shared geodesic implementation. Separate regressions cover an empty complete ball, public export coexistence and an unrepresentable parameter withholding a completeness certificate.

Original G3–G6 controls remain gates. Node and Chromium/Firefox/WebKit evaluate the same source workload. Reports retain source fingerprints and comparator provenance. The existing projection bundle budgets and selective export checks remain unchanged.

## Reproduction and provenance[​](#reproduction-and-provenance "Direct link to Reproduction and provenance")

Native source is tag `r2.7`, archive SHA256 `5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5`. The stored comparator has 53 significant bits; it is not a higher-precision oracle. CI recomputes independent controls and checks native input/output digests and source provenance. It does not install or download native PROJ or GeographicLib.

```
python3 modules/geospatial/projection/scripts/generate-g6-reference.py --check

node modules/geospatial/projection/scripts/qualify-g6.mjs --output /tmp/g6.json

node modules/geospatial/projection/scripts/qualify-g6.mjs --browser chromium --output /tmp/g6-chromium.json

node modules/geospatial/projection/scripts/check-g6-package.mjs
```

For offline native regeneration, link the original `geographiclib-g6-oracle.cpp` API driver and `Intersect.cpp` with the pinned static GeographicLib library, using the source/generated include directories and a 53-bit `Math::real` build. Then run the generator with `--archive /path/to/r2.7.tar.gz --oracle /path/to/oracle`. The adapted capture/conjugate algorithms retain Charles Karney MIT SPDX credits and the full module license notices.

Shifted coincident paths now include 2.1, 3.2 and 5.7 axis-unit shifts in both directions. Near-dependent spherical plane normals use the geodesic refinement path rather than amplifying cross-product rounding. A 53-bit native Closest quirk classifies one rounded spherical continuum as isolated although native All reports the continuum. The fixture preserves that discrepancy explicitly; that case is gated against All and an independent analytic shift/period minimum. Physical residual and conditioned parameter budgets remain unchanged.

Global default bounds and ranking arithmetic stay normalized by the semi-major axis, so accepted large axes do not overflow the radius or L1 ranking sums. Unrepresentable output parameters still withhold completeness; explicit infinite search radii remain invalid. Coincident closest/next ranking gates use the tight `5e-14 a` distance budget, without the isolated-crossing sine condition factor. Fault injection moves candidates along the same coincident paths and verifies that an incorrect ranking fails even when its physical residual remains valid.

<!-- -->

## References

1. Charles F. F. Karney (2024). Geodesic Intersections. Journal of Surveying Engineering, 150, (3). [doi:10.1061/jsued2.sueng-1483](https://doi.org/10.1061/jsued2.sueng-1483) [Source](https://arxiv.org/abs/2308.00495)
