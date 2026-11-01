# Worker runtime qualification

Build from the repository root, then run:

```sh
yarn build
node test/bench/workers/index.mjs --output=/tmp/worker-results.json
```

`--quick` reduces sizes for smoke testing. The default runs 1,000 sequential tiny
jobs, copy/transfer of 100 MiB buffers, repeated projection of 1M coordinates,
100 map requests through bounded `runTasks` concurrency, crashes,
and 50 initialization/teardown cycles. Numerical parity, buffer ownership and
successful recovery are asserted during the measurements.

For pinned Piscina, workerpool and Comlink comparisons, install the isolated
benchmark dependencies, which are not runtime dependencies:

```sh
npm ci --prefix test/bench/workers --ignore-scripts
node test/bench/workers/index.mjs --compare --output=/tmp/worker-results.json
```

The harness also measures explicit local execution and ordered independent calls.
The local route honors the same copy/transfer ownership contracts.

The JSON records environment metadata, first-request latency, warm mean, p50/p95,
throughput, process CPU time and sampled process RSS. RSS includes worker threads;
5 ms sampling can miss transient peaks and JavaScript GC affects later readings.
This is not a memory leak proof. Handles are closed after their measured lifetimes;
long-duration profiling and browser-specific memory tools remain useful.

Run on an otherwise idle machine. Report distributions across independent runs
before setting regression thresholds. Five large-buffer/projection repetitions
are a smoke qualification, not statistically robust tail-latency estimates.
Allocations and parity assertions are included in end-to-end timings. Both projection routes use the same provided task and chunking implementation.
The persistent route retains its projection and worker; the automatic route
includes worker startup and cleanup. It does not isolate projection setup cost.

Direct execution and raw Node Worker transport provide lower-level baselines.
Pinned-library tiny-task comparisons use one worker and one outstanding request.
Their first-request measurements can include different amounts of eager startup;
use warm numbers for dispatch comparisons. Buffer comparisons explicitly label
ownership; all transfer tests transfer input and output buffers. These workloads
compare useful primitives, not feature-equivalent schedulers or production tuning.

Browser correctness and lifecycle coverage is in
`modules/core/test/tasks/task-runner.spec.ts`, including actual workers,
cancellation, streaming, ownership, and retained state. Node throughput measurements
must not be presented as browser performance results.

The echo worker startup and module loading are measured separately as
`math.gl/echo-initialize`. `math.gl/tiny-sequential-initialized` measures calls
on that retained handle. Its `coldMs` is the first timed call after initialization,
not a cold worker startup measurement. Compare warm call timings across libraries
and report initialization separately.

Worker-code warmup is measured as `math.gl/echo-preload`. Compare
`math.gl/tiny-automatic-cold` (fresh worker each call) with
`math.gl/tiny-automatic-after-code-preload` (fresh worker and task state after global code warmup).
`math.gl/tiny-main-thread-sync` uses `runTaskSync`; the timing harness still awaits
each sample. Startup costs remain separate from warmed-call measurements.

Global code preloading does not retain workers. Node results do not predict browser HTTP-cache savings.
