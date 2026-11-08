# @math.gl/tasks

Tasks keep applications responsive while processing large datasets. Use `TaskRunner` to execute named input/output objects locally or in a worker, process streams, and retain expensive state across calls.

* [Get started with Tasks](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/task-runner.md): run provided tasks, then create your own.
* [API reference](https://visgl.github.io/math.gl/next/docs/modules/tasks/api-reference/task-runner.md): methods, controls, and lifecycle.
* [Migration](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/migration.md): upgrade from the removed worker and top-level task APIs.

`@math.gl/tasks` is the only public task execution entry. Import provided geospatial tasks from `@math.gl/geospatial/tasks`. The package is standalone, has no runtime dependencies, and does not require core, Arrow, or geospatial.

## Usage[​](#usage "Direct link to Usage")

```
import {TaskRunner} from '@math.gl/tasks';



const runner = new TaskRunner();

try {

  const result = await runner.runTask(

    {id: 'double', process: ({value}: {value: number}) => ({value: value * 2})},

    {value: 3}

  );

  console.log(result.value); // 6

} finally {

  await runner.close();

}
```

See the [method reference](https://visgl.github.io/math.gl/next/docs/modules/tasks/api-reference/task-runner.md) for exact signatures and [the guide](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/task-runner.md) for complete examples.

## Features[​](#features "Direct link to Features")

| Feature                                            | Support | Contract and limits                                                                                                                                                                                                                       |
| -------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typed task definitions                             | ✅      | Plain objects checked with `satisfies Task<Types>`; input, output, options, initialization, state, and batch types stay aligned. No global registration.                                                                                  |
| Named input/output payloads                        | ✅      | Plain objects with named fields; typed arrays and buffers belong inside those fields. Runtime validation also protects JavaScript callers.                                                                                                |
| Browser and Node workers                           | ✅      | Browser worker factories or Node module URLs, including CommonJS worker entrypoints on Node 22.3+. `initializeTaskWorker` installs one task in an existing worker; functions are loaded from modules, never serialized.                   |
| Cross-origin module workers                        | ✅      | HTTP(S) entrypoints use same-origin module shims. Remote imports require CORS and compatible CSP; runtime-owned shim URLs are released with the worker.                                                                                   |
| Main-thread execution                              | ✅      | `execution: 'main-thread'` runs the local processor. `auto` selects a declared worker, otherwise local execution. No silent fallback after worker failure.                                                                                |
| Synchronous execution                              | ✅      | `runTaskSync` returns the output object directly. Requires preloaded code and synchronous initialization, processing, and destruction; blocks the calling thread and throws when capacity is occupied.                                    |
| Single atomic operation                            | ✅      | `runTask` returns a promise and automatically initializes and destroys temporary state.                                                                                                                                                   |
| Multiple independent inputs                        | ✅      | `runTasks` accepts sync/async iterables, preserves output order, and bounds outstanding work and buffered results with `concurrency`.                                                                                                     |
| Stateful streaming                                 | ✅      | `runTaskInBatches` invokes one async-iterable processor for the stream. Input/output batch types and batch counts may differ. Consumer demand applies backpressure.                                                                       |
| Reusable task state                                | ✅      | `initializeTask` returns a serial handle for repeated atomic or streaming operations. State stays at one execution location; an idle handle still occupies active capacity.                                                               |
| Worker-code warmup                                 | ✅      | Global `preloadTasks` loads code ahead of execution. Optional `task.preload()` hooks await nested imports. Temporary preload workers terminate when ready; no task state or worker pool is retained. Browser cache policy controls reuse. |
| Execution capacity                                 | ✅      | `maxConcurrency` bounds active lifetimes, including initialization and retained handles. Code preloading is independent of runner capacity; queued bytes are not bounded.                                                                 |
| Buffer ownership                                   | ✅      | Inputs copy by default; explicit transfer detaches caller aliases. Shared storage remains shared. Output copying preserves buffers retained in task state. The same boundaries apply locally.                                             |
| Initialization ownership                           | ✅      | Automatic atomic/streaming calls can copy, transfer, or share setup data independently of processing inputs. Multi-input templates allow copy/share only; explicit handles choose setup ownership at initialization.                      |
| Cancellation                                       | ✅      | `AbortSignal` cancels queued acquisition. Worker abort terminates the worker and invalidates its handle. Local work must observe the signal and yield; synchronous calls cannot service timer/UI abort events mid-call.                   |
| Progress                                           | ✅      | Tasks report `{completed, total?, phase?, unit?}` through context; callers receive `onProgress` events.                                                                                                                                   |
| Graceful and forced cleanup                        | ✅      | `close` drains work and destroys state; `terminate` aborts owned work. Finish/return output iterators before graceful shutdown.                                                                                                           |
| Failure isolation                                  | ✅      | Failed/cancelled workers are discarded. No rollback or automatic retry. Atomic processing plus cleanup failures use `AggregateError`.                                                                                                     |
| Queue byte budgets, priorities, reservations       | ❌      | Applications must bound production and account for memory upstream. Active concurrency alone does not bound queued payloads.                                                                                                              |
| Adaptive routing, pool metrics, shutdown deadlines | ❌      | Choose routes, measure timings, and enforce deadlines at the application layer.                                                                                                                                                           |
| Cooperative worker cancellation                    | ❌      | Worker cancellation uses termination; task cleanup cannot be guaranteed after a forced stop.                                                                                                                                              |

## Choose an operation[​](#choose-an-operation "Direct link to Choose an operation")

| Need                                | API                                               |
| ----------------------------------- | ------------------------------------------------- |
| Immediate local result              | `runner.runTaskSync(task, input, request?)`       |
| Warm worker modules                 | `preloadTasks([task], {signal}?)`                 |
| One result                          | `runner.runTask(task, input, request?)`           |
| Independent inputs, ordered results | `runner.runTasks(task, inputs, request?)`         |
| A stateful streaming operation      | `runner.runTaskInBatches(task, inputs, request?)` |
| Reuse expensive state across calls  | `runner.initializeTask(task, initialization)`     |
| Install a task in a worker module   | `initializeTaskWorker(task)`                      |

## Execution controls[​](#execution-controls "Direct link to Execution controls")

The runner bounds active execution with `maxConcurrency`. Inputs copy by default; choose transfer explicitly when ownership moves to the task. Progress and cancellation are per-call controls. Explicit handles retain a worker and its state until closed. Worker cancellation terminates the worker and invalidates its state.

Queue byte budgets, admission reservations, priorities, built-in metrics, adaptive routing, cooperative worker cancellation, and shutdown deadlines are not public controls in this implementation. See [migration](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/migration.md) for application-level alternatives and intentional removals. Active concurrency is not a bound on memory consumed by arbitrarily many queued calls.
