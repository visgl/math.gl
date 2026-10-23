# GeographicLib G3–G4 qualification

This bounded increment adds `EllipsoidMetrics`, optional geodesic edge `S12`, and
`GeodesicPolygon`. It does not replace the G0–G2 qualification or claim universal
finite-input correctness, arbitrary-flattening geodesics, or full GeographicLib
feature parity. G5/G6 and wider-domain Exact solvers remain separate work.

## Controls and budgets

The stored original workload has **593 cases**: 336 native metric/latitude
cases, 35 independent integral cases, 24 inverse edges, 48 direct/arc cases,
144 polygon/polyline cases, and six independent spherical triangles (each at
four length scales). Each case can gate several outputs. Node and Chromium,
Firefox and WebKit run the same source-bundled evaluator. Contract tests also
check all line entry paths, preview isolation, errors, reset, zero and ownership.

| Family | Declared sampled profile | Budget established before fixes |
| --- | --- | --- |
| G3 metrics | b/a = 0.5, WGS84 ratio, 1, near-sphere ±2^-40, 1.01, 2; a = 1e-30, 1, 6378137, 1e30; equator, tiny latitudes, ordinary latitudes and exact/near poles | 5e-14 × max(characteristic unit power, absolute expected value); length scales by a, area by a², volume by a³ |
| G3 six auxiliary latitudes and inverses | Same native domain; independent 80-digit integrals at five ratios and seven latitudes | 2e-11 degrees, including isometric degree units; exact pole infinities checked separately |
| G4 ordinary edge area | Sphere, WGS84, b/a = 1.01; dateline, antipodal/polar and ordinary paths | 5e-14 a² |
| G4 ordinary polygon area | Both winding conventions, unsigned complements, pole/dateline crossings, self-intersection, empty/repeated points; direct edges through four circuits | 5e-14 a² × max(1, number of inserted points/edges) |
| G4 perimeter | Same polygon/polyline workload; open polylines and signed direct distances | 5e-14 a × max(1, number of inserted points/edges) |
| G4 tiny area | Equatorial right triangles down to 1e-7 degree; 1,000 tiny loops; short equatorial 45° direct edges | 2e-8 relative area, with explicit a² floors of 1e-28 (edge), 1e-27 (polygon), 1e-29 (independent sphere); short direct edges use the relative budget without an absolute floor |
| G4 independent sphere perimeter | Analytic right spherical triangles, four scales | 5e-14 a |

Existing accuracy/coverage/bundle limits are unchanged. New metrics are limited
to 0.5 ≤ b/a ≤ 2 and reject nonrepresentable dimension results; they do not
silently extrapolate a series beyond a qualified flattening range. Sphere,
near-sphere, oblate/prolate and pole endpoint behavior is explicit in the API.

## Independent mathematics and native discrepancies

The standard-library Python generator uses **80-digit Decimal arithmetic**,
Machin π, Taylor trigonometry, and independently constructed 48-node Gaussian
quadrature to evaluate the meridian and surface integrals. Production uses
binary64 16-node quadrature with different subdivision. Independent inversion
controls supply mathematical auxiliary values, not production round trips.
Spherical excess of a right triangle is evaluated as
`2 atan(tan(delta/2)^2)` with high precision, including tiny areas.

For the tiny equatorial ellipsoidal triangles, the independent local metric
integral is `b² delta² / 2`, multiplied by the loop count when applicable. The
neglected relative curvature term is O(delta²), below 1e-12 for the stored
shapes and delta ≤ 1e-5 degree, well below the 2e-8 gate. For short equatorial
45° direct edges the corresponding integral is `distance² / 4`; its neglected
relative term is likewise below 1e-12. These are mathematical controls with
bounded remainders, not native values promoted to exact expectations.

Native GeographicLib C++ **2.7, tag r2.7**, archive SHA-256
`5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5`,
is the comparator. Both its series and elliptic-integral Exact geodesics/polygons
are recorded. The fixture records actual native significand precision (53 bits
for the recorded Apple arm64 precision-3 build), driver/generator hashes and the
complete native-data hash. A precision-3 build is not claimed to provide more
than 53 significant bits on this platform.

Polygon reduction uses the exact same cached authalic normalization as its
edge engine. Recomputing a nominally equivalent total area independently caused
a WebKit rounding residue at a degenerate zero-area boundary to select the full
unsigned complement; this is fixed and regression-tested. Projection gnomonic
uses the shared raw engine so optional public facade/area APIs are discarded from
projection-only bundles. Existing bundle limits pass without increases.

Two native limitations are explicit:

- Subtracting nearly equal C4 Fourier values loses tiny ellipsoidal area bits.
  Native series and Exact disagree, and both can disagree materially with the
  independent local integral. math.gl uses the cosine-difference identity,
  preserving the short arc before subtraction. Original native results remain
  stored and their discrepancies remain visible in reports; tiny-area gates use
  the independent mathematics. The 1,000-loop workload also checks compensated
  accumulation rather than allowing a global a² tolerance to hide small areas.
- Near a pole, native Exact distance inversion can lose phase bits, amplified
  into area errors. Those explicitly annotated Exact distance results are
  diagnostic; native series remains a gate, and independent high-precision
  sphere controls validate the conditioned case. Arc calculations compare the
  identical stored arc, not a distance recast as an assumed equivalent input.
  Exactly 1440° and `8*pi*a` in binary64 need not specify the same side of an
  exact pole. Different pole/antipodal branches are domain conventions, not
  silently widened error allowances.

No relative-area guarantee is claimed for arbitrary nearly cancelling,
non-equatorial polygons or unbounded numbers of circuits. The ordinary absolute
area budget remains visible. A sampled result is not an all-input proof.

## Reproduction and CI

```bash
# Ordinary CI: no native library, compiler, download or extra Python package.
python3 modules/geospatial/projection/scripts/generate-g34-reference.py --check
node modules/geospatial/projection/scripts/qualify-g34.mjs --output /tmp/g34.json
node modules/geospatial/projection/scripts/qualify-g34.mjs --browser chromium --output /tmp/g34-chromium.json
```

To regenerate native values, verify the pinned archive hash, extract r2.7 and
build its static C++ library with `GEOGRAPHICLIB_PRECISION=3` (for example CMake
`-DGEOGRAPHICLIB_PRECISION=3 -DBUILD_SHARED_LIBS=OFF`). Compile the original
`geographiclib-g34-oracle.cpp` driver with those generated/source include paths
and that static library, using the same precision configuration. Then run:

```bash
python3 modules/geospatial/projection/scripts/generate-g34-reference.py \
  --archive /path/to/geographiclib-r2.7.tar.gz --oracle /path/to/g34-oracle
# Same compiler/precision environment can check exact regeneration:
python3 modules/geospatial/projection/scripts/generate-g34-reference.py \
  --archive /path/to/geographiclib-r2.7.tar.gz --oracle /path/to/g34-oracle --check
```

No upstream implementation or test dataset is downloaded by CI. Existing
GeographicLib code remains MIT attributed; the adapted polygon transit/reduction
rules carry Charles Karney's 2010–2023 copyright and the owning module packages
the MIT terms. New integrals, driver, mathematical controls and stable-difference
follow-up are original math.gl code. No package manifest or lockfile changes.

Full API details: [metrics](../api-reference/ellipsoid-metrics.md) and
[polygon/edge area](../api-reference/geodesic-polygon.md).
