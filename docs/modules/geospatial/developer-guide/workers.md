# Workers

Use `@math.gl/geospatial/workers` to run map setup and bulk projection outside the
browser UI thread. Synchronous math APIs are unchanged. Each task owns a fresh
worker, reports progress, and terminates on completion, failure, or cancellation.
This favors responsive, cancellable jobs over a persistent worker pool.

## Worker entry

Create an application-owned module worker so your bundler controls its URL:

```ts
// geospatial.worker.ts
import {installWorkerTasks} from '@math.gl/geospatial/workers';
import {geospatialWorkerTasks} from '@math.gl/geospatial/workers/operations';

installWorkerTasks(self, geospatialWorkerTasks);
```

The client entry does not import map or projection algorithms. The operations
entry belongs in the worker. Do not install handlers on the browser window.

## Bulk projection

```ts
import {runWorkerTask} from '@math.gl/geospatial/workers';

const controller = new AbortController();
const createWorker = () => new Worker(
  new URL('./geospatial.worker.ts', import.meta.url),
  {type: 'module'}
);

const output = await runWorkerTask<Float64Array>(createWorker, 'bulk-projection', {
  projection: {from: 'EPSG:4326', to: 'EPSG:3857'},
  coordinates: new Float64Array([10, 20, 30, 40]),
  dimension: 2,
  chunkSize: 4096
}, {
  signal: controller.signal,
  onProgress: ({phase, completed, total}) => console.log(phase, completed, total)
});

// From a cancel button while the promise is pending:
// controller.abort();
```

The operation accepts `Float32Array` or `Float64Array` with complete interleaved
records, a dimension of at least two, an optional `inverse: true`, and a positive
integer chunk size. CRS options are `from`, `to`, `enforceAxis`, and `mode` from
`CreateProjectionOptions`. The built-in full projection catalogue is used; custom
plugins, registered grids, pipelines and coordinate epochs need an application
handler configured inside the worker.

Progress has `{phase, completed, total?}`. `projection-setup` reports start and
completion; `bulk-projection` reports processed records, including zero and the
final count. Progress measures work within a phase, not elapsed time. Empty input
reports zero of zero. An absent total means indeterminate work. Handlers should
report at chunk boundaries, not for every coordinate.

## Map setup

Using the same client imports and worker factory:

```ts
import {MapEngine, type PreparedMap} from '@math.gl/geospatial/discontinuous';

const prepared = await runWorkerTask<PreparedMap>(createWorker, 'map-setup', {
  version: 1,
  id: 'world',
  definition: {type: 'myriahedral', preset: 'polyconic', columns: 24}
}, {signal: controller.signal, onProgress: console.log});

const map = MapEngine.fromPrepared(prepared);
```

Setup constructs the map and samples its layout in the worker. It reports start
and completion, since synchronous setup has no internal progress checkpoints.
Aborting terminates the worker even during this phase.

`MapEngine.toPrepared()` returns an independent structured-cloneable snapshot.
`MapEngine.fromPrepared()` restores synchronous projection and hinge methods for
rendering. Myriahedral snapshots retain the resolved mesh, weighted hinge tree,
angles, and sampled bounds, avoiding repeat land sampling, tree selection and
overlap counting. Restoration still constructs runtime chart and hinge objects;
other map types reconstruct chart functions and reuse sampled bounds. Snapshots
are trusted, same-version worker results, not a durable format for untrusted files.

## Application operations

Extend the handlers to keep map setup and geometry processing in one worker.
`setupMap(description, context, bindings)` returns a worker-local `MapEngine`;
`projectBulk(input, context)` transforms worker-owned storage. Both are exported
from `/workers/operations`. Custom chart, land and edge-weight callbacks must be
defined inside the worker; functions cannot be sent in task requests. Return
plain data and a prepared map snapshot when the renderer needs map methods.

Ice Age Explorer demonstrates this composition for clipping, grid generation,
ordinary projection and myriahedral maps. It displays phase progress, cancels old
selections, ignores stale results, and retains the displayed map until the next
one is ready. Its Cancel button returns to the globe and stops automatic cycling.

## Ownership and failures

- The factory must return a fresh worker used only by that task. Concurrent calls
  are independent; applications should bound concurrency themselves.
- Request buffers are cloned rather than transferred. Inputs remain usable after
  success, failure and cancellation. This costs a copy and additional memory.
- Result `ArrayBuffer`s are deduplicated and transferred, including buffers nested
  in arrays, maps and sets. A subview transfers its entire backing buffer. Shared
  buffers are never transferred; the built-in bulk operation rejects them because
  concurrent mutation is outside its ownership contract.
- Cancellation rejects with the signal's reason. Numerical errors reject the job
  without returning partial output. Other failures preserve the worker error
  name and message. A throwing progress callback also ends the job.
- A terminated worker cannot recover its private intermediate buffers. The client
  cleans up handlers and abort listeners and ignores replies after settlement.
- `runWorkerTask` has no automatic main-thread fallback. Applications choose an
  explicit fallback where workers are unavailable. A promise alone does not move
  computation off the UI thread.

Benchmark startup, copying, result transfer, memory and UI responsiveness alongside
kernel time before choosing job sizes. Small transforms usually belong in the
synchronous APIs.
