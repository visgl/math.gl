# Native proj4 parity audit — September 29, 2026

**The native engine has broad algorithm coverage, but has not reached proj4js parity.**
The performance PR does not qualify it as a replacement. The important new finding
is that some accepted structured CRS definitions return incorrect coordinates,
not merely that some definitions are rejected.

This audit measures runtime revision `bf28217d` (PR #148) against proj4js **2.22.0**,
still npm's latest release when checked. It adds evidence beyond the existing
selected fixtures and synthetic grids. No correctness fixes are included in this audit.

## Full upstream coordinate corpus

All 242 entries in upstream's tagged
[`test/testData.js`](https://github.com/proj4js/proj4js/blob/v2.22.0/test/testData.js)
were exercised in **both directions**, using each fixture's original expected
coordinates and the tolerances calculated by
[`test/proj4.test.mjs`](https://github.com/proj4js/proj4js/blob/v2.22.0/test/proj4.test.mjs).
The reference passes all 242. All native plugins, optional WKT/PROJJSON readers,
and the upstream suite's registered aliases were supplied.

| Input | Fixtures | Native passes both directions | Rejected | Returns out-of-tolerance coordinates |
| --- | ---: | ---: | ---: | ---: |
| PROJ strings | 116 | 106 | 10 | 0 |
| WKT | 112 | 67 | 37 | 8 |
| PROJJSON | 8 | 2 | 3 | 3 |
| Aliases | 6 | 6 | 0 | 0 |
| **Total** | **242** | **181** | **50** | **11** |

Of the 50 rejections, 49 occur at construction and one during execution (a NAD27
definition requiring unavailable grids). The 181/242 result is **74.8% of this
particular corpus**, not a percentage of complete proj4 compatibility. The PROJJSON
sample is especially small. This is the full coordinate fixture file, not the entire
upstream API test suite or an independent native PROJ accuracy corpus.

## Confirmed problems and compatibility decisions

1. **Polar WKT interpretation silently changes the projection.** Four fixtures
   (zero-based indices 220, 222, 223, 224) use `Polar_Stereographic` with
   `latitude_of_origin=±71`. Upstream interprets this as `lat_ts=±71, lat_0=±90`;
   native normalization retains `lat_0=±71`. At the pole, native returns a northing
   about **2,141,829 meters** from the expected origin. Another fixture differs by
   about **3,315,485 meters**. This is a blocking normalization bug.
2. **Datum name/authority resolution causes seven silent mismatches.** WKT datum
   aliases for NZGD49 and Belge 1972 are not recognized, skipping expected shifts
   (about **192 m** and **118 m** respectively). Structured EPSG datum identifiers
   are not used to choose upstream's EPSG-specific table entries: NAD83(CSRS),
   Segara, Belgian 1972, MGI and Amersfoort differ by about **0.44–176 m** in the
   tested cases. Copying the upstream datum table was insufficient; its lookup
   and precedence rules must also be reproduced and independently checked.
3. **Five valid pole/origin definitions are rejected due to roundoff.** Conversion
   from WKT angular units produces `90.00000000000003` degrees, then strict latitude
   validation rejects it. This affects northern azimuthal equidistant and Belgian
   Lambert definitions (indices 43, 130, 131, 132, 134).
4. **Structured method and parameter coverage is incomplete.** Rejections include
   Hotine variants A/B and ESRI spellings, Krovak/North Orientated, QSC, Cassini,
   spherical equidistant cylindrical, polar aliases, `semi_minor`, axis meridians
   and directional axis spellings. The numerical plugin being present does not
   imply its WKT/PROJJSON method is mapped correctly.
5. **Strict PROJ handling differs from upstream.** The ten rejected PROJ fixtures
   include ignored/redundant parameters, Krovak `alpha`, inferred UTM zones, and even
   a malformed trailing quote in upstream's `no_defs` fixture. These require explicit
   compatibility decisions; accepting every upstream input is not automatically a fix.

The machine-readable snapshot lists every failed fixture with its upstream index,
source line, rejection reason or numerical delta. Structured datum differences are
confirmed compatibility failures; deciding the geodetically correct operation still
requires an independent oracle, particularly when upstream uses different named and
EPSG-specific transformations.

## Numerical kernel stress comparison

A separate seeded sweep exercised **109 configurations × 256 points × two regions**:
27,904 points within ±5 degrees of existing fixture centers, and 27,904 globally
sampled points. The seed is `0x7a11deed`. Datums were disabled and configurable false offsets zeroed
to isolate equations (UTM retains its standard offsets); upstream's missing defaults were supplied explicitly. Geographic,
geocentric and oblique-composition coverage remains in the ordinary tests, not this sweep.

- Nearby: no forward differences above **1e-5 projected meters**, and no inverse
  differences above **1e-8 degrees** where the reference inverse is usable. Upstream
  `equi` inverse is excluded because it omits its return value.
- Agreement is not accuracy: **114 nearby ellipsoidal Cassini cases** exceeded
  **1e-6 degrees** round-trip error in both implementations. Regional series need
  documented validity/accuracy envelopes and an independent reference.
- Global: 1,060 native forward rejections despite finite upstream output, 582
  non-finite/error upstream forwards, two small forward differences above the strict
  threshold, and 554 inverse mismatches/rejections. Much of this exercises projection
  horizons or regional series far outside their useful domain. Several upstream
  inverse outputs have physically impossible latitudes. These counts need domain
  classification; they are not 554 newly established numerical bugs.

The sweep supports the fidelity of the common equation ports. It does not exercise
all parameter combinations, extreme ellipsoids, datum operations or CRS parsing.

## Real upstream grid fixtures

The audit additionally downloaded upstream's BETA2007 NTv2, downsampled Canadian NTv2
(with and without accuracy columns), and `ca_nrc_NA83SCRS.tif`. Files were kept external
to the repository, and their hashes are recorded. GeoTIFF was decoded with version 3.0.5.

| Grid cases | Upstream passes | Native passes |
| --- | ---: | ---: |
| BETA2007, three CRS targets, both directions | 6/6 | 6/6 |
| Canadian NTv2, two record layouts | 14/14 | 14/14 |
| GeoTIFF, three points, both directions | 6/6 | 4/6 |

Both GeoTIFF failures concern the western-edge point `[-80, 44.92]`. Upstream's
projected result corresponds to an underlying source-grid longitude of approximately
`-80.0000002894`, just outside the source extent. Native strict coverage rejects it.
This aligns with the documented decision to reject approximate/extrapolated edge
solutions, but fails an actual upstream fixture and needs an explicit policy review.
Interior and overlapping-subgrid cases pass. These few real fixtures do not establish
full real-world grid coverage or independent accuracy.

## Why the existing tests looked stronger

Most numerical kernels are direct TypeScript ports of upstream code. That makes broad
algorithm coverage achievable in a few large PRs, while preserving both strengths and
limitations of the original equations. The existing tests also select supported CRS
forms, often use nearby points, and sometimes neutralize known upstream bugs/defaults.
Batch/scalar tests share normalization and equations, so they cannot detect a shared
CRS interpretation bug. Passing them establishes batch consistency, not independent parity.

The inventory has 38 upstream files (37 projection modules and one helper), **all still
marked partial**. Its broad gap categories previously hid concrete missing behavior;
this audit gives those gaps measurable examples. Existing API compatibility checks
only establish that a CRS can be constructed, not that its coordinates are correct.

## Follow-up tranches before promotion

1. **Correctness first:** polar WKT semantics, structured datum IDs/name aliases and
   precedence, and angular roundoff. Import regression fixtures for all 11 silent
   mismatches and five pole-definition failures. Unsupported operations must reject
   explicitly instead of silently selecting another interpretation.
2. **Structured compatibility:** enumerate and implement the missing method/parameter/
   axis mappings; disposition each strict-input rejection. Run the entire coordinate
   corpus continuously, with individually reviewed exceptions rather than a total pass count.
3. **Grid and domain policy:** resolve the two real-grid edge differences, add licensed
   maintained real datasets, and define projection validity/accuracy limits, particularly
   for regional approximations. Separate intentional rejections from wrong finite output.
4. **Independent qualification:** reproducible native PROJ reference generation, wider
   parameter/datum/pole/antimeridian coverage and supported-browser execution. Promotion
   remains a separate decision after these gates, not a consequence of faster benchmarks.

## Reproduce

Build the current packages with `yarn build`. Obtain the unmodified files from the
[tagged upstream test directory](https://github.com/proj4js/proj4js/tree/v2.22.0/test)
into an external directory. The corpus audit verifies SHA-256 hashes and reads literal
fixture data without executing upstream test code. It prints failures as audit results;
exit success means the audit ran, not that parity passed.

```sh
node modules/proj4/scripts/audit-upstream-parity.mjs --upstream-tests /path/to/proj4js/test --output /tmp/proj4-corpus.json
node modules/proj4/scripts/audit-projection-kernels.mjs --output /tmp/proj4-kernels.json
node modules/proj4/scripts/audit-datum-grids.mjs --grids /path/to/proj4js/test --geotiff-module /path/to/geotiff/dist-module/geotiff.js --output /tmp/proj4-grids.json
```

The grid audit requires an independently installed geotiff reader; the projection
package gains no runtime dependency. Fixtures and tolerance semantics retain attribution
to proj4js 2.22.0 (MIT). Snapshot: `modules/proj4/test/fixtures/parity-audit-2026-09-29.json`.
