# Get started with TaskRunner

**Define the work once. Choose how long it lives.**

A `Task` is a plain typed object. A `TaskRunner` executes it locally or in a worker,
handles named input and output objects, and owns its cleanup. Start with one call;
use the same definition for a sequence of calls, a stream, or reusable state.

> **Experimental prototype.** This guide describes the TaskRunner implementation
> on this branch. It is not a promise that an already-published math.gl version
> contains these exports. Existing task functions retain their behavior. The
> [support boundary](#what-this-prototype-supports) identifies deferred RFC features.

## Your first task

The following TypeScript needs no worker or bundler configuration. It scales a
buffer on the main thread and returns an independently owned result.

```ts
import {TaskRunner, type Task} from '@math.gl/core/tasks';

type ScaleTypes = {
  input: {values: Float64Array};
  output: {values: Float64Array};
  options: {factor: number};
};

const scaleTask = {
  id: 'scale',

  process({values}, {factor}, context) {
    context.throwIfAborted();
    return {values: values.map(value => value * factor)};
  }
} satisfies Task<ScaleTypes>;

const runner = new TaskRunner();
try {
  const input = {values: new Float64Array([1, 2, 3])};
  const output = await runner.runTask(scaleTask, input, {
    options: {factor: 10}
  });

  console.log([...output.values]); // [10, 20, 30]
  console.log([...input.values]);  // [1, 2, 3] — input is copied by default
} finally {
  await runner.close();
}
```

Three things to notice:

1. **Data has names.** Use `{values}`, not a bare array. Results follow the same
   rule. Adding a field later does not change the argument order.
2. **Application options are separate.** `factor` lives in `options`; execution,
   signals, and ownership controls live beside it.
3. **`satisfies` checks the contract.** It types processor arguments and preserves
   the concrete return type. No factory, registration table, or string lookup is
   involved. `id` labels diagnostics.

`process` may return an object or a Promise of an object. A task without
application options can omit the `options` type and the request argument.

## Choose the operation

| You have… | Call | What runs |
| --- | --- | --- |
| One input object | `runTask(task, input, request)` | `process` once |
| Independent input objects | `runTasks(task, inputs, request)` | `process` for each input |
| An incremental computation | `runTaskInBatches(task, inputs, request)` | `processInBatches` once for the whole stream |
| Expensive reusable state | `initializeTask(task, initialization)` | `initialize` once; use the returned handle repeatedly |

Both multi-input methods return async iterables. Creating an iterable does not
start work; consuming it does. Use `for await` so `break` closes the iterator.

## Process several inputs

Use `runTasks` for independent inputs. Results arrive in input order, even when
execution overlaps. Set runner capacity and per-call concurrency explicitly:

```ts
const runner = new TaskRunner({maxConcurrency: 2});
try {
  const inputs = [
    {values: new Float64Array([1, 2])},
    {values: new Float64Array([3, 4])}
  ];

  for await (const {values} of runner.runTasks(scaleTask, inputs, {
    options: {factor: 10},
    concurrency: 2
  })) {
    console.log([...values]); // [10, 20], then [30, 40]
  }
} finally {
  await runner.close();
}
```

The runner pulls inputs lazily and bounds outstanding results. Concurrency is an
upper bound: other calls using the same runner may leave fewer slots available.
It does not turn synchronous main-thread work into parallel CPU execution. Add a
worker target when you need that.

## Move the same task into a worker

Keep the task definition in `scale-task.ts`, export it, and add a worker target:

```ts
export const scaleTask = {
  id: 'scale',
  process({values}, {factor}, context) {
    context.throwIfAborted();
    return {values: values.map(value => value * factor)};
  },
  worker: {
    url: new URL('./scale-worker.js', import.meta.url),
    capabilities: {atomic: true, streaming: false}
  }
} satisfies Task<ScaleTypes>;
```

The worker entry point installs that definition:

```ts
// scale-worker.ts — compiled to scale-worker.js
import {initializeTaskWorker} from '@math.gl/core/tasks';
import {scaleTask} from './scale-task.js';

await initializeTaskWorker(scaleTask);
```

Then call the task normally:

```ts
const output = await runner.runTask(scaleTask, {values}, {
  options: {factor: 10},
  execution: 'worker'
});
```

`initializeTaskWorker` runs **inside an existing worker**. It installs the message
protocol; it does not create a Worker or call your task's `initialize` hook.
The runner creates the Worker. Functions are loaded from the worker module, never
serialized from the caller.

For a browser bundler, replace `url` with a factory whose literal URL the bundler
can discover:

```ts
worker: {
  create: () => new Worker(new URL('./scale-worker.ts', import.meta.url), {
    type: 'module'
  }),
  capabilities: {atomic: true, streaming: false}
}
```

Use exactly one of `url` or `create`. Node requires a compiled module URL;
`create` is the browser factory form. Auto execution chooses a declared worker
target when present and local execution otherwise. Choose `main-thread` explicitly
to use the local processor of a task that also declares a worker. Worker load
errors are reported; they do not trigger a hidden local retry.

## Stream without collecting everything first

`processInBatches` can retain session-local variables, change batch sizes, and
produce a different number of outputs than inputs. This task groups values into
pairs across input boundaries:

```ts
type GroupTypes = {
  input: {values: number[]};
  output: {values: number[]};
};

const groupTask = {
  id: 'pairs',

  async *processInBatches(inputs, _options, context) {
    let pending: number[] = [];
    for await (const {values} of inputs) {
      context.throwIfAborted();
      pending.push(...values);
      while (pending.length >= 2) {
        yield {values: pending.splice(0, 2)};
      }
    }
    if (pending.length) yield {values: pending};
  }
} satisfies Task<GroupTypes>;

for await (const output of runner.runTaskInBatches(groupTask, [
  {values: [1, 2, 3]},
  {values: [4, 5]}
])) {
  console.log(output);
}
// {values: [1, 2]}
// {values: [3, 4]}
// {values: [5]}
```

A task can implement both `process` and `processInBatches`. The method you call
selects the processor; the runner never guesses a conversion between them.
Use `batchInput` and `batchOutput` in the type map when streaming representations
differ from atomic inputs and outputs.

The worker protocol requests inputs on demand and acknowledges outputs as the
consumer advances. A slow consumer therefore slows processing. Closing a worker
stream early invalidates its initialized handle in this prototype; create a new
handle before issuing more calls. A normally completed stream retains its state.

## Initialize expensive state once

Imagine a lookup table, decoded geometry, or a WASM instance. The state should
stay where the computation runs. Add lifecycle hooks, with destruction directly
below initialization:

```ts
type LookupTypes = {
  initialization: {entries: Array<[string, number]>};
  state: Map<string, number>;
  input: {keys: string[]};
  output: {values: number[]};
  options: {missingValue: number};
};

const lookupTask = {
  id: 'lookup',

  initialize({entries}) {
    return new Map(entries);
  },

  destroy(state) {
    state.clear();
  },

  process({keys}, {missingValue}, context) {
    context.throwIfAborted();
    return {values: keys.map(key => context.state.get(key) ?? missingValue)};
  },

  async *processInBatches(inputs, {missingValue}, context) {
    for await (const {keys} of inputs) {
      context.throwIfAborted();
      yield {values: keys.map(key => context.state.get(key) ?? missingValue)};
    }
  }
} satisfies Task<LookupTypes>;
```

For one operation, let the runner manage the lifetime automatically:

```ts
const output = await runner.runTask(lookupTask, {keys: ['a', 'missing']}, {
  initialization: {entries: [['a', 10], ['b', 20]]},
  options: {missingValue: -1}
});
// {values: [10, -1]}; destroy has completed before successful resolution.
```

For repeated operations, keep an explicit initialized handle:

```ts
const lookup = await runner.initializeTask(lookupTask, {
  entries: [['a', 10], ['b', 20]]
});
try {
  await lookup.runTask({keys: ['a']}, {options: {missingValue: -1}});
  await lookup.runTask({keys: ['b']}, {options: {missingValue: -1}});

  for await (const output of lookup.runTaskInBatches(
    [{keys: ['a', 'b']}],
    {options: {missingValue: -1}}
  )) {
    console.log(output); // {values: [10, 20]}
  }
} finally {
  await lookup.close();
}
```

The handle has the same three execution methods with the task argument removed.
It serializes operations, fixes the execution location, and keeps the same state.
A streaming iterator occupies the handle until it ends. Do not wait for another
operation on that handle from inside an unfinished streaming loop.

### See the lifetime

```text
runner.runTask             initialize → process → destroy
runner.runTaskInBatches    initialize → stream ─────────→ destroy
runner.initializeTask     initialize → call → call → stream → close → destroy
```

`runTasks` creates one state instance for each used slot and reuses it within that
call. With concurrency two, there are two separate states. Use concurrency one or
an explicit handle when mutations must follow one shared history. Empty input
creates no state. Nothing is cached across separate automatic calls.

An initialized handle occupies runner capacity, even while idle. With capacity
one, close that handle before awaiting a separate runner call. Reuse the handle
for related operations, or provision more capacity.

## Keep ownership intentional

| Control | Meaning |
| --- | --- |
| `inputOwnership: 'copy'` (default) | Preserve the caller's buffers |
| `inputOwnership: 'transfer'` | Move buffers; all caller views of those buffers detach |
| `inputOwnership: 'share'` | Require shared storage rather than ordinary transferable buffers |
| `outputOwnership: 'transfer'` (default) | Move returned buffers to the caller |
| `outputOwnership: 'copy'` | Keep buffers usable inside task state |

These boundaries also apply to local execution. SharedArrayBuffer remains shared
under every policy; copy does not isolate shared memory. Application options are
copied separately. Do not depend on aliases between options and input payloads.
Automatic `runTasks` copies initialization data for each slot; explicit
initialization can transfer ownership once.

If a processor returns a cached typed array, choose `outputOwnership: 'copy'`.
Otherwise the default transfer detaches that cached buffer inside the task.

## Cancellation and cleanup

```ts
const controller = new AbortController();
const result = runner.runTask(scaleTask, {values}, {
  options: {factor: 10},
  execution: 'worker',
  signal: controller.signal
});
// A UI event can call controller.abort().
await result;
```

Worker cancellation in this prototype terminates the worker and invalidates
persistent state. There is no automatic retry. On the main thread, processors
must observe `context.signal` or call `context.throwIfAborted()` and yield during
long work so abort events can run. Main-thread JavaScript cannot be forcibly
stopped; cleanup waits until execution settles.

Always close runners and initialized handles in `finally`. `close()` drains work
and invokes `destroy`; `terminate(reason)` cancels work and forcibly stops workers.
Forced termination cannot guarantee `destroy`. Finish or close output iterators
before awaiting shutdown. The prototype has no shutdown timeout.

## Run the complete example

From a source checkout after installing dependencies and building:

```sh
node examples/core/task-runner/main.mjs
```

The [runnable example](https://github.com/visgl/math.gl/tree/master/examples/core/task-runner) uses real
Node workers and verifies all four patterns:

```text
One call: [ 11, 21, 31 ]
Independent slots: [ 1, 1, 2 ]
One streaming session: [ 1, 2 ]
Explicit lifetime: [ 1, 2 ]
```

The counters are the useful part: each parallel slot starts at one, while streaming
and explicit lifetimes reuse one counter. The example asserts that caller input
buffers remain available.

## What this prototype supports

| Available now | Deferred from the RFC |
| --- | --- |
| Plain typed objects; inferred input/output/options; required initialization | Full compile-time capability discrimination for worker-only descriptors |
| Browser/Node module workers and main-thread execution | Capability/version handshake for mismatched worker assets |
| Atomic calls, ordered bounded multi-input calls, streaming sessions | Runner byte budgets, reservations, priority, metrics |
| Automatic lifetimes and explicit initialized handles | Worker reuse across separate automatic lifetimes |
| Copy/transfer/share input and copy/transfer output | Cooperative worker cancellation with escalation |
| Signals, progress, graceful close, forced worker termination | Shutdown deadlines and adaptive routing |

Worker-side errors conservatively invalidate the handle, including ordinary
processor errors. Local processor errors leave an explicit handle usable after
settlement. This is stricter than the RFC's eventual worker behavior. Capabilities
are declared by the application, so keep worker assets and descriptors aligned.

For JavaScript, payload records are validated at runtime. For TypeScript, required
fields and output types are checked through the descriptor. An explicitly
annotated worker-only `Task<Types>` can preserve processor types, but the prototype
does not yet provide complete compile-time initialization/capability checking for
that shape. Prefer a shared typed definition with both worker and local hooks.

## Coming from the existing tasks API

- Keep existing top-level functions unchanged until you migrate a call site.
- Old `runTaskInBatches` means independent atomic calls: migrate it to
  `runner.runTasks`, not `runner.runTaskInBatches`.
- Put application parameters under `options` and raw payloads in named fields.
- Replace `createResourceWorker` with task lifecycle hooks and
  `createWorkerResource` with `runner.initializeTask`.
- Replace worker-side `createWorker` setup with `initializeTaskWorker(task)` for
  these new descriptors. Old and new descriptors are different protocols.

Continue with the [API reference](../api-reference/task-runner.md) or the
[design RFC](https://github.com/visgl/math.gl/blob/master/dev-docs/RFCs/task-runner-rfc.md).
