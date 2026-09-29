# Independent projection validation

The native engine now has reference coordinates from **PROJ 9.5.1**, generated with
**pyproj 3.7.2** independently of proj4js. The corpus covers all **37 named algorithms**
with **118 configurations and 1,612 points**, plus **80 points in two real horizontal
grid datasets**. The internal Gauss helper is exercised through its parent projections.
These are sampled accuracy checks, not a claim of full-domain or full-CRS parity.

The proj4js compatibility baseline remains **2.22.0**, checked against npm's latest
tag on September 29, 2026. Its separate upstream corpus still passes 233/242 cases,
with nine deliberate input rejections. An independent oracle matters because a
TypeScript port can reproduce a bug in the JavaScript implementation exactly.

## What the checks establish

Every configuration compares forward output with native PROJ and separately feeds
PROJ's projected coordinates into the native inverse. The scalar and in-place
Float64 paths both run in Node and Chromium, including four-component records and
trailing-ordinate preservation. This does not infer accuracy from a round trip.
Existing suites separately cover Float32 precision, units, aliases, axes and CRS readers.

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
| Robinson | 2 m forward / 2e-5° inverse | Legacy interpolation and numerical differences; observed forward maximum about 1.586 m. This is not sub-metre qualification. |
| Geocentric | 1e-6 inverse | The inverse includes height in metres as well as angles in degrees. |

### Cassini regional limits

Cassini's legacy series loses accuracy away from its central meridian. For an
ellipsoidal definition centered at longitude 10°, latitude 40°, these are the
largest component errors on nine-point matrices at the listed longitude **and**
latitude offsets. They are observations, not global bounds or suggested areas of use.

| Offsets from the center | Observed forward error | Observed inverse error | CI regression ceilings (m / degrees) |
| --- | --- | --- | --- |
| ±1° | 0.000236 m | 9.92e-9° | 0.001 / 2e-8 |
| ±3° | 0.0577 m | 2.71e-6° | 0.1 / 3e-6 |
| ±5° | 0.735 m | 3.91e-5° | 1 / 5e-5 |
| ±10° | 23.46 m | 0.001645° | 25 / 0.002 |

The looser Cassini and Robinson budgets keep known limitations visible and prevent
regression. They do not turn those limitations into geodetic accuracy guarantees.

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

## Real grids and boundary policy

The maintained fixtures are Germany's **BETA2007** and Canada's **NA83SCRS**, pinned
to an immutable PROJ-data revision with SHA-256 hashes and original redistribution
notices. Canada's file contains 14 nested images; Germany's contains one. Samples
include the center and points close to every image boundary, plus prior audit interiors.
Native PROJ's explicit `hgridshift` pipeline supplies forward and inverse references.
Tests decode the actual GeoTIFF bytes and check scalar/batch output to **1e-9 degrees**.

Outer nodes, shifted inverse boundaries, uncovered coordinates and explicit `null`
fallbacks also have policy tests. The two earlier Canadian western-edge audit failures
are now an explicit strict-coverage decision: inverting `[-80, 44.92]` produces an
approximate source longitude of **−80.00000028943268°** in PROJ, just outside the grid.
The native engine rejects this inverse instead of accepting an extrapolated source.
The fixture preserves PROJ's result to make the difference observable. Inverting a
valid shifted boundary point succeeds; `null` fallback is available only when declared.

The two GeoTIFFs occupy about 1.4 MB in the repository and are excluded from npm
packages. `geotiff` is a development dependency for tests; decoding remains supplied
by the application at runtime. No PROJ or Python dependency is added to the package.
Real NTv2 binary coverage, other grid metadata conventions, vertical grids and
structured operation selection remain separate work.

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

Remaining promotion gates include denser regional/domain sampling, better Cassini
and Robinson accuracy, more structured CRS and grid operations, broader browser and
startup performance baselines, and an explicit compatibility/migration decision.
