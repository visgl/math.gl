# Write a typed worker

A descriptor names an operation and explains how to create its worker. The
processor receives serializable input and options; message identifiers,
listeners, pooling, and cancellation transport stay inside the runtime.

## 1. Implement the processor

Create `scale-worker.ts`. This example returns a new result buffer, checks
cancellation at chunk boundaries, and yields so message-based cancellation works
without shared memory.

```ts
import {createWorker} from '@math.gl/core/task-runtime';

await createWorker(async (
  input: Float64Array,
  options: {scale?: number} = {},
  context
) => {
  const output = new Float64Array(input.length);
  const scale = options.scale ?? 1;
  for (let start = 0; start < input.length; start += 4096) {
    context?.throwIfAborted?.();
    const end = Math.min(start + 4096, input.length);
    for (let i = start; i < end; i++) output[i] = input[i] * scale;
    context?.reportProgress?.({
      phase: 'scale', completed: end, total: input.length, unit: 'values'
    });
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return output;
});
```

`context.throwIfAborted()` checks the worker-side signal and optional atomic
control state. `context.signal` alone changes only when the worker can process a
cancellation message. Awaiting an already-resolved Promise does not yield to
incoming worker messages.

## 2. Declare the descriptor

Create `scale.ts` next to the worker source:

```ts
import type {WorkerObject} from '@math.gl/core/task-runtime';

export const ScaleWorker: WorkerObject<
  Float64Array, Float64Array, {scale?: number}
> = {
  id: 'scale',
  name: 'Scale values',
  module: 'application',
  version: '1',
  options: {},
  worker: new URL('./scale-worker.js', import.meta.url).href,
  loadWorker: () => new Worker(
    new URL('./scale-worker.ts', import.meta.url), {type: 'module'}
  )
};
```

The browser factory uses the TypeScript source URL so tools such as Vite or
webpack can bundle it as a module worker. Node ignores that browser factory and
uses the compiled `scale-worker.js` URL. Compile the worker alongside the caller
as ES modules (for example TypeScript `module: "NodeNext"`, `target: "ES2022"`,
and a package with `"type": "module"`), and retain their relative paths. Projects using another output
extension should adjust the Node URL accordingly.

For a published worker, keep its descriptor and processor versioned together.
A classic worker URL or explicit `packageName`-based asset resolution is also
supported; see [descriptor fields](../api-reference/runtime.md#workerobject).

## 3. Run and cancel

```ts
import {processOnWorker} from '@math.gl/core/task-runtime';
import {ScaleWorker} from './scale.js';

const controller = new AbortController();
const input = new Float64Array([1, 2, 3]);
const output = await processOnWorker(ScaleWorker, input, {
  scale: 2,
  inputOwnership: 'copy',
  signal: controller.signal,
  cancellationMode: 'cooperative',
  cancellationTimeout: 1000,
  onProgress: progress => console.log(progress.completed)
});
// output is [2, 4, 6]; input remains [1, 2, 3].
```

An incompatible input or `scale` option is a TypeScript error. Call
`controller.abort()` from the UI or application lifecycle to cancel. A throwing
progress callback aborts the job. Do not mutate submitted inputs while the
runtime is waiting to serialize them for dispatch.

## Enable local routing for the same operation

To make `ScaleWorker` eligible for small local tasks, extract the processor from
step 1 into a shared `scale-operation.ts` module and export it as `scale`.
The worker installs it with `createWorker(scale)`; the descriptor also supplies it
as its local processor:

```ts
import {runTask} from '@math.gl/core/task-runtime';
import {scale} from './scale-operation.js';

ScaleWorker.process = scale;
const output = await runTask(ScaleWorker, new Float64Array([1, 2, 3]), {
  mainThread: {maxSize: 64 * 1024}, inputOwnership: 'copy', scale: 2
});
```

Keep the kernel portable: DOM access belongs in the caller, and worker-local
initialization belongs in a resource. See [execution routing](./execution.md) for
thresholds, independent batches, and cancellation on the main thread.

## Use an isolated, bounded pool

A direct pool keeps your scheduling policy independent of the shared singleton
farm. Use the browser factory in a browser; Node uses the worker URL instead.

```ts
import {isBrowser, WorkerPool, processOnWorker} from '@math.gl/core/task-runtime';
import {ScaleWorker} from './scale.js';

const pool = new WorkerPool({
  ...(isBrowser
    ? {loadWorker: ScaleWorker.loadWorker}
    : {url: ScaleWorker.worker as string}),
  maxConcurrency: 2,
  maxQueuedJobs: 8,
  maxQueuedBytes: 32 * 1024 * 1024,
  maxInFlightBytes: 32 * 1024 * 1024
});

try {
  const admission = await pool.reserve(8 * 1024 * 1024);
  try {
    const input = new Float64Array(admission.inputBytes / Float64Array.BYTES_PER_ELEMENT);
    await processOnWorker(ScaleWorker, input, {
      workerPool: pool, admission, scale: 2, inputOwnership: 'transfer'
    });
  } finally {
    admission.release();
  }
} finally {
  await pool.destroy();
}
```

The reservation includes all application buffers in input, options, and job
context. The fixed shared control buffer is runtime overhead and excluded.
Keep the number of waiting producers bounded with `maxPendingAdmissions`.
Releasing a consumed ticket is a no-op; a ticket cannot be consumed twice.

## Stream batches

A batch processor consumes an iterable and emits an async iterable. Install it
as the second argument of `createWorker` in a worker module:

```ts
import {createWorker, type ProcessInBatches} from '@math.gl/core/task-runtime';

const batches: ProcessInBatches<Float64Array, Float64Array> = async function* (
  input, _options, context
) {
  for await (const batch of input) {
    context?.throwIfAborted?.();
    yield batch.map(value => value * 2);
  }
};
await createWorker((input: Float64Array) => input.map(value => value * 2), batches);
```

Declare `workerInBatches: true` on its typed descriptor, then consume results:

```ts
import {processOnWorkerInBatches} from '@math.gl/core/task-runtime';

// BatchWorker follows the descriptor pattern above for the batch worker module.
for await (const output of processOnWorkerInBatches(BatchWorker, inputBatches, {
  inputOwnership: 'copy',
  inputBytes: 8 * 1024 * 1024,
  maxInFlightBytes: 16 * 1024 * 1024,
  maxQueuedBytes: 16 * 1024 * 1024
})) {
  consume(output);
}
```

`inputBytes` reserves the complete session's options/context buffers plus each
batch's input buffers. Oversized batches fail before transfer. The worker asks
for the next input only when its processor advances, and output acknowledgement
waits for the consumer to resume. Results follow processor emission order.
A processor that retains earlier batches must account for that memory itself.

Always finish the iterator or close it with `return()`; `for await` does this
when breaking out. Closing the iterator terminates an active session, discards
its worker-local state, and requests input-iterator cleanup. Input cleanup is
best effort if a custom producer is blocked indefinitely.

## Handle failure deliberately

Queued cancellation leaves input attached. Once dispatch transfers a buffer,
its ownership cannot be reclaimed after an abort, serialization failure, or
worker crash. Keep a caller-owned copy when retries are required. A crash
rejects the active operation; the pool replaces the worker for future work.
There is no automatic retry or main-thread fallback.
