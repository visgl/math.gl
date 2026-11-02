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

## Cross-origin module workers

`worker.url` may reference an HTTP(S) module on another origin. The runtime creates
a same-origin blob entrypoint that statically imports that URL; relative imports
inside the remote module continue to resolve against its original URL. The remote
server must allow CORS, and your CSP must permit `blob:` worker entrypoints and the
remote module import. Same-origin, relative, data, and caller-owned blob URLs keep
their original entrypoint. Runtime-created shims are revoked when their worker is
terminated or its constructor fails; caller-owned blob URLs remain yours to revoke.
A `worker.create` factory still controls its own worker construction and cleanup.
