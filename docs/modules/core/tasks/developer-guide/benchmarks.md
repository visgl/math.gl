# Measure worker workloads

A worker can improve UI responsiveness while taking longer end to end than a
synchronous operation. Measure startup, dispatch, input ownership, processor time,
and application latency separately before choosing a pool or batch size.

## Run the shipped harness

From the repository root after installing dependencies:

```sh
yarn build
yarn benchmark:workers --quick --output=/tmp/worker-smoke.json
yarn benchmark:workers --output=/tmp/worker-results.json
```

The quick mode is a correctness smoke qualification. The harness also checks
main-thread routing for tiny tasks and mixed-size independent batches.
The full mode covers:

| Workload | What to inspect |
| --- | --- |
| 1,000 sequential tiny tasks | Dispatch overhead, cold startup, batching opportunities |
| 100 MiB ordinary buffers in copy and transfer modes | Transport/serialization cost and detachment |
| Repeated projection of 1M coordinates | Numerical parity, warm processing, persistent state |
| 100 concurrent map requests with cancellation | Admission, overload, task lifetime and recovery |
| Worker crashes during processing | Failure isolation and replacement |
| 50 initialization/teardown cycles | Lifecycle settlement and resource profiling |

The harness asserts numerical results, ownership, and successful recovery. JSON
records the runtime/CPU environment, first-request latency, warm mean, p50/p95,
throughput, process CPU time, and sampled process RSS. CI runs quick qualification
and uploads a `worker-runtime-qualification` artifact.

## Compare relevant primitives

Comparator packages are isolated benchmark dependencies, not runtime dependencies:

```sh
npm ci --prefix test/bench/workers --ignore-scripts
node test/bench/workers/index.mjs --compare --output=/tmp/worker-comparison.json
```

The harness pins Piscina, workerpool, and Comlink versions and includes direct
execution and raw Node Worker baselines. Tiny-task comparisons use one worker and
one outstanding request. Buffer transfer comparisons move ownership both ways.
These compare useful primitives, not feature-equivalent production schedulers.

## Interpret the evidence

Use an otherwise idle machine and repeat independent runs. Report the environment,
ownership policy, sample count, and cold versus warm behavior. Five large-buffer
or projection samples are a smoke qualification, not robust tail-latency estimates.

Allocation and parity assertions are included in end-to-end timings. The stateless
projection yields between chunks; the persistent fixture runs synchronously, so
the difference includes scheduling as well as initialization reuse. Do not label
that difference as a pure caching speedup.

Sampled RSS includes worker threads but can miss short-lived peaks; GC changes
later readings. A zero active-lease count after teardown is useful evidence, not
proof of leak freedom. Use long-running profiling and browser memory tools when
qualifying a production application. Node measurements do not establish browser
performance. Shared-memory correctness is separately exercised in isolated and
non-isolated browser tests.

## Instrument your own operation

```ts
const pool = new WorkerPool({
  url: workerUrl,
  maxConcurrency: 2,
  maxQueuedJobs: 8,
  maxQueuedBytes: 64 * 1024 * 1024,
  maxInFlightBytes: 64 * 1024 * 1024,
  onMetrics: metrics => record(metrics),
  performanceMarks: true
});
```

`workerUrl` and `record` belong to the application; import `WorkerPool` from
`@math.gl/core/tasks`. Queue wait indicates scheduling pressure; startup
latency indicates cold-worker cost; `postMessageMs` captures only the synchronous
send cost. Processor elapsed time includes its awaits. These durations overlap.
Consume and clear optional performance entries, and await pool destruction when
finished. See [the API reference](../api-reference/runtime.md#stats-and-workerjobmetrics).
