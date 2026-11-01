# Tasks

Tasks keep applications responsive while processing large datasets. Use `TaskRunner` to execute named input/output objects locally or in a worker, process streams, and retain expensive state across calls.

* [Get started with Tasks](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/task-runner.md): run provided tasks, then create your own.
* [API reference](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/api-reference/task-runner.md): methods, controls, and lifecycle.
* [Migration](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/migration.md): upgrade from the removed worker and top-level task APIs.

`@math.gl/core/tasks` is the only public task execution entry. Import provided geospatial tasks from `@math.gl/geospatial/tasks`. The ordinary math entry does not import the task runtime.

## Choose an operation[​](#choose-an-operation "Direct link to Choose an operation")

| Need                                | API                                               |
| ----------------------------------- | ------------------------------------------------- |
| One result                          | `runner.runTask(task, input, request?)`           |
| Independent inputs, ordered results | `runner.runTasks(task, inputs, request?)`         |
| A stateful streaming operation      | `runner.runTaskInBatches(task, inputs, request?)` |
| Reuse expensive state across calls  | `runner.initializeTask(task, initialization)`     |
| Install a task in a worker module   | `initializeTaskWorker(task)`                      |

## Execution controls[​](#execution-controls "Direct link to Execution controls")

The runner bounds active execution with `maxConcurrency`. Inputs copy by default; choose transfer explicitly when ownership moves to the task. Progress and cancellation are per-call controls. Explicit handles retain a worker and its state until closed. Worker cancellation terminates the worker and invalidates its state.

Queue byte budgets, admission reservations, priorities, built-in metrics, adaptive routing, cooperative worker cancellation, and shutdown deadlines are not public controls in this implementation. See [migration](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/migration.md) for application-level alternatives and intentional removals. Active concurrency is not a bound on memory consumed by arbitrarily many queued calls.
