# Native projection source provenance

The experimental implementation uses proj4js **2.22.0** as its pinned compatibility
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

`kernels/eqearth.ts` retains its original **Apache-2.0** notice:
Copyright 2018 Bernie Jenny, Monash University, Melbourne, Australia.
The original credits to Bojan Savric, Tom Patterson, Matthew Bloch and Andreas Hocevar
are retained in that source file. Its full license is included in
`APACHE-2.0-LICENSE.txt`. The TypeScript state conversion is a modification of that
source, not a claim of an independently authored algorithm.

The plugin adapters, normalization/execution pipeline, and WKT/PROJJSON execution
adapters are original math.gl code informed by proj4js behavior. Mercator and
equidistant cylindrical are original equation implementations with proj4js parity
tests. They are MIT-licensed to the vis.gl contributors. Syntax parsing is provided
by `@math.gl/crs`; the experimental runtime does not import proj4js.

Authored differential fixtures use the pinned upstream implementation as an oracle.
Fixtures copied from upstream tests retain their source tag, line numbers, hash and
MIT attribution in `test/fixtures/upstream-2.22.0.ts`.
