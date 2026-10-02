# Projection engine roadmap

Status: tranches **0–11, including qualification tranches 7A–7D, are implemented** for the
[documented projection support profile](./typescript-support.md). The package root uses the math.gl projection engine; `Projection` supplies the compatible
wrapper API (`Proj4Projection` is a deprecated alias) and `ProjectionEngine` allows explicit plugins. The old wrapper is
available from `@math.gl/proj4/classic`; prior engine subpaths remain aliases. No package is published by this work.

The upstream corpus has 232 original numeric matches, one independently corrected
Robinson case and nine deliberate input rejections. All 37 named algorithms have
independent references; partial inventory statuses describe the difference from
unrestricted upstream behavior, not a claim of full-domain geodetic accuracy.

## Target and upstream baseline

Build an independent math.gl projection engine inside `@math.gl/proj4`, initially alongside
the existing proj4js wrapper. Keep projection algorithms explicitly pluggable and
ESM imports tree-shakeable throughout implementation.

The initial parity reference is **proj4js 2.22.0**, the latest npm release verified
on September 29, 2026. The module dependency is pinned to that exact version so
tests remain reproducible. [Upstream release](https://github.com/proj4js/proj4js/releases/tag/v2.22.0),
[tagged source](https://github.com/proj4js/proj4js/tree/v2.22.0).

Parity means matching the transformations exposed by math.gl's `Proj4Projection`:
CRS definitions, aliases, forward/inverse coordinate results, dimensional behavior,
axis handling, and registered datum grids. Broader upstream projection modules are
also inventoried, including those omitted from its default bundle. It does not require
replicating proj4js's callable overloads, mutable globals, `Point` class, or MGRS API,
which math.gl does not currently expose. It is not parity with the full native PROJ
database or operation-selection engine.

Intentional differences, including stricter invalid-input errors, must be recorded
and reviewed before claiming compatibility. Unsupported cases must remain observable;
the math.gl projection engine must never silently fall back to proj4js.

## Tranches

| Tranche | Deliverable | Acceptance gate |
| --- | --- | --- |
| 0 — Independent foundation | Experimental entry point, plugin contract, limited PROJ parameters, geographic/Mercator/eqc transforms | Differential forward/inverse tests, explicit unsupported errors, ESM/CommonJS builds, bundle isolation |
| 1 — Compatibility inventory | Versioned fixtures and a machine-readable feature/projection matrix | Every upstream projection, CRS input kind, and transformation feature has a test or a tracked gap |
| 2 — Common map projections | Transverse Mercator/UTM, common conic and azimuthal projections | Per-projection parity across supported domains, hemispheres, offsets, units, and singularities |
| 3 — CRS normalization | PROJ parameter semantics, WKT1/WKT2 and supported PROJJSON normalization, aliases and axes | Equivalent CRS representations produce equivalent normalized definitions and coordinates |
| 4 — Geocentric and datum transforms | 3D geodetic/geocentric conversion, ellipsoid/datum tables, Helmert transforms | Known datum fixtures, height behavior, inverse transforms, and datum chaining agree with the reference |
| 5 — Remaining projections | Remaining world, regional, perspective, and composite projection plugins | No unclassified projection gaps; forward/inverse coverage for all inventoried algorithms and aliases |
| 6 — Grid transforms | NTv2 and upstream-supported GeoTIFF grid loading/interpolation | Grid-edge, missing-grid, optional-grid, inverse, and asynchronous loading fixtures pass |
| 7A–7D — Projection qualification | Numerical fixes, CRS/datum/grid references, cross-browser/startup/allocation measurements, supported projection API | Passing independent/compatibility checks, reviewed exceptions, preserved engine aliases and explicit classic wrapper, documented migration |

### Tranche 0: implemented foundation

- `@math.gl/proj4/experimental` exports `ProjectionEngine`, plugin types,
  `mercator`, and `equidistantCylindrical` without importing proj4js.
- Plugins and aliases are supplied per instance. Geographic coordinates work without
  plugins; no global projection registry is populated as an import side effect.
- Reuses `@math.gl/crs`'s PROJ syntax parser. The execution subset is documented
  separately from syntax support.
- WGS84 geographic coordinates, EPSG:3857, ellipsoidal/spherical Mercator, and spherical
  eqc equations support both directions and projected-to-projected conversion.
- Trailing ordinates are preserved, not transformed. Unknown parameters and unsupported
  datum operations are rejected. Named datums are limited to WGS84 and `none`.
- Initial comparisons cover a longitude/latitude grid, scale, offsets, linear units,
  custom geometry, inverse transforms, aliases, and error cases.
- A package check verifies ESM and CommonJS consumption, absence of proj4js in browser
  bundles, and removal of unused projection plugins.

This tranche is a usable subset, not a claim of complete parity for any CRS syntax.
See [ProjectionEngine](./api-reference/typescript-projection.md) for the exact contract.
Tranche 3 adds upstream's `identity` alias with explicit radian semantics.

### Tranche 1: make parity measurable

Implemented artifacts:

- `modules/proj4/test/fixtures/parity-inventory.json`: all 38 upstream projection/helper
  modules and 31 CRS/API/transform features, with aliases, default-bundle membership,
  source hashes, fixture IDs, tests, gaps, and intentional differences.
- `upstream-2.22.0.ts`: 24 tagged upstream coordinate fixtures with source lines and
  source-file hash. The retained NAD83 and Plessis cases now execute successfully.
- `common-projections.ts`: authored differential cases covering spheres, ellipsoids,
  both hemispheres, origins, scales, offsets, and units.
- Independent published PROJ UTM examples provide a second numerical reference. A
  larger reproducibly generated native PROJ corpus is now included in tranche 7A.
- `check-parity-inventory.mjs` fails on reference-version drift, unclassified upstream
  modules, changed source hashes, missing tests, or invalid fixture/gap references.


Create a checked-in inventory from the tagged upstream `lib/projections`, projection
registry, included-projection list, CRS parsers, datum code, and tests. Distinguish
algorithms, aliases, helpers, default-bundle availability, and custom-build modules.
Track status as unsupported, partial, or verified, with fixture IDs and outstanding gaps.

Import relevant upstream fixtures with their MIT attribution and a source tag or commit.
Keep separately generated native PROJ/EPSG reference fixtures where available: agreeing
with proj4js alone is not proof of geodetic accuracy. No live network access should be
required to run the test suite.

Use explicit per-fixture tolerances in degrees and meters, adjusted for output units.
Keep forward comparisons, inverse comparisons, and round trips as separate checks.
Record expected failures at poles, antipodes, projection horizons, zone boundaries,
and the antimeridian. Include 2D/3D/4D behavior and non-finite inputs.

Account for recent upstream fixes: 2.22.0 adds geographic aliases and fixes orthographic
false easting and z preservation with enforced axes in oblique Mercator/Robinson.
The preceding 2.21.0 release includes longitude wrapping and several projection fixes;
these belong in the eventual regression corpus as well.

### Tranche 2: common projections

Implemented: `tmerc`, `etmerc`, `utm`, `lcc`, `aea`, `eqdc`, `laea`, `stere`,
`sterea`, and `aeqd`, with explicit typed kernel state and numerical helper inputs.
All 120 WGS84 UTM aliases and both UPS aliases resolve without loading their plugins
implicitly. `tmerc` uses the extended algorithm by default; `+approx` selects the
upstream fast algorithm and permits spherical TM/UTM.

Acceptance coverage includes forward/inverse differential comparisons, round trips,
3D/4D passthrough, parameter rejection, antimeridian/zone/pole boundaries, inverse
nonconvergence, and singular antipodes. UTM and conic package checks verify that
unrelated projection families are removed from browser bundles.

Intentional fixes are tracked and regression-tested: false northing in equatorial
ellipsoidal stereographic, the latitude sign in spherical approximate TM with a
nonzero latitude origin, initialized defaults, and explicit singularity errors.
Projection-name/WKT aliases and CRS normalization are implemented in tranche 3 below.


Implement `tmerc`, `etmerc`, and `utm` first, including southern hemispheres and all
WGS84 UTM aliases. Follow with `lcc`, `aea`, `eqdc`, `laea`, `stere`, `sterea`, and
`aeqd`, including UPS aliases. Port shared numerical helpers with explicit typed
inputs instead of projection objects whose fields are implicitly initialized.

For each family, test sphere/ellipsoid variants, applicable standard parallels,
central meridians, scale/offset parameters, inverse convergence, and documented domains.
Tranche 4 extends these projection kernels with datum transformations. Preserve
upstream copyright/license notices whenever code or test data is adapted.

### Tranche 3: separate CRS normalization from execution

Implemented: immutable native CRS normalization, opt-in WKT/PROJJSON adapters using
`@math.gl/crs`, shared readonly definitions and SpatialReference inputs, explicit
storage-order handling, backend-specific capability checks, and compound/vertical
extraction policy. The shared PROJ parser now preserves DMS notation. Readers are
excluded from minimal bundles. Structured method/axis variants beyond the documented
subset remain explicit gaps rather than a claim of full standards coverage.


Normalize PROJ strings, WKT1/WKT2 (including ESRI spellings), and upstream-supported
PROJJSON into a typed internal CRS model. Keep parsing and metadata types in
`@math.gl/crs`; executable interpretation belongs in `@math.gl/proj4`.

Cover projection-name aliases, parameter defaults and precedence, angular formats,
unit tables, prime meridians, longitude wrapping, axes, and built-in CRS aliases.
Do not claim `BoundCRS` transformation support until its datum operation is implemented.
Compound/vertical CRS behavior must stay explicit and consistent with the existing
math.gl compatibility boundary, including opt-in horizontal extraction.

Add an engine-specific capability check that distinguishes unknown syntax, missing
plugins, and missing transform stages. Keep the existing proj4js compatibility helper
accurately scoped to its own backend.

### Tranche 4: datum and 3D pipeline

Implemented: the `geocentric` plugin, pinned upstream ellipsoid/datum/unit/prime-meridian
tables, three/seven-parameter Helmert transforms, WGS84 datum chaining, WKT TOWGS84 and
BoundCRS operations. Tests cover heights, poles, geocentric units, both directions,
axis permutations, Web Mercator datum geometry, and grid rejection. math.gl height
semantics deliberately expose computed heights; fourth ordinates remain unchanged.
Dynamic operations remain unsupported; tranche 6 adds horizontal grids. Tranche 7B adds independent geodetic datum-chain references.


Add geodetic/geocentric conversions (`geocent`), ellipsoid definitions, datum identity,
three- and seven-parameter Helmert transforms, and upstream datum chaining semantics.
Extend the initial 2D plugin/pipeline contract deliberately where z is part of an
operation; passing z through is not equivalent to implementing a 3D transformation.

Separate projection geometry from datum geometry, including pseudo-Mercator's sphere.
Test zero-height defaults, nonzero heights, poles, inverse transforms, source-to-target
datum chains, and axis permutations involving z. Reject missing required grids until
tranche 6 rather than approximating a grid transformation silently.

### Tranche 5: complete the projection inventory

Implemented: 22 additional numerical plugins and the explicit-dependency
`obliqueTransformation(wrappedPlugin)` factory cover the remaining algorithms.
All 38 upstream projection/helper entries are now implemented or classified:
`gauss` remains an internal helper for oblique stereographic. Coverage includes
sphere/ellipsoid variants, both directions, offsets, units, aliases, all six QSC
faces, rotated geographic/projected coordinates, and recent upstream regressions.
WKT/PROJJSON world and regional method mappings reuse the existing math.gl/crs readers.
All families remain marked partial relative to exhaustive parameter/domain coverage;
tranche 7 qualifies the supported profile with independent references.

Implemented groups:

- World maps: `cea`, `mill`, `sinu`, `eck6`, `moll`, `robin`, `eqearth`, `vandg`, `bonne`.
- Regional systems: `cass`, `poly`, `somerc`, `omerc`, `krovak`, `nzmg`, `gstmerc`.
- Perspective and specialized maps: `gnom`, `ortho`, `tpers`, `geos`, `qsc`.
- Composite/rotated operations: `ob_tran`, with explicit dependencies on its wrapped plugin.
- Audit remaining modules such as `equi` and `gauss` for exposed algorithms versus
  internal helpers; close every inventory entry rather than relying on this shortlist.

Bundle checks cover individual world projections, shared Eckert VI/Sinusoidal
helpers, and a rotated Mollweide plugin. Importing the minimal engine excludes
unused projections and optional CRS readers; no global catalogue is registered.

Intentional numerical corrections are recorded in the inventory: consistent false
offsets, southern Bonne inversion, equi's missing inverse return, zero-radius origins,
Mollweide pole handling, Van der Grinten's equator, and explicit visibility errors.
Direct numerical ports name proj4js 2.22.0 in their source headers. Original adapters
are identified separately. Equal Earth's Apache-2.0 notice and full license are
retained alongside the upstream MIT license and third-party notices.

### Tranche 6: grids

Implemented: `parseNTv2Grid` for both byte orders and standard/compact records,
and an async `loadGeoTIFFGrid` adapter for the pinned upstream two-band horizontal
offset convention. Prepared grids are supplied through each instance's
`datumGrids` map. There is no global registry, network loading, implicit
GeoTIFF dependency or asynchronous work during coordinate transformation.

The datum pipeline supports ordered required/optional/null grids, source and inverse
destination shifts, grid-to-grid transforms, and composition with Helmert/geocentric
operations. NTv2 preserves subgrid file order; GeoTIFF images run last-to-first.
Grid data is owned after preparation and registrations are captured at construction.
ESM bundle checks exclude unused readers and interpolation from minimal engines.

Tests cover nested subgrids, nodata fallback, cell/boundary edges, shifted inverse
extents, two-axis inverse convergence, malformed data, both byte orders, error-field
record layouts, axis/prime-meridian composition, loading failure and data ownership.
Synthetic fields supply analytic expected coordinates and upstream differential
interior checks. Intentional corrections include inclusive outer edges, stricter
inverse convergence, nodata handling and destination-grid execution even when
effective ellipsoids match.

The inventory keeps grid features partial despite the tranche 7 real-grid baseline;
additional datasets, formats and operation semantics still need qualification. Vertical
grids, generalized GeoTIFF metadata/band conventions and structured grid operation
selection remain outside this horizontal subset.

### Tranches 7A–7D: completed qualification profile

| Tranche | Implemented result |
| --- | --- |
| 7A — Numerical accuracy | Correct Cassini series signs and refine its inverse; align Robinson's coefficient precision and stabilize exact knots. Independent reference coverage expands to 134 configurations / 2,386 points, including dense regional, near-pole, horizon and longitude-boundary probes. |
| 7B — CRS and datums | Fifteen EPSG systems in WKT1/WKT2/ESRI/PROJJSON; twelve independent 3D datum chains; real BETA2007 NTv2 plus maintained GeoTIFFs. Correct whole-chain datum=none suppression and ESRI polar/Krovak interpretation. |
| 7C — Performance | Node throughput/allocation and fresh-process measurements; isolated browser load/construction timing and Float32/Float64 forward/inverse workloads. Chromium, Firefox and WebKit qualification runs in CI, including the independent projection corpus. Timing results are artifacts; correctness and package-size budgets are gates. |
| 7D — Stabilization | Supported native entry points alias the same implementation as experimental imports. Packed ESM/CommonJS/type checks cover both families. The documented contract reviews numerical/strict-input exceptions and describes migration with the original wrapper available at `classic`. |

See [independent validation](./independent-validation.md), [performance measurements](./benchmarks.md)
and the [support/migration contract](./typescript-support.md). The machine-readable release
profile checks fixture counts and the reviewed exception list. Publication is a
separate release action; the default now uses the math.gl projection engine, while removing the installed proj4 dependency
remains a separate compatibility decision.

## Tranche 8: shared performance measurements — implemented

Node, browser qualification and the live documentation share sixteen seeded scenarios,
regional/clustered distributions, Float32/Float64, XY/XYZ/XYZM and both directions. Cases
include projected-to-projected transforms, unit conversions, axes and a synthetic NTv2
field. The live page supports million-coordinate buffers and downloadable raw results.
Adaptive independent-buffer samples, rotated execution order, median/p10/p90 statistics
and explicit timing-limit/variation flags make comparisons more inspectable. Correctness
is checked before timing. Browser CI covers Chromium, Firefox and WebKit; all-coordinate
and independent-reference checks remain gates rather than timing thresholds.

## Tranche 9: compiled pipeline overhead — implemented

Construct the plugin registry once, capture CRS kind/unit/prime-meridian choices outside
the coordinate loop, skip identity scale operations, and precompute Helmert coefficients.
Preserve arithmetic order, finite/domain checks, axes, Z/M behavior, custom-plugin fallbacks
and partial batch commits. Existing numerical, ownership and package-size checks apply.

A paired source comparison runner validates and measures baseline/current runtimes on the
same seeded workload without changing checkouts. CI records elapsed results against the
PR base; a separately labeled thread-CPU diagnostic is available locally. Constructor
improvement is clear in the local diagnostic, while transform gains vary by case; see
[methodology and observations](./benchmarks.md#compare-a-runtime-change-with-its-base).

## Tranche 10: projection-specific batch kernels — implemented

Optional whole-buffer plugin factories compile eligible geographic/projected pipelines.
Mercator, transverse Mercator/UTM and the LCC, Albers and equidistant conic families reuse
their scalar equations while fusing units and validation into a single traversal. Complex
chains and existing custom plugins retain the general pipeline. Exact scalar/batch tests
cover both precisions, both directions, strides 2/3/4/6, preserved Z/M, decorated plugins,
invalid records and overflow; the independent PROJ corpus also exercises the batch path.
The shared benchmark adds equidistant conic and CI compares these families with the PR base.

Reusable scalar output buffers were considered but are deferred: this tranche changes no
scalar API or ownership contract. The demonstrated opportunity is avoiding repeated pipeline
dispatch and Z/M writes in existing typed-array calls. Results and limits are documented in
the [benchmark guide](./benchmarks.md).

## Tranche 11: numerical excellence — implemented

An additional 4,005 independent PROJ samples cover 15 explicitly bounded configurations
with seeded interior and boundary-biased probes. Published scalar/Float64 error reports
include forward, independent inverse and roundtrip maxima and their worst coordinates.
Equidistant conic now uses a higher-order meridional series; cylindrical equal-area
preserves near-pole latitudes instead of snapping them to the pole. Node and all three
browser engines enforce the budgets alongside the existing 37-algorithm corpus.

The [accuracy domains and error report](./independent-validation.md#seeded-accuracy-domains)
document conditioning limits and remaining series approximations. Broader parameter
coverage and singularity analysis remain ongoing numerical work, not unrestricted
PROJ parity.

## Tranche 12A: explicit vertical grids — implemented

Per-instance `verticalGrids` and `+geoidgrids` convert height before/after horizontal
datum transformations. Optional GTX and regular-grid readers snapshot their data;
a structural adapter accepts a prepared `@math.gl/geoid` model. Scalar and in-place
Float32/Float64 XYZM paths preserve M and enforce coverage, height and nodata checks.
Ten authored configurations (28 XYZM points) are checked against pinned PROJ 9.5.1
pipelines, including source/destination grids, Helmert ordering, feet, axes and prime
meridians. Browser qualification exercises the same independent references.

Vertical GeoTIFF and typed pipeline composition have since landed in 12B1 and
12B2 below. Compound/vertical CRS execution, broader pipeline operators, epochs
and automatic operation selection remain open.
See the [height conversion guide](./typescript-engine.md#convert-geoid-heights).

## Tranche 12B1: vertical GeoTIFF — implemented

The optional `loadVerticalGeoTIFFGrid` adapter decodes no files itself and adds no TIFF
dependency to the runtime. It validates geoid metadata and geographic geometry, handles
point/area raster registration and scale/offset/nodata, and prepares owned bilinear
snapshots for the existing height stage. Ordered nested/disjoint images have explicit
coverage rules. Seven authored TIFFs / 30 XYZM points are independently qualified with
PROJ 9.5.1; Node and browser tests decode the actual bytes. This completes the vertical
GeoTIFF format portion of 12B; typed pipeline composition is implemented in 12B2 below.

The reader accepts plain `VerticalGridGeoTIFFData` as well as geotiff.js-style input.
This contract preserves unresampled typed bands, per-image/per-band GDAL metadata,
GeoKeys, nodata and original geometry tags. It supports direct integration with the
new loaders.gl `GeoTIFFRasterLoader`; the existing RGB loader remains unsuitable for
geoid samples. Fetching/decoding stays application-owned, with no runtime coupling
between math.gl and loaders.gl.

## Tranche 12B2: typed operation pipelines — implemented

The optional `ProjectionPipeline` composes typed unit conversions, signed axis changes,
registered projection equations, geocentric conversions, static Helmert shifts and
prepared horizontal/vertical grids. It checks adjacent coordinate spaces and units,
reverses order/direction for inverse execution, supports XY/XYZ/XYZM typed buffers,
and shares lazy projection implementations without eager imports. Scalar and Float64
results are independently qualified against PROJ 9.5.1; Float32 execution rounds only
final records. Packed ESM/CJS/types, optional bundle boundaries and browser qualification
run in CI. See [the operation pipeline contract](./operation-pipelines.md).

This completes the typed composition profile, not arbitrary PROJ pipeline parsing.
Exact rotations, `ob_tran` output-unit contracts, push/pop, omitted directions and
additional operators remain explicit gaps tracked in 12B3. Dynamic operations are
split into 12C1–12C2, with an epoch separate from M; operation selection is 12E.

## Remaining performance and geodetic roadmap

Updated October 2, 2026 after the vertical GeoTIFF, typed pipeline and projection API
naming changes landed. The public APIs are `Projection`, `ProjectionEngine`,
`LazyProjection` and `ProjectionPipeline`; the configurable alpha API no longer
exports `TypeScriptProjection`.

These are module-specific milestones within the [six library-wide SOTA tranches](../../sota-roadmap.md).
Keep the library tranche numbers 1–6 and the projection milestone numbers 8–14 distinct:

| Library-wide priority | Projection milestones |
| --- | --- |
| 1 — Consolidation and baselines | Implemented 8–12B2 foundations; ongoing qualification in 14. |
| 2 — Numerical robustness | Implemented 11; remaining pipeline accuracy in 12B3 and broader domains in 14. |
| 3 — WebGPU projection conventions | Core graphics matrix, projection/unprojection and culling APIs. This is separate from projection GPU acceleration in 13D. |
| 4 — Allocation-efficient bulk operations | Implemented 10; remaining general pipeline, grid/datum and XYZM performance in 13A. |
| 5 — Global geospatial correctness | 12B3, 12C1–12C2, 12D, bounded optional operation selection in 12E, and 14. |
| 6 — Measured acceleration | Profile in 13A; evaluate optional Wasm/SIMD, workers and GPU paths in 13B–13D. |

The broader plan excludes BLAS, tensor frameworks and general GIS engines. This module
keeps algorithms, readers, grid data and any future operation catalogue optional.
Independent accuracy, measured speed and supported geodetic operations have separate
acceptance criteria; a faster benchmark does not establish accuracy or complete PROJ parity.

### Completed projection milestones

| Tranche | Landed result |
| --- | --- |
| 8 — Shared performance measurements | Seeded scalar/flat workloads, live browser benchmarks, distributions and timing diagnostics. |
| 9 — Compiled transformation overhead | Reused registries, prepared constants and reduced per-coordinate dispatch. |
| 10 — Projection-specific batch kernels | Whole-buffer operations for eligible Mercator, TM/UTM and conic transformations. |
| 11 — Numerical excellence | Additional independently checked accuracy domains and refined numerical kernels. |
| 12A — Explicit vertical grids | Prepared geoid grids, GTX and the `@math.gl/geoid` adapter. |
| 12B1 — Vertical GeoTIFF | Optional numeric-grid adapter, independent fixtures and loaders.gl integration. |
| 12B2 — Typed operation pipelines | Explicit units, axes, equations, geocentric/static Helmert and horizontal/vertical grid steps. |

### Remaining tranches

All rows below are planned. Existing implementations and their documented limits
remain the baseline; no acceleration backend or dynamic operation is implied to exist.
The former broad 12C is split below, with CRS-driven operation selection tracked in 12E.

| Tranche | Deliverable | Acceptance gate |
| --- | --- | --- |
| 12B3 — Pipeline completeness | Opt-in exact Helmert rotations and inverse, explicit `ob_tran` output spaces/units, push/pop and direction-specific steps. Define the supported subset before adding any PROJ pipeline-string reader. | Independent forward/inverse references for each added operator, state/unit validation and preserved XYZM/partial-error behavior; optional features stay out of core bundles. |
| 12C1 — Observation epochs and kinematic Helmert | Explicit decimal-year epochs and translation/rotation/scale rates with a reference epoch. Support one epoch for a batch and a separately supplied per-point epoch buffer; preserve M. | Independent multi-epoch references for both rotation conventions, inverse transformations, missing/invalid epoch errors and unchanged static-operation results. |
| 12C2 — Deformation models | Optional prepared velocity/deformation grids and explicit source/target epoch propagation; application-owned model loading. | Licensed, pinned real-model fixtures, units/time/coverage/nodata checks and independently checked forward/inverse results; unused models add no core bundle cost. |
| 12D — Structured compound and vertical CRS execution | Interpret supported horizontal + vertical CRS combinations through `@math.gl/crs`, with explicit height units, axes, datums and supplied operations/models. Extend derived CRS support only where its operation is executable. | Equivalent WKT/PROJJSON/readonly CRS inputs produce the same qualified transformation; unsupported or missing operations fail explicitly and metadata remains unchanged. |
| 12E — CRS-driven operation selection | Select from a bounded, optional operation catalogue with area-of-interest, accuracy, epoch and grid-availability filters; expose the chosen operation and alternatives. A full CRS/operation database is outside scope. | Pinned catalogue provenance, deterministic selection against reviewed PROJ cases, explicit missing-resource/ambiguity behavior and no implicit grid downloads or runtime dependency in core. |
| 13A — Further JavaScript batch performance | Profile the general transformation and typed pipeline paths; extend useful whole-buffer specializations and reduce grid/datum/XYZM overhead. Evaluate reusable scalar output buffers separately. | Paired warmed measurements against the PR base and direct proj4js, representative projected-to-projected/grid/XYZM cases, unchanged accuracy and ownership/error contracts, allocation and bundle-size reports. |
| 13B — Optional Wasm/SIMD | Prototype selected kernels behind the projection plugin contract with explicit preparation and a JavaScript fallback. | End-to-end crossover measurements include startup, compilation, copying and memory cost; Node/browser numerical qualification and optional chunk-size budgets. Ship only a demonstrated improvement. |
| 13C — Worker execution | Optional asynchronous large-buffer projection with explicit transfer/ownership, cancellation and bounded scheduling. | Compare single-thread and worker latency/throughput including startup and transfers, verify scalar/flat equivalence and error propagation, and document when workers help. |
| 13D — Visualization GPU paths | Explore an optional rendering-oriented path with explicit precision/domain limits and buffer integration. | Measure upload, dispatch and readback where applicable; publish device/precision error envelopes and keep unsupported geodetic operations explicit. This is a separate visualization profile. |
| 14 — Broader numerical and performance qualification | Expand parameter/singularity coverage, real grids and dynamic-operation references; maintain comparable browser/device benchmarks as the preceding tranches land. | Reproducible error reports with worst coordinates, versioned/licensed fixtures and raw performance data; document corrections, exceptions and tested domains instead of a universal accuracy or speed claim. |

### Suggested order

Start with 12B3 to finish the explicit operation API and 13A to identify the next
measured throughput gains. Then add 12C1 before 12C2. Structured CRS execution in
12D and a reviewed catalogue provide the prerequisites for 12E. Keep qualification
work from 14 alongside every tranche. Evaluate 13B and 13C after profiling establishes
which workloads could benefit; 13D remains an optional visualization investigation.

Dynamic-operation scope follows PROJ's [kinematic Helmert contract](https://proj.org/en/stable/operations/transformations/helmert.html)
and [deformation operations](https://proj.org/en/stable/operations/transformations/deformation.html).
Operation selection is a separate concern described by PROJ's
[CRS-to-CRS operation computation](https://proj.org/en/stable/operations/operations_computation.html).
These sources guide future contracts; the existing pinned numerical fixtures remain
unchanged by this roadmap update.

Further optimization and operation support require separate measurements and accuracy
qualification. Completing these tranches would expand the supported profile; it would
not establish unrestricted PROJ parity or a universal state-of-the-art performance claim.

## Axis compatibility and lazy entry points: implemented follow-up

The five outstanding corpus axis cases now pass: legacy named UNKNOWN axes,
polar direction spellings, and cardinal WKT2/PROJJSON meridians relative to the
central meridian. Scalar and typed-array tests exercise default/enforced order,
signs, units, both hemispheres, and explicit stored order. All nine remaining corpus
rejections are deliberate strict-input policies; see the [audit](./parity-audit.md#strict-input-policy).
Oblique axis rotations, non-polar meridian operations and broader structured variants
remain outside the supported subset.

Public core, projection, parser and grid subpaths preserve the existing experimental
barrel. Corresponding CRS syntax subpaths prevent optional WKT syntax from being
hoisted through a shared dependency. CI inspects the initial static dependency graph
with an eagerly loaded core/Mercator, executes the deferred UTM, WKT and composite
chunks, enforces byte budgets, and checks every subpath in packed ESM/CommonJS and
TypeScript consumers. See the [engine guide](./typescript-engine.md#load-less-used-projections-on-demand).

The independent-reference follow-up below adds maintained datasets and an explicit
edge disposition. The completed qualification profile is described above; additional operations and
unsampled domains remain future extensions rather than an unrestricted parity claim.

## Independent projection and real-grid qualification: implemented baseline

- Native PROJ 9.5.1 / pyproj 3.7.2 references for every named algorithm: 118
  configurations and 1,612 points, including separate inverse and Float64 comparisons.
- Pinned, licensed German/Canadian horizontal GeoTIFFs: 80 independent reference
  points across 15 images, plus boundary and explicit fallback tests.
- Offline Node/Chromium CI and integrity checks; reproducible generation with no
  PROJ or Python runtime dependency.
- AEQD relative-origin correction, explicit legacy-definition translations, measured
  Cassini/Robinson limits and a disposition for the Canadian inverse edge failures.

See [independent validation](./independent-validation.md). This completes the initial
maintained independent-reference and real-GeoTIFF baseline. Tranches 7A–7D above extend this initial baseline and make the supported-profile
promotion decision explicit.

## Maintaining the reference version

At the start of each tranche, check npm's `latest` tag and upstream release notes.
Upgrade the exact dependency pin in a dedicated, reviewable change, rerun the wrapper
suite and differential corpus, and update the inventory for new algorithms, defaults,
aliases, or bug fixes. Record the tested version with fixture provenance. Do not use
an unpinned `latest` dependency or equate passing an older subset with current parity.

## Validation commands

```sh
yarn exec vitest run --project node modules/proj4/test
yarn exec tsc --noEmit --project modules/proj4/tsconfig.json
yarn exec ocular-build proj4
node modules/proj4/scripts/check-experimental-package.mjs
node modules/proj4/scripts/check-parity-inventory.mjs
node modules/proj4/scripts/check-packed-package.mjs
node modules/proj4/scripts/check-bundle-budget.mjs
node modules/proj4/scripts/benchmark.mjs --allocations --output /tmp/proj4-benchmark.json
```
