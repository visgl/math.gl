# Worker processing

`@math.gl/core/worker-utils` provides the worker runtime copied from loaders.gl:
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
loaders.gl's default of transferring input. Set `inputOwnership: 'copy'` or
`'transfer'` explicitly. Transferring an ArrayBuffer detaches every view sharing
it; cancellation cannot restore it. Copy mode clones the entire request payload,
including options and context. Results are transferred back. Typed-array
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
