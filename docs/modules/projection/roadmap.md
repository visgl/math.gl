# Projection engine roadmap

Status: tranches **0–11, including qualification tranches 7A–7D, are implemented** for the
[documented projection support profile](./support.md). The package root uses the math.gl projection engine; `Projection` supplies the compatible
wrapper API and `ProjectionEngine` allows explicit plugins. The package is renamed
from `@math.gl/proj4`; its deprecated wrapper alias and `/classic` subpath are removed.
Prior engine subpaths remain aliases. No package is published by this work.

The upstream corpus has 232 original numeric matches, one independently corrected
Robinson case and nine deliberate input rejections. All 37 named algorithms have
independent references; partial inventory statuses describe the difference from
unrestricted upstream behavior, not a claim of full-domain geodetic accuracy.

## Target and upstream baseline

Build an independent math.gl projection engine inside `@math.gl/projection`, initially alongside
the existing proj4js wrapper. Keep projection algorithms explicitly pluggable and
ESM imports tree-shakeable throughout implementation.

The initial parity reference is **proj4js 2.22.0**, the latest npm release verified
on September 29, 2026. The development dependency is pinned to that exact version so
tests remain reproducible. [Upstream release](https://github.com/proj4js/proj4js/releases/tag/v2.22.0),
[tagged source](https://github.com/proj4js/proj4js/tree/v2.22.0).

The original parity target was the transformations exposed by math.gl's former `Proj4Projection`:
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

- `@math.gl/projection/experimental` exports `ProjectionEngine`, plugin types,
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
See [ProjectionEngine](./api-reference/projection-engine.md) for the exact contract.
Tranche 3 adds upstream's `identity` alias with explicit radian semantics.

### Tranche 1: make parity measurable

Implemented artifacts:

- `modules/projection/test/fixtures/parity-inventory.json`: all 38 upstream projection/helper
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
`@math.gl/crs`; executable interpretation belongs in `@math.gl/projection`.

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
| 7D — Stabilization | Supported native entry points alias the same implementation as experimental imports. Packed ESM/CommonJS/type checks cover both families. The documented contract reviews numerical/strict-input exceptions and described migration through the original `classic` wrapper, since removed during the package rename. |

See [independent validation](./independent-validation.md), [performance measurements](./benchmarks.md)
and the [support/migration contract](./support.md). The machine-readable release
profile checks fixture counts and the reviewed exception list. Publication is a
separate release action. The default uses the math.gl projection engine; proj4js is now a development dependency. The `/classic` wrapper and its helpers were removed during the alpha package rename.

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

This does not complete tranche 12: compound/vertical CRS execution,
general pipeline composition, epochs and automatic operation selection remain open.
See the [height conversion guide](./projection-engine.md#convert-geoid-heights).

## Tranche 12B1: vertical GeoTIFF — implemented

The optional `loadVerticalGeoTIFFGrid` adapter decodes no files itself and adds no TIFF
dependency to the runtime. It validates geoid metadata and geographic geometry, handles
point/area raster registration and scale/offset/nodata, and prepares owned bilinear
snapshots for the existing height stage. Ordered nested/disjoint images have explicit
coverage rules. Seven authored TIFFs / 30 XYZM points are independently qualified with
PROJ 9.5.1; Node and browser tests decode the actual bytes. This completes the vertical
GeoTIFF format portion of 12B; typed pipeline composition remains 12B2.

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
The follow-up below adds exact rotations, explicit `ob_tran` output units, ordinate
stacks and direction-specific steps. Other operators and arbitrary string parsing
remain outside the typed profile. Kinematic Helmert epochs/rates follow in 12C1 below;
deformation models and operation selection remain separate work, with epochs separate
from M.

## Tranche 12B3: pipeline completeness — implemented

Opt-in exact static Helmert rotations and mathematical inverses preserve the default
small-angle model. Explicit `ob_tran` contracts cover rotated geographic radians/degrees
and projected metres. Balanced, nested X/Y/Z stacks and `omitForward`/`omitInverse`
steps support height-only adjustments in a separate interpolation frame. Both paths
are validated for units, spaces and stack state; each batch owns reusable stack storage.
Thirty-seven authored pipelines / 102 XYZM points now have independent PROJ 9.5.1
forward/inverse expectations, including real BETA2007 interpolation and an authored
GTX field. Scalar, Float64 and Float32 ownership/rounding checks run with Node and
browser qualification. See [the pipeline guide](./operation-pipelines.md).

This completes the declared typed-operator extension. M remains an uninterpreted
measure. The following tranche adds explicit observation epochs; general PROJ
pipeline-string parsing and further operators remain separate work. A pipeline that
omits or discards information need not roundtrip.

## Tranche 12C1: observation epochs and kinematic Helmert — implemented

`ProjectionPipeline` accepts explicit decimal-year observation epochs on scalar and
flat methods. A flat call can use one epoch for a batch or a separate Float64/Float32
epoch buffer with one value per record; M and later ordinates stay untouched.
Helmert steps snapshot translation/rotation/scale rates and a required reference epoch,
cache repeated-epoch coefficients and update mixed epochs without per-record objects.
Both rotation conventions and small-angle/exact modes are qualified against 12
independent PROJ 9.5.1 pipelines / 48 coordinate/epoch pairs. Unit/space validation,
reverse execution, lazy loading and ownership/partial-error contracts are preserved.
The core and ordinary wrapper bundles remain unchanged.

This is explicit reference-frame transformation at an observation epoch. It neither
propagates coordinates between epochs nor infers time from M or CRS metadata.
Prepared linear velocity models are available in the bounded 12C2 profile below.
Time-varying components and automatic operation selection remain future work. See [coordinate epochs](./operation-pipelines.md#coordinate-epochs-and-moving-reference-frames).

## Tranche 12C2: linear velocity models — implemented bounded profile

Optional prepared ENU velocity grids and GeoTIFF raster adapters support explicit
source/target epoch propagation in geocentric pipelines. A source can be fixed or
supplied through the separate batch/per-record epoch argument; M remains untouched.
Application-reviewed validity ranges, whole-vector coverage/nodata, a bounded mathematical
inverse and failure/ownership contracts are explicit. Original authored TIFF data
and pinned native PROJ forward evaluations independently qualify 16 configurations /
64 coordinate-epoch pairs in Node and browsers. No third-party model files or new
third-party code/dependencies are added. Models and readers remain outside core,
ordinary wrappers and a pipeline-only static graph.

This completes the linear, time-invariant profile. Real-model accuracy qualification
and nonlinear/time-varying components are still separate work. See
[deformation models](./deformation-models.md).

## Tranche 13A: pipeline batch performance — implemented first pass

Kinematic Helmert coefficients and their cached epoch use owned Float64 storage
to reduce mixed-epoch allocation. Fixed unit factors and signed axis selections are
prepared once. Arithmetic and operation order, intermediate
finiteness checks, final Float32 rounding, per-record commits and M preservation
remain unchanged. All chains retain the general runner; no dynamic code generation
or additional per-record storage is used.

A paired benchmark covers 15 scenarios: units/axes, projected-to-projected operations,
static/exact Helmert, horizontal/vertical grids, stacks and batch/mixed epochs in
Float32/Float64 XYZ/XYZM layouts and both directions. Historical and current engines
are first checked against pinned PROJ anchors, then every generated output is compared.
Equivalent CRS pairs also compare directly with proj4js. CI publishes timings and
separate allocation estimates without noisy speed gates. The independent static
pipeline corpus expands to 39 configurations / 108 XYZM points.

This completes the measured coefficient/constant pass, not every JavaScript optimization in 13A.
A follow-up packs horizontal grid nodes and removes per-coordinate objects/callbacks
from AEQD, Robinson, Oblique Mercator, QSC and tilted perspective. Source-wide allocation
auditing guards the numerical paths, and guarded scalar scratch/stack storage avoids
repeated allocations while preserving recursive-hook isolation. Paired grid preparation
benchmarks separate loading
and retained memory from point throughput. The next pass adds caller-owned scalar outputs:
`projectTo` / `unprojectTo` and explicit synchronous variants reuse number arrays or floating
point typed arrays, including in-place identity, pipeline epochs and lazy loading. Independent
projection/pipeline references qualify both directions. Paired timing and separate allocation
sampling show lower allocation traffic without a consistent throughput improvement, at about
0.46–0.71 KiB gzip depending on the retained entry point. Datum-heavy and mixed-epoch chains,
remaining implicit allocation/boxing costs and further whole-buffer specializations remain
profiling targets. See
[paired pipeline benchmarks](./benchmarks.md#compare-operation-pipeline-performance).

### Whole-buffer unit/axis execution and bulk leases

Pipelines containing only unit/axis steps and at least one unit conversion compile a
numeric buffer runner per eligible direction, including inverse/omitted steps. Pure
axis programs retain general dispatch because measured gains were inconsistent. Multiplication and division remain distinct, operations retain
order and finite checks, and Float32 rounds only on a completed record. Other stages
retain general dispatch. Scalar and general bulk calls now share guarded point/stack
storage; recursive calls remain isolated and failures release the lease. Repeated ordinary
bulk calls no longer allocate a point and pipeline stack on each invocation.

Qualification covers all 48 signed XYZ permutations, exact scalar rounding, XY/XYZM
views/tails, epochs and failure commits, plus independent existing PROJ references.
The paired pipeline matrix expands to 17 scenarios / 136 rows with inverse-only axes
and angular units. Untimed allocation iterations can be increased for short batches.
The optional pipeline import adds about 0.49 KiB gzip; deferred projection chunks remain
unchanged. A paired diagnostic observes about 1.8× for angular-unit batches, while other
chains have no consistent throughput gain. Short-call stack/datum allocation estimates
fall from about 109 to 77 B/point; timing-limited short-call rows support allocation
comparisons rather than throughput claims. Raw reports retain the measured scope. Grid/datum and mixed-epoch allocation/boxing remain profiling targets.

## Tranche 12E — Reviewed operation selection: implemented bounded profile

`OperationCatalog` is available only through the optional `/operations` entry point.
Applications provide directed operations with conservative geographic bounds, explicit
epoch limits, declared metre accuracy, pinned provenance and required grid revisions.
Selection requires full area/epoch coverage, matches available assets exactly, excludes
unknown-accuracy and ballpark candidates by default, and ranks eligible candidates
deterministically. `inspect` reports every rejected gate and missing grid.

The catalogue snapshots reviewed metadata and never constructs, preloads or executes
payloads. It has no network access or bundled database/model data. Select once before
using the existing scalar or flat execution APIs. Qualification covers an independent
2,401-arc longitude oracle, seam/polar/global and epoch boundaries, quality policies,
asset revisions, stable ranking, metadata ownership and explicit factory execution.
Packed ESM/CommonJS/types and isolated bundle budgets cover the optional entry point;
the retained selector measures 4.4 KiB minified / 1.6 KiB gzip on Node 24.14.0.
Existing projection, pipeline, root and lazy imports retain no selection code and
existing bundle limits are unchanged.

This completes the bounded application-catalogue milestone, not unrestricted EPSG
operation discovery, dynamic CRS inference or a geodetic accuracy certification.
See the [operation selection guide](./operation-selection.md).

## Tranche 13A — Static Helmert coordinate buffers: implemented follow-up

A pipeline direction with one active static Helmert step now executes directly over
Float32/Float64 buffers using numeric locals. It covers translation/scale, small-angle
and exact rotations, both conventions and inverse-oriented steps. Exact batches reuse
the scalar stage's prepared matrix. Per-step equation order, finite/Float32 validation,
explicit epochs, Z/M/tails and partial-failure commits remain unchanged. Mixed chains,
grids and stacks continue through general execution. The kinematic follow-up below
extends this single-stage optimization to rates.

Independent PROJ anchors and seeded exact scalar/general-dispatch comparisons qualify
the implementation. Tests cover XYZ/XYZM/six-component views, both directions/conventions,
parameter snapshots, omitted-stage epoch requirements, error recovery and recursive hooks.
The allocation audit guards the new buffer loop. Packed ESM/CommonJS/types and byte budgets
cover the implementation; upstream proj4js/PROJ notices remain attached to derived equations.
The shared paired pipeline matrix expands to 22 scenarios / 176 layout/direction rows.
A separate 80-row Apple M2 / Node 24.14.0 CPU-time diagnostic observes median flat
ratios of 1.76× for translation/small-angle and 1.38× for exact rotations, with
control medians within about 3% of baseline. Raw samples retain local contention,
spread and aggregate-limit warnings; allocation samples do not establish a reduction.

Pipeline/all-root bundles add about 1.35/1.35 KiB minified and 0.47/0.49 KiB gzip respectively.
Core, wrapper, selective, catalogue, deformation and deferred imports remain unchanged.
Only exceeded optional pipeline/all-root allowances increase with reviewed rounding headroom.
See the [benchmark evidence](./benchmarks.md#static-helmert-coordinate-buffers) for the
measured scope; this does not establish a general throughput or state-of-the-art claim.

## Tranche 13A — Kinematic Helmert coordinate buffers: implemented follow-up

Single-active-stage directions with Helmert rates now execute directly over
Float32/Float64 buffers. Constant batch epochs prepare once; typed per-record
epochs share the scalar epoch preparation and cache. Both conventions, exact and
small-angle rotations and inverse-oriented steps retain scalar arithmetic,
Z/M/tails, epoch validation, empty-buffer behavior and partial failure commits.

Independent anchors and seeded bit-for-bit scalar/general-dispatch tests qualify
all variants. Source allocation checks guard the new loop; packed ESM/CommonJS
consumers exercise both epoch modes. The shared benchmark matrix now covers 26
scenarios / 208 rows, adding approximate, coordinate-frame and inverse rate cases.
The [paired diagnostic](./benchmarks.md#kinematic-helmert-coordinate-buffers)
records CPU timing, spread warnings, allocation sampling and optional bundle cost.
A longer-sample Apple M2 / Node confirmation observes 2.86×/1.26× median flat ratios
for constant/mixed epochs, with remaining spread/aggregate-limit warnings. Optional
pipeline/root bundles add 342/353 gzip bytes; selective and lazy imports stay unchanged.
No new public API, models or third-party data are included.

This completes a targeted single-stage rate optimization. Mixed-stage chains,
grid/datum-heavy workloads, further allocation/boxing investigation and optional
acceleration remain subject to separate correctness and performance qualification.

## Tranche 13A — Grid scratch and mixed-pipeline qualification: implemented follow-up

Horizontal grids reuse a private working point for tuple-returning `shift()` calls.
The returned pair remains an owned result; the mutable interpolation/inverse kernel
is unchanged. Tests cover failure recovery and recursive application setters without
exposing scratch. Timing is noisy, so allocation evidence does not imply a grid
throughput claim.

The shared benchmark matrix now covers 31 scenarios / 248 rows. Authored unit/axis
oracles compose pinned PROJ Helmert anchors. New mixed-chain tests cover exact/scalar
arithmetic, epochs, signed zero, strides and intermediate errors. Grid diagnostics
separate owned tuples and mutable outputs, both directions and both reader formats.
Optional heap source-site profiles help distinguish explicit allocations from runtime
boxing. CI uploads bounded coordinate/allocation measurements alongside preparation
reports. See [the measurements](./benchmarks.md#grid-scratch-and-mixed-pipeline-qualification).

A mixed unit/axis and Helmert numeric-buffer prototype improved throughput but
regressed sampled allocations after varied workloads, including when narrowed to
constant-epoch rate stages. It was not retained. Per-record epoch specialization
also failed to show repeatable gains. Mixed chains keep general dispatch; existing
single-stage specializations remain intact. Further work must qualify allocation
behavior after heterogeneous warmup as well as throughput, accuracy and bundle cost.
This adds no public API, model data or acceleration backend.

## SOTA roadmap

Stable S identifiers distinguish this numerical/performance roadmap from the completed original parity tranches. S1–S3 establish stronger mathematical contracts; S4–S5 add qualified scratch reuse and bulk layouts; they do not establish a universal SOTA claim.

| Tranche | Status and work | Acceptance gate |
| --- | --- | --- |
| **S1 — Safeguarded ellipsoid inverse** | Implemented for sphere/oblate nearest normals: deep interiors, cusp policy, compensated extreme-flattening arithmetic | 434 independent high precision accuracy checks; bounded updates and untouched failure outputs. Prolate/triaxial legacy interior limitations remain explicit. |
| **S2 — Accuracy and domain contracts** | Implemented: 42 seeded domains, all 37 named algorithms independently referenced, polar meridian and Van der Grinten fixes, optional explicit domain enforcement | Independent forward and inverse values; per-profile sampled ceilings and oracle limitations in the accuracy scorecard. Latest proj4js reference remains pinned at 2.22.0. |
| **S3 — Factors and derivatives** | Implemented optional `/analysis`: reusable Jacobians, scales, convergence, angular distortion and principal scales | 450 independent PROJ comparisons plus analytic and failure/reentry tests; no root/core bundle inclusion or successful hot-path object creation. Numerical stencil limits remain explicit. |
| **S4 — CPU mixed-pipeline performance** | Implemented reusable point/stack storage per observed recursive depth, batch scratch and cheaper inverse classification; mixed/grid-heavy comparisons retained. Runtime boxing and broader numeric fusion remain follow-ups | Paired measurements after heterogeneous warmup; unchanged accuracy/ownership, lower aggregate sampled allocation estimates in the recorded profiles. No broad throughput or zero-allocation claim. |
| **S5 — Reusable bulk layouts** | Implemented optional `/bulk`: separate input/output, offsets/strides, XYZM columns and chunks | 2,616 independent layout/epoch checks, all 31 mixed pipeline scenarios, Float32/64/payload/alias/failure/reentry tests; measured gather/transform/scatter costs. |
| **S6 — Real-model and operation qualification** | Implemented qualification harness: hashed local assets, conservative coverage cells, compound/dynamic frame identity and model revisions/terms. Authoritative data qualification remains application-owned | Reviewed data terms, conservative coverage/time/accuracy bounds; no bundled third-party database or implicit downloads. |
| **S7 — Temporal models and events** | Implemented optional `/temporal`: velocity, acceleration, step and exponential relaxation; original-epoch bounded Newton inverse | 96 independent Decimal forward/inverse cases; explicit units, event endpoints, validity and failure recovery. Source sampling is distinct from trajectory integration. |
| **S8 — Optional acceleration** | Implemented worker evaluation/recipe and three-browser CI: persistent two-worker UTM gains on measured large buffers. Wasm/SIMD/GPU algorithm backends remain deferred, capability probes only | Warm copy/partition/transfer/scheduling and cold startup/bundle costs recorded separately; exact Float32/64 outputs and failure ownership are gates. No automatic backend or universal speed claim. |
| **S9 — Published scorecard** | Accuracy, throughput, allocation, startup, memory and bundle measurements across Node and three browsers | Pinned competitors and explicit hardware/domain qualifications; bounded claims from measured evidence. |

The target is a browser-native projection and coordinate transformation library. General GIS engines, BLAS and tensors remain outside scope. Unrestricted native PROJ parity is not claimed. The earlier 12C2/12E2 follow-ups map to S6–S7; 13A maps to S4–S5, and 13B–13D to S8.

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
TypeScript consumers. See the [engine guide](./projection-engine.md#load-less-used-projections-on-demand).

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

## Ellipsoid convergence — numerical qualification follow-up

The shared spheroid preparation now has a numerical follow-up: stable near-pole
geospatial latitude, bounded surface inversion and explicit unsupported-input
behavior, numeric inverse output commits, and an analytic spherical projection
inverse. Authored anchors qualify center/near-axis boundaries, flattened/prolate/
triaxial geometry, aliasing and recursive outputs; matched benchmarks compare
reusable scalar and flat paths with separate allocation samples. CI records those
diagnostics without speed gates. See [coordinate-system boundaries](./coordinate-systems.md#interoperating-with-geospatial-ellipsoids)
and [the measurements](./benchmarks.md#spheroid-numerical-boundaries).

The next qualification and sharing tranche is implemented: independent surface/
exterior anchors extend from spheres to b/a = 0.000001; ordinary interior offsets
and ambiguous/radial interior behavior have separate tests. The geocentric plugin
retains the supplied polar axis instead of recovering it from eccentricity.

The shared arithmetic lives in the optional `@math.gl/core/spheroid` numeric leaf.
Both modules share spheroid forward conversion and the qualified surface/exterior
inverse. Geospatial keeps its three-radius/interior kernel, radial approximation,
angle units and exact-pole convention. Reusable scratch captures numeric
results before public output setters; no coordinate arrays/objects are created by
the shared functions. Setup, scalar/flat, sampled allocations and selective bundle
costs are recorded separately. See [shared conversion measurements](./benchmarks.md#shared-spheroid-conversions).

This completes common-leaf placement for the qualified domain. The subsequent
interior qualification tranche is also implemented: 198 independently generated
binary64 inputs, 144 accuracy checks and 322 explicitly diagnostic path checks.
High-precision nearest-footpoint references cover deep interiors, extreme
flattening, prolate/triaxial axes and either side of the equatorial cusp. Analytic
checks extend finite-axis/underflow boundaries and flat failure ownership. CI
checks fixture reproducibility, sampled accuracy and failure contracts; every
diagnostic error/rejection is retained separately. See
[ellipsoid accuracy and interior boundaries](./ellipsoid-qualification.md).

Further interior algorithm work needs an explicit normal-branch selection
contract and a safeguarded, independently qualified solver.


Local-frame convergence is implemented in the qualified sphere/oblate domain:
shared original ENU/XYZ basis and ENU/NED matrix commits, preserved height/pole
normal conventions, reusable outputs and recursive sampling/setter qualification.
See [the local-frame measurements](./benchmarks.md#shared-local-frames). Datums/epochs remain explicit projection concerns.
Existing CesiumJS/proj4js provenance stays attached, and the core package includes
the full upstream MIT notice. No new third-party source or model data is added.

## Validation commands

```sh
yarn exec vitest run --project node modules/projection/test
yarn exec tsc --noEmit --project modules/projection/tsconfig.json
yarn exec ocular-build projection
node modules/projection/scripts/check-experimental-package.mjs
node modules/projection/scripts/check-parity-inventory.mjs
node modules/projection/scripts/check-packed-package.mjs
python3 modules/projection/scripts/generate-interior-reference.py --check
node modules/projection/scripts/qualify-interiors.mjs
node modules/projection/scripts/check-spheroid-allocations.mjs
node modules/projection/scripts/check-local-frame-allocations.mjs
node modules/projection/scripts/check-local-frame-boundary.mjs
node modules/projection/scripts/check-bundle-budget.mjs
node modules/projection/scripts/benchmark.mjs --allocations --output /tmp/proj4-benchmark.json
```

## Deformation qualification follow-up: authored stress and application harness

108 independent Decimal/Newton references qualify a nonlinear spatial field on
WGS84, sphere and flattened spheroid, including separate inverse targets,
hemispheres/poles/dateline-adjacent points, heights and positive/negative/zero/fractional
epoch intervals. Bulk checks preserve views, M/tails and epochs with explicit
Float32 rounding limits. A local factory/reference CLI supports independently
reviewed application-owned models without distributing their data. Node and browser
CI retains error/provenance reports; the generator uses Python's standard library.

Tests distinguish source-sampled displacement from trajectory integration and
static velocity from temporal rate/event laws. Authoritative model certification
remains application-owned. S6 adds pinned local
asset and operation metadata qualification; S7 implements the four explicit
temporal laws with independent references. See
[deformation qualification](./deformation-qualification.md), [temporal models](./temporal-models.md)
and [optional acceleration](./acceleration.md).
S6–S8 add original code/reference generation only, with no new runtime dependencies
or third-party datasets. S9 remains the consolidated publication/scorecard tranche.
