# Measuring task execution

Build the packages, then run the correctness-checked benchmark:

```
yarn build

yarn benchmark:workers --quick --output=/tmp/task-smoke.json

yarn benchmark:workers --output=/tmp/task-results.json
```

The harness uses `TaskRunner` and explicit handles. It measures tiny calls, copy/transfer round trips, local calls, independent inputs, repeated projections, map preparation, fresh-worker recovery, and initialization/cleanup. It asserts numerical parity and buffer ownership while measuring end-to-end latency.

Reports contain environment information, cold latency, warm mean, percentiles, throughput, CPU time, and sampled process RSS. These are harness measurements, not runner metrics. RSS includes worker threads; sampling can miss peaks and is not proof of leak freedom. Automatic calls create temporary workers, while explicit handles reuse one worker. Compare the same lifetime and ownership policy.

Optional pinned-library comparisons:

```
npm ci --prefix test/bench/workers --ignore-scripts

node test/bench/workers/index.mjs --compare --output=/tmp/task-comparison.json
```

The comparison is between useful primitives, not identical feature sets. Run on an idle machine and repeat measurements before drawing performance conclusions. Node results are not browser measurements. See the harness README for details.

The echo worker startup and module loading are measured separately as `math.gl/echo-initialize`. `math.gl/tiny-sequential-initialized` measures calls on that retained handle. Its `coldMs` is the first timed call after initialization, not a cold worker startup measurement. Compare warm call timings across libraries and report initialization separately.
