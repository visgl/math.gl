# Worker runtime qualification

Build from the repository root, then run:

```sh
yarn build
node test/bench/workers/index.mjs --output=/tmp/worker-results.json
```

`--quick` reduces sizes for smoke testing. The default runs 1,000 sequential tiny
jobs, copy/transfer of 100 MiB buffers, repeated projection of 1M coordinates,
100 concurrent map requests with cancellation and awaitable admission, crashes,
and 50 initialization/teardown cycles. Numerical parity, buffer ownership and
successful recovery are asserted during the measurements.

For pinned Piscina, workerpool and Comlink comparisons, install the isolated
benchmark dependencies, which are not runtime dependencies:

```sh
npm ci --prefix test/bench/workers --ignore-scripts
node test/bench/workers/index.mjs --compare --output=/tmp/worker-results.json
```

The harness also compares tiny auto-routed local tasks with worker dispatch and
asserts that mixed-size independent batches select local/worker execution in input
order. The local route still honors copy/transfer serialization contracts.

The JSON records environment metadata, first-request latency, warm mean, p50/p95,
throughput, process CPU time and sampled process RSS. RSS includes worker threads;
5 ms sampling can miss transient peaks and JavaScript GC affects later readings.
This is not a memory leak proof. Lifecycle checks assert zero active leases;
long-duration profiling and browser-specific memory tools remain useful.

Run on an otherwise idle machine. Report distributions across independent runs
before setting regression thresholds. Five large-buffer/projection repetitions
are a smoke qualification, not statistically robust tail-latency estimates.
Allocations and parity assertions are included in end-to-end timings. The
stateless projection API yields between chunks, whereas the persistent fixture
runs synchronously; the difference includes cooperative scheduling costs as well
as initialization reuse. It does not isolate initialization cost alone.

Direct execution and raw Node Worker transport provide lower-level baselines.
Pinned-library tiny-task comparisons use one worker and one outstanding request.
Their first-request measurements can include different amounts of eager startup;
use warm numbers for dispatch comparisons. Buffer comparisons explicitly label
ownership; all transfer tests transfer input and output buffers. These workloads
compare useful primitives, not feature-equivalent schedulers or production tuning.

Browser correctness and lifecycle coverage is in
`modules/core/test/worker-utils/browser.spec.ts`, including actual module workers,
cooperative cancellation and persistent resources. Node throughput measurements
must not be presented as browser performance results.
