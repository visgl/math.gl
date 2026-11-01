# Creating tasks and workers

Define a plain object with `process`, optionally `processInBatches`, and lifecycle hooks. Use `satisfies Task<Types>` to check named inputs, outputs, and options. The [authoring section](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/task-runner.md#create-your-own-task) contains a complete example and worker setup.

An application creates the runner. A worker module calls `initializeTaskWorker(task)` once to install that task in the existing worker. The initializer does not create a worker or register tasks in a global table.

## Stream batches[​](#stream-batches "Direct link to Stream batches")

`runner.runTasks` makes independent atomic calls. `runner.runTaskInBatches` invokes `processInBatches` once for an input sequence. A stream may retain intermediate state, regroup inputs, and emit a different number of output batches. Both inputs and outputs use named fields. Consume with `for await` so an early `break` closes the iterator. See [streaming examples](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/task-runner.md#process-a-stream).
