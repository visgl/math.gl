# Projection performance development history

Historical implementation measurements and development notes. For application guidance and live benchmarks, see [Performance](../docs/modules/projection/benchmarks.md).

Tranche 9 removes duplicate plugin-registry construction and resolves CRS kinds, unit
factors and Helmert coefficients once per compiled transform. It retains operation order,
validation, height handling and partial batch commit behavior. On the local Apple M2,
a paired CPU-time diagnostic against `a0d70d7c` showed 1.38–1.51× constructor throughput
across five cases. Transformation changes were smaller and mixed; elapsed measurements
on the busy host were too variable to support a general speedup claim. CI artifacts
provide the corresponding elapsed-time comparison for each PR revision.

`--allocations` uses V8's sampling heap profiler with a 4096-byte sampling interval,
including allocations collected by minor/major GC, in a separate untimed run. Reported
bytes per point are **sampled estimates of all JS allocations**, not retained heap,
exact counts, or counts of coordinate arrays. Near-zero samples do not prove zero
allocation. Built-in execution avoids temporary coordinate arrays; some kernels and
runtime operations still allocate objects. Custom plugins can provide mutable hooks
or retain their allocating scalar fallback.

The standard Node/browser benchmark suites also include proj4 comparisons for both
float types. Those suite timings include an identical buffer reset in every contender;
use the standalone runner for separate forward/inverse, dimension and allocation results.

## Tranche 10 batch-kernel measurements

The optional whole-buffer path fuses the simple geographic/projected pipeline around
Mercator, transverse Mercator/UTM and common conic equations. It preserves the equations,
validation and per-record commit contract; it does not change the scalar API.

Measured September 30, 2026 on Apple M2, Node 24.14.0, against master
`494d6fa5`, using 20,000 points and 11 rotated adaptive samples.
These are **main-thread CPU-time speedups**, not browser or elapsed throughput.
The ranges below span Float64 XY/XYZM and forward/inverse medians, not confidence intervals:

| Projection | Batch CPU-time speedup range |
| --- | ---: |
| Web Mercator | 1.16–1.58× |
| Ellipsoidal Mercator | 1.01–1.15× |
| UTM 31N | 0.98–1.05× |
| Lambert conformal conic | 1.03–1.14× |
| Albers equal area | 1.04–1.10× |
| Equidistant conic | 1.02–1.30× |

UTM is dominated by its projection equations and shows little change; there is no
uniform gain across every projection or direction. Scalar and construction results
remain mixed. Raw samples, variation, clock and source/workload fingerprints are retained
in [the diagnostic report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/batch-kernels-cpu.json).
Use the CI comparison artifact for elapsed measurements on each PR revision. Browser
qualification validates 792 warm workloads per engine, including the independent PROJ
reference corpus. Reuse compiled instances to amortize batch-factory setup.

## Historical initial measurements

Measured September 29, 2026 on Apple M2 / macOS arm64, Node v24.5.0
(V8 13.6.233.10-node.21), proj4 2.22.0. Median of 7 warmed
passes over 50,000 points. Selected Float64, 2D forward results, in **million points/second**:

| Case | math.gl flat | math.gl scalar | proj4 import | Wrapper | Batch/import |
| --- | ---: | ---: | ---: | ---: | ---: |
| Web Mercator | 18.68 | 11.93 | 4.42 | 4.39 | 4.22× |
| UTM 31N | 4.04 | 3.81 | 2.44 | 2.50 | 1.65× |
| Lambert conic | 9.39 | 8.15 | 3.51 | 3.69 | 2.67× |
| Helmert to Mercator | 4.12 | 3.84 | 2.21 | 2.29 | 1.86× |

Sampled estimated allocation bytes/point for the same cases (500,000 points per
implementation, separate profiling run):

| Case | math.gl flat | math.gl scalar | proj4 import | Wrapper |
| --- | ---: | ---: | ---: | ---: |
| Web Mercator | 0.04 | 159.70 | 601.33 | 607.11 |
| UTM 31N | 48.27 | 206.20 | 651.58 | 648.47 |
| Lambert conic | 0.44 | 159.33 | 600.47 | 598.27 |
| Helmert to Mercator | 79.07 | 239.64 | 957.04 | 953.60 |

Warmed constructor medians ranged from 21.0–33.7 µs for the math.gl projection engine,
versus 2.4–5.4 µs for the direct import. Prefer one compiled instance per
CRS pair. Construction order/JIT state affect these figures; use them as a local
baseline, not a production latency promise.


## Bundle budgets and release gates

The table below preserves the initial tranche 7 baseline. For current measurements,
including optional WKT/PROJJSON readers and grid adapters, see the
[projection engine guide](../docs/modules/projection/projection-engine.md#tree-shaking-and-bundle-size).

`bundle-budgets.json` records measured baselines and explicit limits with approximately
10% headroom, rounded up to 100 bytes. The check uses esbuild browser ESM targeting
ES2020, minification and gzip level 9. It exercises retained public exports rather
than an empty tree-shaken program. `allNativeExports` deliberately retains all plugins
and optional CRS/grid readers; it is not a default global projection preset.

| Retained entry | Minified bytes | Gzip bytes |
| --- | ---: | ---: |
| core | 42,306 | 15,612 |
| mercator | 43,672 | 16,090 |
| utm | 50,526 | 18,834 |
| allNativeExports | 138,144 | 47,432 |
| proj4Wrapper | 131,932 | 43,443 |


`check-experimental-package.mjs` separately checks that selected bundles exclude
unrelated plugins, readers and the upstream runtime. `check-packed-package.mjs` creates
real npm tarballs for proj4 and its math.gl dependencies, extracts them into an isolated
temporary consumer, and tests ESM, CommonJS, strict NodeNext declarations, batch behavior
and distributed licenses. The installed third-party proj4 dependency is reused without
fetching or publishing anything.

Tranche 9 compiled pipeline constants bring the rotated lazy example’s initial graph
to 17,720 gzip bytes on Node 24.14.0. Its allowance increases from 17,700 to 17,800
bytes; other byte limits remained unchanged in that tranche.

Tranche 10 adds the shared batch adapter to eligible projection bundles. Static bundles
retain their existing limits. The UTM, WKT and rotated lazy initial graphs now measure
48,390/18,137, 48,258/17,503 and 48,316/18,073 minified/gzip bytes respectively. Their
initial limits are reviewed and rounded up to 100 bytes; catalogue and deferred limits
remain unchanged. See the [current size tables](../docs/modules/projection/projection-engine.md#tree-shaking-and-bundle-size).

Performance and packaging do not establish geodetic parity. The math.gl projection engine is now the default;
the [support profile](../docs/modules/projection/support.md) defines the scope of the projection API
and the migration to the default Projection wrapper. Historical wrapper timings
refer to the upstream proj4js implementation. The historical wrapper was removed
when the package was renamed; current comparisons import `proj4` directly.


## Historical release qualification measurements

The checked-in raw reports under `modules/projection/test/fixtures/qualification/` include
source SHA-256 fingerprints, all samples, exact engine versions and methodology.
These recorded timings predate the Robinson pole correction and its 32 additional
reference points; subsequent CI artifacts qualify the updated source and corpus.
Measured September 29, 2026 on Apple M2 / macOS arm64, Node 24.5.0, with 20,000
points and seven samples. These are distinct from the earlier baseline above.

Selected Float64/2D forward throughput, in million points/second:

| Engine | Projection | math.gl flat | proj4 import |
| --- | --- | ---: | ---: |
| chromium 151.0.7922.34 | Mercator | 14.29 | 5.41 |
| chromium 151.0.7922.34 | UTM | 3.77 | 2.67 |
| webkit 26.5 | Mercator | 10.00 | 10.00 |
| webkit 26.5 | UTM | 4.00 | 4.00 |
| Node 24.5.0 | Web Mercator | 18.77 | 4.70 |
| Node 24.5.0 | UTM 31N | 4.09 | 2.45 |
| Node 24.5.0 | Lambert conic | 9.47 | 3.63 |
| Node 24.5.0 | Helmert to Mercator | 4.13 | 2.26 |

WebKit's coarse timer quantizes short workloads: its equal displayed values are
not evidence of exactly equal performance. Firefox startup stalls on this macOS 27
host; Linux CI runs all three engines, checks all independent projection fixtures,
and uploads its own versioned performance report. No Firefox result is inferred
from Chromium or WebKit.

The same-day [Linux CI run](https://github.com/visgl/math.gl/actions/runs/36636932010)
passed in all three engines on an AMD EPYC 9V74 / Linux x64 runner. Its raw report
is preserved as `qualification/browser-linux.json`, using the same runtime source
fingerprint, point count and sample count. Each engine verified all 134 configurations /
2,354 reference points and completed 64 warm workloads and 21 cold samples.

| Linux engine | Projection | math.gl flat (Mpoints/s) | proj4 import (Mpoints/s) |
| --- | --- | ---: | ---: |
| Chromium 151.0.7922.34 | Mercator | 7.69 | 3.08 |
| Chromium 151.0.7922.34 | UTM | 2.06 | 1.46 |
| Firefox 153.0 | Mercator | 6.67 | 3.33 |
| Firefox 153.0 | UTM | 2.50 | 2.00 |
| WebKit 26.5 | Mercator | 6.67 | 6.67 |
| WebKit 26.5 | UTM | 2.86 | 3.33 |

These shared-runner measurements also have timer quantization. math.gl flates are
not uniformly faster in every engine/workload: WebKit UTM was slower in this run.

Fresh Node process medians (OS caches warm; separate process/module registries):

| Import | Process lifetime (ms) | Module load (ms) | First construction (µs) |
| --- | ---: | ---: | ---: |
| native-selected | 40.02 | 7.43 | 1416.29 |
| native-barrel | 67.98 | 33.40 | 1396.17 |
| proj4 | 67.40 | 25.35 | 94.08 |
| wrapper | 59.00 | 26.82 | 108.21 |

Selected math.gl subpaths reduce module-loading work compared with the full barrel.
math.gl first construction remains more expensive than proj4's: prepare and reuse
converters rather than constructing one per coordinate. Browser cold measurements
separately record bundle fetch/parse/evaluation, first construction and first projection
in fresh contexts; they do not flush operating-system caches.

Sampled allocation estimates for math.gl batch versus proj4 were approximately
0 versus 595 bytes/point for Mercator, 49 versus 641 for UTM, 0 versus 595 for LCC,
and 78 versus 977 for Helmert-to-Mercator. Zero samples do not prove zero allocation;
these are V8 statistical estimates, including collected objects, not exact allocation
counts. Scalar APIs allocate output arrays; mutable batch hooks avoid those arrays.

Reproduce the additional qualification after building:

```sh
node modules/projection/scripts/benchmark-startup.mjs --samples 7 --output /tmp/startup.json
yarn playwright install --with-deps chromium firefox webkit
node modules/projection/scripts/benchmark-browser.mjs --points 20000 --samples 7 --output /tmp/browsers.json
```

Each browser first measures separate math.gl and direct-proj4 bundles, then checks
all independent projection references. Current warm workloads use the twenty-two-scenario
shared matrix described above, including XYZ. The historical tables retain their older
workload and wrapper column for provenance; they are not current benchmark results.
The runner bounds each browser to 300 seconds. CI keeps downloadable measurements and
gates correctness. The Node startup runner also checks the first computed coordinate in
every fresh process. Packed-consumer, tree-shaking and bundle-size checks exercise the
canonical projection paths and retained compatibility aliases.

### Compare operation pipeline performance

```sh
node modules/projection/scripts/benchmark-pipeline-compare.mjs --baseline-ref origin/master --points 20000 --samples 11 --allocations --output /tmp/proj4-pipeline-comparison.json
```

This runner compares the historical and current `ProjectionPipeline` using the same
source bundler and installed dependencies. The base must support the tested static
and kinematic pipeline APIs. It covers 31 scenarios in both precisions, XYZ/XYZM and
both directions (248 rows): units, signed axes, Mercator-to-UTM, static and exact
Helmert, horizontal/vertical grids, ordinate stacks and batch/mixed observation epochs.
Coordinates have repeatable bounded jitter around the independently checked fixtures.
One epoch buffer is supplied separately and stays unchanged; M varies by record.

Both runtimes pass pinned PROJ forward/inverse anchors before measurement. Every
seeded output is then checked against the baseline scalar result with precision-aware
tolerances, including exact M preservation. Mercator, Mercator-to-UTM and the static
datum-to-Mercator pair also include direct **proj4js 2.22.0** measurements, validated
within `1e-4` output units. Other rows omit this comparator: proj4js does not implement
the typed pipeline, exact Helmert or kinematic epoch contracts being measured.

The report labels baseline/current flat and scalar implementations separately. Setup,
fixture checks, coordinate preparation and buffer resets stay outside timing. Adaptive
sampling and rotating execution order match the existing comparison runner. Raw samples,
median/p10–p90, timing warnings, seed, workload/source/grid fingerprints, versions and
machine metadata are retained. `--scenarios` accepts comma-separated case names.
`--clock thread-cpu` provides the same optional CPU-time diagnostic; its timings describe
main-thread work rather than elapsed throughput. Allocation sampling starts after every timing row has finished, so profiling
does not affect later timing rows. Its untimed pass reports sampled estimates,
including collected objects. `--allocation-iterations` controls the untimed repetitions
(default 10, maximum 100,000), allowing allocation sampling of short repeated batches
without changing timing sample counts or default CI work. Optional `--allocation-sites`
requires `--allocations` and adds the largest sampled sites with compiled bundle positions
and call stacks. These positions are not source lines or counts of explicit object
creation, and sampling cannot prove an allocation-free runtime.

Tranche 13A keeps mutable kinematic coefficients and their cached epoch in owned
Float64 storage, reducing numeric boxing when epochs change. It also prepares fixed
unit factors and signed-axis selections once. It preserves equation/operation order
and checks
intermediate coordinates, so an invalid intermediate cannot be hidden by a later stack
restore. Float32 rounds only when each completed record is committed. That initial pass
kept general dispatch and one point/optional stack per flat call. The later unit/axis
pass below shares guarded scratch across calls and specializes eligible programs.
Neither pass adds per-record arrays, objects or dynamic code generation.

CI uploads `proj4-pipeline-comparison.json` alongside the ordinary projection comparison,
using 10,000 points and seven samples. It validates results and records measurements;
it does not require a speed ratio. Core, ordinary wrapper and selective projection
bundles were unchanged in that initial pass; the retained pipeline adds about 0.18 KiB minified / 0.01 KiB gzip.
Grid/datum-heavy and mixed-epoch workloads still need further profiling and do not have
a blanket speedup claim. The live table above continues to compare the ordinary
projection APIs; this paired pipeline report is a separate developer tool.

### Compare grid preparation and retained memory

```sh
node --expose-gc modules/projection/scripts/benchmark-grid-compare.mjs --baseline-ref origin/master --sizes 65,257,1025 --samples 11 --memory --output /tmp/projection-grid-comparison.json
```

This compares the historical and current horizontal grid readers with identical authored
bilinear fields. NTv2 bytes and already decoded GeoTIFF bands are prepared outside timing;
network and TIFF decoding are excluded. The reader must pass analytic forward/inverse
checks at edges and interior points. Samples alternate baseline/current order and retain
raw timings and machine/source/workload provenance. `--clock thread-cpu` optionally measures
main-thread CPU work on Node 24.14 or later; this is distinct from elapsed loading time.

Horizontal grids keep longitude/latitude node pairs in one owned Float64Array per subgrid,
using 16 bytes per node and avoiding a small JavaScript array for each pair. Preparing a
1025 × 1025 grid removes 1,050,625 such arrays. Reader ownership, node orientation, bilinear
summation order, nodata handling, coverage and inverse iteration limits remain unchanged.
This targets preparation and GC pressure; it does not imply a blanket point-throughput gain.

`--memory` runs three separate fresh processes for each reader/size/revision. Each measures
the change in `heapUsed + arrayBuffers` after full GC while retaining one prepared grid;
input bytes/bands are excluded. These engine-dependent estimates describe retained storage,
not total allocated bytes, peak memory or garbage-collection pauses. Small-grid differences
can be noisy. Omit `--memory` for timing only; `--expose-gc` also enables untimed collection
before timing samples. CI uses two small grids and three samples to check the runner and
upload a report; it applies no performance or memory threshold.

An October 2026 diagnostic on Apple M2 / Node 24.14.0 compared seven thread-CPU
samples against commit `6b2b154`. For 1025 × 1025 nodes:

| Reader | Preparation CPU, baseline → current | Retained storage, baseline → current |
| --- | --- | --- |
| NTv2 | 87.36 → 26.69 ms | 77.70 → 16.84 MB |
| GeoTIFF adapter | 96.14 → 40.70 ms | 77.70 → 16.84 MB |

These results describe synthetic grid preparation on one machine. Smaller-grid CPU
results were mixed, including slower medians at 65 × 65, and ordinary coordinate
throughput did not improve consistently. The
[raw grid report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/grid-preparation-node.json)
retains all sizes, samples and provenance. The
[paired coordinate report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/allocation-projections-node.json)
covers the five changed algorithms and NTv2, both precisions, XY/XYZM and both directions.

### Allocation checks

The live comparison also includes AEQD, Robinson, Oblique Mercator, QSC and tilted
perspective. Their mutable equations reuse the working point or local numbers instead of
creating coordinate result objects; Robinson's Newton solver avoids a per-point callback.
Robinson follows PROJ's float-rounded tables, while proj4js uses double coefficients.
Its comparator allows 0.5 metres forward and 1e-4 degrees inverse; the independent PROJ
accuracy budgets remain unchanged, including the documented table-knot exceptions.
Scalar methods still return owned arrays, while reusing one private working point.
Scalar pipelines also cache their ordinate stack. Recursive hooks receive isolated
fallback storage; exceptions release the scratch lease. The safeguards add approximately
0.1–0.2 KiB gzip to selected core/Mercator/pipeline bundles, with the existing deferred
budgets retained. Flat methods keep one working point and an
optional typed ordinate stack per call, rather than per record. Custom plugins/grids should
provide mutable hooks to avoid the legacy array-returning fallback.

```sh
node modules/projection/scripts/audit-allocations.mjs --check --output /tmp/projection-allocations.json
```

The source-wide AST inventory covers all projection runtime files. CI checks the numerical
paths for explicit object/array/function creation and allocating methods. Setup, returned
scalar arrays and failure diagnostics are reviewed separately. This helps prevent regressions;
JIT numeric boxing and external hook behavior still need heap profiling.

The separate untimed Inspector sampling pass estimated 487.7 → 157.1 allocated bytes
per point for the scalar stack-and-datum chain and 188.7 → 100.5 for the mixed-epoch
Helmert chain. These are sampled estimates, including collected objects, rather than
exact counts or a throughput promise. Public result arrays still allocate, and flat
paths still show some engine allocations despite having no explicit per-record objects.
See the [paired pipeline report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/allocation-pipeline-node.json)
for all allocation samples and timing rows.


### Compare reusable scalar outputs

Both paired runners accept `--reusable-results`. This adds **math.gl scalar array output**
and **math.gl scalar typed output** alongside the existing allocating scalar/flat modes.
The runners reuse input and output storage, call `projectToSync` / `unprojectToSync`, and
copy results into the same final typed-buffer layout. Setup is outside timing, no per-point
subarrays are created, and every output ordinate is checked before measuring. Pipeline
observation epochs remain separate from M. The live table retains its three existing columns.

```sh
node modules/projection/scripts/benchmark-compare.mjs --baseline-ref origin/master --reusable-results --points 10000 --samples 7 --output /tmp/projection-scalar-results.json
node modules/projection/scripts/benchmark-pipeline-compare.mjs --baseline-ref origin/master --reusable-results --allocations --points 10000 --samples 7 --output /tmp/projection-pipeline-results.json
```

`arrayOutputSpeedup` and `typedOutputSpeedup` divide the current allocating scalar median
by the current reusable-output median. Values above one indicate faster reusable outputs.
Historical/current scalar and flat ratios remain separately reported. When the baseline
supports reusable outputs, both versions run those modes with the same storage/return-type
mix during warm-up. `pairedArrayOutputSpeedup` and `pairedTypedOutputSpeedup` compare the
baseline reusable-output median with the corresponding current median. Baselines predating
these APIs keep the current-only rows. This matters because JavaScript optimization can
respond differently to mixed return-storage types. The pipeline runner
samples allocation only after all timings; these are estimated allocated bytes, including
collected objects, rather than exact counts or proof of zero allocation.

An October 2026 Apple M2 / Node 24.14.0 diagnostic compared commit `c213a0b4` with these
APIs using 10,000 points and seven thread-CPU samples. Each report contains 32 rows across
four scenarios, both precisions/layouts and both directions. Reusing array outputs had median
speed ratios of 0.97× for ordinary projections and 0.99× for pipelines; typed outputs were
0.96× in both reports. This is an allocation reduction with no consistent throughput gain.
Selected pipeline allocation estimates were:

| Pipeline | Owned-array scalar | Reused array output | Reused typed output |
| --- | --- | --- | --- |
| Mercator | 74.7 B/point | 0.08 B/point | 0 sampled B/point |
| Horizontal grid to UTM | 224.8 B/point | 147.2 B/point | 144.5 B/point |
| Height stack and datum | 156.7 B/point | 78.2 B/point | 78.0 B/point |
| Mixed epoch Helmert | 96.2 B/point | 17.0 B/point | 15.3 B/point |

The [ordinary raw report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/reusable-scalar-projections-node.json)
and [pipeline raw report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/reusable-scalar-pipelines-node.json)
retain timings, sample variation, runtime/source/workload provenance and allocation estimates.
Grid/datum and mixed-epoch runtime allocations remain profiling targets. Use flat APIs for
large buffers; deferred scalar requests still snapshot inputs and allocate promises, so use
explicit synchronous methods after preloading when reusing scalar storage.

The added APIs cost 619 gzip bytes for core, 624 for selective Mercator and 472 for a
pipeline-only import (browser ESM/es2020, minified, gzip level 9). All-root exports add 723
bytes. Only exceeded static/initial bundle limits are increased with rounding headroom;
deferred projection chunks and optional deformation-model profiles are unchanged. CI records
reusable-output pipeline measurements with seven samples and a shorter 4 ms aggregate
window across the full scenario/layout/direction matrix. Developer runs retain the 12 ms
default. Correctness/package budgets are enforced without speed thresholds.


### Unit conversion batches and repeated bulk calls

Pipelines containing only unit/axis steps, with at least one unit conversion in the
selected direction, use a whole-buffer numeric runner. Pure axis programs keep general dispatch; the separately qualified static Helmert
subset is described below. Mixed programs retain general dispatch; their expanded qualification is described at the end of this page. Multiplication and division remain distinct, each
intermediate must be finite, and Float32 rounds only on a completed record. Stride,
height, trailing ordinates, epoch validation and partial-error behavior are unchanged.
General scalar/bulk calls share one instance point and a lazily cached pipeline stack;
recursive hooks receive independent scratch, and failures release the lease.

The October 2026 Apple M2 / Node 24.14.0 paired diagnostic against `1ce5edef` uses
10,000 points, seven 12 ms thread-CPU samples and matching baseline/current reusable-output
modes. Across eight layout/direction rows, inverse angular-unit conversion has a median
1.80× flat speed ratio. Pure axis results varied across runs, so that subset keeps general
dispatch. Mixed grid/datum and mixed-epoch flat ratios were approximately 1.00×.
Scalar timings were mixed, including slower axis rows; this is a targeted batch improvement,
not a general throughput claim. See the
[raw batch report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/numeric-batches-node.json)
for all 48 rows, samples and separate allocation estimates. The full bounded CI runner
qualified the then-current 22 scenarios / 176 rows, including both baseline/current output modes where
available, without a speed threshold.

Large buffers amortize point/stack setup. To expose allocation traffic in repeated short
calls, increase untimed allocation repetitions while keeping timing samples independent:

```sh
node modules/projection/scripts/benchmark-pipeline-compare.mjs --baseline-ref origin/master --points 10 --samples 7 --min-sample-ms 4 --allocations --allocation-iterations 10000 --scenarios 'Height stack and datum,Horizontal grid to UTM' --output /tmp/projection-bulk-leases.json
```

For ten-point calls, the sampled stack/datum estimate decreased from 109.3 to 77.1 B/point;
the horizontal-grid chain decreased from 147.5 to 142.9 B/point. These estimates include
collected JavaScript objects, are not exact allocation counts, and do not measure GC pauses.
All short-call timing rows hit the aggregate-iteration cap and are flagged `timingLimited`;
use this run for allocation evidence rather than a throughput claim. The
[raw bulk-lease report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/bulk-leases-node.json)
retains runtime/source/workload provenance and 100,000 coordinates per allocation profile.

The optional pipeline import measures 58,759 minified / 21,108 gzip bytes: +1,746 / +499
versus the reusable-output tranche. Core/selective imports add 150 minified bytes with
negligible gzip changes. Deferred projection chunks and deformation-only profiles are
unchanged. Only exceeded bundle allowances increase with reviewed rounding headroom.


### Static Helmert coordinate buffers

A pipeline direction with exactly one active static Helmert step now transforms
Float32/Float64 buffers with numeric locals. This covers translation/scale, small-angle
and exact rotations, both position-vector and coordinate-frame conventions, and
inverse-oriented steps. Scalar calls keep their existing point operations. Mixed
unit/axis/datum chains, grids and stacks keep general dispatch. Kinematic rates
now also have the single-stage specialization described below.

The buffer runner preserves each scalar equation's multiplication, division and
addition order. Exact rotations use the same prepared matrix as the scalar stage;
the inverse subtracts translation and divides by scale before applying its transpose.
It does not fold a whole operation into an affine matrix, omit terms with zero
coefficients or change small-angle inverse semantics. Every record validates finite
XYZ and supplied epochs, checks output/Float32 range before writing, and preserves M
and all later ordinates. On failure, completed records remain transformed and the
failing record and tail remain unchanged.

Qualification combines the pinned PROJ pipeline corpus with seeded bit-for-bit
scalar/general-dispatch comparisons, both precisions, XYZ/XYZM and six-component
buffer views. Tests cover both conventions, inverse/omitted directions, caller
parameter snapshots, explicit epoch requirements, recursive hooks and failure
commits. The source allocation guard includes the new buffer loop. No objects,
arrays or functions are created inside its successful coordinate path; sampled
allocation remains a diagnostic rather than a guarantee about all JavaScript engines.


The October 2026 Apple M2 / Node 24.14.0 diagnostic compares against `fefea8f7`
with 50,000 points, nine 12 ms thread-CPU samples and matched baseline/current
reusable-output modes. Independent anchors and every seeded ordinate pass before
measurement. Across 32 translation/small-angle layout/direction rows, the median
flat ratio is 1.76×; across 24 exact-rotation rows it is 1.38×. Every measured static
Helmert flat row improves in this run. The three control-scenario medians are
0.99× (angular units), 1.00× (horizontal grid to UTM) and 1.03× (mixed epochs).
Scalar medians are approximately unchanged.

Local CPU contention and GC produced spread warnings: 54 of 80 rows flag at least
one implementation, and 20 hit the aggregate-iteration limit. Among the 56 static
Helmert rows, 27 flag spread in a flat implementation and 13 are timing-limited.
These flags, raw samples and p10–p90 remain in the
[raw report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/helmert-batches-node.json).
Treat ratios as targeted CPU-time observations, not elapsed throughput guarantees
or a state-of-the-art claim. Repeat on the application's browser and hardware.

Untimed allocation sampling follows all timing. Most static flat profiles sample
zero for both baseline and current; these measurements do not establish an
allocation reduction or prove zero allocation. The new loop avoids mutable point
field writes and contains no explicit successful per-coordinate allocation sites.
Pipeline/all-root bundles measure 60,140/179,812 minified and 21,591/60,993 gzip bytes:
+1,381/+1,383 minified and +483/+497 gzip versus the operation-selection tranche.
Core, wrapper, selective, operation catalogue, deformation and lazy initial/deferred
profiles remain unchanged. Only exceeded pipeline/all-root allowances increase.


### Kinematic Helmert coordinate buffers

A direction with exactly one active kinematic Helmert step now transforms
Float32/Float64 buffers using numeric locals and the scalar stage's owned
coefficients. A constant batch epoch prepares and reads the matrix once; separate
per-record epochs use the existing epoch preparation and cache. Both rotation
conventions, exact and small-angle rotations and inverse-oriented steps preserve
the full scalar matrix arithmetic, including zero terms and division order.
Mixed-stage chains continue through general dispatch.

Tests compare every ordinate bit-for-bit with scalar and general dispatch across
both precisions, XYZ/XYZM and six-component views, repeated/alternating epochs and
both directions. Independent PROJ anchors cover all 12 kinematic configurations /
48 coordinate-epoch pairs. Failure tests check epoch/XYZ validation precedence,
invalid adjusted parameters, Float32 overflow, completed-record commits, cache
recovery, parameter snapshots, empty buffers and recursive hooks. Epoch buffers
remain borrowed and cannot overlap coordinates; M and all later ordinates remain
untouched. Packed ESM/CommonJS consumers exercise exact rotations and typed epochs.

The source allocation guard includes the new record loop. It creates no explicit
objects, arrays or functions in successful coordinate execution and avoids mutable
point field writes. Epoch preparation remains shared with scalar calls; heap
sampling remains diagnostic and does not establish zero allocation or a GC benefit.


The October 2026 Apple M2 / Node 24.14.0 diagnostic compares against `a1b36de3`
with 10,000 points and seven 4 ms thread-CPU samples. The four matched runners are
baseline/current flat and ordinary scalar calls; reusable-output modes are excluded
from this targeted comparison. Independent anchors and every seeded ordinate pass
before timing. Across 24 constant-epoch rows the median flat ratio is 2.91×;
across 24 mixed-epoch rows it is 1.35×. Scalar medians are approximately unchanged.
Control flat medians are 1.03× for static Helmert and 1.01× for horizontal grid to UTM.

The report flags spread in at least one implementation for 57 of 64 rows and
aggregate limits for five. Forty of the 48 targeted rows flag spread in a flat
implementation; four mixed-epoch Float32 rows are at or below baseline, including
one at 0.66×. These ratios are CPU-time observations with substantial variation,
not guaranteed elapsed throughput or a state-of-the-art claim. Keep the
[raw samples and warnings](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/kinematic-helmert-batches-node.json)
when interpreting the result, and repeat on the application's browser and hardware.

A longer-sample confirmation repeats the exact batch, exact mixed and inverse exact
mixed cases plus both controls: 20,000 points, nine 8 ms thread-CPU samples and no
allocation sampling. The eight constant-epoch rows have a 2.86× median; all 16 mixed
rows improve, with a 1.26× median and a 1.16–1.53× range. Static/grid control medians
are 1.01×/1.01×. Eighteen of 40 rows still flag spread in at least one runner, and
six hit the aggregate limit. The
[confirmation report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/kinematic-helmert-batches-confirmation-node.json)
retains those warnings; it supports the targeted optimization without proving
universal gains.

```sh
node modules/projection/scripts/benchmark-pipeline-compare.mjs \
  --baseline-ref a1b36de3 --points 20000 --samples 9 --min-sample-ms 8 \
  --clock thread-cpu \
  --scenarios 'Batch epoch Helmert,Mixed epoch Helmert,Mixed epoch inverse exact Helmert,Static Helmert,Horizontal grid to UTM' \
  --output /tmp/kinematic-helmert-confirmation.json
```

Untimed allocation sampling follows all timing: constant-epoch flat profiles sample
zero in both versions; mixed-epoch flat estimates remain roughly 14.5–17.6 B/point.
The profiles do not establish an allocation reduction. The source guard separately
checks explicit allocation sites in the new loop.

Pipeline/all-root bundles measure 61,230/180,906 minified and 21,933/61,346 gzip bytes:
+1,090/+1,094 minified and +342/+353 gzip versus static Helmert buffers. Core, wrapper,
selective, catalogue, deformation and all lazy initial/deferred profiles remain
unchanged. Only exceeded pipeline/all-root allowances increase with rounding headroom.


### Grid scratch and mixed-pipeline qualification

The shared pipeline matrix adds horizontal-grid sampling and approximate/exact
Helmert chains with units, signed axes and batch/per-record epochs. It now covers
31 scenarios / 248 layout-direction rows, with independent authored unit/axis
oracles composed with pinned PROJ anchors.

A numeric-buffer prototype for mixed unit/axis and Helmert chains improved throughput
but showed intermittent sampled allocation regressions after heterogeneous warmup.
Narrowing it to constant-epoch rate stages did not remove that regression, so the
prototype was not retained. Per-record epoch specialization also lacked repeatable
speed gains. Mixed pipelines keep the existing general runner. The new cases and
optional `--allocation-sites` diagnostics establish the next qualification gate;
throughput alone is insufficient.

```sh
node modules/projection/scripts/benchmark-pipeline-compare.mjs \
  --baseline-ref 4f0d3ae2 --points 10000 --samples 7 --min-sample-ms 4 \
  --clock thread-cpu --allocations --allocation-sites \
  --scenarios 'Static Helmert with units and axes,Exact Helmert with units and axes,Batch epoch Helmert with units and axes,Mixed epoch Helmert with units and axes,Static Helmert' \
  --output /tmp/mixed-helmert-comparison.json
```

Prepared horizontal grids separately reuse a private working point for their
owned-tuple `shift()` API. The interpolation and bounded inverse kernel are unchanged;
`shiftInPlace()` still borrows the caller's point, while every successful `shift()`
returns a new pair. Scratch never escapes and is reset before each call, including
calls following coverage failures or inverse errors. This removes an explicit small
object even when JIT timing or heap samples are inconclusive.

```sh
node modules/projection/scripts/benchmark-grid-compare.mjs \
  --baseline-ref 4f0d3ae2 --sizes 65 --samples 9 --clock thread-cpu \
  --coordinates --allocations --points 20000 \
  --output /tmp/grid-coordinate-comparison.json
```

`--coordinates` times forward/inverse sampling separately for matching owned tuples
and mutable outputs. Prepared grids, input generation and result buffers are outside
timing; twenty warmups, rotated order and exact all-coordinate comparisons supplement
the authored bilinear anchors. `--allocations` runs afterward and requires
`--coordinates`; it reports sampled collected allocations, including runtime boxing.
The existing preparation/retained-memory measurements stay separate. CI records
bounded coordinate/allocation runs alongside the preparation reports.


The [grid coordinate report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/grid-coordinate-scratch-node.json)
uses 65 × 65 nodes, 20,000 coordinates and nine samples. All timing rows flag wide
spread, so they do not establish a speedup. Separate owned-tuple allocation samples
show:

| Reader / direction | Baseline → scratch, sampled bytes/point |
| --- | ---: |
| NTv2 forward | 183.6 → 111.6 |
| NTv2 inverse | 279.9 → 210.4 |
| GeoTIFF adapter forward | 183.8 → 112.2 |
| GeoTIFF adapter inverse | 283.8 → 214.1 |

Mutable-output controls measure about 31–34 B/point forward and 129–133 B/point
inverse. These are V8 sampling estimates, including numeric boxing and collected
allocations; they are not exact object sizes or GC-pause measurements. The source
guard independently prevents reintroducing a working object inside the tuple adapter.

On Node 24.14.0 the grid adapter adds 12 minified bytes to horizontal-reader,
wrapper and all-root profiles, with 6–16 gzip bytes. Pipeline-only, core, selective
projection, catalogue and deformation profiles are unchanged. Existing static and
lazy bundle allowances remain unchanged. The private working point is retained once
per prepared grid; owned result arrays and runtime numeric boxing remain.


### Spheroid numerical boundaries

The retained measurement snapshot precedes the later master merge; its source
fingerprint identifies the measured candidate. The numerical kernels are unchanged
by that merge. Final bundle checks include the landed grid scratch adapter.

The ellipsoid convergence follow-up improves near-pole latitude and bounds surface
inversion, while preserving separate projection/geospatial contracts. The paired
[spheroid report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/spheroid-boundaries-node.json)
compares master `7bc0ba63` with candidate `c52156b4` on Apple M2 / Node 24.14.0: 5,000
points, seven samples, a 4 ms thread-CPU aggregate, Float64 XYZM, both directions
and regional/near-pole inputs for WGS84, a sphere and a 2:1 flattened spheroid.

Every coordinate is checked against an authored unit-normal support-point
construction before timing. Projection flat and reusable scalar outputs are
compared alongside geospatial reusable scalar outputs. The baseline geospatial
near-pole latitude keeps its recorded 1e-6° allowance; the candidate and projection
use 1e-9°. Cartesian/height allowance is 10 μm. This is a bounded test profile,
not a global inverse error bound. At ±89.999999° the baseline geospatial latitude
error is about 2.1e-7° on WGS84/sphere and 4.8e-7° on the flattened case; the
candidate has zero sampled latitude difference from these anchors.

All twelve timing rows flag spread and one hits the aggregate limit. Some inverse
ratios regress, so these measurements do not establish a speedup. The accuracy
and bounded-execution changes are retained for correctness. Setup, loading and
input generation are excluded; kernel consolidation still needs setup and wider
domain measurements.

Separate heap sampling follows **all** timing, including collected allocations.
For geospatial reusable-output inverses, sampled bytes per point are:

| Shape / region | Baseline → candidate |
| --- | ---: |
| WGS84 regional | 126.7 → 90.0 |
| WGS84 near poles | 124.4 → 89.5 |
| Sphere regional | 121.1 → 92.5 |
| Sphere near poles | 129.7 → 89.7 |
| Flattened regional | 128.2 → 92.1 |
| Flattened near poles | 124.9 → 94.3 |

These samples include runtime boxing and profiler effects; they are not exact
object sizes or a zero-GC proof. Two explicit inverse arrays are removed, and a
source guard covers the five modified numeric functions. Owned default results
and failure errors are allowed. Caller-provided outputs, aliased buffers, preserved
M, unsupported-input recovery and recursive setters have Node/Chromium coverage.

```sh
node modules/projection/scripts/benchmark-spheroid-compare.mjs \
  --baseline-ref 7bc0ba63 --points 5000 --samples 7 --min-sample-ms 4 \
  --clock thread-cpu --allocations --output /tmp/spheroid-comparison.json
node modules/projection/scripts/check-spheroid-allocations.mjs
```

The analytic spherical inverse adds 148 minified bytes to retained projection
profiles. Core/pipeline/all-root measure 49,411/61,378/181,066 minified and
17,871/21,964/61,391 gzip bytes. Only exceeded core/UTM/WKT/PROJJSON minified and
WKT/rotated lazy initial allowances increase; gzip/deferred allowances stay intact.
Projection still has no production dependency on the geospatial class. Existing
CesiumJS/proj4js SPDX attribution remains attached, and no external model data or
conversion code is added.


### Shared spheroid conversions

The shared-conversion [paired report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/shared-spheroid-node.json)
uses Apple M2 / Node 24.14.0, 5,000 Float64 XYZM points, seven samples and 4 ms
thread-CPU aggregates. Baseline `66b70d5e` contains the landed #187 spheroid code;
the candidate source fingerprint identifies this extraction. Both runtimes use
the same independently authored normal-support workload, with every output
validated before timing. Sphere, WGS84 and 2:1 flattened shapes are sampled in
regional/near-pole regions, both directions, scalar reusable outputs and flat
buffers. The extended extreme-flattening/interior tests are separate correctness
qualification, not timing scenarios that the historical runtime supports.

Complete public constructor factories are now timed separately in rotated order,
20 instances per aggregate; these include shape snapshots and CRS parsing but
exclude module loading. Coordinate timing excludes construction, source generation,
reset copies and validation. Heap samples run after all timing and include collected
allocations. Geospatial now reuses a plain scratch point and a setup-time shape
snapshot; projection writes directly to its existing owned point. The shared leaf
creates no coordinate arrays/objects. The source guard covers 11 numeric functions;
runtime boxing remains separately sampled.

The measured geospatial forward ratios range from 1.52 to 1.92x baseline
in this snapshot. Several projection scalar/flat and flattened inverse cases
regress, and 11 of the twelve rows flag timing spread. There is no overall throughput claim. Geospatial forward
samples fall from roughly 200 bytes/point to near zero; inverse samples are lower
for geospatial and generally similar for projection in this run. Zero samples
are not a zero-allocation or zero-GC proof. The extraction deliberately avoids
passing large numeric argument lists or vector-class outputs across the shared
inverse boundary, which increased sampled allocations in local diagnostics.

The [selective source-graph report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/shared-spheroid-bundles.json)
compares identical historical/current source-level entries, browser ESM/es2020,
esbuild minification and gzip level 9. Core's root graph is unchanged; the numeric
leaf has no runtime imports, and projection graphs retain no geospatial/culling
classes. The new leaf measures 1,734 minified / 803 gzip bytes. Source-graph deltas are
+1,334/+475 for projection core, +1,373/+423 for pipelines and +2,362/+852 for the
Ellipsoid entry; core root adds zero bytes. Packed ESM core/pipeline/all-root
measure 50,744/62,749/182,457 minified and 18,340/22,409/61,880 gzip bytes.
Source-graph and packed ESM budgets use separately recorded bundling methods. New fallback support and public adapters have a bundle cost;
only measured exceeded allowances are updated. Full upstream MIT attribution
ships in the core package; no new third-party source or model data is added.

```sh
node modules/projection/scripts/benchmark-spheroid-compare.mjs \
  --baseline-ref 66b70d5e --points 5000 --samples 7 --min-sample-ms 4 \
  --clock thread-cpu --allocations --output /tmp/shared-spheroid-comparison.json
node modules/projection/scripts/check-spheroid-boundary.mjs \
  --baseline-ref 66b70d5e --output /tmp/shared-spheroid-bundles.json
node modules/projection/scripts/check-spheroid-allocations.mjs
```

## Shared local frames

The optional `@math.gl/core/local-frame` entry shares original ENU rotation and
ENU/NED matrix arithmetic between geospatial and deformation. It creates no
coordinate objects; basis storage is allocated once at setup. Cartesian-gradient
up for geometry and inverse-geodetic up for deformation remain distinct at height.
The paired diagnostic validates every output independently before timing.

```sh
node modules/projection/scripts/benchmark-local-frame-compare.mjs \
  --baseline-ref f59efba9 --points 5000 --samples 7 --min-sample-ms 4 \
  --clock thread-cpu --allocations --output /tmp/local-frame-comparison.json
node modules/projection/scripts/check-local-frame-boundary.mjs \
  --baseline-ref f59efba9 --output /tmp/local-frame-bundles.json
```

Thread CPU timing requires Node 24.14 or later. Wall time is the default. The
workload covers WGS84, sphere and 2:1 flattened shapes, both hemispheres,
regional/near/exact poles, surface/elevated origins, ENU/NED matrix commits,
direct deformation, reusable pipeline scalar output and Float64 XYZM batches.
Exact-pole anchors choose canonical zero longitude; separate tests qualify the
adapters' distinct pole conventions. Deformation is forward-only in this timing
profile; inverse contracts have separate regression tests.

Preparation, loading, result allocation and buffer resets are outside coordinate
timing. Public geometry/model construction has separate samples. Raw timings,
rotated execution order, spread/aggregate warnings, source/workload hashes and
collected allocation samples after all varied timings are retained in the report.
CI runs a smaller diagnostic and uploads JSON; it does not enforce a speed gate.

Local Node 24.14.0 measurements show noisy timing, with improvements in some
geospatial frame rows and mixed deformation/pipeline results. Sampled median
allocation traffic does not increase versus master; numeric boxing remains visible
in both versions. Zero heap samples would not prove zero allocations. This is
scoped consolidation and ownership qualification, not a universal speedup claim.

Selective source bundles (esbuild browser/es2020, minification and gzip level 9):

| Import | Minified bytes | Gzip bytes | Gzip change vs master |
| --- | ---: | ---: | ---: |
| Whole local-frame leaf | 2,711 | 1,000 | New optional entry |
| Deformation model | 4,500 | 1,775 | +174 |
| Geospatial Ellipsoid | 38,889 | 12,259 | +695 |
| Core root | 42,048 | 12,033 | 0 |
| Projection core | 51,320 | 18,364 | 0 |
| Model-free pipeline | 63,474 | 22,382 | 0 |

These source profiles differ from the packaged-entry budget profiles above. Graph
checks require no runtime dependencies in the leaf, no geometry/culling in
projection and no retained local-frame leaf in the three unchanged graphs.
Successful coordinate source allocations are separately guarded in eleven functions.

## Reusable scratch and buffer layouts

The S4–S5 follow-up reuses projection points, batch working points and pipeline
ordinate stacks at each observed recursive call depth. A normalized squared-norm
classification also avoids an extra `hypot` in spheroid inverse dispatch. Existing
independent numerical and recursive ownership checks qualify these changes.
The optional [`ProjectionBuffer`](../docs/modules/projection/bulk-layouts.md) adds separate arrays, padded
records, columns, chunk ranges and pipeline epochs without per-record source
objects, arrays or subviews.

Retained diagnostics in `modules/projection/test/fixtures/qualification/` include:

- `reusable-mixed-pipelines.json`: paired historical/current runtime measurements
  for six mixed/grid-heavy scenarios, both directions, XYZ/XYZM and Float32/64;
  reusable scalar comparisons and source-site heap sampling after heterogeneous warmup.
- `reusable-spheroid-costs.json`: paired forward/inverse and construction diagnostics
  across WGS84, sphere and flattened spheroid; independent accuracy gates precede timing.
- `reusable-bulk-layouts.json`: five qualified pipelines, both directions/precisions,
  interleaved/column layouts; adapter, 256-record chunks, reusable scalar and reusable
  gather/flat/scatter comparators. Gathering, transformation and scattering are timed.
- `reusable-bulk-bundles.json`: selective source graphs and optional adapter costs;
  `/bulk` retains one original source file and is absent from existing imports.

The recorded Apple M2 / Node 24.14.0 run uses seven adaptive thread-CPU samples
and 1,000 records. Mixed Float64 XYZM forward flat ratios span approximately
0.96–1.18×; spread flags prevent a general speed claim. Aggregate sampled bytes per
point for the six mixed profiles decline from 113.1 to 83.7 for flat, 104.5 to
84.6 for reusable array outputs, and 111.5 to 80.8 for reusable typed outputs.
These are sampling diagnostics across particular workloads, not zero-allocation
proofs or guarantees for individual projections. Numeric boxing remains observable,
including in some column/chunk profiles. Allocation-free source loops do not imply
an allocation-free JavaScript runtime.

Separate-layout adapter throughput is generally close to a reusable scalar loop;
reusable compact-flat staging can be faster. Choose storage contracts based on the
application and measure the complete path. The packed optional adapter measures
5,469 minified / 1,721 gzip bytes; retained scratch/classification changes add about
139/65 minified/gzip bytes to core and 54/74 bytes to an optional pipeline in this
build. The optional adapter itself adds no bytes to either graph.

```sh
node modules/projection/scripts/benchmark-pipeline-compare.mjs \
  --baseline-ref b6f38ef5 --points 1000 --samples 7 --min-sample-ms 4 \
  --clock thread-cpu --allocations --allocation-sites --reusable-results \
  --scenarios 'Mercator to UTM,Datum to Mercator,Horizontal grid to UTM,Height stack and datum,Static Helmert with units and axes,Mixed epochs with height stack and UTM' \
  --output /tmp/mixed-scratch.json
node modules/projection/scripts/benchmark-bulk-layouts.mjs \
  --points 1000 --samples 7 --allocations --output /tmp/bulk-layouts.json
node modules/projection/scripts/check-spheroid-boundary.mjs \
  --baseline-ref b6f38ef5 --output /tmp/bulk-bundles.json
```

Thread-CPU commands require Node 24.14 or later. Shared browser CI now also checks
2,616 independent layout/epoch comparisons across 54 configurations. Browser
performance, further mixed-pipeline fusion and runtime boxing reduction remain
separate follow-ups in the [SOTA roadmap](./projection-roadmap.md#sota-roadmap).

## Persistent worker evaluation

The optional S8 runner measures both directions/precisions, copies, partitioning,
transfer and scheduling, with cold worker preparation reported separately.
Measured large UTM buffers benefit from two persistent workers on the tested Apple
M2; small batches and Mercator depend more on browser and timer resolution. See
[the measurements, ownership recipe and backend boundaries](../docs/modules/projection/acceleration.md).
CI records all three browser results without a speed gate. Wasm SIMD and WebGPU
capability probes do not benchmark projection implementations.

## Consolidated scorecard

The [projection scorecard](../docs/modules/projection/scorecard.md) combines these measurements with
independent accuracy, allocation sampling, isolated memory checkpoints, startup
and bundle costs. Environments stay separate and missing browser heap evidence
is explicit. See [the publication gates and commands](../docs/modules/projection/scorecard-methodology.md).

### CI runner usage

Projection and pipeline comparisons share a runner and run sequentially, retaining
all workloads and sampling settings while avoiding a second installation and build.
The required `test` job consolidates and uploads the scorecard when the checks and
browser qualifications succeeded, even if the independent PR performance comparison
failed. It then verifies all prerequisite results in a final step that always runs.
On master pushes, the performance comparison must be skipped. A failed, cancelled
or unexpectedly skipped prerequisite fails `test`; scorecard or upload failures also
fail that same required check. Consolidation and the final gate share one runner,
so completing the scorecard does not require another queued job.
