# Independent projection validation

The native engine now has reference coordinates from **PROJ 9.5.1**, generated with
**pyproj 3.7.2** independently of proj4js. The corpus covers all **37 named algorithms**
with **134 configurations and 2,386 points**, plus **87 points in real horizontal
GeoTIFF and NTv2 datasets**. The internal Gauss helper is exercised through its parent projections.
These are sampled accuracy checks, not a claim of full-domain or full-CRS parity.

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
| Ellipsoidal CEA | 2e-8° inverse | Authalic-latitude inverse series. |
| Robinson | 1e-5 m forward / 1e-8° inverse away from exact knots | Uses PROJ coefficient precision. Exact knots are checked against their original latitude/longitude to 1e-8°; a separately declared 1e-4° comparison budget accommodates PROJ's unstable neighbouring-piece selection at knots. |
| Near-pole Mollweide / perspective horizons | 1e-7° inverse | Longitude becomes ill-conditioned near singularities; these remain sampled budgets. |
| Geocentric | 1e-6 inverse | The inverse includes height in metres as well as angles in degrees. |

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
Other grid metadata conventions, vertical grids and automatic structured operation
selection remain outside the supported native profile.

## Reproduction and maintenance

Normal checks are offline and consume checked-in reference data:

```sh
node modules/proj4/scripts/check-native-reference.mjs
yarn exec vitest run --project node --project headless modules/proj4/test
```

To regenerate, install `pyproj==3.7.2` in a separate Python virtual environment whose
wheel reports **PROJ 9.5.1**, then run:

```sh
python modules/proj4/scripts/generate-native-reference.py
node modules/proj4/scripts/check-native-reference.mjs
```

The generator validates both versions and grid hashes, disables PROJ networking,
and uses explicit operation pipelines. Unexpected oracle failures abort generation.
Source-manifest and generator hashes detect stale references in CI. The input fixtures,
reference coordinates and grid provenance live in `modules/proj4/test/fixtures`.
Do not regenerate expectations from math.gl or proj4js, and review definition
translations and accuracy budgets whenever changing the oracle version.

The completed qualification profile and promotion decision are described in the
[native support and migration contract](./native-support.md). Unlisted parameter/domain
combinations and additional CRS/grid operations remain possible future extensions.
