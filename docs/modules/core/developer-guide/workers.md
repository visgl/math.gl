# Worker processing

Start with the [tasks overview](../tasks/README.md) for a quick
start and an ownership comparison. Follow the
[custom worker tutorial](../tasks/developer-guide/custom-workers.md),
[persistent resource guide](../tasks/developer-guide/persistent-resources.md),
[shared-memory guide](../tasks/developer-guide/shared-memory.md), or
[API reference](../tasks/api-reference/runtime.md) for complete examples
and option defaults. This page describes scheduling and execution contracts.

`@math.gl/core/tasks` exposes task dispatch and the shared worker runtime.
`@math.gl/core/worker-utils` remains a compatibility entry for the worker APIs
copied from loaders.gl:
`createWorker`, `processOnWorker`, `processOnWorkerInBatches`, `preloadWorker`,
and the `WorkerFarm` and `WorkerPool` classes. The runtime supports browser and
Node workers, bounded concurrency, worker reuse, progress and cancellation.
Worker descriptions can provide a `loadWorker` module-worker factory, a URL, or
an explicit npm `packageName` for the default CDN URL. Without `packageName`, the
legacy loaders.gl URL convention remains available for compatibility.

For common geospatial operations, import the ready-to-use descriptors or functions:

```ts
import {projectBulkInWorker, setupMapInWorker} from '@math.gl/geospatial/workers';
import {MapEngine} from '@math.gl/geospatial/discontinuous';

const controller = new AbortController();
const projected = await projectBulkInWorker({
  projection: {from: 'EPSG:4326', to: 'EPSG:3857'},
  coordinates: new Float64Array([10, 20, 30, 40]),
  dimension: 2
}, {
  signal: controller.signal,
  onProgress: ({phase, completed, total, unit}) => console.log(phase, completed, total, unit)
});

const prepared = await setupMapInWorker({
  version: 1,
  id: 'world',
  definition: {type: 'myriahedral', preset: 'polyconic', columns: 24}
}, {signal: controller.signal});
const map = MapEngine.fromPrepared(prepared);
```

`MapSetupWorker` and `BulkProjectionWorker` expose the same operations to
`processOnWorker`. `WorkerObject<Input, Output, Options>` describes typed jobs.
Custom worker processors use `createWorker(process, processInBatches?)` and can
report phase progress with `context.reportProgress`. The caller's `onProgress`
callback and `AbortSignal` remain on the calling thread. A throwing progress
callback aborts the job. Cancellation removes queued jobs or terminates the
running worker; the pool can create a replacement for subsequent work.

The geospatial operations copy input by default. The low-level runtime preserves
loaders.gl's default of transferring input. Set `inputOwnership: 'copy'`, `'transfer'` or `'share'` explicitly.
Share mode accepts shared storage and rejects ordinary transferable buffers before dispatch. Transferring an ArrayBuffer detaches every view sharing
it; cancellation cannot restore it. Copy mode clones the entire request payload,
including serializable options and context; runtime callbacks and control objects stay local. Results are transferred back. Typed-array
subviews transfer their entire backing buffer; shared buffers are not transferred.
`processOnWorkerInBatches` applies the same input policy to each batch and uses
backpressure while keeping a worker leased for the session.

Map setup reports its setup phase, and bulk projection reports completed records
at chunk boundaries. Rapid updates within a phase may be coalesced; the final
measurement is flushed before the job completes. `total` may be absent when the amount of
work is unknown; it is not an estimate of remaining time. Snapshots are trusted
same-version worker transport, not durable storage. Restoring a snapshot creates
runtime objects locally; myriahedral snapshots avoid repeating land sampling,
hinge selection and overlap counting. Applications with custom projection,
land or edge-weight callbacks must install those callbacks inside their own
worker; functions cannot cross the structured-clone boundary.

For small jobs, synchronous APIs avoid worker startup and copying costs. No
automatic main-thread fallback is provided by `processOnWorker`; applications
choose their own fallback if workers are unavailable.

## Scheduling and memory budgets

`maxQueuedBytes` and `maxInFlightBytes` configure each worker pool's input-buffer
budgets (both default to `Infinity`). Atomic jobs count buffers in input, options
and job context. Shared backing buffers count once per job, and subviews count
their entire backing buffer. These limits do not bound objects, strings, results,
worker caches, algorithm scratch space or total process memory. Copy mode can
temporarily retain both the caller's buffer and its worker-side clone.

Jobs wait for concurrency and in-flight capacity. Jobs larger than the in-flight
budget and submissions that overflow the waiting queue reject with `RangeError`
before transferring input. Producers must limit concurrent submissions and handle
overflow; the runtime does not retain an additional unbounded admission queue.
`maxQueuedJobs` additionally bounds waiting task count. Higher `priority` values
start first. Every `priorityAgingMs` (default 1000), a waiting job gains one
priority point, so older work can precede newer traffic. Equal effective
priorities preserve queue order. A blocked head job prevents smaller jobs
bypassing it. These are per-pool limits, not ecosystem-wide memory limits.

Byte-bounded batch sessions require `inputBytes`, a reservation covering the
options/context buffers plus each input batch's backing buffers. It remains held
for the whole session. Each batch is checked before transfer. The worker requests
input on demand; output is yielded in the worker processor's emission order,
with acknowledgement after the consumer resumes. Processors must release or
account for retained earlier batches themselves.

Pool options on `processOnWorker` configure the shared singleton farm and apply
to its cached pools. Configure consistent budgets for that farm; use a separate
`WorkerPool` for independent scheduling policies. Lowering a budget allows active
jobs to finish, rejects queued jobs that can no longer fit in flight, and applies
the new queue limit to subsequent submissions.

## Cancellation and teardown

Queued jobs reject immediately on abort without transferring their input. The
compatibility default, `cancellationMode: 'terminate'`, destroys an active worker
and all its local state. `cancellationMode: 'cooperative'` rejects the caller
immediately and sends cancellation to `createWorker`'s `context.signal`. The
worker remains leased and its input bytes remain reserved until its processor
settles; progress and results after cancellation are discarded. A processor that
settles within `cancellationTimeout` (default 1000 ms) leaves its worker reusable.
Otherwise the runtime terminates it and subsequent jobs use a replacement.
Legacy custom workers without cancellation support require termination.

A synchronous CPU loop cannot receive cancellation messages while it blocks the
worker event loop. Message-based cooperative processors must yield to a task (for example
`setTimeout`, not just a resolved Promise) and check `context.signal`.
Optional atomic shared-state polling can avoid this yield requirement; see below. Bulk
projection does this between chunks. Synchronous map setup still requires hard
cancellation. Cancellation does not roll back mutations to persistent state or
shared memory, and transferred input cannot be recovered automatically.

`await pool.destroy()` rejects pending admissions, queued jobs and active jobs,
then waits for Node worker termination. It is idempotent. `WorkerFarm.destroy()`
and resource destruction are also awaitable. Browser termination is synchronous
at the Worker API boundary. A crashed worker is never reused.

`copy` means structured clone, not exclusive ownership: SharedArrayBuffer remains
shared in every mode and requires appropriate browser cross-origin isolation.
The runtime does not synchronize concurrent shared-memory access. Overlapping
views retain their common backing-buffer identity; transfer detaches all views.

## Awaitable admission

Reserve capacity **before constructing large input**, then consume that reservation
with `processOnWorker`. Admission waits retain only byte counts and listeners;
`maxPendingAdmissions` bounds these waiters (default 128). A full admission queue
rejects rather than retaining an unbounded second queue. Waiting can be aborted.
A reservation holds queued bytes and a task slot until consumed or released.
Use `try/finally` to release tickets after allocation or submission failures.

```ts
import {WorkerPool, processOnWorker, NullWorker} from '@math.gl/core/worker-utils';

const pool = new WorkerPool({
  url: NullWorker.worker as string,
  maxConcurrency: 2,
  maxQueuedJobs: 8,
  maxQueuedBytes: 64 * 1024 * 1024,
  maxInFlightBytes: 64 * 1024 * 1024
});
const admission = await pool.reserve(16 * 1024 * 1024, {signal: controller.signal});
try {
  const input = new Uint8Array(admission.inputBytes);
  await processOnWorker(NullWorker, input, {workerPool: pool, admission});
} finally {
  admission.release(); // No-op after consumption.
}
await pool.destroy();
```

Tickets belong to one pool, can be consumed once, and must match the accounted
input bytes, including options/context buffers. For browser module workers,
construct the pool with the descriptor's `loadWorker` factory instead of a Node
URL. A resolved ticket is caller-owned; aborting its former waiting signal does
not release it. Lowering budgets does not revoke resolved tickets; release and
reserve again if submission no longer fits. A batch reservation covers its
whole session rather than admitting each batch independently.

## Persistent worker resources

`createResourceWorker` initializes state once inside a worker. It can hold a
projection, spatial index, dataset, or WASM instance. Functions and resources
remain worker-local. For example, a worker module can install:

```ts
import {createResourceWorker} from '@math.gl/core/worker-utils';

await createResourceWorker({
  initialize: (input: {scale: number}) => ({scale: input.scale}),
  run: (state, input: Float64Array, context) => {
    context.signal?.throwIfAborted();
    return input.map(value => value * state.scale);
  },
  dispose: state => { state.scale = 0; }
});
```

The caller describes its protocol with
`WorkerResourceObject<{scale: number}, Float64Array, Float64Array>`, supplies a
worker URL or browser factory, and calls
`await createWorkerResource(descriptor, {scale: 2})`. The returned handle has typed
`run(input, options)`, `stats` and `destroy()` methods. Each handle owns a dedicated
single-worker pool: calls serialize, preserving affinity and initialization.
Pool configuration belongs to resource creation; `run` accepts only per-call
ownership, scheduling, progress and cancellation controls.
The default resource queue holds at most 32 waiting calls; configure byte budgets
for large inputs. This first version
trades cross-resource worker sharing for explicit lifetime guarantees.

`destroy()` stops accepting new calls, drains submitted work, invokes the optional
worker-side disposer, then terminates its worker even if disposal fails. Hard
abort or crash invalidates the handle; later calls reject and callers must create
a new resource. The runtime never silently reconstructs state or retries work
whose inputs may have detached. Cooperative cancellation can leave partial state
mutations; resource processors own their transaction and cleanup semantics.
Resource `destroy({timeout})` has a 1000 ms default grace period for draining and
disposal; on expiry it terminates the worker and rejects with a timeout error.
Results transfer by default: return independent buffers when retaining cached
state. A timed-out or crashed worker cannot run its disposer; external resources must
tolerate abrupt loss.

## Instrumentation and benchmarks

`pool.stats` returns current/peak input bytes, queued/active jobs, admission waits,
reservations, worker creation/restarts, and completed/failed/cancelled counts.
Restarts count workers discarded after cancellation or unexpected failure;
intentional teardown does not count. Queued cancellation is not a worker lease
and is not included in settled-lease counts.

`onMetrics` receives one record after each worker lease settles: queue wait,
worker constructor time, optional runtime-ready startup latency, synchronous
`postMessage` serialization/transfer time, lease duration, input bytes, outcome,
and processor execution time when supplied by `createWorker`. Startup latency
includes module loading until the ready handshake, not the first job's execution.
A reused worker retains its original startup measurement. Durations overlap;
do not add these fields together. Transfer time does not claim to measure all
asynchronous delivery costs. Throwing diagnostics are isolated from execution.
`performanceMarks: true` additionally emits `math.gl.worker:<job name>` measures;
applications should consume and clear those opt-in timeline entries.

See [the benchmark harness](../tasks/developer-guide/benchmarks.md) for cold/warm
latency, throughput, sampled process RSS, persistent projection, overload,
cancellation, crash recovery, teardown, and optional pinned library comparisons.
Performance depends on workload, ownership policy and environment; these APIs
alone do not establish a universal performance ranking.

## Optional shared memory between caller and workers

`getWorkerCapabilities()` probes workers, SharedArrayBuffer allocation, Atomics,
and whether structured cloning preserves shared backing storage. It reports
`sharedMemory`, `crossOriginIsolated`, and an unavailability reason. Browser
sharing requires a secure context and cross-origin isolation, usually configured
with these response headers (and compatible cross-origin assets):

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Node does not require these headers. `createSharedWorkerState()` returns `null`
when unavailable; ordinary message-based execution still works.

```ts
import {createSharedWorkerState, getWorkerCapabilities} from '@math.gl/core/worker-utils';

const state = createSharedWorkerState();
console.log(getWorkerCapabilities());
const result = projectBulkInWorker(input, {
  cancellationMode: 'cooperative',
  signal: controller.signal,
  sharedState: state?.buffer
});
// The main thread may poll state?.snapshot without a progress message round trip.
await result;
console.log(state?.snapshot); // completed, total, revision, cancelled
```

Cooperative jobs automatically get a fresh shared control buffer when available.
Supply an explicitly created buffer to observe it on the caller, or set
`sharedState: false` to force message-only behavior. No input data is automatically
converted to shared memory. The fixed 16-byte runtime control buffer is excluded
from application input-byte reservations, just like worker/message overhead.

Custom processors receive `context.sharedState` and `context.throwIfAborted()`.
The latter checks both the native worker signal and the atomic cancellation
flag. Calling it within a synchronous CPU loop can observe main-thread aborts
without processing a cancellation message. Algorithms must still poll; arbitrary
JavaScript cannot be forcibly interrupted while preserving worker state.
`context.signal` alone updates when the worker processes the cancellation message.
When shared memory is unavailable or disabled, yielding remains necessary.

Workers may call `context.sharedState?.setProgress(completed, total)` to publish
int32 counters; bulk projection does so at chunk boundaries. Phase names and units
continue over normal progress messages. Each snapshot field is atomic, but a
snapshot is not a transaction across fields. The revision counter wraps as int32.
Counters support nonnegative signed int32 values; `total: -1` means unknown.

Use one fresh control buffer per job and do not reuse a cancelled buffer.
For resource handles, a signal or control buffer supplied at creation applies only
to initialization; later `run` calls receive fresh automatic control state unless
the caller provides their own. Creation-time `sharedState: false` remains a
default opt-out for that resource. Pass cancellation signals on each `run` call. Calling
`state.cancel()` directly is observed by cooperating processors, but it does not
by itself reject a queued caller or start a termination deadline; use AbortSignal
for runtime-managed cancellation. Cancellation never rolls back shared writes.

For application-defined state or datasets, allocate your own SharedArrayBuffer,
pass its typed views in an operation/resource input, and use Atomics for shared
integer synchronization. `inputOwnership: 'share'` rejects ordinary transferable
storage and preserves shared buffers. Use an ownership protocol or double
buffering for floating-point data; concurrent Float64Array writes are not made
transactional by the runtime. Persistent resource inputs can retain such buffers
while the main thread keeps its own views.

The isolated browser regression suite runs with
`MATHGL_TEST_SHARED_MEMORY=1 yarn vitest run --project headless modules/core/test/worker-utils/browser.spec.ts`.
CI exercises both isolated sharing and the default message fallback.
