# Landed PR review audit — 2026-10-24

Reviewed all **227 merged PRs**, including PRs merged into another feature branch
or release branch, and their **254 inline review threads**. The initial master
snapshot was `31dae67e`. Of **52 unresolved threads**, 30 describe findings
addressed by this change, seven describe issues already fixed on master, and 15
are historical discussion, outdated remarks, or compatibility/design questions.
Duplicate comments are grouped below. A resolved review thread is not proof that
all domains of a feature are qualified.

PR #281 has four review threads, all resolved. Its polar rhumb area and
representable near-pole endpoint fixes are on master. No additional unresolved
finding on #281 requires another implementation here. The still-open
[PR #278](https://github.com/visgl/math.gl/pull/278) (bounded P0 qualification) and
[PR #287](https://github.com/visgl/math.gl/pull/287) (global G6 completeness) are
separate integration work; this change does not copy their implementations.

## Fixes in this change

| Source PR | Findings | Current fix and evidence |
| --- | --- | --- |
| [#277](https://github.com/visgl/math.gl/pull/277) | Radial ray norm overflow, mixed subnormal/huge velocity orientation, tangent-contact roundoff, radian cartographic configuration (five threads, four defects). | Normalize after dividing by the largest component; retain tangent contacts within a bounded discriminant error estimate while rejecting real misses; respect cartographic units and reject failed basis construction. Independent unit-vector, analytic sphere and radian-basis regressions. |
| [#268](https://github.com/visgl/math.gl/pull/268) | Cached pages disposed on `pagehide`, live WebGL contexts after disposal, compact canvas rules applied to all views, inaccurate Canvas-renderer documentation. | Preserve persisted pages; explicitly lose released WebGL contexts; compact sizing applies only to inline embeds with a larger fullscreen view. Real Chromium checks exercise disposal, retained DOM, context loss and computed layout. Documentation specifies WebGL 2. |
| [#257](https://github.com/visgl/math.gl/pull/257) | Extra GeoJSON ordinates were not validated (two duplicate threads). | Check every supplied ordinate, including sparse slots; reject malformed records through both validation and epoch selection. Valid finite additional ordinates remain accepted. |
| [#256](https://github.com/visgl/math.gl/pull/256) | Search test did not exercise notes. | A note-only query must return `iapetus`. |
| [#255](https://github.com/visgl/math.gl/pull/255) | Optional astronomy peer dropped; grouped documentation links, Sun script imports/generator paths and projection audit imports broken (seven threads, five grouped findings). | Restore the existing optional peer contract without adding a new package resolution; retain the ban on all other external runtime dependencies. Fix grouped paths, formatter paths and related sunlight output paths. Check all package exports; generate sky/cloud/star demos offline. |
| [#236](https://github.com/visgl/math.gl/pull/236) | Failed basemap requests remained indistinguishable from loading. | Accessible loading/success/failure status with usable fallback globe. Chromium aborts imagery and checks the failure status and continued interaction. |
| [#234](https://github.com/visgl/math.gl/pull/234) | Documentation invented a historical `getSun` export/rename. | Identify the old documentation filename as a placeholder; preserve the actual `getSunPosition` API. |
| [#140](https://github.com/visgl/math.gl/pull/140) | Release verification included private examples and website workspaces. | Verify publishable `modules/*` workspaces, matching the release inventory. No release is performed. |
| [#124](https://github.com/visgl/math.gl/pull/124) | Bounds tests blessed wrong 3D detection; unsigned bigint export was not constructible. | Inspect coordinate dimensions and test valid 3D bounds. Export/test the native `BigUint64Array` constructor. |
| [#123](https://github.com/visgl/math.gl/pull/123) | Structurally assignable options could override WKB mode/target/offset; skipped null rows bypassed offset validation. | Internally controlled fields win; validate every offset before writing. Tests check the returned bytes, untouched foreign buffers and atomic rejection of decreasing/negative offsets. |
| [#94](https://github.com/visgl/math.gl/pull/94) | Reserved function names accepted; stale asynchronous UI results; seam-crossing preview geometry clipped. | Reject JSEP literals/`this` atomically; revision-check success/error/finalization; render unwrapped world copies at both seam edges. Controlled asynchronous browser regressions and independent seam examples. |
| [#92](https://github.com/visgl/math.gl/pull/92) | Prototype names bypassed expression compilation/cache lookup. | Null-prototype accessor and key caches handle `toString`, `hasOwnProperty`, `constructor` and `__proto__` as ordinary row fields. |

The changes cover **26 findings across 30 threads**, including documentation and
test gaps. They do not add a mandatory runtime dependency, download datasets, or
change numerical/bundle acceptance budgets. `astronomy-engine` was already a
development dependency and an existing runtime integration; its restored optional
peer metadata is also checked explicitly by the package audit. The lockfile change
only records that metadata, with no new external resolution.

## Already addressed on master

| Source PR | Evidence and disposition |
| --- | --- |
| [#228](https://github.com/visgl/math.gl/pull/228) — stalled downloads (two threads) | `snapshot-request.js` bounds both headers and response-body consumption with a request-specific controller. Existing tests exercise stalled headers/body, retries and lifetime cancellation. No second transport implementation is needed. |
| [#228](https://github.com/visgl/math.gl/pull/228) — pose-wait status | `waitForTime` invokes its own status callback initially and on progress. Existing regressions cover independent/cancelled waiters. |
| [#215](https://github.com/visgl/math.gl/pull/215) — initial pose waits for full buffer | `loadModel` awaits only the required pose bracket via `waitForTime`; history continues separately. Existing tests cover pose-first partial streaming. |
| [#120](https://github.com/visgl/math.gl/pull/120) — WKB source alias | Consolidated imports now use `@math.gl/geospatial/wkb`, which has an explicit source alias in `tsconfig.test.json`. The removed standalone package must not be reintroduced. |
| [#109](https://github.com/visgl/math.gl/pull/109) — clamped byte GL type | Both `Uint8ClampedArray` constructor and instance are mapped to `UNSIGNED_BYTE`; the thread already contains the original fix acknowledgement. |
| [#95](https://github.com/visgl/math.gl/pull/95) — local lint helper excluded | The cited `dev-modules/devtools-extensions/biome/lint.mjs` no longer exists. Tooling comes from the external dev-tools package; do not add a nonexistent workspace to the lint scope. |

## Historical discussion, not new correctness work

Fifteen open threads across #11, #12, #14, #26, #27, #54, #72 and #73 are old
review discussion: removed declarations/configuration, formatting/target-parameter
remarks on outdated diffs, an acknowledgement, explanations of type spelling,
private tooling configuration, documentation layout suggestions and old website
version discussion. They are not evidence of a reproducible current bug.
Removing the `NumberArray` compatibility alias remains an explicit major-version
API decision; this audit does not silently break existing consumers. These
threads are not mechanically marked resolved merely to reduce the open count.

## Remaining implementation tranches

The authoritative mathematical scope is the
[GeographicLib roadmap](./geographiclib-roadmap.md), complemented by the
[frames and paths roadmap](./geospatial-roadmap.md).

| Priority | Remaining tranche | Next deliverable |
| --- | --- | --- |
| P0 | G0–G2 bounded qualification — open #278 | Refresh and land the existing P0 work; preserve independent controls and published conditioning/shape/magnitude limits. Broader domains remain qualification work, not a universal finite-input claim. |
| P1 | G6 global intersections — open #287 | Land the already implemented capture-bound completeness increment and its independent/root-set/ranking tests. Master currently contains only the earlier bounded search. |
| P1 | G7 bulk/performance | Output-buffer/reusable/batch APIs only where equal-accuracy paired benchmarks demonstrate value; separate setup, allocations, throughput and bundle costs. |
| P1 | C5 seams/topology | Qualified seam splitting for declared edge models, pole/dateline crossings, holes, winding and degeneracies; preserve attributes and original-edge provenance. |
| P2 | C4/C6 rhumb path integration | Reuse the delivered G5 scalar rhumb solver in the path sampler/adaptive subdivision interfaces; test winding, pole failures, height/provenance and work limits. Do not reimplement G5. |
| P2 | C8 local-operation qualification | Extend scalar/frame/tangent evidence to a declared independent domain matrix, packaged APIs, multiple browser engines and measured performance. These boundary fixes are not exhaustive qualification. |
| P2 | C7 renderer precision/interop | Consumer-driven rebasing/high-low buffers, tested under actual float32 arithmetic with allocation/bundle measurements. |
| P2 | G8 wider-flattening revolution geodesics | Qualified elliptic-integral primitives and Exact direct/inverse/line solver with explicit algorithm selection. |
| P2 | G9 triaxial geometry/geodesics | Independent trajectories, conserved quantities and equal-axis/singularity controls; distinguish direct-line support from a global inverse solver. |
| P2 | G10 coordinate utility gaps | Audit existing projection, UTM/UPS, MGRS and angle APIs; implement demonstrated gaps rather than duplicate existing PROJ/CRS operations. |
| P2 / scope decision | G11 optional Earth models | Decide normal-gravity/gravity/magnetic scope and versioned optional coefficient/data contracts before implementation. Existing geoid APIs do not establish parity for all model families. |

C9 celestial-frame/time work is separately in open
[PR #284](https://github.com/visgl/math.gl/pull/284). G3–G5 scalar metrics,
auxiliary latitudes, geodesic polygons and rhumbs are on master in #281. C1–C3
frames/poses/tangent operations and C4 geodesic/linear path sampling are already
merged; their follow-on qualification/integration work above must not be confused
with missing scalar implementations.
