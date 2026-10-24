# GeographicLib SOTA tranche list

Target the full GeographicLib capability family, not only its JavaScript package.
P0 closes correctness and contract gaps in existing APIs; P1 adds core geometry;
P2 extends mathematical domains and specialized capabilities. The list records planned scope; delivered P0 increments are recorded below. Priorities are not release commitments.

The [accuracy audit](../docs/modules/geospatial/api-reference/ellipsoid-accuracy.md)
is the delivered baseline: series direct/inverse geodesics, reusable distance/arc
lines, reduced length, scales, longitude unrolling and ellipsoidal gnomonic have
native PROJ controls. Sphere/oblate Cartesian conversion has independent
high-precision controls. Preserve these qualifications.

The complementary [geospatial frames and paths roadmap](./geospatial-roadmap.md)
tracks local frames, poses, tangent-plane operations and path integration.
C1–C3 are merged in [PR #277](https://github.com/visgl/math.gl/pull/277),
not yet recorded here as released; their sampled API/geometry evidence does not complete G0–G2.
Rhumb algorithms remain owned by G5 here, and their subdivision integration is
tracked separately by C4/C6.

## Bounded P0 delivery — merged PR #278

The [P0 completion matrix](../docs/modules/geospatial/projection/ellipsoid-p0-qualification.md)
closes G0–G2 for existing APIs and explicit sampled domains in merged
[PR #278](https://github.com/visgl/math.gl/pull/278). It pins full C++
GeographicLib 2.7 (series and Exact), independently gates Cartesian mathematics,
and records the complete public ownership/unit/boundary audit. The new matrix
has 930 Decimal geometry rows (720 wider-domain cases and 210 exact-input anchor cases) and 2,550 native C++ rows; 3,478 rows are gates and
two very-long-line Exact comparisons remain explicitly diagnostic. Existing
PROJ, interior and cusp gates and accuracy/bundle budgets remain unchanged.

No P0 blocker remains within this profile. Arbitrary finite-domain certification
is not implied: wider flattening/path-length Exact algorithms are G8, triaxial
geodesic scope is G9, and new buffer signatures/performance claims are G7.
G3–G5 scalar APIs are now on master. Remaining implementation and integration
work includes G7 and the remaining frames/paths qualification and wider domains.

## P0 — Existing correctness and defensible claims

| Tranche | Deliverable | Acceptance criteria |
| --- | --- | --- |
| G0: Qualification matrix | Versioned operation/domain comparison with full GeographicLib C++, including units, shape, magnitude and singularities. | Pin comparator versions and original inputs. Establish per-domain budgets before fixes; publish worst cases and independent mathematical checks where algorithms are shared. Keep the current approximately 13 µm sampled interior-height ceiling visible until improved. |
| G1: Nearest surface and interiors | Replace or explicitly isolate the near-center radial approximation in prolate/triaxial surface projection and Cartesian conversion. Distinguish nearest Euclidean surface point from geodetic normal representation. | Independent high-precision constrained-distance controls cover exterior, surface, center, axes, medial/evolute boundaries, repeated radii and thin/prolate shapes. Verify global minimum, residual and signed height; define multiple-minimizer selection or failure. No universal nearest-point claim before qualification. |
| G2: Geometry/API contracts | Audit radii mutation versus cached values, ownership, units, pole conventions, invalid inputs and failure behavior across adapters. | Regression cases establish cache consistency, alias safety and deterministic boundaries. Keep sphere/oblate adapter restrictions distinct from prolate geodesic support. Finite positive axes must not imply arbitrary-flattening accuracy. |

## P1 — Core GeographicLib geometry

| Tranche | Deliverable | Acceptance criteria |
| --- | --- | --- |
| G3: Ellipsoid metrics and auxiliary latitudes | Area, volume, meridian distance/quarter meridian, curvature radii; geocentric, parametric, rectifying, authalic, conformal and isometric latitudes and inverses. | Independent high-precision and GeographicLib controls cover sphere limits, small flattening, poles, inverse conditioning and the declared oblate/prolate domain. Specify endpoint behavior and units. |
| G4: Edge area and polygons | Geodesic `S12`; polygon/polyline accumulator with point/edge insertion, signed area/perimeter, previews and reset. | Compensated sums; independent sphere identities and ellipsoid references. Cover pole/dateline crossings, reversed winding, self-intersections, degeneracy, many tiny edges and multi-circuit paths. Define algebraic/unsigned area and complement conventions; use meaningful near-zero area budgets. |
| G5: Rhumb geometry | Constant-bearing inverse/direct, reusable lines and rhumb polygon area. | GeographicLib controls plus independent meridian/parallel/sphere limits. Cover winding, near-east/west courses and pole approach; distinguish undefined/infinite cases from convergence failures. |
| G6: Geodesic intersections | Closest/next/all searches and segment intersection semantics within an explicit support profile. | Independent residual and segment-membership checks plus GeographicLib comparisons. Cover tangencies, nearly parallel/coincident paths, antipodes and multiple crossings. Specify search bounds, deduplication and ambiguity; bound iteration. |
| G7: Bulk APIs and performance | Reusable/batch operations with output buffers where benchmarks demonstrate value. | Paired benchmarks against pinned GeographicLib implementations at equal accuracy. Measure setup, throughput, allocations and bundle cost separately. Preserve scalar accuracy and alias contracts. Claim improvements only for measured operations/environments. |

## G3–G4 bounded delivery

`EllipsoidMetrics` now supplies area, volume, meridian/curvature metrics and six
auxiliary latitudes/inverses for 0.5 ≤ b/a ≤ 2. Optional geodesic `S12` and
`GeodesicPolygon` supply compensated point/edge insertion, signed/unsigned
algebraic area, open polylines, previews and reset. Original stable C4 differences
fix tiny ellipsoidal-area cancellation also seen in native GeographicLib 2.7.

The [G3–G4 matrix](../docs/modules/geospatial/projection/geographiclib-g34-qualification.md)
records 810 sampled native/independent cases, explicit budgets, native Exact
limitations, exact input conventions and remaining boundaries. This delivers the
bounded G3/G4 scalar APIs, not arbitrary-flattening or all near-zero polygon
certification. G5 now has rhumb inverse/direct/lines/polygons with independent integral and
native controls. Merged [PR #287](https://github.com/visgl/math.gl/pull/287) adds capture-bound global closest/next searches and complete finite-ball
ellipsoid intersections, including coincident continua and complete segment
classification in the declared 0.99 ≤ b/a ≤ 1.01 profile. This global increment is on master; it does not certify arbitrary finite shapes or searches.
See the [global G6 qualification](../docs/modules/geospatial/projection/geographiclib-g6-qualification.md) and the
[G5–G6 qualification](../docs/modules/geospatial/projection/geographiclib-g56-qualification.md).
The [landed-review audit](./landed-review-audit.md) records follow-up correctness fixes and separates pending integration from remaining implementation. G7 performance APIs and G8 wider-domain solvers
remain separate. G0–G2 bounded completion is on master in PR #278. C6 rhumb adapters and the C5 meridian line/polygon profile are described in the [seam guide](../docs/modules/geospatial/api-reference/geographic-seams.md).

## P2 — Wider domains and specialized capabilities

| Tranche | Deliverable | Acceptance criteria |
| --- | --- | --- |
| G8: Exact revolution geodesics | Elliptic-integral direct/inverse/line solver for a declared wider flattening domain, with explicit algorithm selection. | Independent high-precision controls and GeographicLib Exact comparisons establish errors, convergence and cost for very oblate/prolate shapes. Retain series where preferable; “exact” does not mean zero floating-point error. |
| G9: Triaxial geometry | Coordinate/direction conversions and geodesic lines; separately assess conformal coordinates and uniform surface sampling. | Independent trajectories, conserved quantities and GeographicLib triaxial controls cover equal-axis limits and singularities. State inverse-geodesic support explicitly; direct-line support does not imply a global inverse solver. |
| G10: Projection and coordinate utilities | Audit GeographicLib projections, UTM/UPS, MGRS and angle/coordinate utilities against existing math.gl APIs; implement demonstrated gaps. | Coverage matrix separates existing support, precision/domain gaps and intentionally omitted formats. New work receives native controls and module contracts. PROJ CRS/datum operation selection remains separate. |
| G11: Optional Earth models | Scope/design decision for normal gravity, geoid, gravity and magnetic APIs and coefficient loading. | Optional entry points; separately licensed/versioned datasets; datum, epoch, units and uncertainty contracts. Model controls and loading/bundle budgets precede parity claims. No mandatory data downloads. |

## Sequence and common gates

G0–G6 bounded increments are delivered. C6 now connects rhumbs to path sampling,
and C5 adds a meridian line/polygon profile. Next, extend qualification and advance
G7 where equal-accuracy benchmarks justify reusable/batch APIs. G8 needs qualified
special-function primitives; G9 follows G1/G2 and a dedicated numerical design.
P2 tranches are independently selectable, and G11 requires a product scope decision.

Keep small numeric helpers and optional entry points rather than placing every
feature on `Ellipsoid`. Every implementation tranche must:

- Keep ordinary CI on stored, provenance-checked controls. Native PROJ,
  GeographicLib and high-precision generators remain offline qualification tools.
- Check independent expected values, not only round trips. Use conditioning-aware
  physical errors near singularities without hiding ordinary angular errors.
- Set budgets by operation/domain before fixes; document ambiguity and conditioning
  instead of weakening thresholds after failures.
- Qualify supported browsers and Node, public types, packaged ESM/CJS exports and
  selective bundle behavior for new public APIs.
- Prefer small original implementations where practical; add no runtime package
  dependencies by default. Derived code retains SPDX credits and its license in
  the owning module's packaged LICENSE. Dataset licenses are separate.
- Update the accuracy audit with delivered evidence and remaining limits. An
  “exceeds GeographicLib” claim names the operation, domain, metric, comparator
  version and reproducible results. Feature count alone does not prove accuracy.

## Scope references

Scope checked on 2026-10-22 against the GeographicLib 2.7 release family:

- [Upstream releases and changes](https://github.com/geographiclib/geographiclib/blob/main/NEWS)
- [Full C++ API headers](https://github.com/geographiclib/geographiclib/tree/main/include/GeographicLib)
- [Triaxial capabilities](https://geographiclib.sourceforge.io/doc/triaxial.html)
- [Geodesic parameter restrictions](https://geographiclib.sourceforge.io/html/python/interface.html#restrictions-on-the-parameters)

The [ellipsoid convergence plan](./ellipsoid-convergence.md) owns shared kernels,
adapters and local frames. The [projection roadmap](./projection-roadmap.md)
owns projection delivery. This plan adds remaining GeographicLib capabilities
and qualification priorities without replacing those plans.


## P0 delivery ledger

| Tranche | Delivered increment | Remaining gate |
| --- | --- | --- |
| G0 | Full pinned C++ 2.7 series/Exact, ECEF, LocalCartesian, Gnomonic and triaxial Cartesian comparisons; independent Decimal forward/nearest mathematics; published worst cases/native limitations. | Closed for the [declared profile](../docs/modules/geospatial/projection/ellipsoid-p0-qualification.md). No universal finite-input/SOTA claim. |
| G1 | Existing 625 surface controls plus 930 independent Decimal controls; compensated thin exteriors and accurate polar degree conversion; ambiguity/cusp policies retained. | Closed for sampled bounded domains; arbitrary extreme/Exact domains remain G8/G9. |
| G2 | Complete existing-Ellipsoid contract table and regressions: snapshots, inputs/outputs, aliases/M, unit modes, nested setters, normals/rays, pole/center and invalid-input policies. | Closed for existing signatures. New typed-buffer API design and performance comparisons remain G7. |

### Current qualification matrix

| Operation/domain | Comparator and metric | Support boundary |
| --- | --- | --- |
| Series geodesics, seven shapes near Earth-like flattening | 819 native PROJ 9.9 controls; distance/reduced length, scales, condition-aware endpoint/bearing displacement | Shared algorithm family; not an independent mathematical proof or arbitrary-flattening guarantee |
| Sphere/oblate Cartesian inverse, including thin shapes and unique interiors | Exact binary64-input, 110/180-digit Decimal footpoint oracle; unit-normal angle and height | 134 inputs per leaf/projection/geospatial path; 1e-9 degree and max(1e-12, max radius * 2e-12) height ceilings |
| Prolate/triaxial Cartesian inverse | Same independent oracle and unchanged budgets | 64 sampled inputs, including deep interiors; additional unique cusp/boundary recovery qualified |
| Three-axis nearest surface | Same independent footpoint oracle; coordinate and surface residual checks | Existing 625 inputs including 427 cusp controls, plus 930 independent controls; original ceilings retained; no universal finite-shape claim |
| Ambiguous interiors | Analytic multiple-minimum constructions | Reject atomically instead of selecting arbitrary hemisphere/axis |
| Geometry/cache ownership | Mutation and alias regressions | Frozen geometry snapshots; construct a new shape instead of mutating vectors |

Preserve the existing MIT/Apache-2.0 Cesium notices and GeographicLib MIT notices.
The new solver and controls are original MIT math.gl work, not an upstream port.
