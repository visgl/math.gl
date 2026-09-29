# TypeScript proj4 parity roadmap

Status: tranches 0 through 5 implemented in this source tree for the documented subset.
Tranches 6–7 are proposed; the inventory still marks projection families as partial
until their remaining CRS/parameter gaps are closed.
Sequencing describes dependencies, not release dates.

## Target and upstream baseline

Build an independent TypeScript engine inside `@math.gl/proj4`, initially alongside
the existing proj4js wrapper. Keep projection algorithms explicitly pluggable and
ESM imports tree-shakeable throughout implementation.

The initial parity reference is **proj4js 2.22.0**, the latest npm release verified
on September 28, 2026. The module dependency is pinned to that exact version so
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
the TypeScript engine must never silently fall back to proj4js.

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
| 7 — Compatibility release | Package/API stabilization, performance and bundle budgets, migration decision | Full compatibility matrix green or explicitly documented exceptions; release review approves promotion |

### Tranche 0: implemented foundation

- `@math.gl/proj4/experimental` exports `TypeScriptProjection`, plugin types,
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
See [TypeScriptProjection](./api-reference/typescript-projection.md) for the exact contract.
Tranche 3 adds upstream's `identity` alias with explicit radian semantics.

### Tranche 1: make parity measurable

Implemented artifacts:

- `modules/proj4/test/fixtures/parity-inventory.json`: all 38 upstream projection/helper
  modules and 30 CRS/API/transform features, with aliases, default-bundle membership,
  source hashes, fixture IDs, tests, gaps, and intentional differences.
- `upstream-2.22.0.ts`: 24 tagged upstream coordinate fixtures with source lines and
  source-file hash. The retained NAD83 and Plessis cases now execute successfully.
- `common-projections.ts`: authored differential cases covering spheres, ellipsoids,
  both hemispheres, origins, scales, offsets, and units.
- Independent published PROJ UTM examples provide a second numerical reference. A
  larger reproducibly generated native PROJ corpus remains tracked in the inventory.
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
axis permutations, Web Mercator datum geometry, and grid rejection. Native height
semantics deliberately expose computed heights; fourth ordinates remain unchanged.
Dynamic operations and grids remain unsupported. A larger independent geodetic corpus
is still an acceptance gate for promotion.


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
All families remain marked partial pending exhaustive parameter/domain coverage and
the independent reference corpus in tranche 7.

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

Start with the NTv2 registration surface exposed by `Proj4Projection.registerDatumGrid`,
then match upstream's optional GeoTIFF grid support through an isolated adapter.
Separate byte decoding/loading from synchronous transformation over prepared grids.
Keep optional readers and grid data out of minimal bundles.

Test grid selection, nested subgrids, interpolation at cell/boundary edges, inverse
iteration, nodata, optional versus required grids, null-grid behavior, byte order,
error-field options, loading failures, and caller-controlled data ownership. Match
only the grid/vertical semantics actually supported by the pinned upstream release;
broader geoid and native PROJ capabilities are separate scope.

### Tranche 7: promote only after evidence

Run the complete matrix in Node and supported browsers, test packed ESM/CommonJS
packages and declarations, and record cold construction cost, transform throughput,
allocation counts, and gzip/minified bytes for core-only, Mercator, UTM, and full presets.
Set regression budgets from measured baselines.

Review every intentional behavioral difference. Keep the proj4js-backed implementation
available for migration and comparison. Decide separately whether to expose a backend
choice, promote the TypeScript class, or change defaults in a major release. Removing
the runtime proj4 dependency requires its own compatibility and migration decision.

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
```
