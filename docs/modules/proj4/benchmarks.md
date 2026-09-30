# TypeScript projection benchmarks

import BrowserOnly from '@docusaurus/BrowserOnly';

The TypeScript engine offers `projectFlat` and `unprojectFlat` for interleaved
Float32/Float64 buffers. Reuse the projection instance: normalization and plugin
initialization are setup costs that should be amortized over many coordinates.
Performance depends on the projection, layout, runtime and hardware.

## Live benchmarks

Compare the current TypeScript implementation with the classic proj4js backend on
your own browser and hardware. Choose a buffer layout and direction, then run the
inline benchmark. Nothing runs until you press **Run benchmarks**.

<BrowserOnly fallback={<p>Live benchmarks are available in a browser with JavaScript enabled.</p>}>
  {() => {
    const Proj4Benchmarks = require('@site/src/components/proj4-benchmarks').default;
    return <Proj4Benchmarks />;
  }}
</BrowserOnly>

The TypeScript columns use the default `Projection`, through its in-place and
scalar APIs, labeled **math.gl flat** and **math.gl scalar**. The **proj4js 2.22.0**
column uses the pinned `proj4` dependency directly. All three process the same coordinates into
the same typed-array layout. Scalar paths reuse an input array and copy returned
coordinates into the output buffer. Every coordinate is checked before timing,
including height and trailing ordinates. Datum-shift cases enable axis enforcement
to compare computed heights consistently. Implementation order rotates between samples.

The sixteen shared cases cover spherical and ellipsoidal Mercator, UTM in both hemispheres,
Lambert conformal conic, Albers, Lambert azimuthal equal area, polar stereographic,
Equal Earth, Mollweide, three- and seven-parameter datum shifts, UTM-to-Mercator,
US survey feet, north/east axis order, and an authored synthetic NTv2 grid.
Regional samples cover each projection's useful domain; clustered samples concentrate
in four smaller regions. Both are reproducible from a fixed seed. XY, XYZ and XYZM
share the same horizontal coordinates; heights vary, and M is preserved. The buffer
selector supports up to one million coordinates.

These are warmed transformation measurements, excluding loading and construction.
Inverse runs start from coordinates projected by the reference implementation.
Each of seven samples transforms independent buffer copies, with resets outside timing.
Calibration targets at least 12 ms for the fastest implementation, up to one million
coordinates or 256 buffers per sample. The table reports the median normalized to one
selected buffer, and throughput in **million coordinates per second** (the **M** suffix).
The p10–p90 spread describes sample variation; it is not a confidence interval.

Green dots mark the fastest result in each row, including ties. Small multipliers show
math.gl throughput relative to proj4js: **3×** means three times as many coordinates per
second. Dots and multipliers are suppressed when the minimum duration cannot be reached
or any implementation's p10–p90 range exceeds 25% of its median. These flags help expose
timer limits and interference from other work; they do not establish statistical significance.
**Download results** saves the raw aggregate samples, normalized statistics, seed,
settings and browser metadata. The benchmark runs in a dedicated worker with Stop and
rerun controls. It does not measure allocations, startup or bundle size.

## Reproduce

Build the packages before measuring their published entry points:

```sh
yarn build
node modules/proj4/scripts/benchmark.mjs --points 50000 --samples 7 --allocations --output /tmp/proj4-benchmark.json
node modules/proj4/scripts/check-bundle-budget.mjs
node modules/proj4/scripts/check-lazy-package.mjs
node modules/proj4/scripts/check-packed-package.mjs
```

The standalone Node runner and browser qualification runner use the same workload as
the live page: sixteen scenarios, Float32/Float64, XY/XYZ/XYZM and both directions
(192 rows, with three implementations per row). Select regional or clustered inputs
with `--distribution regional|clustered`; set `--min-sample-ms` between 0 and 100 to
control adaptive sampling. Zero disables calibration for correctness smoke checks and
marks timings as limited. Buffer sizes range from 10 to 1,000,000 points.

Converters and buffers are prepared outside timing. Scalar competitors reuse an input
coordinate array and copy results into the same typed-buffer layout. Every ordinate is
validated against pinned proj4js 2.22.0 before timing, including axes and computed heights;
Float32 tolerances account for storage rounding. Buffer resets are excluded, execution
order rotates, and output contributes to a checksum.

Schema-version-2 JSON reports retain individual aggregate samples, per-buffer medians
and p10/p90, repetition counts, seed, workload/source fingerprints and runtime metadata.
Warmed constructor measurements are separate. Browser qualification additionally measures
module loading and first use in fresh contexts. CI uploads performance artifacts and
gates correctness and bundle sizes; it does not gate noisy speed ratios.

### Compare a runtime change with its base

```sh
node modules/proj4/scripts/benchmark-compare.mjs --baseline-ref origin/master --points 20000 --samples 11 --output /tmp/proj4-comparison.json
```

The comparison compiles baseline runtime sources from Git and current sources with the
same bundler, package manifests and installed dependencies. It uses the current shared
workload for both versions, validates both against proj4js, and rotates baseline/candidate
flat/scalar execution order. It covers XY and XYZM in both precisions and directions;
constructor batches alternate separately. `--scenarios` accepts comma-separated scenario
names to focus a run. On pull requests, CI measures five representative scenarios against
the actual base commit and uploads `proj4-performance-comparison`.

`--clock thread-cpu` (Node 24.14 or later) is an optional diagnostic using main-thread CPU
time. It reduces scheduler interference but excludes time spent off the thread; **it is
not elapsed throughput** and must not be compared directly with the live table. Default
reports use elapsed wall time. Always inspect sample variation before interpreting ratios.

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

## Historical initial measurements

Measured September 29, 2026 on Apple M2 / macOS arm64, Node v24.5.0
(V8 13.6.233.10-node.21), proj4 2.22.0. Median of 7 warmed
passes over 50,000 points. Selected Float64, 2D forward results, in **million points/second**:

| Case | Native batch | Native scalar | proj4 import | Wrapper | Batch/import |
| --- | ---: | ---: | ---: | ---: | ---: |
| Web Mercator | 18.68 | 11.93 | 4.42 | 4.39 | 4.22× |
| UTM 31N | 4.04 | 3.81 | 2.44 | 2.50 | 1.65× |
| Lambert conic | 9.39 | 8.15 | 3.51 | 3.69 | 2.67× |
| Helmert to Mercator | 4.12 | 3.84 | 2.21 | 2.29 | 1.86× |

Sampled estimated allocation bytes/point for the same cases (500,000 points per
implementation, separate profiling run):

| Case | Native batch | Native scalar | proj4 import | Wrapper |
| --- | ---: | ---: | ---: | ---: |
| Web Mercator | 0.04 | 159.70 | 601.33 | 607.11 |
| UTM 31N | 48.27 | 206.20 | 651.58 | 648.47 |
| Lambert conic | 0.44 | 159.33 | 600.47 | 598.27 |
| Helmert to Mercator | 79.07 | 239.64 | 957.04 | 953.60 |

Warmed constructor medians ranged from 21.0–33.7 µs for the TypeScript engine,
versus 2.4–5.4 µs for the direct import. Prefer one compiled instance per
CRS pair. Construction order/JIT state affect these figures; use them as a local
baseline, not a production latency promise.


## Bundle budgets and release gates

The table below preserves the initial tranche 7 baseline. For current measurements,
including optional WKT/PROJJSON readers and grid adapters, see the
[TypeScript engine guide](./typescript-engine.md#tree-shaking-and-bundle-size).

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
bytes; all other byte limits remain unchanged.

Performance and packaging do not establish geodetic parity. The TypeScript engine is now the default;
the [support profile](./typescript-support.md) defines the scope of the TypeScript API
and the migration to the default TypeScript wrapper. Historical wrapper timings
refer to the proj4js implementation now imported from `classic`.


## Historical release qualification measurements

The checked-in raw reports under `modules/proj4/test/fixtures/qualification/` include
source SHA-256 fingerprints, all samples, exact engine versions and methodology.
These recorded timings predate the Robinson pole correction and its 32 additional
reference points; subsequent CI artifacts qualify the updated source and corpus.
Measured September 29, 2026 on Apple M2 / macOS arm64, Node 24.5.0, with 20,000
points and seven samples. These are distinct from the earlier baseline above.

Selected Float64/2D forward throughput, in million points/second:

| Engine | Projection | Native batch | proj4 import |
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

| Linux engine | Projection | Native batch (Mpoints/s) | proj4 import (Mpoints/s) |
| --- | --- | ---: | ---: |
| Chromium 151.0.7922.34 | Mercator | 7.69 | 3.08 |
| Chromium 151.0.7922.34 | UTM | 2.06 | 1.46 |
| Firefox 153.0 | Mercator | 6.67 | 3.33 |
| Firefox 153.0 | UTM | 2.50 | 2.00 |
| WebKit 26.5 | Mercator | 6.67 | 6.67 |
| WebKit 26.5 | UTM | 2.86 | 3.33 |

These shared-runner measurements also have timer quantization. Native batches are
not uniformly faster in every engine/workload: WebKit UTM was slower in this run.

Fresh Node process medians (OS caches warm; separate process/module registries):

| Import | Process lifetime (ms) | Module load (ms) | First construction (µs) |
| --- | ---: | ---: | ---: |
| native-selected | 40.02 | 7.43 | 1416.29 |
| native-barrel | 67.98 | 33.40 | 1396.17 |
| proj4 | 67.40 | 25.35 | 94.08 |
| wrapper | 59.00 | 26.82 | 108.21 |

Selected TypeScript subpaths reduce module-loading work compared with the full barrel.
Native first construction remains more expensive than proj4's: prepare and reuse
converters rather than constructing one per coordinate. Browser cold measurements
separately record bundle fetch/parse/evaluation, first construction and first projection
in fresh contexts; they do not flush operating-system caches.

Sampled allocation estimates for TypeScript batch versus proj4 were approximately
0 versus 595 bytes/point for Mercator, 49 versus 641 for UTM, 0 versus 595 for LCC,
and 78 versus 977 for Helmert-to-Mercator. Zero samples do not prove zero allocation;
these are V8 statistical estimates, including collected objects, not exact allocation
counts. Scalar APIs allocate output arrays; mutable batch hooks avoid those arrays.

Reproduce the additional qualification after building:

```sh
node modules/proj4/scripts/benchmark-startup.mjs --samples 7 --output /tmp/startup.json
yarn playwright install --with-deps chromium firefox webkit
node modules/proj4/scripts/benchmark-browser.mjs --points 20000 --samples 7 --output /tmp/browsers.json
```

Each browser first measures separate TypeScript and direct-proj4 bundles, then checks
all independent projection references. Current warm workloads use the sixteen-scenario
shared matrix described above, including XYZ. The historical tables retain their older
workload and wrapper column for provenance; they are not current benchmark results.
The runner bounds each browser to 180 seconds. CI keeps downloadable measurements and
gates correctness. The Node startup runner also checks the first computed coordinate in
every fresh process. Packed-consumer, tree-shaking and bundle-size checks exercise the
canonical TypeScript paths and retained compatibility aliases.
