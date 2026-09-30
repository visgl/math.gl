# Native projection source provenance

The native implementation uses proj4js **2.22.0** as its pinned compatibility
reference: https://github.com/proj4js/proj4js/tree/v2.22.0.

The numerical kernels under `src/experimental/kernels/`, numerical helpers under
`src/experimental/common/`, and CRS datum/ellipsoid/unit/prime-meridian tables are
**direct TypeScript ports** of the corresponding proj4js sources. Source comments
retain attribution to the proj4js authors. They have been modified to use explicit
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
by `@math.gl/crs`; the experimental runtime does not import proj4js.

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
