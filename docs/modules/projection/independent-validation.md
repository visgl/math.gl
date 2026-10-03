# Independent projection validation

The native engine now has reference coordinates from **PROJ 9.5.1**, generated with
**pyproj 3.7.2** independently of proj4js. The corpus covers all **37 named algorithms**
with **134 configurations and 2,386 points**, plus **87 points in real horizontal
GeoTIFF and NTv2 datasets**. The internal Gauss helper is exercised through its parent projections.
A separate seeded corpus adds **15 explicit domains / 4,005 points** for common
regional and world-map configurations. These are sampled accuracy checks, not a claim of full-domain or full-CRS parity.

The proj4js compatibility baseline remains **2.22.0**, checked against npm's latest
tag on September 29, 2026. Its separate upstream corpus has 232 original numeric matches, one independently
corrected Robinson result, and nine deliberate input rejections. An independent oracle matters because a
TypeScript port can reproduce a bug in the JavaScript implementation exactly.

## What the checks establish

Every configuration compares forward output with native PROJ and separately feeds
PROJ's projected coordinates into the native inverse. The scalar and in-place
Float64 paths both run in Node and Chromium, including four-component records and
trailing-ordinate preservation. This does not infer accuracy from a round trip.
Existing suites separately cover Float32 precision, units, aliases and axes. The
browser qualification harness runs this independent projection corpus in Chromium,
Firefox and WebKit in Linux CI, alongside its measured performance workloads.

| Algorithms | Independent sampling |
| --- | --- |
| `longlat`, `merc`, `eqc`, `cea`, `eck6`, `eqearth`, `equi`, `mill`, `moll`, `robin`, `sinu`, `vandg` | Local samples plus a longitude/latitude matrix spanning −110° to 130° and −60° to 60°. Spherical/ellipsoidal configurations where applicable. |
| `tmerc`, `etmerc`, `utm` | Exact and approximate TM, spherical equivalents, northern and southern UTM. |
| `lcc`, `aea`, `eqdc` | Northern/southern cones, spherical, tangent and selected polar-origin cases. |
| `laea`, `stere`, `aeqd`, `sterea` | Equatorial, oblique and polar origins; true-scale stereographic; AEQD origin regressions. |
| `cass`, `poly`, `gstmerc`, `gnom`, `ortho`, `bonne` | Local spherical/ellipsoidal cases, plus Cassini regional accuracy probes. |
| `krovak`, `nzmg`, `omerc`, `somerc` | Selected regional definitions; Czech orientation, NZMG refinement, Hotine scale/rotation/offset and two-point variants. |
| `geos`, `tpers`, `qsc` | Sweep axes, perspective tilt, spherical/ellipsoidal geostationary variants, all six cube faces. |
| `geocent`, `ob_tran` | Ellipsoidal 3D conversion; explicitly composed oblique Mollweide. |

Most configuration budgets are **1e-5 metres forward / 1e-8 degrees inverse**.
They apply to the sampled parameters and points, not every input to an algorithm.
Each fixture declares its budget; exceptions are explicit:

| Case | Regression ceiling | Interpretation |
| --- | --- | --- |
| Polar ellipsoidal AEQD | 0.001 m forward | Meridional-arc approximation; observed maximum about 0.000564 m. |
| Mollweide | 0.00002 m forward | Iterative forward approximation over the wider matrix. |
| Ellipsoidal CEA | 2e-8° inverse | Difference from PROJ 9.5.1's authalic-latitude inverse series; math.gl solves the inverse iteratively. |
| Robinson | 1e-5 m forward / 1e-8° inverse away from exact knots | Uses PROJ coefficient precision. Exact knots are checked against their original latitude/longitude to 1e-8°; a separately declared 1e-4° comparison budget accommodates PROJ's unstable neighbouring-piece selection at knots. |
| Near-pole Mollweide / perspective horizons | 1e-7° inverse | Longitude becomes ill-conditioned near singularities; these remain sampled budgets. |
| Geocentric | 1e-6 inverse | The inverse includes height in metres as well as angles in degrees. |

## Seeded accuracy domains

Tranche 11 adds 256 deterministic probes per configuration: half are uniform and
half approach an edge logarithmically, between 1e-2 and 1e-10 of the domain width.
Exact corners, edge midpoints, centres and authored regressions supplement them.
The seed is 193867281. Generation aborts on any PROJ error; no rejected samples are
silently removed. The earlier 37-algorithm corpus remains a separate required gate.

The following are **observed maximum absolute component errors**, rounded upward,
from Node 24.14.0 on the checked-in corpus. Scalar and Float64 XYZM batches have
identical maxima in this run. Forward errors compare with PROJ in metres; inverse
errors start from PROJ coordinates and compare with PROJ's inverse in degrees.
Roundtrip errors compare math.gl's inverse of its own forward result with the input.
The latter is an additional consistency check, never the independent accuracy oracle.

| Configuration | Longitude / latitude domain (degrees) | Forward (m) | Inverse (°) | Roundtrip (°) |
| --- | --- | ---: | ---: | ---: |
| `merc-ellipsoid` | [-179.99, 179.99] / [-85, 85] | 3.73e-09 | 2.85e-14 | 2.85e-14 |
| `merc-sphere` | [-179.99, 179.99] / [-85, 85] | 3.73e-09 | 2.85e-14 | 2.85e-14 |
| `tmerc-ellipsoid` | [-15, 33] / [-80, 84] | 1.87e-09 | 6.04e-14 | 7.11e-14 |
| `utm-north` | [0, 6] / [0, 84] | 2.80e-09 | 5.89e-14 | 6.22e-14 |
| `utm-south` | [150, 156] / [-80, 0] | 1.87e-09 | 2.85e-14 | 2.85e-14 |
| `lcc-north` | [-125, -65] / [15, 65] | 4.08e-09 | 1.77e-11 | 1.77e-11 |
| `lcc-south` | [105, 165] / [-65, -10] | 5.59e-09 | 1.77e-11 | 1.77e-11 |
| `aea-north` | [-125, -65] / [15, 65] | 1.03e-08 | 1.28e-13 | 1.14e-13 |
| `eqdc-north` | [-60, 60] / [0, 85] | 4.52e-06 | 1.20e-10 | 3.02e-14 |
| `eqdc-south` | [-60, 60] / [-85, 0] | 4.54e-06 | 1.20e-10 | 3.20e-14 |
| `cea-ellipsoid` | [-169.99, 179.99] / [-89.99, 89.99] | 7.46e-09 | 1.43e-08 | 2.48e-10 |
| `cass-dense-domain` | [0, 20] / [-75, 75] | 5.26e-06 | 9.16e-11 | 2.74e-12 |
| `robin-ellipsoid` | [-169.99, 179.99] / [-89.99, 89.99] | 3.73e-09 | 1.43e-13 | 1.43e-13 |
| `eqearth-ellipsoid` | [-169.99, 179.99] / [-85, 85] | 2.80e-08 | 6.23e-09 | 1.99e-08 |
| `moll-sphere` | [-169.99, 179.99] / [-89, 89] | 1.79e-05 | 3.04e-10 | 4.95e-12 |

All definitions and regression ceilings are explicit in
[`accuracy-cases.json`](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/accuracy-cases.json).
The [raw report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/accuracy-node.json)
records each worst input separately for scalar and batch paths, with source and
reference hashes. Most ceilings are 1e-5 m forward and 1e-8° inverse/roundtrip.
Mollweide retains 2e-5 m forward; CEA uses 2e-8° inverse/roundtrip; Equal Earth's
truncated authalic inverse uses a 3e-8° roundtrip ceiling. The broader suite continues
to test exact Robinson knots separately from these mostly off-knot probes.

These rectangles describe tested inputs for the exact fixture parameters, not an
algorithm's mathematical validity domain or an EPSG area of use. PROJ itself may
use approximate series, especially Cassini away from its central meridian. Sampling
does not prove a global maximum. Float32 quantization, extreme ellipsoids, singular
poles/horizons and arbitrary parameters need their own error budgets. CEA samples
stop at ±89.99° because latitude recovery becomes ill-conditioned closer to the
poles; explicit pole regressions are separate.

### Corrections established by these probes

- **Equidistant conic:** replacing the truncated meridional series with the existing
  higher-order helper reduces the worst sampled forward difference from 0.000816 m
  to 0.00000454 m, and inverse difference from 2.60e-8° to 1.20e-10°. Both hemispheres
  use the same forward/inverse series. The proj4js benchmark comparison allows a
  documented 0.001 m difference for this algorithm; independent PROJ checks retain
  their 1e-5 m ceiling.
- **Cylindrical equal-area:** the inherited 1e-6 authalic-q pole cutoff mapped
  ±89.95° to ±90°, a 0.05° error. A roundoff-sized cutoff preserves these latitudes,
  still recognizes exact poles, and rejects northings beyond the ellipsoid's pole
  limit. The worst sampled roundtrip error is now below 2.48e-10°.

The kernels retain their proj4js attribution; the cutoff correction and shared-series
integration are original math.gl changes. PROJ is an independent numerical oracle.
See its [CEA implementation](https://github.com/OSGeo/PROJ/blob/9.5.1/src/projections/cea.cpp)
for the inverse-series comparison used here.

### Reproduce the accuracy report

```bash
# Only needed when intentionally regenerating independent coordinates:
# use a separate environment with pyproj==3.7.2 / PROJ 9.5.1 / EPSG v11.022
python modules/projection/scripts/generate-accuracy-reference.py

# Ordinary offline verification; build the packages first.
yarn build
node modules/projection/scripts/check-native-reference.mjs
node modules/projection/scripts/measure-accuracy.mjs --output /tmp/proj4-accuracy.json
```

CI checks fixture/generator hashes and all numeric budgets, uploads a fresh Node
report, and repeats the same corpus in Chromium, Firefox and WebKit. Python and
PROJ are only regeneration tools and are not package or CI runtime dependencies.

### Cassini and Robinson corrections

Cassini's previous discrepancy was not merely an unavoidable regional approximation:
two legacy series signs differed from PROJ, and the inverse stopped at a truncated
series. The corrected kernel uses a higher-order meridional helper and bounded Newton
refinement against its own forward equations, with reusable scratch storage.

For an ellipsoidal definition centered at (10°, 40°), maximum component differences
from native PROJ on nine-point matrices improve as follows:

| Longitude and latitude offsets | Previous forward difference | Corrected forward difference |
| --- | --- | --- |
| ±1° | 0.000236 m | 6.34e-8 m |
| ±3° | 0.0577 m | 2.15e-7 m |
| ±5° | 0.735 m | 4.04e-7 m |
| ±10° | 23.46 m | 1.06e-6 m |

All these cases now use 1e-5 m forward / 1e-8° inverse budgets. They establish agreement
with PROJ's regional series, not exact geodesic accuracy arbitrarily far from the
central meridian. A nonconvergent inverse throws rather than returning a finite guess.

Robinson now uses the same float-valued coefficient table and interval selection as
PROJ 9.5.1. This removes the roughly 1.6 m forward discrepancy on the original matrix.
Polynomial pieces have small discontinuities at 5° knots: floating-point de-scaling
can make even PROJ select a neighbouring interval. The native inverse recognizes
exact tabulated knots and returns their tabulated latitude. Exact poles use the final
coefficient row; independent spherical/ellipsoidal cases cover ±90° and nearby
latitudes at four longitudes. Pole inverses retain the strict 1e-8° budget. Tests check those results
against the independently projected input, while separately recording the larger
PROJ-inverse comparison budget. This exception does not loosen off-knot accuracy.

### AEQD origin correction

The independent regional probes found a shared proj4js bug: the ellipsoidal AEQD
shortcut checked absolute longitude zero instead of longitude relative to `lon_0`.
With `+lon_0=10 +lat_0=40`, `[0, 40]` incorrectly became the false origin, producing
an error of about 852 km in easting. The native kernel now checks relative longitude.
Independent northern/southern cases include false offsets and scalar/batch paths;
this correction is an intentional difference from proj4js 2.22.0.

## Differences in definition semantics

PROJ and proj4js do not always assign the same meaning to the same string. The
input manifest retains **both** definitions and an explanation for each translation.
No datum transformation is selected implicitly in the projection-only corpus.

- Spherical UTM is checked against explicitly parameterized spherical TM because
  PROJ rejects UTM with zero eccentricity. `etmerc +approx` likewise selects `tmerc +approx`.
- Tangent EQDC explicitly supplies `lat_2=lat_1` to PROJ; the engines have different
  defaults for an omitted second parallel.
- Polar stereographic `lat_ts` overrides `k_0` in math.gl/proj4js. PROJ rejects their
  conflicting combination, so the oracle omits the overridden scale.
- The legacy Miller, Van der Grinten, gnomonic and orthographic implementations
  use a sphere of radius equal to the semi-major axis. The oracle explicitly selects
  that sphere. Passing their unchanged ellipsoidal strings to PROJ can yield different results.
- Legacy `equi` is compared with equivalent `eqc`. NZMG uses standard false offsets
  explicitly in math.gl and omits the proj4js-only `iterations` option in PROJ.

These translations qualify the intended legacy algorithm. They do not establish
identical behavior for arbitrary PROJ definitions or PROJ's newer ellipsoidal methods.

## Structured CRS and datum-chain references

The generator pins EPSG dataset v11.022 (2024-11-05), supplied by PROJ 9.5.1. Fifteen
systems are serialized as WKT1, WKT2, ESRI WKT and PROJJSON: UTM, LAEA, polar/oblique
stereographic, LCC including US survey feet, Mercator, Swiss systems, Krovak and NZMG.
Each conversion is referenced from its own geographic base, with no implicitly
selected datum operation. Tests compare scalar and Float64 output in both directions.
Budgets are 0.001 output units and 1e-7 degrees.

Twelve explicit static datum chains cover both directions between WGS84, an
International-ellipsoid translation, an Airy seven-parameter transform and a Bessel
seven-parameter transform. The 144 points include negative, zero and elevated heights.
PROJ pipelines explicitly select cartesian conversion, position-vector Helmert stages
and inverse stages; no online grid or automatic operation selection is involved.
Budgets are 1e-7 degrees and 0.001 metres of height, with fourth-ordinate preservation.

This exposed and fixed datum=none suppression across a two-stage chain. It also
qualified ESRI true-scale North Pole stereographic separately from its older explicit-
scale spelling, and the complete standard ESRI Krovak axis-adjustment triplet. Other
Krovak adjustment values, missing members and duplicates reject explicitly.

## Real grids and boundary policy

The maintained fixtures are Germany's **BETA2007** and Canada's **NA83SCRS** GeoTIFFs, plus the original **BETA2007 NTv2** file distributed
with proj4js v2.22.0. GeoTIFFs are pinned to an immutable PROJ-data revision with SHA-256 hashes and original redistribution
notices. Canada's file contains 14 nested images; Germany's contains one. Samples
include the center and points close to every image boundary, plus prior audit interiors.
Native PROJ's explicit `hgridshift` pipeline supplies forward and inverse references.
Tests decode the actual GeoTIFF and NTv2 bytes and check scalar/batch output to **1e-9 degrees**.

Outer nodes, shifted inverse boundaries, uncovered coordinates and explicit `null`
fallbacks also have policy tests. The two earlier Canadian western-edge audit failures
are now an explicit strict-coverage decision: inverting `[-80, 44.92]` produces an
approximate source longitude of **−80.00000028943268°** in PROJ, just outside the grid.
The native engine rejects this inverse instead of accepting an extrapolated source.
The fixture preserves PROJ's result to make the difference observable. Inverting a
valid shifted boundary point succeeds; `null` fallback is available only when declared.

The three grid files occupy about 1.5 MB in the repository and are excluded from npm
packages. `geotiff` is a development dependency for tests; decoding remains supplied
by the application at runtime. No PROJ or Python dependency is added to the package.
Other horizontal grid metadata conventions and automatic structured operation
selection remain outside the supported native profile.

## Reproduction and maintenance

Normal checks are offline and consume checked-in reference data:

```sh
node modules/projection/scripts/check-native-reference.mjs
yarn exec vitest run --project node --project headless modules/projection/test
```

To regenerate, install `pyproj==3.7.2` in a separate Python virtual environment whose
wheel reports **PROJ 9.5.1**, then run:

```sh
python modules/projection/scripts/generate-native-reference.py
node modules/projection/scripts/check-native-reference.mjs
```

The generator validates both versions and grid hashes, disables PROJ networking,
and uses explicit operation pipelines. Unexpected oracle failures abort generation.
Source-manifest and generator hashes detect stale references in CI. The input fixtures,
reference coordinates and grid provenance live in `modules/projection/test/fixtures`.
Do not regenerate expectations from math.gl or proj4js, and review definition
translations and accuracy budgets whenever changing the oracle version.

The completed qualification profile and promotion decision are described in the
[native support and migration contract](./support.md). Unlisted parameter/domain
combinations and additional CRS/grid operations remain possible future extensions.

## Explicit vertical grids

Tranche 12A adds 10 authored configurations / 28 XYZM points generated by pyproj 3.7.2
and PROJ 9.5.1 with networking disabled. The GTX bytes, input definitions and generator
are hashed. Explicit oracle pipelines check source and destination geoid heights,
Helmert ordering, vertical feet, Mercator, axis signs/order, and prime-meridian sampling.
The [fixture provenance](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/README.md#vertical-height-reference)
explains regeneration. Scalar forward/inverse and Float64 paths use a 1e-5 tolerance;
Float32 paths also account for input/output rounding. Browser qualification repeats
these references in Chromium, Firefox and WebKit.

These are synthetic grids for checking operation semantics, not a claim of geoid-model
accuracy. Additional tests cover the prepared `@math.gl/geoid` adapter, horizontal-grid
ordering, nodata/coverage, optional/null fallbacks, buffer ownership, missing Z and partial
flat-array writes. Compound/vertical CRS execution, epochs and general
pipeline parsing remain outside this subset.


## Vertical GeoTIFF format qualification

Seven small authored MIT TIFF files / 30 XYZM points cover PixelIsPoint, PixelIsArea,
Deflate, big-endian scaled int16, nonzero tiepoint indices, nested images, nodata and
antimeridian sampling. A standard-library TIFF encoder writes the fixtures; pyproj
3.7.2 / PROJ 9.5.1 reads their exact bytes and supplies explicit `vgridshift` forward
and inverse expectations. The generator, input JSON and each TIFF are SHA-256 checked.
These are synthetic format tests, not geoid model accuracy claims.

Node/Chromium tests decode them with geotiff.js and check scalar/Float64 XYZM results
at 1e-5, preserve M, and separately exercise Float32 rounding. The three-browser
qualification runner decodes the same files after benchmark timing completes, so the
optional test decoder is excluded from measured projection bundles. Strict metadata,
ownership, fallback and rejection cases supplement those numerical references.

Regenerate with `modules/projection/scripts/generate-vertical-geotiff-reference.py` using
the pinned oracle environment; verify offline with
`node modules/projection/scripts/check-vertical-geotiff-reference.mjs`.
The adapter does not claim general raster or arbitrary PROJ grid support: other grid
operation types, projected/rotated rasters, overviews, non-metre units, non-bilinear
interpolation and ambiguous overlapping image layouts remain unsupported.
