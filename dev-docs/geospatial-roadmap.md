# Geospatial frames and paths roadmap

Status updated October 23, 2026. This plan tracks the CesiumJS-inspired coordinate,
pose and surface-path work. **Merged** means present on master; it does not mean released or fully qualified
for every domain. PR #277 merged on October 23, 2026.
Priorities describe sequencing, not release commitments.

## Baseline and delivery ledger

| Tranche | Status | Delivered scope and evidence | Remaining boundary |
| --- | --- | --- | --- |
| C0: Existing foundations | On master | Ellipsoid conversions, normals, local-frame numeric kernels, horizon queries, GeographicLib-backed series geodesics, tile matrices and the general CRS/projection pipeline. | Preserve existing operation/domain qualifications. Do not duplicate these capabilities based on the older checkout reviewed initially. |
| C1: Reusable local reference frames | Merged in [PR #277](https://github.com/visgl/math.gl/pull/277) | `LocalReferenceFrame` snapshots geodetic basis and origin; ENU/NED/custom right-handed axes; separate point/vector transforms; independent matrix copies and caller-owned vector results. Analytic axis, elevated-origin, pole, dateline, alias and ownership tests. | Sphere/oblate geometry only. Pole longitude follows the existing Cartesian inverse convention. No datum transformation or universal finite-input precision claim. |
| C2: Geographic poses and motion orientation | Merged in [PR #277](https://github.com/visgl/math.gl/pull/277) | Radian heading/pitch/roll matrices/quaternions, rigid-pose extraction, canonical gimbal lock and normalized velocity-aligned orientation. Tests cover mixed/custom frames, singular motion, subnormal speeds and overflow rejection. | Model-forward and angle signs are explicit; ENU heading zero aligns model +X east. Motion orientation is stateless; no continuity solver, inertial conversion or rotating-frame velocity term. |
| C3: Tangent-plane operations | Merged in [PR #277](https://github.com/visgl/math.gl/pull/277) | Outward radial projection, radial/normal surface inversion, packed projection with validity masks, overlap validation and orthonormal three-radius bases. Independent sphere/axis equations plus off-axis triaxial and WGS84 regression cases. | Normal inversion selects the near-facing branch and can miss; radial horizon/back-facing rays fail explicitly. Height is discarded. Legacy basis getters remain mutable. This is not comprehensive extreme-shape qualification. |

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
| C4: Surface-path sampling and subdivision | P1 / planned next | Adapt existing geodesic lines into an explicit source-edge sampler; extend adaptive subdivision to consume declared linear, geodesic and eventually rhumb paths. Preserve edge indices/fractions and interpolated height/attributes. | Reuse existing geodesics rather than expose internal Vincenty helpers. Independent midpoint/distance controls, dateline/polar/near-antipodal cases, bounded vertex/depth limits and provenance checks. Keep sampled error distinct from a certified curve bound. Rhumb mode depends on C6/G5; geodesic mode need not wait for it. |
| C5: Geographic seams and topology | P1 / planned | Generalize current Mercator cutters and existing discontinuous-layout geometry into geographic seam splitting with declared edge semantics, interpolated attributes and preserved topology. | Build on C4 and existing layout/cutting contracts. Qualify seam intersections, pole crossings, holes, winding, repeated crossings and degenerate edges. Split seams and clip invalid domains before adaptive projection; retain provenance and do not silently reinterpret edges. |
| C6: Rhumb geometry | P2 / planned; owned by [G5](./geographiclib-roadmap.md) | Constant-bearing direct/inverse operations and reusable lines, followed by polygon area when its accumulator infrastructure is ready. | Share auxiliary-latitude work from G3 and area infrastructure from G4. GeographicLib controls and independent meridian/parallel/sphere limits; explicit winding, pole and infinite/undefined behavior. Feed the same qualified solver into C4. |
| C7: Precision and renderer interop | P2 / design needed | Optional coordinate rebasing/high-low encoding utilities and a matching consumer contract for deck.gl/luma.gl. Clarify geographic degrees, projected metres, ECEF/local units and rendering common space. | Establish an actual renderer consumer before selecting a buffer layout. Measure reconstruction and relative subtraction under real float32 arithmetic, including large origins and small offsets. Benchmark setup, throughput, allocation and selective bundle cost; coordinate encoding alone must not imply jitter-free rendering. |
| C8: Local-operation qualification and ergonomics | P2 / planned | Extend C1–C3 evidence to packaged ESM/CJS exports, public types, Firefox/WebKit, declared numerical domains and measured performance; consider reusable flat frame transforms if a consumer demonstrates value. | Preserve scalar ownership/failure behavior. Add independent physical-error controls and domain-specific budgets before accuracy/performance claims. Do not infer allocation-free poses or universal precision from the existing kernel guards. |
| C9: Celestial frames and precise time | P3 / optional, consumer-driven | Separate optional celestial-frame/time module: explicit ICRF/body-fixed and TEME/pseudo-fixed profiles, time scales, versioned Earth-orientation/precession data providers and state-vector transformations. | Coordinate with the [sun/sky roadmap](./sun-roadmap.md). Define UTC/TAI/TT/UT1 handling, leap-second policy, data coverage/loading and accuracy tiers. Independently validate position and velocity, including the frame-derivative term. Approximate starfield rotation is not a qualified terrestrial frame conversion. |

## Sequence and ownership

1. C1–C3 landed in PR #277; retain their documented support limits and track
   release status separately.
2. Start C4 using the already delivered geodesic solver; then extend C5 using the
   existing cutters/discontinuous layouts. Keep these as reviewable increments.
3. Develop C6 through GeographicLib G3–G5, then connect rhumb sampling to C4.
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
