# Native proj4 parity audit — September 29, 2026

**The native engine has broad algorithm coverage, but has not reached proj4js parity.**
The performance PR does not qualify it as a replacement. The original audit found accepted structured CRS definitions returning incorrect
coordinates, in addition to rejected definitions. The correctness follow-up below
fixes those demonstrated silent errors; broader qualification remains open.

This audit measures runtime revision `bf28217d` (PR #148) against proj4js **2.22.0**,
still npm's latest release when checked. It adds evidence beyond the existing
selected fixtures and synthetic grids. The original results below are preserved for comparison.

## Structured-method follow-up

The next follow-up repairs **30 more corpus cases**, bringing numeric passes from
**198/242 to 228/242**: PROJ 108/116, WKT 106/112, PROJJSON 8/8, and aliases 6/6.
There are **14 construction rejections**, no execution rejections, and no silent
mismatches in the accepted cases. Eight PROJJSON samples still do not establish
complete PROJJSON support.

The repaired cases cover Hotine variants A/B and legacy spellings, Krovak and its
North Orientated spelling, QSC, Cassini, spherical equidistant cylindrical, the
legacy North Pole stereographic method, and a redundant pseudo-Mercator semi-minor
radius hint. Variant-specific offsets and parameter units are preserved. Krovak's
fixed angles and the pseudo-Mercator radius hint are validated; arbitrary values
are not silently ignored. A bounded inverse-sine roundoff correction makes the
right-angle Swiss Hotine definitions finite. The North Pole stereographic spelling
uses the oblique alternative away from a pole and the polar kernel at a pole.

All 30 exceptions have been removed, so these cases now assert both original
coordinate directions. Additional tests exercise unit conversion, zero rectified
angles, duplicate/conflicting parameters, invalid fixed constants, and Swiss-origin
round trips. The remaining exceptions comprise **five axis-orientation coverage
gaps** and **nine deliberate strict-input differences**. Grid-edge policy, regional
validity limits and independent native PROJ accuracy qualification remain open.

See the [TypeScript engine guide](./typescript-engine.md) for registration, dynamic
loading, optional readers and measured bundle costs.

## Correctness follow-up (PR #149)

The follow-up fixes all **11 silent coordinate mismatches**, the **five pole/origin
roundoff rejections**, and the **NAD27 execution rejection**. At this stage the unchanged
upstream corpus passed **198/242** cases in both directions:

| Input | Passes | Construction rejections | Execution rejections | Silent mismatches |
| --- | ---: | ---: | ---: | ---: |
| PROJ strings | 106/116 | 10 | 0 | 0 |
| WKT | 81/112 | 31 | 0 | 0 |
| PROJJSON | 5/8 | 3 | 0 | 0 |
| Aliases | 6/6 | 0 | 0 | 0 |
| **Total** | **198/242** | **44** | **0** | **0** |

WKT1 polar stereographic latitude-of-origin now sets the latitude of true scale;
the actual origin is the corresponding pole. WKT2 variant A retains its pole and
scale factor. Structured latitude conversion tolerates only a few ULPs of pole
roundoff; invalid PROJ or structured latitude values still reject.

WKT1 recognizes the NZGD49 and Belge 1972 datum aliases. WKT2/PROJJSON projected
CRSs use a recognized geographic base-CRS authority ID before a datum-name lookup,
matching upstream's existing transformation table. Unknown IDs retain the name
fallback, and IDs on the projected CRS or datum itself are not interpreted as
geographic CRS IDs. Explicit TOWGS84 and BoundCRS transformations take priority,
including over named grids. These are compatibility choices, not a geographic
operation-selection database or independent geodetic validation.

All 242 original coordinate fixtures, tolerances and suite aliases are now checked
in with source hashes and attribution. Node and Chromium run them continuously.
The 44 rejections at this stage were individually listed in
`modules/proj4/test/fixtures/upstream-corpus-exceptions.json`: **35 open coverage
gaps** and **nine intentional strict-input differences**. The structured-method
follow-up above removes 30 of those entries. Each exception must still
throw its exact expected error; it cannot mask a new silent mismatch. Newly accepted
cases fail the exception check until their exception is removed and their coordinates
pass. Passing tests for expected rejections does **not** mean 242/242 parity.

This completed follow-up tranche 1 and the continuous-corpus gate from tranche 2.
Remaining method/parameter/axis mappings, grid coverage policy, regional validity
limits and independent native PROJ qualification remain open. The original kernel
and grid audit measurements below are unchanged by these normalization fixes.

## Original full upstream coordinate corpus

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

1. **Correctness first (completed):** polar WKT semantics, structured datum IDs/name aliases and
   precedence, and angular roundoff. Import regression fixtures for all 11 silent
   mismatches and five pole-definition failures. Unsupported operations must reject
   explicitly instead of silently selecting another interpretation.
2. **Structured compatibility (corpus method gaps fixed; axis mappings open):** enumerate and implement the missing method/parameter/
   axis mappings; disposition each strict-input rejection. Run the entire coordinate
   corpus continuously, with individually reviewed exceptions rather than a total pass count.
3. **Grid and domain policy:** resolve the two real-grid edge differences, add licensed
   maintained real datasets, and define projection validity/accuracy limits, particularly
   for regional approximations. Separate intentional rejections from wrong finite output.
4. **Independent qualification:** reproducible native PROJ reference generation, wider
   parameter/datum/pole/antimeridian coverage and supported-browser execution. Promotion
   remains a separate decision after these gates, not a consequence of faster benchmarks.

## Reproduce

The checked-in corpus runs without downloads with `yarn test-node modules/proj4/test`
and `yarn test-headless modules/proj4/test`. To re-extract its inputs and expectations,
add `--fixtures-output modules/proj4/test/fixtures/upstream-corpus-2.22.0.json`
to the corpus audit command. Exception dispositions are maintained separately and
are never generated by the audit command.

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
