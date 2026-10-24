# Projection engine attribution and source provenance

Paths beginning with `src/` below are relative to the `@math.gl/geospatial` package root.
License files named without a path are in this `projection/` directory.

The math.gl projection engine uses proj4js **2.22.0** as its pinned compatibility
reference: https://github.com/proj4js/proj4js/tree/v2.22.0.

Except for the original ellipsoidal orthographic kernel (`kernels/ortho.ts`) and
meridian integration helper (`common/meridian-distance.ts`), the numerical kernels under `src/projection/experimental/kernels/`, numerical helpers under
`src/projection/experimental/common/`, and CRS datum/ellipsoid/unit/prime-meridian tables are
**direct TypeScript ports** of the corresponding proj4js sources. Source comments
retain attribution to the proj4js authors, with `SPDX-License-Identifier` license
expressions, `SPDX-FileCopyrightText` credits naming the upstream copyright holders,
and `SPDX-FileComment` provenance. They have been modified to use explicit
state, typed inputs, bounded iterations, strict errors, and the corrections recorded
in the parity inventory. The MIT license is reproduced in `PROJ4-LICENSE.md`.
The geocentric/Helmert equations in `datum.ts` and rotation equations in
`projections/ob-tran.ts` are likewise directly adapted from proj4js, with attribution
in those files.

The NTv2 decoder, GeoTIFF node orientation and interpolation/inverse equations in
`src/projection/experimental/grids/grid.ts`, `grids/ntv2.ts` and `grids/geotiff.ts` are directly adapted from proj4js 2.22.0
`lib/nadgrid.js` and `lib/datum_transform.js`. Their headers retain upstream
MIT attribution. The per-instance grid registration contract is original math.gl
code informed by upstream grid-list behavior. Synthetic grid fixtures are authored
for math.gl and include no externally licensed grid datasets.

`kernels/eqearth.ts` retains its original **Apache-2.0** notice:
Copyright 2018 Bernie Jenny, Monash University, Melbourne, Australia.
The original credits to Bojan Savric, Tom Patterson, Matthew Bloch and Andreas Hocevar
are retained in that source file. Its full license is included in
`APACHE-2.0-LICENSE.txt`. The TypeScript state conversion is a modification of that
source, not a claim of an independently authored algorithm.

The plugin adapters, normalization/execution pipeline, and WKT/PROJJSON execution
adapters are original math.gl code informed by proj4js behavior. The datum alias/
authority lookup and method/parameter normalization rules in `crs/structured.ts` are directly adapted
from proj4js 2.22.0 and its MIT-licensed wkt-parser dependency, with attribution
in the source. Mercator and
equidistant cylindrical are original equation implementations with proj4js parity
tests. They are MIT-licensed to the vis.gl contributors. Syntax parsing is provided
by `@math.gl/geospatial/crs`; the projection runtime does not import proj4js.

Authored differential fixtures use the pinned upstream implementation as an oracle.
Fixtures copied from upstream tests retain their source tag, line numbers, hash and
MIT attribution in `test/fixtures/upstream-2.22.0.ts` and the complete
`test/fixtures/upstream-corpus-2.22.0.json`. The latter includes all 242 coordinate
fixtures and suite-level alias definitions, extracted without executing upstream tests.


Cassini series signs/inverse refinement and Robinson coefficient precision/interval
selection are adapted from [PROJ 9.5.1](https://github.com/OSGeo/PROJ/tree/9.5.1/src/projections).
The Cassini Newton solver and Robinson exact-knot handling are original math.gl
modifications. Both files retain their proj4js port notices and identify the PROJ
adaptations. PROJ's MIT-style terms and attribution are reproduced in `PROJ-LICENSE.txt`.

Independent reference coordinates are generated with pyproj 3.7.2 / PROJ 9.5.1.
Structured CRS fixtures reproduce selected definitions from the EPSG dataset v11.022
(2024-11-05), distributed in PROJ's database; see the fixture README for source and
terms. Licensed real grids are test-only assets with separate redistribution notices
under `test/fixtures/real-grids`; none are included in the npm package.

The explicit height stage (`src/projection/experimental/vertical-datum.ts`), regular-grid
interpolator/geoid adapter (`grids/vertical.ts`) and GTX reader (`grids/gtx.ts`) are
original math.gl implementations. Their public registration follows the existing
proj4-style engine API; geoid-height signs and GTX layout/nodata conventions follow
PROJ/GDAL documentation. No proj4js or PROJ implementation was copied into these files.
Independent expectations use PROJ 9.5.1; the tiny GTX model is authored MIT test data.
The structural geoid adapter does not copy or import GeographicLib or `@math.gl/earth/geoid`
code. Applications providing a geoid model retain that model's own license and data terms.


`src/projection/experimental/grids/vertical-geotiff.ts` is original math.gl adapter code written
against the PROJ Geodetic TIFF Grid format, not a direct proj4js or PROJ fork. It does
not copy or import a TIFF decoder. The optional decoding library is chosen by the
application. Authored synthetic TIFF fixtures and their standard-library encoder are
MIT math.gl test data/code; PROJ 9.5.1 supplies independent numeric expectations.

## Typed operation pipelines

`src/projection/experimental/projection-pipeline.ts` is original math.gl orchestration inspired
by PROJ's explicit operation/units model, not a direct PROJ fork. It reuses projection
kernels and the geocentric/static Helmert equations directly adapted from proj4js in
`datum.ts`, with their existing attribution and `PROJ4-LICENSE.md`. Independent pipeline
expectations use pyproj 3.7.2 / PROJ 9.5.1. Authored pipeline cases are MIT math.gl test
data; the reused BETA2007 NTv2 grid retains its attribution in
`test/fixtures/real-grids/README.md` and is not shipped in the package.

`src/projection/experimental/exact-helmert.ts` directly adapts the exact rotation matrix and
convention transpose from PROJ 9.5.1 `src/transformations/helmert.cpp` (Copyright
(c) 2016, Thomas Knudsen / SDFE), under the MIT-style terms in `PROJ-LICENSE.txt`.
It is modified into prepared typed point operations; the existing approximate
Helmert equations remain the attributed proj4js adaptation in `datum.ts`.

`src/projection/experimental/helmert-flat.ts` adds original direct-buffer traversal around
these existing attributed equations. Its small-angle arithmetic follows the
proj4js adaptation in `datum.ts`; exact matrix application follows the PROJ
adaptation in `exact-helmert.ts` and consumes that stage's prepared matrix.
Its SPDX headers retain both upstream copyright credits and point to the existing
`PROJ4-LICENSE.md` and `PROJ-LICENSE.txt`. No new third-party model data is added.
Ordinate-stack and direction-specific orchestration are original math.gl code
inspired by PROJ pipeline contracts, not direct PROJ or proj4js forks.
The additional two-by-two GTX is authored MIT test data, not a distributed geoid model.

`src/projection/experimental/kinematic-helmert.ts` is original epoch/rate orchestration following
PROJ's documented parameter propagation contract. Its exact matrix/convention
transpose directly adapts PROJ 9.5.1 `helmert.cpp`, with the Thomas Knudsen / SDFE
copyright and `PROJ-LICENSE.txt` terms above; its small-angle equations follow the
existing attributed proj4js `datum.ts` adaptation. The kinematic fixture parameter
example is documented by PROJ; authored finite rotations/epochs are MIT test data,
not an authoritative CRS operation catalogue. Numerical expectations are generated
independently with pinned pyproj 3.7.2 / PROJ 9.5.1, with observation time separate from M.


`src/projection/experimental/kinematic-helmert-flat.ts` adds original coordinate-buffer
traversal using the epoch preparation and owned coefficients in `kinematic-helmert.ts`.
The exact matrix application follows that file's existing PROJ adaptation; the
small-angle matrix application follows its attributed proj4js adaptation. Both
upstream copyrights and license references remain in the source header. This
optimization introduces no model files, databases or additional third-party code.


## Prepared velocity models

The optional deformation model, velocity-grid preparation and velocity GeoTIFF
adapter are original math.gl code inspired by PROJ's documented deformation/GTG
contracts, not direct PROJ or proj4js forks. The model uses an original ENU basis
rotation and inverse solver, while reusing the existing attributed proj4js geocentric
conversion in datum.ts. No new upstream code or third-party model data is included.
The synthetic velocity TIFF and its encoder are original MIT math.gl test assets,
excluded from the published package. Native PROJ 9.5.1 forward evaluations generate
independent references; the legacy inverse is retained separately for comparison.
Application-provided model files and decoders retain their own terms.

## Source header convention

All projection engine source files declare their license with
`SPDX-License-Identifier` and ownership with `SPDX-FileCopyrightText`. Files with
multiple copyright holders use a separate copyright tag for each notice. Years
are retained when supplied by the original notice; none are invented.

`SPDX-FileComment` records direct ports, adaptations, inspiration and modifications,
with links to retained license files where applicable. Each file comment occupies
one line so source scanning can extract the complete provenance. Original wrappers
and adapters retain their own copyright; importing an attributed kernel does not
make the adapter a port. These tags follow the [SPDX source file tag convention](https://spdx.github.io/spdx-spec/v2.3/file-tags/).
The original Equal Earth Apache notice and all distributed upstream license texts
remain intact. CI checks every source header and the proj4js/PROJ credits.


## Horizontal grid tuple adapter

`src/projection/experimental/grids/grid.ts` reuses a private working point in the tuple-returning
adapter. This original adapter change retains the existing attributed interpolation
and inverse kernel described above. Successful calls still return an owned tuple.
No additional third-party code or model data is included.

## Shared spheroid arithmetic

The existing proj4js-derived geocentric forward equations and Hannover inverse from
`datum.ts` now live in `@math.gl/core/spheroid`, used by projection and the qualified
sphere/oblate geometry paths. The numeric leaf retains the proj4js SPDX copyright,
MIT identifier and full `PROJ4-LICENSE.md` in the core package. The safeguarded
surface/exterior fallback and adapters are original math.gl work. No new upstream
source or model data is introduced. Geospatial retains its existing Cesium-derived
three-radius/interior kernels and Apache-2.0 attribution.

## Modern PROJ corrections and upstream regressions

The independently implemented orthographic and pole-boundary corrections
acknowledge the numerical behavior and bug investigations maintained by
OSGeo/PROJ. Their SPDX-FileComment tags identify PROJ 9.5.1 source files and,
where applicable, upstream issues and PRs. The retained `PROJ-LICENSE.txt` supplies
PROJ's MIT terms. Existing proj4js copyright notices and Equal Earth's Apache-2.0
notice remain intact; independent math.gl implementations retain their own
copyright rather than assigning new copyright notices to upstream maintainers.

Orthographic behavior was informed by PROJ #2361 and the inverse-convergence
investigation in #2844/#2855. The parallel-ray/ellipsoid inverse and its rendering
enclosures are original math.gl code. Equal Earth's ellipsoidal authalic semantics
are documented in PROJ #1097. Historical regression scenarios from #2844 and
Mollweide #3082 are acknowledged in their test header; expected coordinates were
independently generated by pyproj 3.7.2 / PROJ 9.5.1. No PROJ model data is added.

## Shared ellipsoid geodesics and gnomonic

`src/ellipsoid-geodesic.ts` is an original typed facade over the shared GeographicLib
geodesic implementation in `src/vendor/geographiclib-geodesic/runtime.js`. That
source combines Math.js, Geodesic.js and GeodesicLine.js from GeographicLib JS 2.2.0,
pinned at commit 9c4036d6242aa997e08e43a20df789e2007fbe6f, preserving Charles Karney's
copyright and MIT terms. The version template is filled and an ESM export added.
The full MIT license is in `../GEOGRAPHICLIB-LICENSE.txt` and the module `../LICENSE`.
No package dependency is added.

The ellipsoidal gnomonic Newton formulation and Swiss oblique Mercator branch and
inverse equations follow PROJ 9.5.1. Stable conformal latitude expressions follow
PROJ's tsfn formulation. Source SPDX comments identify these adaptations; the PROJ
license is retained in `PROJ-LICENSE.txt` and the module `../LICENSE`.

## Original pole-conditioning corrections

The follow-up review adds original math.gl authalic pole-complement/inversion and
Cartesian spherical-inverse helpers. LAEA, stereographic, oblique stereographic,
spherical AEQD, QSC, Mollweide and polyconic retain their existing attributed ports;
new half-angle identities, stable complements, polar inverse limits and quadrature
reuse are original math.gl corrections, not copied upstream implementations.
Source SPDX comments preserve existing proj4js/PROJ credits and identify the changes.
Independent multiprecision equations and authored reference fixtures retain MIT
math.gl provenance; mpmath/pyproj are used only by temporary offline generation tools.
