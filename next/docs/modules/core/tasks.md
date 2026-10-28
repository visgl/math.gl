# Tasks

Move expensive numerical work off the main thread while keeping control of input ownership, queue capacity, cancellation, and resource lifetime. Small independent batches can run on the main thread to avoid worker round trips. `@math.gl/core/tasks` is an optional entry in `@math.gl/core` for browser and Node workers. Geospatial operations consume the same runtime through `@math.gl/geospatial/workers`.

![Requests flow from the main thread through a bounded queue to reusable workers, with optional shared control state](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5NjAgNDgwIiByb2xlPSJpbWciIGFyaWEtbGFiZWxsZWRieT0idGl0bGUgZGVzY3JpcHRpb24iPgogIDx0aXRsZSBpZD0idGl0bGUiPlRhc2sgZXhlY3V0aW9uIGFyY2hpdGVjdHVyZTwvdGl0bGU+CiAgPGRlc2MgaWQ9ImRlc2NyaXB0aW9uIj5BIG1haW4gdGhyZWFkIHN1Ym1pdHMgdHlwZWQgd29yayB0aHJvdWdoIGEgYm91bmRlZCBzY2hlZHVsZXIgdG8gcmV1c2FibGUgd29ya2Vycy4gT3B0aW9uYWwgc2hhcmVkIG1lbW9yeSBjb25uZWN0cyBjYW5jZWxsYXRpb24gYW5kIHByb2dyZXNzIHN0YXRlLjwvZGVzYz4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYmFja2dyb3VuZCIgeDI9IjEiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjMDgxNjI1Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMTQyZDQzIi8+PC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0icXVldWUiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agc3RvcC1jb2xvcj0iIzE2NGI2MCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzE1MzQ0OCIvPjwvbGluZWFyR3JhZGllbnQ+CiAgICA8bWFya2VyIGlkPSJhcnJvdyIgdmlld0JveD0iMCAwIDEwIDEwIiByZWZYPSI4IiByZWZZPSI1IiBtYXJrZXJXaWR0aD0iNyIgbWFya2VySGVpZ2h0PSI3IiBvcmllbnQ9ImF1dG8tc3RhcnQtcmV2ZXJzZSI+PHBhdGggZD0iTTAgMCAxMCA1IDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzc0ZTJjZCIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48L21hcmtlcj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9Ijk2MCIgaGVpZ2h0PSI0ODAiIHJ4PSIyNCIgZmlsbD0idXJsKCNiYWNrZ3JvdW5kKSIvPgogIDxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzc0ZTJjZCIgc3Ryb2tlLXdpZHRoPSIzIiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93KSI+CiAgICA8cGF0aCBkPSJNMjYwIDIxOEgzNDAiLz48cGF0aCBkPSJNNjAwIDIxOEg2NTBWMTE4SDY5OCIvPgogICAgPHBhdGggZD0iTTYwMCAyMThINjk4Ii8+PHBhdGggZD0iTTYwMCAyMThINjUwVjMxOEg2OTgiLz4KICA8L2c+CiAgPGcgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiI+CiAgICA8dGV4dCB4PSI0MiIgeT0iNTYiIGZpbGw9IiM5ZWViZGYiIGZvbnQtc2l6ZT0iMTYiIGxldHRlci1zcGFjaW5nPSIzIj5UQVNLUzwvdGV4dD4KICAgIDxyZWN0IHg9IjQwIiB5PSIxMjgiIHdpZHRoPSIyMjAiIGhlaWdodD0iMTgwIiByeD0iMTgiIGZpbGw9IiMxNDJkNDMiIHN0cm9rZT0iIzQ5N2I5NCIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgICA8dGV4dCB4PSI2NSIgeT0iMTY4IiBmaWxsPSIjZWZmOWZmIiBmb250LXNpemU9IjI1IiBmb250LXdlaWdodD0iNjUwIj5NYWluIHRocmVhZDwvdGV4dD4KICAgIDx0ZXh0IHg9IjY1IiB5PSIyMDYiIGZpbGw9IiNiZmQ0ZTAiIGZvbnQtc2l6ZT0iMTgiPlR5cGVkIHJlcXVlc3RzPC90ZXh0PgogICAgPHRleHQgeD0iNjUiIHk9IjIzOCIgZmlsbD0iI2JmZDRlMCIgZm9udC1zaXplPSIxOCI+U21hbGwgdGFza3MgcnVuIGhlcmU8L3RleHQ+CiAgICA8dGV4dCB4PSI2NSIgeT0iMjcwIiBmaWxsPSIjYmZkNGUwIiBmb250LXNpemU9IjE4Ij5Pd25lZCByZXN1bHRzPC90ZXh0PgogICAgPHJlY3QgeD0iMzQwIiB5PSIxMDgiIHdpZHRoPSIyNjAiIGhlaWdodD0iMjIwIiByeD0iMTgiIGZpbGw9InVybCgjcXVldWUpIiBzdHJva2U9IiM3NGUyY2QiIHN0cm9rZS13aWR0aD0iMiIvPgogICAgPHRleHQgeD0iMzY1IiB5PSIxNTMiIGZpbGw9IiNlZmY5ZmYiIGZvbnQtc2l6ZT0iMjUiIGZvbnQtd2VpZ2h0PSI2NTAiPkJvdW5kZWQgcXVldWU8L3RleHQ+CiAgICA8dGV4dCB4PSIzNjUiIHk9IjE5NCIgZmlsbD0iI2QwZWNlYiIgZm9udC1zaXplPSIxOCI+VGFza3MgKyBpbnB1dCBieXRlczwvdGV4dD4KICAgIDx0ZXh0IHg9IjM2NSIgeT0iMjI4IiBmaWxsPSIjZDBlY2ViIiBmb250LXNpemU9IjE4Ij5Qcmlvcml0aWVzICsgYWRtaXNzaW9uPC90ZXh0PgogICAgPGcgZmlsbD0iIzc0ZTJjZCI+PHJlY3QgeD0iMzY3IiB5PSIyNjUiIHdpZHRoPSI0MCIgaGVpZ2h0PSIyMiIgcng9IjUiLz48cmVjdCB4PSI0MTciIHk9IjI2NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjIyIiByeD0iNSIvPjxyZWN0IHg9IjQ2NyIgeT0iMjY1IiB3aWR0aD0iNDAiIGhlaWdodD0iMjIiIHJ4PSI1Ii8+PC9nPgogICAgPHJlY3QgeD0iNTE3IiB5PSIyNjUiIHdpZHRoPSI0MCIgaGVpZ2h0PSIyMiIgcng9IjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzc0ZTJjZCIgc3Ryb2tlLWRhc2hhcnJheT0iNCAzIi8+CiAgICA8ZyBmaWxsPSIjMTgzOTRjIiBzdHJva2U9IiM0OTdiOTQiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iNzAwIiB5PSI3OCIgd2lkdGg9IjIyMCIgaGVpZ2h0PSI4MCIgcng9IjE2Ii8+PHJlY3QgeD0iNzAwIiB5PSIxNzgiIHdpZHRoPSIyMjAiIGhlaWdodD0iODAiIHJ4PSIxNiIvPjxyZWN0IHg9IjcwMCIgeT0iMjc4IiB3aWR0aD0iMjIwIiBoZWlnaHQ9IjgwIiByeD0iMTYiLz48L2c+CiAgICA8ZyBmaWxsPSIjZWZmOWZmIiBmb250LXNpemU9IjIyIiBmb250LXdlaWdodD0iNjAwIj48dGV4dCB4PSI3MjgiIHk9IjEyNyI+V29ya2VyIDE8L3RleHQ+PHRleHQgeD0iNzI4IiB5PSIyMjciPldvcmtlciAyPC90ZXh0Pjx0ZXh0IHg9IjcyOCIgeT0iMzI3Ij5Xb3JrZXIgMzwvdGV4dD48L2c+CiAgICA8cGF0aCBkPSJNMTUwIDMxMFYzOTRIODEwVjM2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOWFhOWVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjcgNiIvPgogICAgPHJlY3QgeD0iMjU0IiB5PSIzNzMiIHdpZHRoPSI0NTAiIGhlaWdodD0iNDQiIHJ4PSIyMiIgZmlsbD0iIzI0MmU0YiIgc3Ryb2tlPSIjOWFhOWVlIi8+CiAgICA8dGV4dCB4PSI0NzkiIHk9IjQwMSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2RjZTBmZiIgZm9udC1zaXplPSIxOCI+T3B0aW9uYWwgc2hhcmVkIGNhbmNlbGxhdGlvbiArIHByb2dyZXNzPC90ZXh0PgogICAgPHRleHQgeD0iNDc5IiB5PSI0NTMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNhZGM2ZDUiIGZvbnQtc2l6ZT0iMTYiPkxvY2FsIGV4ZWN1dGlvbiArIHBvb2xlZCB3b3JrZXJzIMK3IGV4cGxpY2l0IG93bmVyc2hpcDwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo=)

## What you can build[​](#what-you-can-build "Direct link to What you can build")

| Workload                                                     | Starting point                                                                                                                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project many coordinates or prepare a map                    | Ready-to-use geospatial workers below                                                                                                                          |
| Run a typed numerical operation                              | [Custom worker tutorial](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/custom-workers.md)                          |
| Stream batches with demand-driven input                      | [Batch processing](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/custom-workers.md#stream-batches)                 |
| Reuse a projection, spatial index, dataset, or WASM instance | [Persistent resources](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/persistent-resources.md)                      |
| Share counters or cancellation between caller and worker     | [Shared memory](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/shared-memory.md)                                    |
| Control overload and diagnose latency                        | [Scheduling and instrumentation](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/workers.md#scheduling-and-memory-budgets) |
| Look up options and lifecycle rules                          | [API reference](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/api-reference/runtime.md)                                            |

## Install and import[​](#install-and-import "Direct link to Install and import")

```
npm install @math.gl/core @math.gl/geospatial
```

Import worker utilities through their optional subpath:

```
import {

  WorkerPool,

  processOnWorker,

  createWorkerResource,

  getWorkerCapabilities

} from '@math.gl/core/tasks';
```

The ordinary `@math.gl/core` math entry does not require the task runtime. `@math.gl/core/worker-utils` remains a compatible entry for existing worker APIs; both entries share the same runtime and worker pools. The generic runtime has no dependency on geospatial operations or loaders.gl. This implementation preserves the copied loaders.gl runtime's MIT attribution and low-level transfer default; loaders.gl compatibility migration is separate.

## Avoid worker round trips for small tasks[​](#avoid-worker-round-trips-for-small-tasks "Direct link to Avoid worker round trips for small tasks")

```
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

Auto routing requires an explicit size policy and a descriptor with a local `process` implementation. The two packaged geospatial descriptors provide one. Larger or unknown-cost jobs still use workers. Local execution preserves the structured-clone ownership boundary; it avoids dispatch round trips, not input copying when `copy` is requested. See [execution routing](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/execution.md).

## Start with a packaged operation[​](#start-with-a-packaged-operation "Direct link to Start with a packaged operation")

This example copies input, reports progress, and cooperates with cancellation. It runs in a browser with module-worker bundling or in Node using packaged worker assets. Keep the caller and worker package versions aligned.

```
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

Call `controller.abort()` from a UI event to cancel. Cancellation rejects the caller immediately; the pool retains the worker lease until the processor settles or its cancellation deadline terminates the worker.

For prepared maps:

```
import {setupMapInWorker} from '@math.gl/geospatial/workers';

import {MapEngine} from '@math.gl/geospatial/discontinuous';



const prepared = await setupMapInWorker({

  version: 1,

  id: 'world',

  definition: {type: 'myriahedral', preset: 'polyconic', columns: 24}

});

const map = MapEngine.fromPrepared(prepared);
```

Prepared snapshots preserve computed layout for same-version transport. Restoration still constructs local runtime objects. They are not a durable storage format. Custom callbacks must be installed inside your worker.

## Choose an ownership policy[​](#choose-an-ownership-policy "Direct link to Choose an ownership policy")

| Policy     | Ordinary ArrayBuffer                             | SharedArrayBuffer         | Useful for                              |
| ---------- | ------------------------------------------------ | ------------------------- | --------------------------------------- |
| `copy`     | Structured-cloned; caller keeps its input        | Remains shared            | Reusable caller input                   |
| `transfer` | Ownership moves; all backing-buffer views detach | Remains shared            | Large disposable inputs                 |
| `share`    | Rejected before dispatch                         | Shared; never transferred | Explicit application-owned shared state |

Geospatial convenience APIs default to `copy`; `processOnWorker` defaults to `transfer` for compatibility. Results transfer back. A typed-array subview transfers its entire backing buffer, including overlapping views. Cancellation and worker crashes cannot restore transferred input.

## Choose an execution lifetime[​](#choose-an-execution-lifetime "Direct link to Choose an execution lifetime")

Ordinary operations use reusable worker pools. Batch processing leases a worker for the iterator's lifetime. Persistent resource handles initialize once and serialize calls on one dedicated worker; hard cancellation or a crash invalidates that handle. None of these APIs automatically retry lost work.

For production queues, configure both task and input-byte budgets. Reserve queue capacity before allocating a large input. Budgets cover application input buffers, not result buffers, object graphs, worker caches, scratch allocations, or total process memory. See the [execution guide](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/workers.md).

## Know the platform boundary[​](#know-the-platform-boundary "Direct link to Know the platform boundary")

Browser workers require a bundler-resolved factory or a usable worker URL. Node uses a compiled worker module URL. Shared memory additionally requires browser cross-origin isolation; ordinary workers do not. Capability detection falls back to message-based control when sharing is unavailable.

Small jobs can be faster synchronously because worker startup, serialization, and dispatch have a cost. The runtime schedules CPU workers; automatic WASM/GPU backend selection is outside this API. See the [benchmark guide](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/benchmarks.md) to measure your workload.
