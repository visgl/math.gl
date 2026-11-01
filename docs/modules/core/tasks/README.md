# Tasks

Tasks keep applications responsive while processing large datasets. Use
`TaskRunner` to execute named input/output objects locally or in a worker,
process streams, and retain expensive state across calls.

- [Get started with Tasks](./developer-guide/task-runner.md): run provided tasks,
  then create your own.
- [API reference](./api-reference/task-runner.md): methods, controls, and lifecycle.
- [Migration](./developer-guide/migration.md): upgrade from the removed worker and
  top-level task APIs.

`@math.gl/core/tasks` is the only public task execution entry. Import provided
geospatial tasks from `@math.gl/geospatial/tasks`. The ordinary math entry does
not import the task runtime.

## Feature support

A task-execution feature card for browser and Node applications. Each row describes
implemented behavior and the limits applications need to account for.

| Feature | math.gl support | Contract and limits |
| --- | --- | --- |
| Typed task definitions | ✅ Implemented | Plain objects checked with `satisfies Task<Types>`; input, output, options, initialization, state, and batch types stay aligned. No global registration. |
| Named input/output payloads | ✅ Implemented | Plain objects with named fields; typed arrays and buffers belong inside those fields. Runtime validation also protects JavaScript callers. |
| Browser and Node workers | ✅ Implemented | Browser worker factories or Node module URLs. `initializeTaskWorker` installs one task in an existing worker; functions are loaded from modules, never serialized. |
| Main-thread execution | ✅ Implemented | `execution: 'main-thread'` runs the local processor. `auto` selects a declared worker, otherwise local execution. No silent fallback after worker failure. |
| Synchronous execution | ✅ Implemented | `runTaskSync` returns the output object directly. Requires synchronous initialization, processing, and destruction; blocks the calling thread and throws when capacity is occupied. |
| Single atomic operation | ✅ Implemented | `runTask` returns a promise and automatically initializes and destroys temporary state. |
| Multiple independent inputs | ✅ Implemented | `runTasks` accepts sync/async iterables, preserves output order, and bounds outstanding work and buffered results with `concurrency`. |
| Stateful streaming | ✅ Implemented | `runTaskInBatches` invokes one async-iterable processor for the stream. Input/output batch types and batch counts may differ. Consumer demand applies backpressure. |
| Reusable task state | ✅ Implemented | `initializeTask` returns a serial handle for repeated atomic or streaming operations. State stays at one execution location; an idle handle still occupies active capacity. |
| Worker-code warmup | ✅ Implemented | `preloadTasks` loads worker modules without task initialization. Later calls reuse code with fresh task state. Idle workers are bounded by `maxIdleWorkers` and evicted oldest-first. |
| Execution capacity | ✅ Implemented | `maxConcurrency` bounds active lifetimes, including initialization and retained handles. Idle preloaded workers have a separate bound; queued bytes are not bounded. |
| Buffer ownership | ✅ Implemented | Inputs copy by default; explicit transfer detaches caller aliases. Shared storage remains shared. Output copying preserves buffers retained in task state. The same boundaries apply locally. |
| Cancellation | ✅ Implemented | `AbortSignal` cancels queued acquisition. Worker abort terminates the worker and invalidates its handle. Local work must observe the signal and yield; synchronous calls cannot service timer/UI abort events mid-call. |
| Progress | ✅ Implemented | Tasks report `{completed, total?, phase?, unit?}` through context; callers receive `onProgress` events. |
| Graceful and forced cleanup | ✅ Implemented | `close` drains work and destroys state; `terminate` aborts owned work. Both stop retained idle workers. Finish/return output iterators before graceful shutdown. |
| Failure isolation | ✅ Implemented | Failed/cancelled workers are discarded. No rollback or automatic retry. Atomic processing plus cleanup failures use `AggregateError`. |
| Queue byte budgets, priorities, reservations | ❌ Not implemented | Applications must bound production and account for memory upstream. Active concurrency alone does not bound queued payloads. |
| Adaptive routing, pool metrics, shutdown deadlines | ❌ Not implemented | Choose routes, measure timings, and enforce deadlines at the application layer. |
| Cooperative worker cancellation | ❌ Not implemented | Worker cancellation uses termination; task cleanup cannot be guaranteed after a forced stop. |

See the [method reference](./api-reference/task-runner.md) for exact signatures and
[the guide](./developer-guide/task-runner.md) for complete examples.

## Choose an operation

| Need | API |
| --- | --- |
| Immediate local result | `runner.runTaskSync(task, input, request?)` |
| Warm worker modules | `runner.preloadTasks([task], {signal}?)` |
| One result | `runner.runTask(task, input, request?)` |
| Independent inputs, ordered results | `runner.runTasks(task, inputs, request?)` |
| A stateful streaming operation | `runner.runTaskInBatches(task, inputs, request?)` |
| Reuse expensive state across calls | `runner.initializeTask(task, initialization)` |
| Install a task in a worker module | `initializeTaskWorker(task)` |

## Execution controls

The runner bounds active execution with `maxConcurrency`. Inputs copy by default;
choose transfer explicitly when ownership moves to the task. Progress and
cancellation are per-call controls. Explicit handles retain a worker and its state
until closed. Worker cancellation terminates the worker and invalidates its state.

Queue byte budgets, admission reservations, priorities, built-in metrics, adaptive
routing, cooperative worker cancellation, and shutdown deadlines are not public
controls in this implementation. See [migration](./developer-guide/migration.md)
for application-level alternatives and intentional removals. Active concurrency
is not a bound on memory consumed by arbitrarily many queued calls.
