# Projection engine attribution and source provenance

The math.gl projection engine uses proj4js **2.22.0** as its pinned compatibility
reference: https://github.com/proj4js/proj4js/tree/v2.22.0.

The numerical kernels under `src/experimental/kernels/`, numerical helpers under
`src/experimental/common/`, and CRS datum/ellipsoid/unit/prime-meridian tables are
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
`src/experimental/grids/grid.ts`, `grids/ntv2.ts` and `grids/geotiff.ts` are directly adapted from proj4js 2.22.0
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
by `@math.gl/crs`; the projection runtime does not import proj4js.

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

The explicit height stage (`src/experimental/vertical-datum.ts`), regular-grid
interpolator/geoid adapter (`grids/vertical.ts`) and GTX reader (`grids/gtx.ts`) are
original math.gl implementations. Their public registration follows the existing
proj4-style engine API; geoid-height signs and GTX layout/nodata conventions follow
PROJ/GDAL documentation. No proj4js or PROJ implementation was copied into these files.
Independent expectations use PROJ 9.5.1; the tiny GTX model is authored MIT test data.
The structural geoid adapter does not copy or import GeographicLib or `@math.gl/geoid`
code. Applications providing a geoid model retain that model's own license and data terms.


`src/experimental/grids/vertical-geotiff.ts` is original math.gl adapter code written
against the PROJ Geodetic TIFF Grid format, not a direct proj4js or PROJ fork. It does
not copy or import a TIFF decoder. The optional decoding library is chosen by the
application. Authored synthetic TIFF fixtures and their standard-library encoder are
MIT math.gl test data/code; PROJ 9.5.1 supplies independent numeric expectations.

## Typed operation pipelines

`src/experimental/projection-pipeline.ts` is original math.gl orchestration inspired
by PROJ's explicit operation/units model, not a direct PROJ fork. It reuses projection
kernels and the geocentric/static Helmert equations directly adapted from proj4js in
`datum.ts`, with their existing attribution and `PROJ4-LICENSE.md`. Independent pipeline
expectations use pyproj 3.7.2 / PROJ 9.5.1. Authored pipeline cases are MIT math.gl test
data; the reused BETA2007 NTv2 grid retains its attribution in
`test/fixtures/real-grids/README.md` and is not shipped in the package.

`src/experimental/exact-helmert.ts` directly adapts the exact rotation matrix and
convention transpose from PROJ 9.5.1 `src/transformations/helmert.cpp` (Copyright
(c) 2016, Thomas Knudsen / SDFE), under the MIT-style terms in `PROJ-LICENSE.txt`.
It is modified into prepared typed point operations; the existing approximate
Helmert equations remain the attributed proj4js adaptation in `datum.ts`.

`src/experimental/helmert-flat.ts` adds original direct-buffer traversal around
these existing attributed equations. Its small-angle arithmetic follows the
proj4js adaptation in `datum.ts`; exact matrix application follows the PROJ
adaptation in `exact-helmert.ts` and consumes that stage's prepared matrix.
Its SPDX headers retain both upstream copyright credits and point to the existing
`PROJ4-LICENSE.md` and `PROJ-LICENSE.txt`. No new third-party model data is added.
Ordinate-stack and direction-specific orchestration are original math.gl code
inspired by PROJ pipeline contracts, not direct PROJ or proj4js forks.
The additional two-by-two GTX is authored MIT test data, not a distributed geoid model.

`src/experimental/kinematic-helmert.ts` is original epoch/rate orchestration following
PROJ's documented parameter propagation contract. Its exact matrix/convention
transpose directly adapts PROJ 9.5.1 `helmert.cpp`, with the Thomas Knudsen / SDFE
copyright and `PROJ-LICENSE.txt` terms above; its small-angle equations follow the
existing attributed proj4js `datum.ts` adaptation. The kinematic fixture parameter
example is documented by PROJ; authored finite rotations/epochs are MIT test data,
not an authoritative CRS operation catalogue. Numerical expectations are generated
independently with pinned pyproj 3.7.2 / PROJ 9.5.1, with observation time separate from M.

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
