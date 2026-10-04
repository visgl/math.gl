# Reproduce the projection scorecard

The [published scorecard](./scorecard.md) consolidates source-matched measurements
for Node, Chromium, Firefox and WebKit. Each environment remains separate. It does
not produce an overall ranking or claim unrestricted PROJ parity.

## What is measured

| Category | Evidence and limits |
| --- | --- |
| Accuracy | 42 reviewed independent PROJ domains / 11,160 points; scalar and Float64 bulk forward/inverse/closure, maximum errors and worst inputs. These are sampled domains, not global error bounds. |
| Throughput | The same 22 seeded scenarios, both precisions, XY/XYZ/XYZM and both directions. Prepared converters, rotated order, independent buffers, raw times, median/p10/p90 and normalization by iteration count. Preparation and resets are excluded. |
| Startup | Fresh Node processes or browser contexts, with import, first construction and first transformation checked separately. Browser cold bundles and Node module graphs differ; OS disk caches are not flushed. |
| Allocation | Node inspector heap sampling includes collected objects, in Float64 XY/XYZM forward cases. Estimated bytes/point and sample counts are retained. A zero estimate is not proof of zero allocation. |
| Memory | Fresh Node processes, forced GC checkpoints, identical live input/output Float64 XYZM buffers, and ten Web Mercator batches. Retained heap/external/arrayBuffer/RSS snapshots are not peak working set or allocation counts. |
| Bundle | Built browser ESM, ES2020, minified and gzip level 9. Actual byte counts cover selective entry points; external model data and TIFF decoders are excluded. |

Browser JS heap and collected-object allocation metrics are **unavailable** in this
portable profile. Every throughput row includes exact input-buffer bytes, a storage
lower bound that excludes adaptive copies, result objects, library memory and other
application costs. It must not be interpreted as the browser's working set.

## Collect a full profile

Build the package first. Measurement scripts do not fetch models or dependencies.
The comparator is the actual installed **proj4js 2.22.0**, matching the exact reviewed
development pin; reports record its version and installed main-entry content hash.

```sh
yarn exec ocular-build projection
node modules/projection/scripts/collect-scorecard-node.mjs \
  --directory /tmp/projection-scorecard-node --points 20000 --samples 7 --min-sample-ms 12
node modules/projection/scripts/benchmark-browser.mjs \
  --browsers chromium,firefox,webkit --points 20000 --samples 7 --min-sample-ms 12 \
  --output /tmp/projection-scorecard-browsers.json
node modules/projection/scripts/scorecard.mjs \
  --node /tmp/projection-scorecard-node \
  --browser-report /tmp/projection-scorecard-browsers.json \
  --output /tmp/projection-scorecard.json --markdown /tmp/projection-scorecard.md
```

Separate browser report files can be supplied with repeated `--browser-report`
arguments. Hardware, OS, runtime versions, observation dates, point counts and
sampling windows remain attached to each environment. There is no pooling across
machines, browsers or workload layouts. PR CI uses three samples and a bounded
4 ms aggregate window; master keeps the seven-sample/12 ms profile. PR observations
are validation diagnostics and can show more variation than a dedicated full run.

## Publication gates

The Node input manifest hashes every raw report and snapshots the reviewed accuracy
profile. Consolidation requires matching source/workload fingerprints, comparator
identity, the complete layout matrix, accuracy domains and numerical allowances,
raw sample counts, median normalization, cold samples, allocation/memory inventories
and bundle profiles. Mismatched or missing evidence fails instead of filling gaps.
The generator's hash and every raw input report hash accompany the output.

Timer-limited or high-variation rows remain visible, but their speedup ratios are
withheld. Variation is descriptive, not a confidence interval. Different epoch,
layout, coordinate distribution, operation chain or compiler settings can change
results. No threshold declares a universal winner, a globally accurate projection,
zero allocation or a SOTA engine.

All three browsers are required by default. `--allow-partial` is available for local
work; it visibly marks missing environments and cannot produce a complete scorecard
claim. CI never passes that option. The publication job consolidates uploaded Node
and browser evidence, retains JSON/Markdown artifacts and is a required check.

The checked-in snapshot retains raw throughput samples, independent errors, memory
checkpoints and allocation estimates in
[`scorecard.json`](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/scorecard.json).
It is a dated baseline, not a promise that later source changes preserve its timings.
Regenerate a snapshot from one explicitly identified source/workload and review its
limits before replacing it. CI artifacts provide subsequent source-matched runs.

```sh
node --test modules/projection/scripts/scorecard.test.mjs
node modules/projection/scripts/benchmark-memory.mjs --points 20000 --samples 3 --output /tmp/memory.json
```
