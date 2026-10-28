# Worker runtime API

Import runtime functions and types from `@math.gl/core/tasks`. For runnable
examples, start with [custom workers](../developer-guide/custom-workers.md),
[persistent resources](../developer-guide/persistent-resources.md), and
[shared memory](../developer-guide/shared-memory.md).

## Task dispatch

`runTask(task, input, options?, context?, jobContext?)` returns a typed Promise.
`TaskDescriptor<Input, Output, Options>` is the descriptor type (compatible with
`WorkerObject`). A local `process` implementation enables main-thread execution.

`runTaskInBatches(task, inputIterable, options?, context?, jobContext?)` returns an
AsyncIterable of independent atomic outputs, in input order, with one request in
flight. It does not invoke the descriptor's stateful `processInBatches` method.
Reusable option/context buffers are copied per request when batch inputs transfer;
input/metadata transfer aliases are rejected before detachment (use copy mode).
Shared metadata remains shared; transfer-only metadata must be installed in a
persistent resource instead of being reused across requests.

`TaskOptions<Input>` extends worker options with:

| Option | Default | Contract |
| --- | --- | --- |
| `execution` | `auto` | `auto`, `main-thread`, or `worker` |
| `mainThread.maxSize` | No policy | Finite nonnegative local-work threshold |
| `mainThread.getSize(input)` | Input backing-buffer bytes | Optional typed workload estimator; finite nonnegative result |
| `onExecution(route)` | None | Diagnostic route event; exceptions are isolated |

Auto without a policy uses workers. Unknown zero-byte input uses workers unless
an explicit estimator supplies its cost. Missing local processors, worker
admissions, or explicit hard termination also use workers. See the
[execution guide](../developer-guide/execution.md) for ownership and cancellation.

## WorkerObject

`WorkerObject<Input, Output, Options>` is a typed descriptor, not a running worker.

| Field | Meaning |
| --- | --- |
| `id`, `name`, `module`, `version` | Operation identity and diagnostic/version metadata |
| `options` | Descriptor metadata object; supply execution options to the processing call |
| `worker` | Worker asset URL, or capability declaration |
| `loadWorker` | Browser factory returning a fresh Worker, or `null` to use URL fallback |
| `packageName` | Explicit npm package for default CDN asset resolution |
| `workerInBatches` | Declares built-in batch protocol support |
| `workerFile`, `workerNode`, `workerSourceNode` | Asset/source-resolution overrides for packaged workers |
| `process`, `processInBatches` | Optional processor declarations carrying input/output/options types |

Browser callers can use a bundler-resolved module-worker factory. Node callers
need a loadable compiled worker module URL. Custom URLs and `workerUrl` overrides
must implement the runtime protocol. An omitted `packageName` preserves the legacy
loaders.gl URL convention; do not rely on that convention for new math.gl packages.

For browser URL or source targets, set `workerType: 'module'` to load an ES module;
the default is `'classic'` for compatibility. Module URLs use the browser's native
worker loading and origin rules. This option does not change Node's module resolution.

## processOnWorker

```ts
processOnWorker<Input, Output, Options>(
  worker: WorkerObject<Input, Output, Options>,
  input: Input,
  options?: ProcessOnWorkerOptions & Partial<Options>,
  context?: WorkerContext,
  jobContext?: WorkerJobContext
): Promise<Output>
```

Acquires a worker lease, posts one request, and returns its result. Caller callbacks,
signals, pools, and admission tickets stay local. `jobContext` is serializable
application context sent to the processor as its fourth argument. The caller-side
`context.process` can service worker requests to the main thread; ordinary
application operations usually do not need it.

There is no automatic synchronous fallback or retry. Use `canProcessOnWorker` to
check whether a descriptor and `{worker: true}` request can be offloaded; it does
not prove that a worker asset will load. `getWorkerCapabilities` reports platform
support independently of a particular asset.

### Per-call controls

| Option | Default | Behavior |
| --- | --- | --- |
| `inputOwnership` | `transfer` | `copy`, `transfer`, or `share`; geospatial convenience APIs default to `copy` |
| `signal` | None | Reject queued work; cancel active work according to its mode |
| `cancellationMode` | `terminate` | Hard termination, or `cooperative` for processors installed with `createWorker` |
| `cancellationTimeout` | 1000 ms | Cooperative grace period before hard termination |
| `sharedState` | Automatic for cooperative calls when available | Explicit 16-byte control buffer, or `false` to disable sharing |
| `priority` | 0 | Larger values start first; waiting priority increases with age |
| `onProgress` | None | Receives phase measurements; throwing aborts the job |
| `jobName` | Worker name | Diagnostic task name |
| `workerPool` | Shared farm pool | Explicit isolated pool |
| `admission` | None | One-use reservation from that same pool; exact application input-byte count must match |
| `inputBytes` | Batch-specific | Retained input reservation for a byte-bounded batch session; atomic calls calculate their bytes |

Runtime controls coexist with typed operation options, such as projection settings.
Input buffers in options and job context participate in ownership and byte accounting.
Shared control storage is fixed runtime overhead and excluded from input reservations.

## createWorker

```ts
createWorker(process: Process, processInBatches?: ProcessInBatches): Promise<void>
```

Installs the processor protocol inside a worker. `Process<Input, Output, Options>`
receives `(input, options, context, jobContext)` and returns output or a Promise.
Functions in application inputs cannot cross the structured-clone boundary.

| WorkerContext member | Purpose |
| --- | --- |
| `signal` | Worker-side AbortSignal, updated through cancellation messages |
| `throwIfAborted()` | Checks both native signal and optional atomic cancellation |
| `sharedState` | Optional SharedWorkerState wrapper |
| `reportProgress(progress)` | Reports `{phase, completed, total?, unit}` |
| `process(...)` | Worker-to-main processing bridge |

Progress may be coalesced within a phase; final progress is flushed before success.
A cancellation after dispatch rejects the caller immediately but keeps the lease
until worker settlement or termination. Cancellation before dispatch releases the
lease without starting a processor or replacing the worker.

## processOnWorkerInBatches

```ts
processOnWorkerInBatches<InputBatch, OutputBatch, Options>(
  worker: WorkerObject<InputBatch, OutputBatch, Options>,
  input: AsyncIterable<InputBatch> | Iterable<InputBatch>,
  options?: ProcessOnWorkerOptions & Partial<Options>,
  context?: WorkerContext,
  jobContext?: WorkerJobContext
): AsyncIterable<OutputBatch>
```

The session owns one worker for its entire iterator lifetime. Input is requested
on demand; output waits for consumer acknowledgement. Ordering follows processor
emission order. Each batch inherits the selected input ownership policy.

If either byte budget is finite, provide `inputBytes` covering options/context plus
each batch's retained buffers. A batch exceeding the reservation fails before
transfer. Retaining earlier inputs inside the processor requires separate
application accounting. Closing the output iterator terminates an active session
and requests input-iterator cleanup.

`canProcessOnWorkerInBatches` checks declared batch support and custom-worker
overrides. An explicitly supplied custom URL needs an explicit batch capability.

## WorkerPool and WorkerFarm

`new WorkerPool(props)` creates an isolated scheduler. `WorkerFarm.getWorkerFarm(props)`
returns the shared singleton used by ordinary processing calls. Farm properties
update its cached pools; use consistent settings or isolated pools for independent
policies.

| Property | Direct pool default | Shared farm default |
| --- | --- | --- |
| `maxConcurrency` | 1 | 3 |
| `maxMobileConcurrency` | 1 | 1 |
| `maxQueuedJobs` | `Infinity` | `Infinity` |
| `maxQueuedBytes` | `Infinity` | `Infinity` |
| `maxInFlightBytes` | `Infinity` | `Infinity` |
| `maxPendingAdmissions` | 128 | 128 |
| `priorityAgingMs` | 1000 ms | 1000 ms |
| `reuseWorkers` | `true` | `true` |
| `onMetrics`, `onDebug` | No callback/no-op | No-op |
| `performanceMarks` | `false` | `false` |

A pool accepts `url`, `source`, `loadWorker`, and optional lazy `getUrl` creation
settings. Concurrency must be a positive safe integer. Budgets/count limits accept
nonnegative safe integers or `Infinity`; the aging interval must be positive and
finite. Configure finite limits appropriate to the application.

For example, a two-worker pool accepting at most eight waiting jobs and
64 MiB of queued or in-flight input buffers can be configured as follows:

```ts
const pool = new WorkerPool({
  url: workerUrl, // Application-supplied worker URL.
  maxConcurrency: 2,
  maxMobileConcurrency: 2,
  maxQueuedJobs: 8,
  maxQueuedBytes: 64 * 1024 * 1024,
  maxInFlightBytes: 64 * 1024 * 1024
});
// Pass {workerPool: pool} to task calls, then await pool.close({timeout: 5000}).
```

These example values are starting points, not a universal recommendation.
Measure your input sizes and worker costs; buffers in outputs, worker caches,
other allocations, and process memory are outside these budgets.

### reserve and WorkerAdmission

```ts
pool.reserve(inputBytes: number, options?: {signal?: AbortSignal}): Promise<WorkerAdmission>
```

Waits for an atomic queue reservation before input allocation. The ticket exposes
`inputBytes` and idempotent `release()`. It belongs to one pool, holds queued bytes
and a task slot, and is consumed once by `processOnWorker`/batch processing.
The pending admission queue stores bounded metadata, not input payloads.

Queue overflow rejects before transfer. A reservation larger than a byte budget,
an exhausted pending-admission queue, or invalid values reject. The waiting signal
cancels only the wait; after resolution the caller must consume or release the ticket.

A head job blocked by the in-flight budget prevents smaller queued jobs bypassing
it. Lowering budgets lets active jobs finish and rejects queued jobs that cannot
fit in flight; previously resolved tickets are not automatically revoked.

### stats and WorkerJobMetrics

`pool.stats` is a snapshot with queued/active job counts, queued/in-flight input
bytes, peak input-byte totals, pending admissions, reservations, workers created,
worker restarts, and completed/failed/cancelled lease counts. Queued cancellation
is not a settled worker lease. Bytes do not estimate strings, objects, outputs,
worker caches, scratch space, or total process RSS.

`onMetrics` receives these fields after a lease settles:

| Field | Meaning |
| --- | --- |
| `name`, `outcome`, `inputBytes` | Diagnostic identity, completed/failed/cancelled outcome, application input bytes |
| `queueWaitMs` | Queue submission to lease start |
| `durationMs` | Lease duration, including time waiting for cooperative settlement |
| `workerCreationMs` | Worker constructor time |
| `workerStartupMs?` | Constructor to runtime-ready handshake; absent for legacy workers |
| `postMessageMs` | Synchronous serialization/transfer call cost |
| `executionMs?` | Processor elapsed time reported by createWorker, including its awaits |

Times overlap and must not be added. A reused worker keeps its original startup
measurement. These timings do not isolate all asynchronous delivery costs.
Diagnostic callback exceptions do not prevent worker release.

`performanceMarks: true` emits `math.gl.worker:<job name>` measures. Consume and
clear those opt-in timeline entries in the application.

### Teardown and preloading

`await pool.close({timeout?})` stops new jobs and admissions, rejects pending
admission waits, invalidates unused reservations, and lets submitted jobs drain.
It then terminates workers. A timeout from 0 through 2,147,483,647 milliseconds
forces termination of unfinished jobs; omit it to wait indefinitely. Repeated
calls return the same promise.

`await pool.destroy(reason?)` rejects queued/active work and admission waits, then
waits for worker termination. It is idempotent. `await farm.destroy(reason?)`
destroys its current pools; later requests can create fresh pools in the farm.

`preloadWorker(descriptor, options?, {count?})` warms workers in the resolved pool.
It accepts an explicit `workerPool` and signal. Preloading does not initialize an
application resource; use a resource handle for that lifetime.

## Persistent resource APIs

| API | Contract |
| --- | --- |
| `createResourceWorker({initialize, run, dispose?})` | Installs a stateful processor inside a worker |
| `WorkerResourceObject<Init, Input, Output>` | Descriptor for the resource protocol |
| `createWorkerResource(descriptor, initialization, options?)` | Initializes once and returns a typed handle |
| `resource.run(input, options?)` | Serial call with WorkerResourceRunOptions |
| `resource.stats` | Owned single-worker pool statistics |
| `resource.destroy({timeout?})` | Drain/dispose/terminate; default total deadline 1000 ms |

Resource pools always have concurrency 1, reuse their worker, and default to
32 queued calls. Their byte budgets remain configurable. Initialization signals
and buffers do not become future run controls. Hard cancellation or worker loss
invalidates the handle; it is never silently recreated. Ordinary processor errors
reject a call without automatically invalidating state. See the
[lifecycle and failure table](../developer-guide/persistent-resources.md#failure-and-cancellation).

## Shared memory APIs

| API | Contract |
| --- | --- |
| `getWorkerCapabilities()` | Reports workers, sharedMemory, crossOriginIsolated, and optional unavailable reason |
| `createSharedWorkerState()` | Creates control state or returns null when unavailable |
| `new SharedWorkerState(buffer)` | Attaches a local wrapper to a 16-byte shared control buffer |
| `state.snapshot` | Atomic fields: cancelled, completed, total, revision; not a multi-field transaction |
| `state.setProgress(completed, total?)` | Publish nonnegative int32 counts; total defaults to -1 |
| `state.cancel()` | Publish cancellation; does not itself start a runtime deadline |
| `state.throwIfCancelled()` | Throw an AbortError if its flag is set |

Use one fresh control buffer per job. Synchronize application-owned shared state
explicitly; the helper is a control plane, not an allocator or a transactional
shared-object store. See the [shared-memory guide](../developer-guide/shared-memory.md).

## Error and ownership rules

| Failure | Caller action |
| --- | --- |
| Queue/byte limit or invalid scheduling input | Bound producers; inspect configured limits and release unused admissions |
| Cancelled signal or shared cancellation | Handle AbortError or the caller's explicit signal reason |
| Uncloneable payload | Remove functions/unsupported objects; install callbacks inside the worker |
| Worker asset/module failure | Correct URL/bundler/package resolution; do not assume platform support proves asset availability |
| Crash or hard cancellation | Recreate resource handles; resubmit only with recoverable caller-owned input |
| Resource teardown timeout | Treat its worker as terminated; cleanup callbacks may not have completed |

Copy means structured cloning. SharedArrayBuffer is shared under every ownership
policy. Transfer detaches entire backing buffers, including all overlapping views;
no failed-operation path promises to restore transferred input.
