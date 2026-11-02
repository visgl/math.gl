# Reusing initialized state

Use `runner.initializeTask(task, initialization)` when multiple operations should
share a projection, dataset, spatial index, or WebAssembly instance. Ordinary
runner calls initialize automatically and release their state after the operation.

```ts
const projectionTask = await runner.initializeTask(ProjectCoordinatesTask, {
  projection: {from: 'EPSG:4326', to: 'EPSG:3857'}
});
try {
  const {coordinates} = await projectionTask.runTask({
    coordinates: new Float64Array([10, 20])
  });
  console.log(coordinates);
} finally {
  await projectionTask.close();
}
```

The handle is bound to its task and execution location. Its calls are serial by default;
atomic, multiple-input, and streaming methods share state. Each handle retains
one runner slot, including while idle. Close it before awaiting another operation
on a runner with capacity one.

Tasks construct state in `initialize` and release it in `destroy`. Processors
receive it as `context.state`. Worker failure, cancellation, or early worker-stream
return invalidates the handle; initialize a new one to continue. Successful stream
completion preserves state. See [lifecycle semantics](../api-reference/task-runner.md).

## Overlapping operations

Initialized tasks remain serialized unless both the task declares a concurrency
limit and the caller opts in with `operationConcurrency`. A task may classify
atomic inputs as `parallel` or `exclusive`; exclusive operations are barriers.
Omitted classifications are exclusive. Both main-thread and worker execution
support concurrency; worker operations share one physical worker and state.
Cancellation of active overlapping work invalidates the instance and aborts its
other operations because shared state may have been partially changed. Queued
calls can be cancelled without invalidating state.

`handle.runTask(input, {timeout: milliseconds})` sets a deadline including time
in the queue. The handle's `state` reports `ready`, `closing`, `closed`, or
`invalid`; an invalid handle cannot be reused. Cancellation is cooperative on
the main thread and cannot interrupt synchronous JavaScript.

```ts
const task = {
  id: 'shared-index',
  concurrency: {
    maxConcurrency: 4,
    getSchedulingMode: (input: {operation: string}) =>
      input.operation === 'query' ? 'parallel' as const : 'exclusive' as const
  },
  initialize: () => createIndex(),
  process: processIndexOperation
};
const handle = await runner.initializeTask(task, {}, {
  execution: 'main-thread',
  operationConcurrency: 2
});
```

Concurrency overlaps asynchronous work; it does not make CPU-bound JavaScript
parallel in a single thread. Streaming calls remain exclusive.

## Typed operation dispatch

For a task accepting multiple operations, define the input and output of each
operation and wrap its initialized handle. The task's `process` hook must return
an object whose `value` corresponds to the request's operation.

```ts
import {createTypedTaskDispatcher, type TaskOperation} from '@math.gl/core/tasks';

type Operations = {
  count: TaskOperation<{source: string}, number>;
  lookup: TaskOperation<{id: number}, {name: string} | null>;
};
// handle.runTask accepts the union of requests and returns {value: result}.
const dispatch = createTypedTaskDispatcher<Operations>(async request =>
  (await handle.runTask(request)).value
);
const count = await dispatch({operation: 'count', input: {source: 'roads'}}); // number
const feature = await dispatch({operation: 'lookup', input: {id: 1}}); // {name: string} | null
```

The adapter does not validate results or change scheduling, cancellation or
ownership. The task must return the right result for each operation. Initialized
handles remain serialized unless explicitly configured for concurrency.

## Separate setup and processing ownership

For automatic atomic or streaming calls, use `initializationOwnership` when setup
resources need different ownership from processing data. For example, transfer a
callback `MessagePort` while copying input buffers:

```ts
await runner.runTask(task, {values}, {
  initialization: {port: channel.port2},
  initializationOwnership: 'transfer',
  inputOwnership: 'copy'
});
```

Transferring initialization detaches its caller-owned resources; do not reuse them
in processing payloads or another task. Shared initialization may contain shared
storage but cannot contain transferable ports. For `runTasks`, initialization is
a reusable template: use copy or share; transfer is rejected before input consumption.
For an explicit retained handle, `initializeTask` already has independent setup
controls: pass `inputOwnership: 'transfer'` there, then choose input ownership again
for each `handle.runTask` or `handle.runTaskInBatches` call.
