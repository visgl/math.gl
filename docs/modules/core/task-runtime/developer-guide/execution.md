# Choose main-thread or worker execution

For small independent batches, worker dispatch can cost more than the numerical
operation. `runTask` and `runTaskInBatches` can execute those batches locally while
sending larger work to workers. Selection is explicit and application-controlled.

## Routing rules

| Execution mode | Behavior |
| --- | --- |
| `worker` | Always calls processOnWorker; existing worker behavior |
| `main-thread` | Requires a descriptor with process; executes locally |
| `auto` (default) | Uses the main thread only when an explicit policy admits the input and process exists |

Without a policy, auto uses workers. Missing local processors, worker admission
tickets, and an explicit `cancellationMode: 'terminate'` also keep auto work on
workers. An asset-loading failure does not silently move a large job onto the UI
thread.

## Set a measured threshold

```ts
import {runTask} from '@math.gl/core/task-runtime';
import {BulkProjectionWorker} from '@math.gl/geospatial/workers';

const projected = await runTask(BulkProjectionWorker, {
  projection: {from: 'EPSG:4326', to: 'EPSG:3857'},
  coordinates: new Float64Array([0, 0, 10, 20])
}, {
  execution: 'auto',
  mainThread: {maxSize: 64 * 1024},
  inputOwnership: 'copy',
  onExecution: route => console.log(route) // main-thread or worker
});
```

By default size is input backing-buffer bytes, with shared/overlapping buffers
counted once and subviews counting their whole backing buffer. The limit is
inclusive. A zero byte count alone does not establish cheap computation: an input
such as `{iterations: 1000000000}` has no buffers and stays on workers.

For a better cost model, supply `getSize` in units you define:

```ts
const projected = await runTask(BulkProjectionWorker, input, {
  mainThread: {
    maxSize: 512, // Coordinate records.
    getSize: request => request.coordinates.length / (request.dimension ?? 2)
  },
  inputOwnership: 'copy'
});
```

These limits are examples, not universal recommendations. Bytes and record counts
are cost proxies, not time budgets. A poor estimate or expensive per-record kernel
can still block the main thread. Profile cold startup, warm execution, and UI frame
latency for your operation. `onExecution` reports the chosen route; worker-only
pool statistics and onMetrics do not include local calls.

## Process independent batches

```ts
import {runTaskInBatches} from '@math.gl/core/task-runtime';
import {BulkProjectionWorker} from '@math.gl/geospatial/workers';

for await (const projected of runTaskInBatches(BulkProjectionWorker, requests, {
  mainThread: {
    maxSize: 512,
    getSize: request => request.coordinates.length / (request.dimension ?? 2)
  },
  inputOwnership: 'copy',
  signal: controller.signal
})) {
  consume(projected);
}
```

`requests`, `controller`, and `consume` belong to the application. One input is
advanced and processed at a time. Each batch chooses its route independently;
outputs retain input order. The source advances again only when the consumer
resumes. Between batches, the iterator yields to the event loop when its
approximately 8 ms scheduling window expires, so a long stream of tiny local
batches does not monopolize the microtask queue. It cannot preempt one expensive
processor call. Aborting while waiting for a blocked producer rejects promptly and
requests best-effort iterator cleanup.

Reusable ordinary buffers in options and job context are copied per request, so
transferring one batch does not detach metadata needed by later batches. Each
batch's own input still transfers in transfer mode. Input sharing a transferable
buffer with reusable metadata is rejected before detachment; use `copy` for that
layout. Shared metadata stays shared. Use persistent resources or shared storage
for large reusable datasets to avoid repeatedly copying them. Non-copyable
transfer-only metadata, such as a MessagePort, cannot be reused this way.

These are independent **atomic** requests, with no leased cross-batch worker
state. Use `processOnWorkerInBatches` for a stateful streaming processor, or a
resource handle when initialization must remain pinned to a worker. A one-use
admission ticket cannot be reused across adaptive batches.

## Keep semantics consistent

Local input, options, job context, and output use a structured-clone boundary.
`copy` preserves ordinary caller input, `transfer` moves ownership and detaches
backing views, and `share` rejects ordinary transferable storage. Local execution
avoids message scheduling and round trips; it does not promise zero serialization
cost or borrowed mutable input.

A custom descriptor supplies `process` for local execution and an equivalent
worker processor for offloading. Keep algorithms and validation shared where
possible. The packaged map and projection descriptors supply local processors;
`projectBulkInWorker` and `setupMapInWorker` remain explicitly worker-only APIs.

Local tasks are outside worker-pool concurrency and memory budgets. Use the
sequential batch API to bound producer demand, or bound concurrent callers yourself.
Worker admission tickets force auto routing onto their pool. Forced local execution
with an admission or hard-termination requirement rejects before dispatch.

## Cancellation on the main thread

Local processors receive a signal, progress reporter, optional shared state, and
`throwIfAborted`. An abort rejects the caller and discards late results/progress.
Processors still own cooperative cleanup and any partial application mutations.
A throwing progress callback aborts the operation even if the processor catches it.

Main-thread JavaScript cannot be hard-terminated. A synchronous local loop blocks
UI events and native signal delivery until it yields. Keep local work small;
use workers when interruption or expensive computation matters. Explicit hard
termination selects a worker in auto mode and is rejected with forced main-thread
execution. A cancellation timeout cannot forcibly stop local code.
