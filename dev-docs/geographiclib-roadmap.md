# GeographicLib SOTA tranche list

Target the full GeographicLib capability family, not only its JavaScript package.
P0 closes correctness and contract gaps in existing APIs; P1 adds core geometry;
P2 extends mathematical domains and specialized capabilities. The list records planned scope; delivered P0 increments are recorded below. Priorities are not release commitments.

The [accuracy audit](../docs/modules/geospatial/api-reference/ellipsoid-accuracy.md)
is the delivered baseline: series direct/inverse geodesics, reusable distance/arc
lines, reduced length, scales, longitude unrolling and ellipsoidal gnomonic have
native PROJ controls. Sphere/oblate Cartesian conversion has independent
high-precision controls. Preserve these qualifications.

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

## P2 — Wider domains and specialized capabilities

| Tranche | Deliverable | Acceptance criteria |
| --- | --- | --- |
| G8: Exact revolution geodesics | Elliptic-integral direct/inverse/line solver for a declared wider flattening domain, with explicit algorithm selection. | Independent high-precision controls and GeographicLib Exact comparisons establish errors, convergence and cost for very oblate/prolate shapes. Retain series where preferable; “exact” does not mean zero floating-point error. |
| G9: Triaxial geometry | Coordinate/direction conversions and geodesic lines; separately assess conformal coordinates and uniform surface sampling. | Independent trajectories, conserved quantities and GeographicLib triaxial controls cover equal-axis limits and singularities. State inverse-geodesic support explicitly; direct-line support does not imply a global inverse solver. |
| G10: Projection and coordinate utilities | Audit GeographicLib projections, UTM/UPS, MGRS and angle/coordinate utilities against existing math.gl APIs; implement demonstrated gaps. | Coverage matrix separates existing support, precision/domain gaps and intentionally omitted formats. New work receives native controls and module contracts. PROJ CRS/datum operation selection remains separate. |
| G11: Optional Earth models | Scope/design decision for normal gravity, geoid, gravity and magnetic APIs and coefficient loading. | Optional entry points; separately licensed/versioned datasets; datum, epoch, units and uncertainty contracts. Model controls and loading/bundle budgets precede parity claims. No mandatory data downloads. |

## Sequence and common gates

Start with G0–G2, then G3/G4, followed by G5/G6. G5 uses auxiliary
latitudes and polygon accumulation infrastructure; G6 builds on existing reusable
geodesic lines. G7 follows each scalar API's qualification. G8 needs qualified
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
| G0 | Existing native PROJ 9.9 geodesic corpus and independent 110-digit Cartesian oracle; operation/domain matrix below. | Full C++ GeographicLib comparison and broader conditioning/magnitude coverage before a complete SOTA claim. |
| G1 | Original three-axis solver plus exact-dyadic recovery of unique boundary/near-cusp roots; 625 surface controls including 427 cusp inputs. Formerly diagnostic deep inverse cases retain their original budgets. | Broader extreme domains and bounded-solver limits still need qualification; no universal finite-input accuracy claim. |
| G2 | Geometry vectors and derived caches frozen together; underflow-safe inverse normal/height; mutation, alias, invalid-input and ambiguity regressions. | Continue auditing all public result ownership, units and pole contracts; no claim of exhaustive completion. |

### Current qualification matrix

| Operation/domain | Comparator and metric | Support boundary |
| --- | --- | --- |
| Series geodesics, seven shapes near Earth-like flattening | 819 native PROJ 9.9 controls; distance/reduced length, scales, condition-aware endpoint/bearing displacement | Shared algorithm family; not an independent mathematical proof or arbitrary-flattening guarantee |
| Sphere/oblate Cartesian inverse, including thin shapes and unique interiors | Exact binary64-input, 110-digit Decimal footpoint oracle; unit-normal angle and height | 134 inputs per leaf/projection/geospatial path; 1e-9 degree and max(1e-12, max radius * 2e-12) height ceilings |
| Prolate/triaxial Cartesian inverse | Same independent oracle and unchanged budgets | 64 sampled inputs, including deep interiors; additional unique cusp/boundary recovery qualified |
| Three-axis nearest surface | Same independent footpoint oracle; coordinate and surface residual checks | 625 sampled inputs including 427 cusp controls; original absolute ceilings plus 2e-12 relative cusp-component checks; no universal finite-shape claim |
| Ambiguous interiors | Analytic multiple-minimum constructions | Reject atomically instead of selecting arbitrary hemisphere/axis |
| Geometry/cache ownership | Mutation and alias regressions | Frozen geometry snapshots; construct a new shape instead of mutating vectors |

Preserve the existing MIT/Apache-2.0 Cesium notices and GeographicLib MIT notices.
The new solver and controls are original MIT math.gl work, not an upstream port.
