# Shared memory and atomic state

SharedArrayBuffer lets the caller and workers observe the same bytes. It is useful for cancellation flags, progress counters, and application state that outlives an individual message. Sharing does not make arbitrary concurrent writes safe.

## Detect availability[​](#detect-availability "Direct link to Detect availability")

```
import {getWorkerCapabilities, createSharedWorkerState} from '@math.gl/core/tasks';



const capabilities = getWorkerCapabilities();

// workers, sharedMemory, crossOriginIsolated, sharedMemoryUnavailableReason

const state = createSharedWorkerState(); // SharedWorkerState or null
```

The probe checks allocation, Atomics, and whether structured cloning preserves shared storage. It reports `cross-origin-isolation`, `unsupported`, or `blocked` when sharing is unavailable. It describes the current realm; a custom worker URL must still be loadable and permitted by its host environment.

| Environment                                        | Ordinary workers                   | Shared control                          |
| -------------------------------------------------- | ---------------------------------- | --------------------------------------- |
| Node with worker threads and shared-memory support | Supported                          | No browser headers required             |
| Secure, cross-origin-isolated browser              | Supported                          | Used when the capability probe succeeds |
| Browser without cross-origin isolation             | Supported when Worker is available | Message fallback                        |
| Environment without Worker support                 | Not available                      | Choose a synchronous application path   |

The runtime does not automatically run a worker operation on the main thread. Applications choose that fallback explicitly.

## Enable browser isolation[​](#enable-browser-isolation "Direct link to Enable browser isolation")

Serve the application and its worker assets from a secure context with compatible isolation policies. A typical Vite development configuration is:

```
export default {

  server: {

    headers: {

      'Cross-Origin-Opener-Policy': 'same-origin',

      'Cross-Origin-Embedder-Policy': 'require-corp'

    }

  }

};
```

Configure equivalent response headers on the production host. Cross-origin assets must satisfy the embedder policy. Check the running page's capability result; development-server headers do not configure production hosting.

## Observe control state without progress round trips[​](#observe-control-state-without-progress-round-trips "Direct link to Observe control state without progress round trips")

```
import {createSharedWorkerState} from '@math.gl/core/tasks';

import {projectBulkInWorker} from '@math.gl/geospatial/workers';



const state = createSharedWorkerState();

const controller = new AbortController();

const poll = setInterval(() => {

  if (state) updateProgress(state.snapshot);

}, 50);



try {

  await projectBulkInWorker({

    projection: {from: 'EPSG:4326', to: 'EPSG:3857'},

    coordinates: new Float64Array([0, 0, 10, 20]),

    chunkSize: 4096

  }, {

    inputOwnership: 'copy',

    cancellationMode: 'cooperative',

    signal: controller.signal,

    sharedState: state?.buffer,

    onProgress: progress => updatePhase(progress.phase)

  });

} finally {

  clearInterval(poll);

}
```

`updateProgress` and `updatePhase` belong to the application. If `state` is null, use `onProgress` for both phase and numeric progress. Cooperative jobs automatically allocate fresh shared control when available; providing your own buffer lets the caller observe it. `sharedState: false` forces message-only control.

The control buffer is 16 bytes and excluded from application input-byte budgets. Its fields are individually atomic:

| Snapshot field | Meaning                                            |
| -------------- | -------------------------------------------------- |
| `cancelled`    | Cancellation flag                                  |
| `completed`    | Latest application-defined nonnegative int32 count |
| `total`        | Nonnegative int32 count, or `-1` for unknown       |
| `revision`     | Change counter; wraps as signed int32              |

A snapshot is not an atomic transaction across all four fields. Messages still carry phase names and units. Workers publish counters explicitly through `context.sharedState?.setProgress(completed, total)`; bulk projection does this between chunks when its record count fits int32.

## Poll cancellation in synchronous work[​](#poll-cancellation-in-synchronous-work "Direct link to Poll cancellation in synchronous work")

```
import {createWorker} from '@math.gl/core/tasks';



await createWorker((input: Float64Array, _options, context) => {

  const output = new Float64Array(input.length);

  for (let i = 0; i < input.length; i++) {

    if (i % 4096 === 0) context?.throwIfAborted?.();

    output[i] = Math.sqrt(Math.abs(input[i]));

  }

  return output;

});
```

With shared control, an AbortSignal on the caller writes the atomic flag and the worker can observe it without processing a message. Without sharing, this synchronous example cannot observe message cancellation until it returns: use a yielding processor when cooperative fallback is required. The termination deadline still applies. Native `context.signal` alone requires worker event-loop progress.

Use AbortSignal for runtime-managed queued cancellation and termination deadlines. Calling `state.cancel()` directly only publishes a flag; it does not immediately reject a queued caller or start a deadline. Create a fresh control buffer per job. Creation-time resource control buffers apply only to initialization; pass per-call buffers to `resource.run()`.

## Share application state[​](#share-application-state "Direct link to Share application state")

Control buffers are separate from application-owned shared data. For a counter that survives resource calls, a worker can retain an atomic view:

```
// counter-worker.ts

import {createResourceWorker} from '@math.gl/core/tasks';



await createResourceWorker({

  initialize: (buffer: SharedArrayBuffer) => new Int32Array(buffer),

  run: (counter, delta: number) => Atomics.add(counter, 0, delta) + delta

});
```

On the caller, describe it as `WorkerResourceObject<SharedArrayBuffer, number, number>` using the [browser/Node descriptor pattern](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/persistent-resources.md#caller-create-run-dispose):

```
import {createWorkerResource, getWorkerCapabilities} from '@math.gl/core/tasks';



if (getWorkerCapabilities().sharedMemory) {

  const counter = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));

  Atomics.store(counter, 0, 10);

  // CounterWorker supplies the typed descriptor and worker URL/factory.

  const resource = await createWorkerResource(CounterWorker, counter.buffer, {

    inputOwnership: 'share'

  });

  try {

    console.log(await resource.run(2)); // 12

    console.log(Atomics.load(counter, 0)); // 12, visible on the caller

    Atomics.store(counter, 0, 20);

    console.log(await resource.run(3)); // 23, observes the caller's write

  } finally {

    await resource.destroy();

  }

}
```

If sharing is unavailable, keep state in a worker and return snapshots, or use a synchronous application implementation. The runtime cannot emulate shared storage by copying it.

`share` rejects ordinary transferable buffers before dispatch. Shared buffers remain shared under `copy` and `transfer` too: structured cloning does not isolate them. Use Atomics for shared integer synchronization and an explicit ownership or double-buffer protocol for numerical arrays. Concurrent floating-point writes are not transactional, and cancellation does not roll back any shared writes.

The shipped bulk-projection operation expects ordinary floating-point buffers. Its optional shared state is the control buffer; application-owned shared numerical kernels can be implemented through custom processors.
