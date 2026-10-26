# Geospatial frames and paths roadmap

Status updated October 24, 2026. This plan tracks the CesiumJS-inspired coordinate,
pose and surface-path work. **Merged** means present on master; it does not mean released or fully qualified
for every domain. PR #277 merged on October 23, 2026.
Priorities describe sequencing, not release commitments.

## Baseline and delivery ledger

| Tranche | Status | Delivered scope and evidence | Remaining boundary |
| --- | --- | --- | --- |
| C0: Existing foundations | On master | Ellipsoid conversions, normals, local-frame numeric kernels, horizon queries, GeographicLib-backed series geodesics, tile matrices and the general CRS/projection pipeline. | Preserve existing operation/domain qualifications. Do not duplicate these capabilities based on the older checkout reviewed initially. |
| C1: Reusable local reference frames | Merged in [PR #277](https://github.com/visgl/math.gl/pull/277) | `LocalReferenceFrame` snapshots geodetic basis and origin; ENU/NED/custom right-handed axes; separate point/vector transforms; independent matrix copies and caller-owned vector results. Analytic axis, elevated-origin, pole, dateline, alias and ownership tests. | Sphere/oblate geometry only. Pole longitude follows the existing Cartesian inverse convention. No datum transformation or universal finite-input precision claim. |
| C2: Geographic poses and motion orientation | Merged in [PR #277](https://github.com/visgl/math.gl/pull/277) | Radian heading/pitch/roll matrices/quaternions, rigid-pose extraction, canonical gimbal lock and normalized velocity-aligned orientation. Tests cover mixed/custom frames, singular motion, subnormal/overflowing speeds and scaled normalization. | Model-forward and angle signs are explicit; ENU heading zero aligns model +X east. Motion orientation is stateless; no continuity solver, inertial conversion or rotating-frame velocity term. |
| C3: Tangent-plane operations | Merged in [PR #277](https://github.com/visgl/math.gl/pull/277) | Outward radial projection, radial/normal surface inversion, packed projection with validity masks, overlap validation and orthonormal three-radius bases. Independent sphere/axis equations plus off-axis triaxial and WGS84 regression cases. | Normal inversion selects the near-facing branch and can miss; radial horizon/back-facing rays fail explicitly. Height is discarded. Legacy basis getters remain mutable. This is not comprehensive extreme-shape qualification. |
| C4: Surface-path sampling and subdivision | Geodesic/linear increment merged in [PR #280](https://github.com/visgl/math.gl/pull/280) | Reusable `GeodesicPath` fraction/distance sampling; generic original-edge sampler factory; adaptive geodesic polylines with surface-distance limits, unrolled longitude, height interpolation and original-edge provenance. 180 pinned native PROJ controls, analytic spherical distance/dense-error checks and failure/ownership regressions. | Sampled target error is not a certified bound. No seam splitting, terrain following or route uniqueness at antipodes. Rhumb adapters now reuse G5 through C6; see the rhumb path guide. Packaged ESM/CJS, strict types and selective boundaries are checked; no speed or allocation-free claim. |

PR #277 validation: all 198 repository Node test files passed (6,399 tests passed,
124 skipped); the 20-file geospatial subset passed (1,695 passed, one skipped);
three targeted Chromium suites passed (21 tests). TypeScript project-reference
build, repository lint, attribution checks and existing local-frame allocation and
package-boundary guards passed. GitHub CI is separate from these local results.
The allocation guards qualify their existing numeric kernels, not every new class
method. Dedicated new-API package-size, performance and cross-browser qualification
remain follow-up work.

## Remaining tranches

| Tranche | Priority / status | Deliverable | Acceptance gate and dependencies |
| --- | --- | --- | --- |
| C5: Geographic seams and topology | Meridian profile merged in [PR #298](https://github.com/visgl/math.gl/pull/298) | `splitGeographicPolyline`/`splitGeographicPolygon` implement explicit linear, geodesic and rhumb meridian seams, preserving attributes, components, holes, declared polar caps and source intervals. | Build on C4 and existing layout/cutting contracts. Qualify seam intersections, pole crossings, holes, winding, repeated crossings and degenerate edges. Split seams and clip invalid domains before adaptive projection; retain provenance and do not silently reinterpret edges. |
| C6: Rhumb path integration | Merged in [PR #298](https://github.com/visgl/math.gl/pull/298) over scalar G5 | `RhumbPath` and `subdivideRhumbPolyline` reuse the existing G5 solver with distance/fraction sampling, unrolled/turn semantics and original-edge provenance. | Preserve G5 independent/native budgets, winding and pole failure semantics. Qualify sampler height/provenance and work limits; do not introduce a second rhumb solver. |
| C7: Precision and renderer interop | P2 / design needed | Optional coordinate rebasing/high-low encoding utilities and a matching consumer contract for deck.gl/luma.gl. Clarify geographic degrees, projected metres, ECEF/local units and rendering common space. | Establish an actual renderer consumer before selecting a buffer layout. Measure reconstruction and relative subtraction under real float32 arithmetic, including large origins and small offsets. Benchmark setup, throughput, allocation and selective bundle cost; coordinate encoding alone must not imply jitter-free rendering. |
| C8: Local-operation qualification and ergonomics | Initial bounded profile implemented | Extend C1–C3 evidence to packaged ESM/CJS exports, public types, Firefox/WebKit, declared numerical domains and measured performance; consider reusable flat frame transforms if a consumer demonstrates value. | Preserve scalar ownership/failure behavior. Add independent physical-error controls and domain-specific budgets before accuracy/performance claims. Do not infer allocation-free poses or universal precision from the existing kernel guards. |
| C9: Celestial frames and precise time | P3 / optional, consumer-driven | Separate optional celestial-frame/time module: explicit ICRF/body-fixed and TEME/pseudo-fixed profiles, time scales, versioned Earth-orientation/precession data providers and state-vector transformations. | Coordinate with the [sun/sky roadmap](./sun-roadmap.md). Define UTC/TAI/TT/UT1 handling, leap-second policy, data coverage/loading and accuracy tiers. Independently validate position and velocity, including the frame-derivative term. Approximate starfield rotation is not a qualified terrestrial frame conversion. |

## Sequence and ownership

1. C1–C3 landed in PR #277; retain their documented support limits and track
   release status separately.
2. C4 geodesic/linear sampling is merged in PR #280. C5 now supplies explicit
   linear/geodesic/rhumb meridian seams and polygon topology. Keep seam processing separate
   from longitude unrolling and preserve the sampled-error qualification.
3. C6 now connects the delivered G5 solver to distance/fraction sampling and
   C4's adaptive subdivision interface, with explicit unrolled/turn semantics.
4. Advance C7 with a renderer consumer and C8 alongside each API's expansion.
5. Start C9 only with an agreed astronomy/satellite use case and data/time design.

The [GeographicLib roadmap](./geographiclib-roadmap.md) owns geodesic/rhumb
algorithms and their qualification; this plan owns their frame/path integration.
The [ellipsoid convergence plan](./ellipsoid-convergence.md) owns shared numeric
kernels and adapter compatibility. The [projection roadmap](./projection-roadmap.md)
owns CRS operations and projection mathematics. Existing geoid/vertical-grid APIs
remain the basis for height-datum work; surface projection is not a height conversion.

More projection formulas, another tile-matrix abstraction, and scene-mode/screen
projection logic are not immediate new tranches: general projection and tile
capabilities already exist, while scene-specific decisions belong to consumers.
New public numerical capabilities require independent expected values, explicit
units/domains/failures, retained attribution, tests and discoverable API docs.

## C4 validation and remaining work

The C4 increment reuses the existing geodesic solver and adaptive subdivision engine;
no runtime dependency or replacement geodesic algorithm is added. The stored controls
pin native PROJ 9.9.0 source hashes and their original generator. Analytic sphere checks
are mathematically independent; native PROJ comparisons share the geodesic algorithm family.
The package check verifies fixture provenance, ESM/CJS public entries, strict consumer
signatures and selective dependency boundaries. Generic geometry does not acquire a
geodesic dependency, and importing only `Ellipsoid` does not initialize the new default solver.

Rhumb paths and adaptive subdivision are available through C6. The C5 meridian
profile preserves components, holes, explicit polar caps, attributes and provenance. Arbitrary
interrupted cut networks and invalid-polygon repair remain outside that profile. Unrolled longitude
alone does not clip a discontinuous projection or guarantee a continuous longitude chart
at a pole. Existing solver shape/domain restrictions remain in force. Full performance,
allocation and broader numerical-domain qualification are not implied by this delivery.

## C5/C6 delivery profile

See [rhumb path sampling](../docs/modules/geospatial/api-reference/rhumb-path.md)
and [geographic seams](../docs/modules/geospatial/api-reference/geographic-seams.md).
The new controls combine 100 native rhumb samples and 180 existing native PROJ
positions with pinned native azimuths, plus independent sphere, solid-angle,
planar area/filled-set, hole and pole controls. Ordinary angular/fraction errors
remain gated; ill-conditioned meridian intersections use transverse physical errors.
Generic geometry remains solver-independent. Existing numerical, bundle, coverage
and allocation gates remain unchanged; no new runtime dependency is introduced.

## C8 / G7 initial evidence

The [local-frame qualification](../docs/modules/geospatial/api-reference/local-frame-qualification.md)
adds 560 Node/browser controls, strict ESM/CJS consumers, selective graph guards
and three numerical fixes. Initial G7 historical/native benchmark baselines
separate setup, reusable operation cost and sampled allocations; they add no
bulk signatures or speed claims. Wider domains, generic ellipsoidal grazing,
additional consumers and browser throughput remain follow-up work.

## C8/G7 follow-up

The next bounded increment extends silhouette qualification with exact rational
signs and 220-digit line/quadric controls, preserving the spherical contact
convention. Measured packed local-frame point/vector transforms reuse Float64
outputs, support exact in-place storage and fail atomically. See the expanded
[qualification and benchmark profile](../docs/modules/geospatial/api-reference/local-frame-qualification.md).
Existing numerical and selective bundle budgets remain unchanged; renderer C7,
G8 Exact geodesics and G9 triaxial geodesics remain separate work.

## Global spherical polygon increment

The existing discontinuous-map engine already handles convex chart boundaries,
interrupted lobes, polyhedral faces and spherical visibility caps. Its prior
open-hemisphere polygon input restriction is now addressed by an explicit directed
filled-side atlas adapter (`cutSphericalPolygon`, `projectSphericalPolygon`,
`MapEngine.projectGlobalPolygon`, and opt-in prepared features). Independent
hemisphere/complement/hole controls qualify the spherical profile. This is broader
map-polygon coverage; it is not arbitrary ellipsoidal/rhumb cuts or polygon repair.
See [global spherical cuts](../docs/modules/geospatial/api-reference/global-geographic-cuts.md).

## C5 latitude-domain increment

The optional `geographic-cuts` entry adds line/polygon clipping to a closed latitude
band for explicit linear, ellipsoidal geodesic and rhumb source curves, composed
with the existing meridian chart. Generated parallel/meridian/pole edges have
explicit descriptors and a projection subdivision adapter. This enables bounded
polar orthographic surface visibility and finite Mercator latitude domains while
preserving holes, disconnected components and original source intervals.

See [latitude cuts](../docs/modules/geospatial/api-reference/latitude-geographic-cuts.md)
for shape restrictions, ownership, limits, 310 native/independent Node/browser
controls and unchanged existing budgets. Arbitrary oblique horizons, curved cut
networks and general ellipsoidal/rhumb global complements remain future work.

## C5 oblique visibility and cut graph delivery

`geographic-atlas` extends latitude-only visibility to arbitrary-direction
orthographic surface horizons on the declared ellipsoid. A shared normal-space
circle graph adds finite multi-chart cells, explicit generated-curve provenance,
shared vertex identities and an octahedral faceted-map consumer. See the
[atlas API and 498-case qualification](../docs/modules/geospatial/api-reference/geographic-atlas.md).
Arbitrary boundary callbacks, unresolved multiple junctions, dataset-wide shared
feature topology and perspective/terrain visibility remain outside this profile.
