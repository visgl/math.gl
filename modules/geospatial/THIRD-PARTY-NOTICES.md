# @math.gl/geospatial: sources and notices

This index distinguishes adapted or vendored source, separately installed
dependencies, datasets, and scientific references. It supplements the full
[package license](./LICENSE), source headers, and adjacent notices; it does not
replace or relicense them. Versions below identify the audited sources, not the
latest available upstream releases.

| Source / author | Use and retained notice |
| --- | --- |
| CesiumJS contributors | Adapted ellipsoid and related geometry utilities; Apache-2.0, [LICENSE](./LICENSE). |
| proj4js 2.22.0 / PROJ | Adapted projection kernels, helpers and datum transformations; [detailed file-level provenance](./THIRD-PARTY-NOTICES.md#projection-sources-and-notices), [proj4js terms](./PROJ4-LICENSE.md), [PROJ terms](./PROJ-LICENSE.txt). |
| Bernie Jenny and Equal Earth collaborators | Equal Earth kernel ported through proj4js; Apache-2.0, [full license](./APACHE-2.0-LICENSE.txt). Source retains the original collaborator credits. |
| Charles Karney / GeographicLib | Vendored geodesic solver and adapted rhumb, intersection and polygon algorithms; MIT, [notice](./GEOGRAPHICLIB-LICENSE.txt), [vendored version and modifications](https://github.com/visgl/math.gl/blob/master/modules/geospatial/src/vendor/geographiclib-geodesic/README.md). |
| Mike Bostock / d3-geo-projection | Adapted [world projection kernels and modification inventory](https://github.com/visgl/math.gl/blob/master/modules/geospatial/src/discontinuous/world-kernels/README.md), elliptic, Guyou, Gringorten, quincuncial, Berghaus, Gingery, interrupted and polyhedral work; ISC, [D3 notice](./src/discontinuous/D3-LICENSE.txt). No D3 runtime dependency. |
| Mike Bostock / d3-geo 3.1.1 | Adapted spherical circle clipping, reused by the original global polygon atlas adapter; ISC, [retained license](./src/discontinuous/spherical-clip/D3-GEO-LICENSE.txt), [modifications and file inventory](https://github.com/visgl/math.gl/blob/master/modules/geospatial/src/discontinuous/spherical-clip/README.md). No runtime D3 dependency. |
| Ricky Reusser / scijs | Adaptive Simpson integration used by the hyperelliptical kernel, via d3-geo-projection; [MIT license](./src/discontinuous/world-kernels/INTEGRATE-LICENSE.txt). |
| d3-geo-polygon contributors | AirOcean topology/rotation; ISC, [AirOcean notice](./src/discontinuous/AIR-OCEAN-LICENSE.txt). |

The separately installed `polygon-clipping` dependency retains its own package
license. The opt-in terrain/martini entry uses separately installed
`@mapbox/martini` 0.2.0 by Vladimir Agafonkin / Mapbox under its ISC package license;
the backend source is not vendored or copied.

Projection authors receive mathematical credit in the [projection references](https://math.gl/docs/modules/geospatial/projection/developer-guide/discontinuous-projections#references-and-implementation-credits).
AirOcean is radial/gnomonic, not an exact Gray–Fuller implementation. Nico Belmonte's
myriahedral demonstration is credited as inspiration; its application code is not incorporated.

HEALPix is independently implemented from M. R. Calabretta, [Mapping on the HEALPix grid (2004)](https://arxiv.org/abs/astro-ph/0412607). The package does not depend on D3 at runtime.

## Gray–Fuller, Petroff, and Snyder maps

- **Robert W. Gray / Buckminster Fuller**: `gray-fuller.ts` implements Gray's
  1995 face equations, also published by **Philippe Rivière** in
  [d3-geo-polygon's Gray–Fuller kernel](https://github.com/d3/d3-geo-polygon/blob/main/src/grayfuller.js)
  with a public-domain dedication. math.gl adds its own monotone inverse and
  integrates the existing ISC-licensed AirOcean topology without adding a runtime dependency.
- **Matthew A. Petroff**: `petroff.ts` adapts the forward/inverse equations in
  `new_projection.py`, [Zenodo record 4661351](https://doi.org/10.5281/zenodo.4661351).
  The archive's code is **CC0-1.0**, as stated in its
  [retained README/license](./src/discontinuous/PETROFF-LICENSE.txt). The record's
  CC-BY metadata also covers images that are not incorporated. Modifications:
  scalar TypeScript, stable Cartesian evaluation, explicit singular limits,
  chart-boundary ownership, and MapEngine integration.
- **John P. Snyder**, *An Equal-Area Map Projection for Polyhedral Globes* (1992),
  and [BRSR's vector formulation](https://brsr.github.io/2021/08/31/snyder-equal-area.html):
  mathematical sources for the independently implemented spherical triangle
  equations in `snyder.ts`.
- **Felix Palmer / PROJ contributors**: `snyder-mesh.ts` adapts only polyhedron
  coordinate/face tables and parent trees from PROJ revision
  `5fa31c29f0a806568ed7bc76c1a557604db4a804`, under the
  [retained PROJ MIT-style terms](./src/discontinuous/PROJ-LICENSE.txt).
  Source paths: `src/projections/polyhedral/polyhedra/{icosahedron,dodecahedron}.h`
  and `src/projections/polyhedral/nets/{isea/isea,dsea/dsea}.h`.
  The separately licensed A5/DGGAL projection implementation is not incorporated.

`air-ocean` remains gnomonic; the distinct `gray-fuller` preset uses the exact
Gray–Fuller formula. Neither is advertised as equal-area. Petroff, ISEA, and DSEA
are spherical equal-area maps; they do not implement ellipsoidal CRS transforms.

## Elastic projection datasets

Elastic I, II and III coordinate tables are by Justin Kunimune, released under the
[Unlicense](./src/discontinuous/elastic/UNLICENSE.txt). See the
[provenance record](https://github.com/visgl/math.gl/blob/master/modules/geospatial/src/discontinuous/elastic/README.md) for the pinned revision,
conversion details, units, and links to the published format and research.

## G8/G9 geodesics

`src/geodesic-exact.ts` and `src/geodesic-exact/inverse-engine.ts` adapt the
auxiliary-sphere, reduced-length/scales and Cayley longitude formulae from Charles
Karney's GeographicLib **2.7** `GeodesicExact.cpp` and `GeodesicLineExact.cpp`.
They reuse the already attributed JavaScript inverse-search framework through
per-instance overrides. Adaptive quadrature, API contracts and endpoint refinement
are original math.gl work. The [MIT terms](./GEOGRAPHICLIB-LICENSE.txt) and full
copyright notices are included in the packaged [LICENSE](./LICENSE).

`src/triaxial.ts` and `src/triaxial/integrate.ts` are original Cartesian
coordinate/geodesic implementations. GeographicLib 2.7's distinct Jacobi solution
is a mathematical reference; its native implementation is not incorporated.

### Exact edge areas

`src/geodesic-exact/area.ts` and the edge-area decomposition in
`src/geodesic-exact.ts` adapt the `I4` integrand and azimuth-area formula from
GeographicLib 2.7 `GeodesicExact.cpp` / `GeodesicLineExact.cpp` (Charles Karney,
MIT). The derivative-integral divided difference and adaptive integration are
original math.gl implementations. `GeodesicPolygonExact` reuses the already
attributed compensated polygon kernel. Existing GeographicLib copyright notices
and MIT terms in [LICENSE](./LICENSE) cover these formula adaptations as well.

## Coordinate utilities and packed geodesic results

The small MGRS alphabets, row/band compatibility rule and standard UTM zone
exceptions adapt GeographicLib 2.7 `MGRS.cpp` / `UTMUPS.cpp`, copyright Charles
Karney (2008–2022), MIT. The owning module's [LICENSE](./LICENSE) and
[GeographicLib terms](./GEOGRAPHICLIB-LICENSE.txt) include the notices. The WGS84
projection facade reuses existing attributed projection kernels. Angle text
utilities, buffer staging and triaxial sampling are original math.gl work.
The existing vendored geodesic result function additionally accepts an optional
caller-owned output; its numerical equations are unchanged.

## Delatin terrain tessellation

The isolated `src/terrain/vendor/delatin.js` backend is transferred from loaders.gl.
It retains the ISC copyright of Michael Fogleman and Vladimir Agafonkin (2019),
with [full terms](./src/terrain/vendor/DELATIN-LICENSE.txt) and
[exact provenance and modifications](https://github.com/visgl/math.gl/blob/master/modules/geospatial/src/terrain/vendor/README.md).
The public adapter and mesh contracts are original math.gl work.

## Projection sources and notices

Paths beginning with `src/` below are relative to the `@math.gl/geospatial` package root.
License files named without a path are in the module root.

The math.gl projection engine uses proj4js **2.22.0** as its pinned compatibility
reference: https://github.com/proj4js/proj4js/tree/v2.22.0.

Except for the original ellipsoidal orthographic kernel (`kernels/ortho.ts`) and
meridian integration helper (`common/meridian-distance.ts`), the numerical kernels under `src/projection/experimental/kernels/`, numerical helpers under
`src/projection/experimental/common/`, and CRS datum/ellipsoid/unit/prime-meridian tables are
**direct TypeScript ports** of the corresponding proj4js sources. Source comments
retain attribution to the proj4js authors, with `SPDX-License-Identifier` license
expressions, `SPDX-FileCopyrightText` credits naming the upstream copyright holders,
and `SPDX-FileComment` provenance. They have been modified to use explicit
state, typed inputs, bounded iterations, and strict errors. The MIT license is reproduced in `PROJ4-LICENSE.md`.
The geocentric/Helmert equations in `datum.ts` and rotation equations in
`projections/ob-tran.ts` are likewise directly adapted from proj4js, with attribution
in those files.

The NTv2 decoder, GeoTIFF node orientation and interpolation/inverse equations in
`src/projection/experimental/grids/grid.ts`, `grids/ntv2.ts` and `grids/geotiff.ts` are directly adapted from proj4js 2.22.0
`lib/nadgrid.js` and `lib/datum_transform.js`. Their headers retain upstream
MIT attribution. The per-instance grid registration contract is original math.gl
code informed by upstream grid-list behavior.

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
equidistant cylindrical are original equation implementations, MIT-licensed to the vis.gl contributors. Syntax parsing is provided
by `@math.gl/geospatial/crs`; the projection runtime does not import proj4js.

Cassini series signs/inverse refinement and Robinson coefficient precision/interval
selection are adapted from [PROJ 9.5.1](https://github.com/OSGeo/PROJ/tree/9.5.1/src/projections).
The Cassini Newton solver and Robinson exact-knot handling are original math.gl
modifications. Both files retain their proj4js port notices and identify the PROJ
adaptations. PROJ's MIT-style terms and attribution are reproduced in `PROJ-LICENSE.txt`.

The explicit height stage (`src/projection/experimental/vertical-datum.ts`), regular-grid
interpolator/geoid adapter (`grids/vertical.ts`) and GTX reader (`grids/gtx.ts`) are
original math.gl implementations. Their public registration follows the existing
proj4-style engine API; geoid-height signs and GTX layout/nodata conventions follow
PROJ/GDAL documentation. No proj4js or PROJ implementation was copied into these files.
The structural geoid adapter does not copy or import GeographicLib or `@math.gl/earth`
code. Applications providing a geoid model retain that model's own license and data terms.


`src/projection/experimental/grids/vertical-geotiff.ts` is original math.gl adapter code written
against the PROJ Geodetic TIFF Grid format, not a direct proj4js or PROJ fork. It does
not copy or import a TIFF decoder. The optional decoding library is chosen by the
application.

### Typed operation pipelines

`src/projection/experimental/projection-pipeline.ts` is original math.gl orchestration inspired
by PROJ's explicit operation/units model, not a direct PROJ fork. It reuses projection
kernels and the geocentric/static Helmert equations directly adapted from proj4js in
`datum.ts`, with their existing attribution and `PROJ4-LICENSE.md`.

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

`src/projection/experimental/kinematic-helmert.ts` is original epoch/rate orchestration following
PROJ's documented parameter propagation contract. Its exact matrix/convention
transpose directly adapts PROJ 9.5.1 `helmert.cpp`, with the Thomas Knudsen / SDFE
copyright and `PROJ-LICENSE.txt` terms above; its small-angle equations follow the
existing attributed proj4js `datum.ts` adaptation.


`src/projection/experimental/kinematic-helmert-flat.ts` adds original coordinate-buffer
traversal using the epoch preparation and owned coefficients in `kinematic-helmert.ts`.
The exact matrix application follows that file's existing PROJ adaptation; the
small-angle matrix application follows its attributed proj4js adaptation. Both
upstream copyrights and license references remain in the source header. This
optimization introduces no model files, databases or additional third-party code.


### Prepared velocity models

The optional deformation model, velocity-grid preparation and velocity GeoTIFF
adapter are original math.gl code inspired by PROJ's documented deformation/GTG
contracts, not direct PROJ or proj4js forks. The model uses an original ENU basis
rotation and inverse solver, while reusing the existing attributed proj4js geocentric
conversion in datum.ts. No new upstream code or third-party model data is included.
Application-provided model files and decoders retain their own terms.

### Source header convention

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
remain intact.


### Horizontal grid tuple adapter

`src/projection/experimental/grids/grid.ts` reuses a private working point in the tuple-returning
adapter. This original adapter change retains the existing attributed interpolation
and inverse kernel described above. Successful calls still return an owned tuple.
No additional third-party code or model data is included.

### Shared spheroid arithmetic

The existing proj4js-derived geocentric forward equations and Hannover inverse from
`datum.ts` now live in `@math.gl/core`, used by projection and the qualified
sphere/oblate geometry paths. The numeric leaf retains the proj4js SPDX copyright,
MIT identifier and full `PROJ4-LICENSE.md` in the core package. The safeguarded
surface/exterior fallback and adapters are original math.gl work. No new upstream
source or model data is introduced. Geospatial retains its existing Cesium-derived
three-radius/interior kernels and Apache-2.0 attribution.

### Modern PROJ corrections and upstream regressions

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
are documented in PROJ #1097. No PROJ model data is added.

### Shared ellipsoid geodesics and gnomonic

`src/ellipsoid-geodesic.ts` is an original typed facade over the shared GeographicLib
geodesic implementation in `src/vendor/geographiclib-geodesic/runtime.js`. That
source combines Math.js, Geodesic.js and GeodesicLine.js from GeographicLib JS 2.2.0,
pinned at commit 9c4036d6242aa997e08e43a20df789e2007fbe6f, preserving Charles Karney's
copyright and MIT terms. The version template is filled and an ESM export added.
The full MIT license is in `./GEOGRAPHICLIB-LICENSE.txt` and the module `./LICENSE`.
No package dependency is added.

The ellipsoidal gnomonic Newton formulation and Swiss oblique Mercator branch and
inverse equations follow PROJ 9.5.1. Stable conformal latitude expressions follow
PROJ's tsfn formulation. Source SPDX comments identify these adaptations; the PROJ
license is retained in `PROJ-LICENSE.txt` and the module `./LICENSE`.

### Original pole-conditioning corrections

The follow-up review adds original math.gl authalic pole-complement/inversion and
Cartesian spherical-inverse helpers. LAEA, stereographic, oblique stereographic,
spherical AEQD, QSC, Mollweide and polyconic retain their existing attributed ports;
new half-angle identities, stable complements, polar inverse limits and quadrature
reuse are original math.gl corrections, not copied upstream implementations.
Source SPDX comments preserve existing proj4js/PROJ credits and identify the changes.

### H3 face orientations

The H3-oriented face net uses H3 v4.3.0 face-center constants (Apache-2.0).
See the [H3 license](./H3-LICENSE.TXT) and [notice](./H3-NOTICE.TXT). Net assembly and inverse are original math.gl code.
