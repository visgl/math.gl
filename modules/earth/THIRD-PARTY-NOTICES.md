# @math.gl/earth: sources and notices

This index distinguishes adapted or vendored source, separately installed
dependencies, datasets, and scientific references. It supplements the full
[package license](./LICENSE), source headers, and adjacent notices; it does not
replace or relicense them. Versions below identify the audited sources, not the
latest available upstream releases.

| Source / author | Use and retained notice |
| --- | --- |
| Charles Karney / GeographicLib 1.50.1 | Adapted geoid interpolation and PGM parsing; MIT, [LICENSE](./LICENSE). |
| Vladimir Agafonkin / SunCalc | Adapted lunar calculations; BSD-2-Clause, [SunCalc notice](./LICENSE-SUNCALC). Sun-position code also cites the astronomical equations of Louis Strous. |
| Lukas Hošek and Alexander Wilkie | Derived 1.4a sunlight/sky model data; BSD-3-Clause, [model notice](./LICENSE-HOSEK-WILKIE). |
| Bretton Wade / YaleBrightStarCatalog | Derived bright-star data; [catalogue notice](./LICENSE-BRIGHT-STARS); the source records the pinned upstream commit. |
| ECMA International / Temporal contributors | Vendored `@js-temporal/polyfill` 0.5.1; ISC, [provenance](https://github.com/visgl/math.gl/blob/master/modules/earth/src/timezone/vendor/temporal/README.md), [license](./src/timezone/vendor/temporal/LICENSE.txt). |
| V8 authors / JSBI | JSBI 4.3.2 bundled with Temporal; Apache-2.0, [license](./src/timezone/vendor/temporal/JSBI-LICENSE.txt). |
| PhotoStructure and tz-lookup contributors | Vendored `@photostructure/tz-lookup` 11.7.0 algorithm/table; CC0-1.0, [provenance](https://github.com/visgl/math.gl/blob/master/modules/earth/src/timezone/vendor/tz-lookup/README.md), [dedication](./src/timezone/vendor/tz-lookup/LICENSE.txt). |
| NGA / GeographicLib EGM96 distribution | Optional geoid grids; public-domain model data, [provenance, resolution and checksum manifest](./data/geoid/README.md). |
| IOC, SCOR and IAPSO / TEOS-10; IAPWS; Roquet et al. (2015); McDougall et al. (2014) | Scientific formulation of the optional `ocean` entry: Gibbs-function coefficients (IAPWS R13-08 and SR7-09), 75-term specific-volume coefficients and the freezing polynomial. The code is an original implementation from the published equations. |
| SCOR/IAPSO WG127 / GSW-C 3.06.16 | Offline comparator only, not distributed. Its licence permits redistribution "without modification", so no GSW source is copied. The test controls store the GSW check values of `gsw_check_data.h` and values from the compiled, unmodified GSW-C; see `modules/earth/scripts/ocean/generate-seawater-reference.py`. |
| Chen and Millero; Fofonoff and Millard; Wong and Zhu; Del Grosso; Mackenzie; Francois and Garrison; Ainslie and McColm | Published sound-speed and absorption equations of the `ocean` entry; scientific references. |
| OpenStreetMap and Timezone Boundary Builder contributors | Optional simplified timezone boundaries, ODbL-1.0; [source and modifications](./data/timezone/README.md), [full license](./data/timezone/LICENSE-ODbL.txt). The MIT code license does not relicense this database. |

The `astronomy-engine` runtime dependency supplies planetary ephemerides under its own
MIT license. Source comments cite the physical data and photometric papers used
by the original math.gl adapters; these are scientific references, not assertions
that the authors supplied the adapter code. The consolidated [references page](https://math.gl/docs/references-and-credits)
links the principal astronomical and rendering models.
