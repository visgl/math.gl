# `TaskRunner` API

The public execution API in `@math.gl/core/tasks`. Start with the [get-started guide](../developer-guide/task-runner.md).
This reference lists implemented controls only; see the RFC for proposed extensions.

## Task type map

`Task<Types>` describes a plain object with `id`, optional `worker`, and hooks:

| Hook | Signature |
| --- | --- |
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

`new TaskRunner({maxConcurrency?: number, maxIdleWorkers?: number})` owns independent execution capacity.
Default concurrency is one; values must be positive safe integers. No shared farm
configuration is mutated. Capacity includes initializing and explicitly retained
handles. Waiting acquisitions honor `signal` and are rejected when the runner closes.

| Method | Result | Contract |
| --- | --- | --- |
| `preloadTasks(tasks, {signal}?)` | `Promise<void>` | Warm one worker per distinct task without task initialization |
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
| `inputOwnership` | `copy` | `copy`, `transfer`, or `share` |
| `outputOwnership` | `transfer` | `copy` or `transfer` |
| `signal` | None | Cancel acquisition or execution |
| `onProgress` | None | Receives `{completed, total?, phase?, unit?}`; throwing fails the operation |
| `concurrency` | 1 | Only on runner `runTasks` |

`initializeTask` controls contain only execution, signal, ownership, and progress;
application initialization data is the named second argument. Its signal does not
control future runs. All automatic calls copy initialization data independently of process input
ownership; multi-input calls copy a template for each slot. Automatic calls create separate workers unless the task was explicitly preloaded.

### Worker-code warmup

`await runner.preloadTasks([ProjectCoordinatesTask, PrepareMapTask])` starts one
worker for each distinct task object and waits for its module/protocol readiness.
It does not call task `initialize`, `process`, or `destroy`, prepare a projection,
or allocate task state. Lazy imports inside hooks still load when those hooks run.
Tasks without worker targets reject. Repeated references in one list are deduplicated.

`maxIdleWorkers` defaults to `maxConcurrency`, accepts nonnegative safe integers,
and bounds retained idle workers separately from active execution. The distinct
task count in one preload request must not exceed this limit. For two tasks with
serial processing, use `new TaskRunner({maxIdleWorkers: 2})`. Zero disables retention.
Up to `maxConcurrency + maxIdleWorkers` workers may exist, plus workers undergoing
asynchronous termination. Idle eviction is oldest-first; reuse makes a worker recent.

Later `runTask`, `runTasks`, `runTaskInBatches`, and worker `initializeTask` calls
borrow warm workers by task object identity, not `id`. Keep definitions stable;
do not mutate worker targets. Each automatic operation still initializes and destroys
its state. Module-level variables survive worker reuse, so instance state belongs in
`initialize`'s return value. Failed/cancelled workers are never returned to the cache.

Preloading uses execution capacity and can wait behind initialized handles. Close
those handles before awaiting warmup when they occupy all slots. A signal cancels
warmup; earlier completed workers may remain cached if a later preload fails.
Concurrent calls and eviction can consume a warmed worker before the next operation;
preloading is a latency optimization, not a reservation. Both runner shutdown methods
stop cached workers. Unpreloaded tasks retain the temporary-worker behavior.

### Synchronous execution

`runner.runTaskSync(task, input, request?)` runs on the calling thread even when
the task declares a worker. It returns `Output`, never a promise, and throws errors
synchronously. The request uses the same typed options, initialization, ownership,
signal, and progress controls as `runTask`, but has no `execution` field.

The atomic processor and any lifecycle hooks must return synchronously. Define the
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
output types. Requests omit initialization, execution, and concurrency. All calls
are serial and share state. A multi-input operation owns the handle until its
iterator finishes. `close()` is idempotent; `terminate(reason?)` invalidates worker
state and closes the handle.

Normal worker stream completion preserves state. Early stream return, worker
cancellation, or worker invocation failure invalidates it. Local processor errors
leave state available. There is no rollback or retry. On automatic atomic calls,
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
shutdown deadlines, implicit worker preloading, adaptive routing, and
cooperative worker cancellation. The old worker-utils entry is removed; see [migration](../developer-guide/migration.md)
for application-level alternatives and intentional removals. Do not pass RFC-only fields to this prototype. See the
[design RFC](https://github.com/visgl/math.gl/blob/master/dev-docs/RFCs/task-runner-rfc.md)
for the complete distinction.
