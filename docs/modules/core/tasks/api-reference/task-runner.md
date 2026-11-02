# `TaskRunner` API

The public execution API in `@math.gl/core/tasks`. Start with the [get-started guide](../developer-guide/task-runner.md).
This reference lists implemented controls only; see the RFC for proposed extensions.

## Task type map

`Task<Types>` describes a plain object with `id`, optional `worker`, and hooks:

| Hook | Signature |
| --- | --- |
| `preload` | `() => void \| Promise<void>` |
| `initialize` | `(initialization, context) => State \| Promise<State>` |
| `destroy` | `(state) => void \| Promise<void>` |
| `process` | `(input, options, context) => Output \| Promise<Output>` |
| `processInBatches` | `(inputs, options, context) => AsyncIterable<BatchOutput>` |

Type fields are `input`, `output`, optional `options`, `initialization`, `state`,
`batchInput`, and `batchOutput`. Batch types default to atomic types. Context has
`state`, `signal`, `throwIfAborted()`, and `reportProgress(progress)`; initialization
context omits state. Input/output payloads are plain objects containing named
fields; state may be any local value. Lifecycle hooks are optional for stateless
tasks. Both processor shapes may coexist on one task.

## `TaskRunner`

`new TaskRunner({maxConcurrency?: number})` owns independent execution capacity.
Default concurrency is one; values must be positive safe integers. No shared farm
configuration is mutated. Capacity includes initializing and explicitly retained
handles. Waiting acquisitions honor `signal` and are rejected when the runner closes.

| Method | Result | Contract |
| --- | --- | --- |
| `runTaskSync(task, input, request?)` | `Output` | Immediate main-thread execution of synchronous hooks |
| `runTask(task, input, request?)` | `Promise<Output>` | Temporary state for one atomic call |
| `runTasks(task, inputs, request?)` | `AsyncIterable<Output>` | Independent calls, ordered output, per-slot state |
| `runTaskInBatches(task, inputs, request?)` | `AsyncIterable<BatchOutput>` | One streaming processor session |
| `initializeTask(task, initialization, controls?)` | `Promise<InitializedTask>` | State retained until close/termination |
| `close()` | `Promise<void>` | Reject waiting acquisitions, drain owned handles, destroy state, stop workers |
| `terminate(reason?)` | `Promise<void>` | Abort handles and force-stop workers; local execution must settle |

`request` becomes required when the descriptor requires application options or
initialization. Options are inferred from the invoked hook: `process` for atomic
calls and `processInBatches` for streaming calls, including on initialized handles.
Iterable methods accept synchronous or asynchronous inputs and
start on first iteration. `runTasks` concurrency defaults to one, must not exceed
runner capacity, and is an upper bound under contention. Buffered ordered results
count toward that bound. Failure stops further consumption when observed in input
order; already-yielded results remain delivered. Input cleanup is best effort for
blocked asynchronous producers.

### Request fields

| Field | Default | Meaning |
| --- | --- | --- |
| `options` | `{}` when no required fields | Typed application parameters, copied per invocation |
| `initialization` | `{}` when no required fields | Temporary instance initialization data |
| `execution` | `auto` | Worker when a target exists; otherwise local |
| `initializationOwnership` | `copy` | Ownership of automatic initialization data, independently of processing payloads; `copy`, `transfer`, or `share`. `runTasks` templates allow only copy/share. |
| `inputOwnership` | `copy` | `copy`, `transfer`, or `share` |
| `outputOwnership` | `transfer` | `copy` or `transfer` |
| `signal` | None | Cancel acquisition or execution |
| `onProgress` | None | Receives `{completed, total?, phase?, unit?}`; throwing fails the operation |
| `concurrency` | 1 | Only on runner `runTasks` |

`initializeTask` controls contain only execution, signal, ownership, and progress;
application initialization data is the named second argument. Its signal does not
control future runs. Automatic calls copy initialization data by default, independently of process input
ownership. Set `initializationOwnership` to transfer setup resources such as MessagePorts
or to validate shared storage. `runTasks` reuses an initialization template per slot,
so it accepts only copy/share and rejects transfer before consuming input. Explicit
`initializeTask` calls continue to use their own `inputOwnership` control for setup. Separate automatic calls create separate workers; explicit handles retain one worker.

## `preloadTasks`

```ts
import {preloadTasks} from '@math.gl/core/tasks';
await preloadTasks([ProjectCoordinatesTask, PrepareMapTask]);
```

This standalone operation loads task code ahead of execution, independently of any
runner. It creates no task state and does not invoke `initialize`, `process`, or
`destroy`. `task.preload()` is an optional code-loading hook for dynamic imports and
nested preload functions. Normal async execution automatically waits for this hook
before initialization. Calls within one runtime deduplicate loading by task object
identity; a failed hook can be retried. Keep task definitions stable.

`preloadTasks(tasks, {execution?, signal?})` follows the same routing rule as execution:
`auto` uses a declared worker, otherwise the local hook. `main-thread` loads locally;
`worker` requires a worker target. Repeated references within a list are deduplicated.
Tasks are preloaded sequentially, bounding temporary workers to one per invocation.

For a worker target, a temporary worker loads its actual bundled entry, executes its
module bootstrap, and awaits its own `preload` hook before acknowledging completion.
The temporary worker then terminates. This also works with opaque bundler worker
factories. There is no global runner, retained worker pool, or shutdown API to manage.
Later workers can reuse browser-cached code where response cache headers permit;
they still pay startup, evaluation, and task initialization costs. Code preloading
cannot guarantee zero network traffic or prefetch unknown runtime-selected assets.
Node workers also start afresh and do not share a JavaScript module cache.

The hook must explicitly load dependencies otherwise deferred until processing.
Provided geospatial tasks preload their projection/operation modules. For custom tasks:

```ts
const task = {
  id: 'transform',
  async preload() {
    const module = await import('./transform-implementation.js');
    await module.preloadDependencies?.();
  },
  async process(input) {
    const {transform} = await import('./transform-implementation.js');
    return {values: transform(input.values)};
  }
};
```

Cancellation stops waiting and terminates temporary workers. While automatic local
initialization is waiting for code, cancellation releases its execution slot without
creating state; `terminate()` does not wait for that shared load. Local dynamic imports
cannot be forcibly cancelled and may finish after the caller aborts.
Hooks receive no task input or state: load modules here, allocate per-instance
resources in `initialize`. Worker module bootstrap and preload hooks must not assume
that a processing request will follow. No HTML preload elements are used.

## Synchronous execution

`runner.runTaskSync(task, input, request?)` runs on the calling thread even when
the task declares a worker. It returns `Output`, never a promise, and throws errors
synchronously. The request uses the same typed options, initialization, ownership,
signal, and progress controls as `runTask`, but has no `execution` field.

The atomic processor and initialization/destruction hooks must return synchronously.
If the task has a `preload` hook, first await
`preloadTasks([task], {execution: 'main-thread'})`; an unloaded task rejects without
starting async work. Worker preloading does not mark code loaded on the main thread. Define the
task with `satisfies Task<Types>` so TypeScript retains its concrete return types;
a broad `Task<Types>` annotation permits async hooks and is not accepted. A streaming
hook may coexist, but is not invoked. Known async functions reject before lifecycle
execution. Hidden promise returns from untyped JavaScript reject at runtime; any late
cleanup is best effort and is not a supported synchronous lifecycle.

The call acquires capacity immediately and releases it after destruction; occupied
capacity causes an error instead of queueing. Inputs/options are copied and transfers
are honored just as in async local execution. An already-aborted signal rejects;
progress callbacks can abort synchronously. Timer and UI callbacks cannot run during
blocking JavaScript. For expensive work, use a worker. Provided geospatial tasks use
async imports and are not eligible for `runTaskSync`.

## `InitializedTask`

Inferred as `InitializedTask<typeof task>`. Provides `runTask(input, request?)`,
`runTasks(inputs, request?)`, and `runTaskInBatches(inputs, request?)` with the same
output types. Requests omit initialization and execution. Calls are serial by default
and share state. A task may declare `concurrency.maxConcurrency` and
`concurrency.getSchedulingMode(input)` (`'parallel'` or `'exclusive'`). Initialize
with `operationConcurrency` to opt in, up to that maximum. This applies to local
and worker execution; a worker instance always retains one physical worker and one
state. Exclusive operations are FIFO barriers. A multi-input operation owns the handle until its
iterator finishes. `close()` is idempotent; `terminate(reason?)` invalidates worker
state and closes the handle.

`state` reports `ready`, `closing`, `closed`, or `invalid`. Atomic calls accept a
`timeout` in milliseconds, including queue wait. Cancelling a queued call does not
disturb active work. Cancelling active concurrent work invalidates the shared
instance; worker transport failures do not silently recreate state. Local code must
cooperate with its signal before destruction can finish.
Invalidated local instances still run their destruction hook after active work
has drained; invalidation prevents reuse, not resource cleanup.

Initialize with `onRequest(operation, payload, signal)` and/or
`onEvent(operation, payload)` to expose host services. Task hooks call
`context.requestHost(operation, payload, controls?)` or
`context.emitHost(operation, payload)`. Requests and responses copy by default;
request controls may explicitly set `inputOwnership` and `outputOwnership` to
transfer buffers. Notifications copy their payload. Host callbacks must not await
an exclusive operation on the same instance: it is queued behind the current call.
Streams retain exclusive ownership and pull inputs on demand, including on the
multiplexed worker transport.

Cancelling or returning a stream before execution removes its queued barrier without
invalidating shared state. Normal worker stream completion preserves state. Early
return after worker stream execution starts, worker
cancellation, transport failure, or worker stream failure invalidates it. Local
processor errors leave state available. On the multiplexed route, atomic processor
errors and host callback exceptions reject only their reporting call; siblings and
retained state remain available. Host notification exceptions are reported after
the remote atomic operation settles, not by interrupting shared state. The legacy
serialized worker transport cannot distinguish processor and transport failures
and conservatively invalidates on either. There is no rollback or retry. On automatic atomic calls,
processing plus destruction failures are reported together via `AggregateError`.
Initialization failure cleans a returned state where possible; an initializer
that throws must release its own partial allocations.

## `initializeTaskWorker`

`await initializeTaskWorker(task)` installs one descriptor in an existing worker.
It rejects calls on the main thread or a second installation. It resolves after
protocol setup, not after task destruction. No global registry is involved.
Worker capability declarations must match the supplied implementation; protocol
negotiation is deferred. Set `worker.url` to a compiled module URL or
`worker.create` to a fresh browser Worker factory, but not both.

## Prototype boundaries

Not implemented: runner byte budgets, admission reservations, priority, metrics,
shutdown deadlines, retained worker pools across automatic calls, adaptive routing, and
cooperative worker cancellation. The old worker-utils entry is removed; see [migration](../developer-guide/migration.md)
for application-level alternatives and intentional removals. Do not pass RFC-only fields to this prototype. See the
[design RFC](https://github.com/visgl/math.gl/blob/master/dev-docs/RFCs/task-runner-rfc.md)
for the complete distinction.
