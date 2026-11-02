# Creating tasks and workers

Define a plain object with `process`, optionally `processInBatches`, and lifecycle
hooks. Use `satisfies Task<Types>` to check named inputs, outputs, and options.
The [authoring section](./task-runner.md#create-your-own-task) contains a complete
example and worker setup.

An application creates the runner. A worker module calls
`initializeTaskWorker(task)` once to install that task in the existing worker.
The initializer does not create a worker or register tasks in a global table.

## Stream batches

`runner.runTasks` makes independent atomic calls. `runner.runTaskInBatches`
invokes `processInBatches` once for an input sequence. A stream may retain
intermediate state, regroup inputs, and emit a different number of output batches.
Both inputs and outputs use named fields. Consume with `for await` so an early
`break` closes the iterator. See [streaming examples](./task-runner.md#process-a-stream).

## CommonJS Node workers

A Node worker may use `require('@math.gl/core/tasks')` and install its task with
`initializeTaskWorker`. Both ESM and CommonJS callers can execute this worker through
`TaskRunner`; use a `.cjs` worker entry point when the containing package uses ESM.
The CommonJS bundle resolves the native Node parent port at runtime, while browser
bundles keep Node built-ins optional. This requires Node's `process.getBuiltinModule`
(Node 22.3 or newer).
