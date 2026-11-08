# Measuring task execution

Measure the whole operation before tuning worker count or buffer ownership. Startup and copying can dominate small calls; reusing setup can matter more for repeated work. Compare the same input and lifetime on the same device.

To measure the repository's task examples, build the packages and run the harness:

```
yarn build

yarn benchmark:workers --quick --output=/tmp/task-smoke.json

yarn benchmark:workers --output=/tmp/task-results.json
```

The harness uses `TaskRunner` and explicit handles. It measures tiny calls, copy/transfer round trips, local calls, independent inputs, repeated projections, map preparation, fresh-worker recovery, and initialization/cleanup. It asserts numerical parity and buffer ownership while measuring end-to-end latency.

Reports contain environment information, cold latency, warm mean, percentiles, throughput, CPU time, and sampled process RSS. These are harness measurements, not runner metrics. RSS includes worker threads; sampling can miss peaks and is not proof of leak freedom. Automatic calls create temporary workers; explicit handles retain both the worker and task state. Compare the same lifetime and ownership policy.

Optional pinned-library comparisons:

```
npm ci --prefix test/bench/workers --ignore-scripts

node test/bench/workers/index.mjs --compare --output=/tmp/task-comparison.json
```

The comparison is between useful primitives, not identical feature sets. Run on an idle machine and repeat measurements before drawing performance conclusions. Node results are not browser measurements. See the harness README for details.

The echo worker startup and module loading are measured separately as `math.gl/echo-initialize`. `math.gl/tiny-sequential-initialized` measures calls on that retained handle. Its `coldMs` is the first timed call after initialization, not a cold worker startup measurement. Compare warm call timings across libraries and report initialization separately.

`math.gl/tiny-main-thread-sync` measures direct synchronous runner calls (the harness still awaits each sample). `math.gl/tiny-automatic-cold` includes fresh worker startup on every call. `math.gl/echo-preload` reports warmup separately, while `math.gl/tiny-automatic-after-code-preload` still includes worker startup and task initialization/destruction. Global code preloading does not retain workers. Node workers do not share a JavaScript module cache, so this row does not predict browser network-cache savings.
