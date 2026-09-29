# TypeScript projection benchmarks

The experimental engine offers `projectFlat` and `unprojectFlat` for interleaved
Float32/Float64 buffers. Reuse the projection instance: normalization and plugin
initialization are more expensive than the existing proj4 constructor in the initial
measurements, while repeated transformations are faster.

## Reproduce

Build the packages before measuring their published entry points:

```sh
yarn build
node modules/proj4/scripts/benchmark.mjs --points 50000 --samples 7 --allocations --output /tmp/proj4-benchmark.json
node modules/proj4/scripts/check-bundle-budget.mjs
node modules/proj4/scripts/check-packed-package.mjs
```

The standalone benchmark compares the native batch API, native scalar API, direct
`proj4` import, and `Proj4Projection` wrapper. Cases cover Web Mercator, UTM, Lambert
conic, and a seven-parameter Helmert-to-Mercator chain, in both directions, 2D/3D,
and Float32/Float64. Every output is checked against the pinned proj4 2.22.0 reference
before timing. Inverse measurements start from the same reference-projected buffer.

Converters and buffers are prepared outside timing. The scalar competitors reuse
an input coordinate array; their output arrays are copied to the same typed-buffer
layout. Buffer resets are excluded, timings cover whole buffers, implementation
order rotates between samples, and output contributes to a checksum. All methods use
default axes except the Helmert case, where axis enforcement exposes computed heights
consistently across the two backends. Float32 comparisons allow storage rounding.

Results include individual timings, medians, machine/runtime metadata, first construction
after imports and warmed constructor timings. The first construction numbers are
order-dependent and exclude module loading/process startup; they are not a cold-start
comparison. Throughput is not a universal guarantee, particularly for tiny buffers,
different browsers or projection domains. CI only runs a small correctness smoke
benchmark, not a machine-dependent speed threshold.

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

## Initial measurements

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

Warmed constructor medians ranged from 21.0–33.7 µs for the native engine,
versus 2.4–5.4 µs for the direct import. Prefer one compiled instance per
CRS pair. Construction order/JIT state affect these figures; use them as a local
baseline, not a production latency promise.


## Bundle budgets and release gates

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

Performance and packaging do not establish geodetic parity. The engine stays opt-in;
the [roadmap](./roadmap.md) retains independent reference, real-world grid, structured
CRS coverage and migration-review gates before promotion.
