# Persistent worker resources

Use a resource handle when initialization is expensive or requests share a projection, index, cached dataset, or WASM instance. Initialization runs once in one dedicated worker. Subsequent calls serialize on that same worker incarnation. For asset loading and WASM-specific cancellation, see [WASM in workers](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/wasm.md).

## Worker: initialize a projection once[​](#worker-initialize-a-projection-once "Direct link to Worker: initialize a projection once")

Create `projection-resource-worker.ts`:

```
import {createResourceWorker} from '@math.gl/core/tasks';

import {FullProjectionEngine} from '@math.gl/geospatial/projection';



await createResourceWorker({

  initialize: (definition: {from: string; to: string}) =>

    new FullProjectionEngine().createProjection(definition),

  run: async (projection, coordinates: Float64Array, context) => {

    const total = coordinates.length / 2;

    for (let start = 0; start < total; start += 4096) {

      context.throwIfAborted?.();

      const end = Math.min(start + 4096, total);

      projection.projectFlatSync(coordinates.subarray(start * 2, end * 2), 2);

      context.reportProgress?.({

        phase: 'projection', completed: end, total, unit: 'records'

      });

      await new Promise(resolve => setTimeout(resolve, 0));

    }

    return coordinates;

  },

  dispose: () => {

    // Release application-owned indexes, WASM allocations or other resources here.

    // This projection has no explicit disposal requirement.

  }

});
```

The projection instance stays in the worker. Only its definition, coordinate buffers, progress, and results cross the boundary. This processor expects complete longitude/latitude pairs; validate application inputs before submission.

The chunked implementation yields for message cancellation. A synchronous kernel can instead poll `context.throwIfAborted()` when shared control is available, but must still provide a yielding path if it needs cooperative cancellation without shared memory.

## Caller: create, run, dispose[​](#caller-create-run-dispose "Direct link to Caller: create, run, dispose")

```
import {

  createWorkerResource,

  type WorkerResourceObject

} from '@math.gl/core/tasks';



type Definition = {from: string; to: string};

const ProjectionResource: WorkerResourceObject<

  Definition, Float64Array, Float64Array

> = {

  id: 'projection-resource',

  name: 'Persistent projection',

  module: 'application',

  version: '1',

  options: {},

  worker: new URL('./projection-resource-worker.js', import.meta.url).href,

  loadWorker: () => new Worker(

    new URL('./projection-resource-worker.ts', import.meta.url), {type: 'module'}

  )

};



const resource = await createWorkerResource(ProjectionResource, {

  from: 'EPSG:4326', to: 'EPSG:3857'

}, {

  maxQueuedJobs: 4,

  maxQueuedBytes: 32 * 1024 * 1024,

  maxInFlightBytes: 32 * 1024 * 1024,

  cancellationMode: 'cooperative'

});



try {

  for (const coordinates of coordinateSets) {

    const controller = new AbortController();

    const result = await resource.run(coordinates, {

      inputOwnership: 'copy',

      signal: controller.signal,

      onProgress: progress => console.log(progress.completed, progress.total)

    });

    render(result);

  }

  console.log(resource.stats);

} finally {

  await resource.destroy({timeout: 2000});

}
```

As in the [custom worker tutorial](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/custom-workers.md), browsers bundle the TypeScript source factory and Node loads the compiled JavaScript worker URL. `coordinateSets` and `render` belong to the application.

## Separate initialization from calls[​](#separate-initialization-from-calls "Direct link to Separate initialization from calls")

Creation accepts pool configuration and initialization controls. A creation-time `signal` or shared control buffer applies only to initialization. Aborting it later does not cancel subsequent calls. Pass each call's signal and optional shared buffer to `run()`.

`WorkerResourceRunOptions` accepts ownership, priority, progress, cancellation mode, cancellation timeout, signal, and shared state. Configure queue budgets and metrics at creation. Creation-time `sharedState: false` is a default opt-out; otherwise cooperative calls create fresh shared control state when available.

Calls default to FIFO ordering; explicitly supplied priorities and aging can change queued call order. A resource owns one worker even when the ordinary worker farm has a higher concurrency limit. The default waiting queue holds 32 calls; byte budgets default to `Infinity`, so configure them for large inputs.

## State and ownership[​](#state-and-ownership "Direct link to State and ownership")

With `copy`, the worker receives independent ordinary input buffers. With `transfer`, the caller's buffers detach and the processor can return them as its result. Do not return a worker-cached ordinary buffer unless you intend to transfer and lose it. Return a slice or an independently allocated result when retaining the original inside the resource.

Shared buffers remain shared and need application synchronization. See [application-owned atomic state](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/shared-memory.md#share-application-state).

## Failure and cancellation[​](#failure-and-cancellation "Direct link to Failure and cancellation")

| Event                                                  | Result                                                        | Resource state                                           |
| ------------------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- |
| Abort while queued or before dispatch                  | Call rejects without transfer                                 | Worker and initialized state preserved                   |
| Cooperative abort settles within its grace period      | Caller rejects immediately; lease drains                      | Same worker remains usable; partial mutations may remain |
| Grace period expires or hard cancellation is requested | Worker terminates                                             | Handle invalidated                                       |
| Processor throws an ordinary error                     | Call rejects                                                  | Handle remains usable; processor owns consistency        |
| Worker crashes or exits unexpectedly                   | Active call rejects                                           | Handle invalidated                                       |
| `destroy()` completes                                  | New calls rejected; submitted calls drained; disposer invoked | Worker terminated                                        |
| Destruction deadline expires                           | Teardown rejects and terminates worker                        | Disposer may not run                                     |

A handle is never silently reinitialized after worker loss. Create a new handle and supply fresh initialization data. No automatic retry can recover transferred inputs or reconstruct application state.

Cancellation is not a transaction. A processor that updates an index or shared counter must define whether partial work is retained, rolled back, or published only after success.

## Teardown guarantees[​](#teardown-guarantees "Direct link to Teardown guarantees")

`destroy()` is idempotent and stops new submissions immediately. Its default 1000 ms deadline covers both draining calls and running the disposer. It always terminates the owned worker, even when the disposer throws. A timed-out or crashed worker cannot perform cleanup; external resources must tolerate abrupt loss. Increase the deadline when graceful draining legitimately takes longer.
