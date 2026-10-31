# Tasks

Move expensive numerical work off the main thread while keeping control of input
ownership, queue capacity, cancellation, and resource lifetime. Small independent
batches can run on the main thread to avoid worker round trips.
`@math.gl/core/tasks` is an optional entry in `@math.gl/core` for browser
and Node workers. Geospatial operations consume the same runtime through
`@math.gl/geospatial/workers`.

![Requests flow from the main thread through a bounded queue to reusable workers, with optional shared control state](/images/tasks.svg)

## Feature support

Capabilities of a local numerical task runtime, including explicit ownership and bounded execution.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature | math.gl support | Notes |
| --- | --- | --- |
| Browser and Node worker pools | ✅ Implemented | [Typed processing and reusable workers](./api-reference/runtime.md), with module-worker URLs and worker construction options. |
| Bounded scheduling and admission | ✅ Implemented | Queue, concurrency, byte-budget and priority controls; [scheduling](../developer-guide/workers.md) exposes overload behavior. |
| Copy, transfer and shared ownership | ✅ Implemented | Explicit ownership policies, transfer validation, SharedArrayBuffer controls, and [shared-memory examples](./developer-guide/shared-memory.md). |
| Cancellation, deadlines and progress | ✅ Implemented | Cooperative cancellation retains worker leases until settlement; unresponsive processors can be terminated. |
| Persistent resources and WASM instances | ✅ Implemented | [Resource lifetime](./developer-guide/persistent-resources.md) and [WASM recipes](./developer-guide/wasm.md) reuse application-owned initialization across tasks. |
| Streaming batches and main-thread routing | ✅ Implemented | Demand-driven batching and [runTask routing](./developer-guide/execution.md) with a caller-supplied size policy. |
| Automatic workload cost prediction | ❌ Not implemented | Auto routing requires an explicit size policy and a local implementation; it is not a learned or self-tuning cost model. |
| Distributed execution and durable job recovery | ❌ Not implemented | Pools run local browser/Node workers. Remote clusters, persisted queues and recovery across process restarts are outside this runtime. |

## What you can build

| Workload | Starting point |
| --- | --- |
| Project many coordinates or prepare a map | Ready-to-use geospatial workers below |
| Run a typed numerical operation | [Custom worker tutorial](./developer-guide/custom-workers.md) |
| Stream batches with demand-driven input | [Batch processing](./developer-guide/custom-workers.md#stream-batches) |
| Reuse a projection, spatial index, dataset, or WASM instance | [Persistent resources](./developer-guide/persistent-resources.md); [WASM in workers](./developer-guide/wasm.md) |
| Share counters or cancellation between caller and worker | [Shared memory](./developer-guide/shared-memory.md) |
| Control overload and diagnose latency | [Scheduling and instrumentation](../developer-guide/workers.md#scheduling-and-memory-budgets) |
| Look up options and lifecycle rules | [API reference](./api-reference/runtime.md) |

## Install and import

```sh
npm install @math.gl/core @math.gl/geospatial
```

Import worker utilities through their optional subpath:

```ts
import {
  WorkerPool,
  processOnWorker,
  createWorkerResource,
  getWorkerCapabilities
} from '@math.gl/core/tasks';
```

The ordinary `@math.gl/core` math entry does not require the task runtime.
`@math.gl/core/worker-utils` remains a compatible entry for existing worker APIs;
both entries share the same runtime and worker pools.
The generic runtime has no dependency on geospatial operations or loaders.gl.
This implementation preserves the copied loaders.gl runtime's MIT attribution
and low-level transfer default; loaders.gl compatibility migration is separate.

## Avoid worker round trips for small tasks

```ts
import {runTask} from '@math.gl/core/tasks';
import {BulkProjectionWorker} from '@math.gl/geospatial/workers';

const result = await runTask(BulkProjectionWorker, {
  projection: {from: 'EPSG:4326', to: 'EPSG:3857'},
  coordinates: new Float64Array([0, 0, 10, 20]),
  dimension: 2
}, {
  execution: 'auto',
  mainThread: {maxSize: 64 * 1024}, // Input backing-buffer bytes.
  inputOwnership: 'copy',
  onExecution: route => console.log(route)
});
```

Auto routing requires an explicit size policy and a descriptor with a local
`process` implementation. The two packaged geospatial descriptors provide one.
Larger or unknown-cost jobs still use workers. Local execution preserves the
structured-clone ownership boundary; it avoids dispatch round trips, not input
copying when `copy` is requested. See [execution routing](./developer-guide/execution.md).

## Start with a packaged operation

This example copies input, reports progress, and cooperates with cancellation.
It runs in a browser with module-worker bundling or in Node using packaged worker
assets. Keep the caller and worker package versions aligned.

```ts
import {projectBulkInWorker} from '@math.gl/geospatial/workers';

const controller = new AbortController();
const coordinates = new Float64Array([0, 0, 10, 20, 30, 40]);

const projected = await projectBulkInWorker({
  projection: {from: 'EPSG:4326', to: 'EPSG:3857'},
  coordinates,
  dimension: 2,
  chunkSize: 4096
}, {
  inputOwnership: 'copy',
  signal: controller.signal,
  cancellationMode: 'cooperative',
  onProgress: progress => {
    console.log(progress.phase, progress.completed, progress.total);
  }
});

// coordinates remains available; projected is independently owned by the caller.
console.log(projected);
```

Call `controller.abort()` from a UI event to cancel. Cancellation rejects the
caller immediately; the pool retains the worker lease until the processor
settles or its cancellation deadline terminates the worker.

For prepared maps:

```ts
import {setupMapInWorker} from '@math.gl/geospatial/workers';
import {MapEngine} from '@math.gl/geospatial/discontinuous';

const prepared = await setupMapInWorker({
  version: 1,
  id: 'world',
  definition: {type: 'myriahedral', preset: 'polyconic', columns: 24}
});
const map = MapEngine.fromPrepared(prepared);
```

Prepared snapshots preserve computed layout for same-version transport.
Restoration still constructs local runtime objects. They are not a durable
storage format. Custom callbacks must be installed inside your worker.

## Choose an ownership policy

| Policy | Ordinary ArrayBuffer | SharedArrayBuffer | Useful for |
| --- | --- | --- | --- |
| `copy` | Structured-cloned; caller keeps its input | Remains shared | Reusable caller input |
| `transfer` | Ownership moves; all backing-buffer views detach | Remains shared | Large disposable inputs |
| `share` | Rejected before dispatch | Shared; never transferred | Explicit application-owned shared state |

Geospatial convenience APIs default to `copy`; `processOnWorker` defaults to
`transfer` for compatibility. Results transfer back. A typed-array subview
transfers its entire backing buffer, including overlapping views. Cancellation
and worker crashes cannot restore transferred input.

## Choose an execution lifetime

Ordinary operations use reusable worker pools. Batch processing leases a worker
for the iterator's lifetime. Persistent resource handles initialize once and
serialize calls on one dedicated worker; hard cancellation or a crash invalidates
that handle. None of these APIs automatically retry lost work.

For production queues, configure both task and input-byte budgets. Reserve queue
capacity before allocating a large input. Budgets cover application input buffers,
not result buffers, object graphs, worker caches, scratch allocations, or total
process memory. See the [execution guide](../developer-guide/workers.md).

## Know the platform boundary

Browser workers require a bundler-resolved factory or a usable worker URL.
Node uses a compiled worker module URL. Shared memory additionally requires
browser cross-origin isolation; ordinary workers do not. Capability detection
falls back to message-based control when sharing is unavailable.

Small jobs can be faster synchronously because worker startup, serialization,
and dispatch have a cost. The runtime schedules CPU workers; automatic WASM/GPU
backend selection is outside this API. See the
[benchmark guide](./developer-guide/benchmarks.md) to measure your workload.

See [References and credits](../../../references-and-credits.md) for the project-wide source inventory and acknowledgments.
