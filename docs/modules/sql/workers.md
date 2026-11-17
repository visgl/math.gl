# Workers

Use `@math.gl/sql/worker` to run structured queries or compiled expressions off the calling thread.
Load data into native Arrow tables before creating a worker session. SQL text execution with
`queryArrowSQL` is synchronous; the query worker accepts structured query options.

## Query sessions

For full table queries off the calling thread, use `createArrowQueryWorker()` or
`queryArrowTableInWorker()` from `@math.gl/sql/worker`. A session retains
the source and accepts structured query options, including native Arrow join and
union inputs. `getTable()` returns a snapshot and `takeTable()` transfers the source
back and closes the worker. By default the source is copied on initialization.
Use `inputOwnership: 'transfer'` to relinquish the source and its buffer aliases.
A query error keeps the session usable. Aborting a query stops the caller's wait.
The worker drains any accepted query before serving later session operations.

```ts
import {createArrowQueryWorker} from '@math.gl/sql/worker';

const session = await createArrowQueryWorker(orders, {
  worker: {
    url: new URL(import.meta.resolve('@math.gl/sql/query-worker-entry.js'))
  }
});
try {
  const result = await session.query({select: ['category'], limit: 100});
} finally {
  await session.close();
}
```

In a browser, supply a module worker factory pointing to a local module that imports
the query worker entry. Custom functions can be registered in that module with
`initializeTaskWorker(createArrowQueryTask({functions}))`.

## Worker execution

Import worker helpers from `@math.gl/sql/worker` and the runner from `@math.gl/tasks`.
Send a serializable expression/AST or `{predicate, parameters}` program. Compiled closures and
registries stay in their own realm. A retained task compiles on its first input and validates that
schema on subsequent calls, including empty tables. Create a new task instance for a different
expression or schema.

```ts
import {TaskRunner} from '@math.gl/tasks';
import {
  createArrowExpressionTask, prepareArrowExpressionInput, hydrateArrowExpressionResult
} from '@math.gl/sql/worker';

const task = createArrowExpressionTask({worker: {
  create: () => new Worker(new URL('./expression-worker.ts', import.meta.url), {type: 'module'}),
  capabilities: {atomic: true, streaming: false}
}});
const runner = new TaskRunner();
try {
  const session = await runner.initializeTask(task, {expression: 'population > 100000'}, {
    execution: 'worker'
  });
  try {
    const result = await session.runTask(prepareArrowExpressionInput(arrowTable), {signal});
    const {field, vector} = hydrateArrowExpressionResult(result);
    // vector preserves batch order; field retains result name, type and metadata.
  } finally {await session.close();}
} finally {await runner.close();}
```

Worker module:

```ts
import {initializeTaskWorker} from '@math.gl/tasks';
import {createArrowExpressionTask} from '@math.gl/sql/worker';
await initializeTaskWorker(createArrowExpressionTask());
```

For Node, use `worker.url: new URL('./expression-worker.mjs', import.meta.url)` instead of a factory.
The shipped `@math.gl/sql/worker-entry.js` is a module worker for built-ins; use a custom
worker module to construct and register application functions or Turf adapters locally.
The executable example is in `examples/sql/expressions-worker`.

### Ownership and cancellation

`prepareArrowExpressionInput(table, {activeRows?})` borrows column buffers without copying values.
TaskRunner's default `inputOwnership: 'copy'` preserves the caller's table. Explicit
`inputOwnership: 'transfer'` detaches every referenced ArrayBuffer, including buffers shared by other
columns, dictionaries and slices. Relinquish those aliases too; transfer is not a slice-only move.
Output buffers transfer back by default, and `hydrateArrowExpressionResult()` reconstructs a vector
and output field without copying buffers. A result mask makes the returned field nullable.

This transport uses schema-only IPC plus separate Arrow buffers, not full value serialization.
Use the same Apache Arrow version on host and worker. TaskRunner owns worker cleanup; caller-owned
input tables remain owned by the caller unless explicitly transferred. Workers yield between batches
for cancellation and report row progress. Errors reject the operation; cancellation returns no partial
result. Do not mutate borrowed input buffers while a task is running.

Run `node modules/core/scripts/arrow/benchmark-expression-tables.mjs` after building. It reports local and
worker throughput, cold startup, warm round-trip costs, preparation time, output chunks/bytes and known
row-object/string-decoding allocations. Worker timings include transfer and hydration. The transfer
case includes preparing an owned copy so its reusable source fixture remains intact. Workers can cost
more overall for small workloads while keeping evaluation off the UI thread.

