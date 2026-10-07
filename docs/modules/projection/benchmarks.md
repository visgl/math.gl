# Performance

import BrowserOnly from '@docusaurus/BrowserOnly';

The math.gl projection engine offers `projectFlat` and `unprojectFlat` for interleaved
Float32/Float64 buffers. Reuse the projection instance: normalization and plugin
initialization are setup costs that should be amortized over many coordinates.
Performance depends on the projection, layout, runtime and hardware.

## Live benchmarks

Compare the current math.gl projection engine with the proj4js implementation on
your own browser and hardware. Choose a buffer layout and direction, then run the
inline benchmark. Nothing runs until you press **Run benchmarks**.

<BrowserOnly fallback={<p>Live benchmarks are available in a browser with JavaScript enabled.</p>}>
  {() => {
    const Proj4Benchmarks = require('@site/src/components/projection-benchmarks').default;
    return <Proj4Benchmarks />;
  }}
</BrowserOnly>

The math.gl columns use the default `Projection`, through its in-place and
scalar APIs, labeled **math.gl flat** and **math.gl scalar**. The **proj4js 2.22.0**
column uses the pinned `proj4` dependency directly. All three process the same coordinates into
the same typed-array layout. Scalar paths reuse an input array and copy returned
coordinates into the output buffer. Every coordinate is checked before timing,
including height and trailing ordinates. Datum-shift cases enable axis enforcement
to compare computed heights consistently. Implementation order rotates between samples.

The twenty-two shared cases cover spherical and ellipsoidal Mercator, UTM in both hemispheres,
Lambert conformal conic, Albers, equidistant conic, Lambert azimuthal equal area, polar stereographic,
Equal Earth, Mollweide, azimuthal equidistant, Robinson, Oblique Mercator, QSC,
tilted perspective, three- and seven-parameter datum shifts, UTM-to-Mercator,
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
second. Bold values and dots identify the fastest measured median even when timings vary.
Timing notices remain visible when the minimum duration cannot be reached or any
implementation's p10–p90 range exceeds 25% of its median. These flags help expose timer
limits and interference from other work; rerun to check consistency. Ratios and highlights
do not establish statistical significance. Medians below timer resolution cannot be ranked
or used to calculate a ratio.
**Download results** saves the raw aggregate samples, normalized statistics, seed,
settings and browser metadata. The benchmark runs in a dedicated worker with Stop and
rerun controls. It does not measure allocations, startup or bundle size.

## Choose a coordinate API

Reuse one compiled converter for each CRS pair. Construction resolves definitions,
validates parameters and prepares algorithms; it is a separate cost from transforming
coordinates. Warm throughput does not describe loading or first-use latency.

| Input or workload | API | Storage behavior |
| --- | --- | --- |
| Individual coordinates | `project` / `unproject` | Returns a new coordinate array |
| Repeated scalar calls | [`projectTo` / `unprojectTo`](api-reference/projection-transform.md#reusable-scalar-outputs) | Reuses a caller-provided output |
| Interleaved Float32/Float64 coordinates | `projectFlat` / `unprojectFlat` | Updates the supplied view in place |
| Separate output, padded records or columns | [`ProjectionBuffer`](api-reference/projection-buffer.md) | Reuses prepared layout and scratch |
| Explicit datum or epoch operations | [`ProjectionPipeline`](api-reference/projection-pipeline.md) | Reuses the prepared operation chain |

```typescript
import {Projection} from '@math.gl/projection';

const projection = new Projection({to: 'EPSG:3857'});
const positions = new Float64Array([12, 55, 13, 56]);
projection.projectFlat(positions, 2);
```

Use Float64 when large coordinates must retain small differences. Float32 reduces
storage and transfer costs, but rounds each stored result. Record width includes
height and trailing measures, so XYZM results have different memory costs from XY.

Built-in flat paths avoid temporary coordinate arrays for each point. Custom plugins
may allocate; use mutable hooks when implementing a plugin. A batch commits completed
records before an error; see the [flat-array contract](api-reference/projection-transform.md#flat-typed-arrays-in-place).

Lazy instances need `preload()` before synchronous methods. Import selection and
loading affect startup and downloads; see [imports, plugins and bundle size](developer-guide/projection-engine.md).

## Keep the interface responsive

Synchronous coordinate batches occupy the calling thread. Partition large jobs or
move them into a persistent worker. Transferable buffers can avoid copies, but
ownership changes and transfer, scheduling and worker preparation are real costs.
See [worker measurements and ownership](acceleration.md) before choosing a worker
strategy; a faster arithmetic loop alone does not establish an application speedup.

## Interpret the measurements

Compare the same projection, direction, coordinate distribution, precision and record
width. Keep browser and Node measurements separate, and rerun noisy cases. A faster
median does not imply greater accuracy or a wider valid coordinate domain.

The [projection scorecard](scorecard.md) records a dated snapshot of accuracy,
throughput, cold startup, allocation and memory evidence. Its
[measurement methodology](scorecard-methodology.md) explains source fingerprints,
raw samples and the limits of each metric. Check [independent validation](independent-validation.md)
when selecting an algorithm for a region or datum transformation.

## Reproduce

Build the packages before measuring their published entry points:

```sh
yarn build
node modules/projection/scripts/benchmark.mjs --points 50000 --samples 7 --allocations --output /tmp/proj4-benchmark.json
```

The standalone Node runner and browser qualification runner use the same workload as
the live page: twenty-two scenarios, Float32/Float64, XY/XYZ/XYZM and both directions
(264 rows, with three implementations per row). Select regional or clustered inputs
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
module loading and first use in fresh contexts. CI uploads browser artifacts and gates
correctness and bundle sizes; it does not gate noisy speed ratios. Pull requests use 20,000 points, three samples and
`--min-sample-ms 0`: all 792 workloads and independent references still run, but
adaptive timing repetitions are disabled. These PR browser measurements are marked
`timingLimited` and serve as correctness checks, not performance evidence. Pushes to
master retain seven samples and a 12 ms calibration target for full browser reports.
The separate paired Node performance comparison runs on every PR with 11 samples
and a 4 ms calibration target; local runs retain the 12 ms default.

### Compare a runtime change with its base

```sh
node modules/projection/scripts/benchmark-compare.mjs --baseline-ref origin/master --points 20000 --samples 11 --output /tmp/proj4-comparison.json
```

The comparison compiles baseline runtime sources from Git and current sources with the
same bundler, package manifests and installed dependencies. It uses the current shared
workload for both versions, validates both against proj4js, and rotates baseline/candidate
flat/scalar execution order. It covers XY and XYZM in both precisions and directions;
constructor batches alternate separately. `--scenarios` accepts comma-separated scenario
names to focus a run. On pull requests, CI measures nine representative scenarios against
the actual base commit and uploads `projection-performance-comparison`. CI keeps all
20,000 coordinates and 11 rotated samples, but uses `--min-sample-ms 4` to limit
adaptive repetitions. Inspect the retained spread and `timingLimited` flags when
interpreting these shorter measurements.

`--clock thread-cpu` (Node 24.14 or later) is an optional diagnostic using main-thread CPU
time. It reduces scheduler interference but excludes time spent off the thread; **it is
not elapsed throughput** and must not be compared directly with the live table. Default
reports use elapsed wall time. Always inspect sample variation before interpreting ratios.

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

## Operation pipelines and grids

For explicit operation chains, measure the actual units, axes, grids and epoch
behavior rather than an isolated projection kernel:

```sh
node modules/projection/scripts/benchmark-pipeline-compare.mjs --baseline-ref origin/master --output /tmp/projection-pipelines.json
node --expose-gc modules/projection/scripts/benchmark-grid-compare.mjs --baseline-ref origin/master --memory --output /tmp/projection-grids.json
```

Prepare grid readers and models outside warm coordinate timing, and measure that
preparation separately when it affects startup. Reuse scalar outputs, scratch and
layouts for repeated calls; include output copies and worker transfers when those
are part of the application workload.

Bundle measurements and packaging checks are documented with
[imports, plugins and loading](developer-guide/projection-engine.md#tree-shaking-and-bundle-size).
