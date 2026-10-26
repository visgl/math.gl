# @math.gl/earth: sources and notices

This index distinguishes adapted or vendored source, separately installed
dependencies, datasets, and scientific references. It supplements the full
[package license](./LICENSE), source headers, and adjacent notices; it does not
replace or relicense them. Versions below identify the audited sources, not the
latest available upstream releases.

| Source / author | Use and retained notice |
| --- | --- |
| Charles Karney / GeographicLib 1.50.1 | Adapted geoid interpolation and PGM parsing; MIT, [LICENSE](./LICENSE). |
| Charles Karney / GeographicLib 2.7 | Normal-potential scientific formulation used by the original bounded analytic evaluator; MIT, [LICENSE](./LICENSE), [upstream source](https://github.com/geographiclib/geographiclib/blob/r2.7/src/NormalGravity.cpp). Offline native comparison only; no runtime dependency. |
| Vladimir Agafonkin / SunCalc | Adapted lunar calculations; BSD-2-Clause, [SunCalc notice](./sun/LICENSE-SUNCALC). Sun-position code also cites the astronomical equations of Louis Strous. |
| Lukas Hošek and Alexander Wilkie | Derived 1.4a sunlight/sky model data; BSD-3-Clause, [model notice](./sun/LICENSE-HOSEK-WILKIE). |
| Bretton Wade / YaleBrightStarCatalog | Derived bright-star data; [catalogue notice](./sun/LICENSE-BRIGHT-STARS); the source records the pinned upstream commit. |
| ECMA International / Temporal contributors | Vendored `@js-temporal/polyfill` 0.5.1; ISC, [provenance](./src/timezone/vendor/temporal/README.md), [license](./src/timezone/vendor/temporal/LICENSE.txt). |
| V8 authors / JSBI | JSBI 4.3.2 bundled with Temporal; Apache-2.0, [license](./src/timezone/vendor/temporal/JSBI-LICENSE.txt). |
| PhotoStructure and tz-lookup contributors | Vendored `@photostructure/tz-lookup` 11.7.0 algorithm/table; CC0-1.0, [provenance](./src/timezone/vendor/tz-lookup/README.md), [dedication](./src/timezone/vendor/tz-lookup/LICENSE.txt). |
| NGA / GeographicLib EGM96 distribution | Optional geoid grids; public-domain model data, [provenance, resolution and checksum manifest](./geoid/data/README.md). |
| OpenStreetMap and Timezone Boundary Builder contributors | Optional simplified timezone boundaries, ODbL-1.0; [source and modifications](./timezone/data/README.md), [full license](./timezone/data/LICENSE-ODbL.txt). The MIT code license does not relicense this database. |

The optional `astronomy-engine` peer supplies planetary ephemerides under its own
MIT license. Source comments cite the physical data and photometric papers used
by the original math.gl adapters; these are scientific references, not assertions
that the authors supplied the adapter code. The consolidated [references page](https://math.gl/docs/references-and-credits)
links the principal astronomical and rendering models.
