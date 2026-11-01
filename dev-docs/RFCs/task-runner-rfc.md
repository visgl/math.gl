# RFC: A consistent TaskRunner API

- **Status**: Draft proposal; not implemented
- **Date**: November 1, 2026
- **Baseline**: math.gl `master`, commit `ad2a3917c`

> An experimental implementation accompanies this RFC. Its
> [API reference](../../docs/modules/core/tasks/api-reference/task-runner.md#prototype-boundaries)
> distinguishes implemented behavior from the complete proposal below.

## Summary

Introduce a curated `@math.gl/core/tasks` API built around plain typed `Task`
objects and an explicitly owned `TaskRunner`. A task can implement atomic
processing, streaming processing, and optional initialization and destruction.
Inputs, outputs, initialization data, and individual stream batches have named
fields. Application options are separate from runtime controls.

Ordinary runner calls automatically initialize and destroy temporary task state.
Applications may call `initializeTask` to keep state across multiple operations.
Worker reuse and task-state reuse are separate concepts. The implementation now
provides global `preloadTasks` and optional nested `task.preload()` hooks for code-only warmup,
and `runTaskSync` for immediate local execution of synchronous hooks. See the
[implemented method reference](../../docs/modules/core/tasks/api-reference/task-runner.md)
for their contracts; neither restores the removed pool API.

```ts
const runner = new TaskRunner({maxConcurrency: 4});

await runner.runTask(task, input, request);
runner.runTasks(task, inputs, request);
runner.runTaskInBatches(task, inputs, request);

const initialized = await runner.initializeTask(task, initialization, controls);
await initialized.runTask(input, request);
await initialized.close();

await runner.close();
```

Inside an already-created worker, `initializeTaskWorker(task)` installs the task
protocol. It neither constructs a Worker nor initializes application state.

## Motivation and scope

The baseline tasks entry point exports all of `worker-utils` and adds two adaptive
execution functions. `TaskDescriptor` aliases `WorkerObject`. Consequently task
users encounter transport classes, protocol messages, library loaders, scheduler
configuration, and processing functions at the same abstraction level.

Specific problems:

- Application options are intersected with runtime options and a catch-all `any`
  index signature. Required application options become `Partial<Options>`.
- Five positional processing arguments include two different kinds of context.
- `runTaskInBatches` performs independent atomic calls, whereas
  `processOnWorkerInBatches` runs one stateful streaming processor.
- Pool settings are accepted on individual calls and may configure shared pools.
- Resource `destroy` drains and disposes; pool `destroy` aborts immediately.
- Task descriptors require worker-oriented metadata even for local processing.

This RFC defines the application-facing API and migration boundaries. It does not
replace the underlying scheduler, introduce distributed execution, serialize
arbitrary functions, provide a global task registry, or promise transparent RPC.
The implementation removes the old public worker-utils entry. Advanced reservations
and custom transports are intentional removals with application-level migration
guidance; any future runner support must follow the design gates below.

## Design principles

1. A task is a plain object checked with `satisfies Task<Types>`.
2. Use one vocabulary: task definition, invocation, initialized task, worker.
3. Inputs and outputs are record-shaped objects. Arrays, typed arrays, and scalar
   values belong in named fields such as `{values}` or `{count}`.
4. Execution location, operation shape, and state lifetime are separate choices.
5. Configuration follows lifetime: assets on tasks, scheduling on runners,
   cancellation and ownership on requests.
6. No hidden task-state cache, automatic retry, or silent route fallback after a
   worker has failed to load.
7. Keep transport implementation internal. Do not expose a second compatibility
   execution API.

## Public surface

```ts
Task<Types>
TaskContext<State>
TaskInitializationContext
TaskRunner
InitializedTask<Types>
TaskRunOptions<Types>
TaskRunsOptions<Types>
TaskStreamOptions<Types>
TaskInitializationOptions
TaskRunnerOptions
TaskProgress
TaskRunnerStats
TaskRunMetrics
TaskWorker

initializeTaskWorker(task): Promise<void>
```

The type declarations below describe the proposed contracts. Conditional typing,
capability inference, and overload implementation require a TypeScript prototype
before implementation approval; the sketches are not a compiled declaration file.

### Task type map

```ts
type LookupTypes = {
  initialization: {entries: Array<[string, number]>};
  state: Map<string, number>;
  input: {keys: string[]};
  output: {values: number[]};
  options: {missingValue: number};
};
```

| Type field | Meaning | Default |
| --- | --- | --- |
| `input` | Atomic input object | Required |
| `output` | Atomic output object | Required |
| `options` | Application parameter object | No application options |
| `initialization` | Initialization input object | No required initialization fields |
| `state` | Private state returned by `initialize` | `undefined` |
| `batchInput` | One streaming input object | `input` |
| `batchOutput` | One streaming output object | `output` |

`state` can be any application type and never crosses the transport boundary.
All other payload types must be structured-clone compatible at runtime. Named
fields do not imply that every nested value must be a plain object. Functions,
ports requiring unsupported ownership modes, and other uncloneable values fail
before dispatch where possible.

The implementation must reject top-level arrays, typed arrays, primitives, and
null as payload records. A bare TypeScript `object` constraint is insufficient;
compile-time negative cases and runtime JavaScript validation are both required.
Nested buffers and arrays are supported. Symbol-keyed data is outside the portable
payload contract.

### Task hooks

```ts
const lookupTask = {
  id: 'lookup',

  initialize({entries}, context) {
    context.throwIfAborted();
    return new Map(entries);
  },

  destroy(state) {
    state.clear();
  },

  process({keys}, {missingValue}, context) {
    context.throwIfAborted();
    return {
      values: keys.map(key => context.state.get(key) ?? missingValue)
    };
  },

  async *processInBatches(inputs, {missingValue}, context) {
    for await (const {keys} of inputs) {
      context.throwIfAborted();
      yield {
        values: keys.map(key => context.state.get(key) ?? missingValue)
      };
    }
  },

  worker: {
    url: new URL('./lookup-worker.js', import.meta.url),
    capabilities: {atomic: true, streaming: true}
  }
} satisfies Task<LookupTypes>;
```

| Hook | Signature | When called |
| --- | --- | --- |
| `initialize` | `(initialization, context) => State \| Promise<State>` | Once per state instance |
| `destroy` | `(state) => void \| Promise<void>` | Once per graceful destruction attempt |
| `process` | `(input, options, context) => Output \| Promise<Output>` | Once per atomic invocation |
| `processInBatches` | `(inputs, options, context) => AsyncIterable<BatchOutput>` | Once per streaming session |

Lifecycle hooks appear together, with `destroy` directly below `initialize`.
A task can provide either processor or both. Streaming-only tasks are valid.
A local stateful implementation supplies `initialize` together with its
processors; `destroy` is optional. A task without initialization has
`context.state === undefined` and no destruction hook. Worker-only descriptors
carry the same type map but may omit local hooks.

`id` is diagnostic metadata, not a global lookup key. Distinct descriptor objects
with the same ID must not accidentally share incompatible workers or state.
Worker pool identity must incorporate the resolved worker target.

### Processor context

```ts
type TaskInitializationContext = {
  signal: AbortSignal;
  throwIfAborted(): void;
  reportProgress(progress: TaskProgress): void;
};

type TaskContext<State = undefined> = TaskInitializationContext & {
  state: State;
};

type TaskProgress = {
  phase?: string;
  completed: number;
  total?: number;
  unit?: string;
};
```

Application metadata belongs in input fields, not a second untyped context.
Initialization receives context without state. Each invocation receives a fresh
cancellation context; initialization signals do not become future run signals.
Checking cancellation in a synchronous main-thread loop does not let the browser
process a new abort event: long-running local work must also yield.

### Worker configuration and installation

```ts
type TaskWorker = {
  url?: URL | string;
  create?: () => Worker;
  capabilities: {
    atomic: boolean;
    streaming: boolean;
  };
};
```

Exactly one target form is supplied. `create` is a browser bundler integration
returning a fresh Worker; `url` identifies a compiled module worker in browser or
Node. New workers use module semantics. Legacy classic-worker and CDN conventions
are outside the new public surface, rather than introducing several competing
location fields on `Task`.

Capabilities describe the worker implementation and are checked against its
ready handshake. They are explicit because a worker-only descriptor has no local
processors to inspect. The worker handshake must also validate lifecycle support
against the descriptor's initialization contract. Reject unsupported operations
before consuming inputs. There is no implicit atomic-to-streaming conversion.

```ts
// lookup-worker.ts
import {initializeTaskWorker} from '@math.gl/core/tasks';
import {lookupTask} from './lookup-task';

await initializeTaskWorker(lookupTask);
```

`initializeTaskWorker` installs message handlers and announces readiness inside
an existing worker. Its promise resolves when setup completes, not when the
worker terminates. It hosts one task definition, ignores the task's worker target,
and rejects a second installation. It does not register an ID in a global table.
The task's `initialize` hook runs only on a later lifecycle request from the runner.
Functions in the descriptor execute where the module is imported; they are never
serialized from the caller to the worker.

## Runner configuration and execution controls

```ts
const runner = new TaskRunner({
  maxConcurrency: 4,
  maxQueuedRuns: 32,
  maxQueuedBytes: 64 * 1024 * 1024,
  maxInFlightBytes: 64 * 1024 * 1024,
  onMetrics(metrics) {
    console.log(metrics);
  }
});
```

The initial runner defaults are `maxConcurrency: 1`, unlimited queue/byte limits,
and worker reuse enabled. Capacity is owned by this runner, never a process-wide
mutable singleton. Concurrency bounds active execution, not CPU parallelism on
the main thread. Metrics and statistics distinguish queued invocations, active
invocations, live state instances, and workers.

```ts
type TaskRunControls = {
  execution?: 'auto' | 'main-thread' | 'worker';
  signal?: AbortSignal;
  priority?: number;
  inputOwnership?: 'copy' | 'transfer' | 'share';
  outputOwnership?: 'copy' | 'transfer';
  cancellation?: {
    mode: 'cooperative' | 'terminate';
    timeoutMs?: number;
  };
  onProgress?: (progress: TaskProgress) => void;
  onExecution?: (execution: 'main-thread' | 'worker') => void;
};
```

`TaskRunOptions<Types>` adds typed `options` and, for automatic state lifetimes,
typed `initialization`. Required application fields remain required: do not use
`Partial<Options>`. Omit `options` for tasks without application parameters.
Initialization with required fields is mandatory on automatic calls and passed
as the second argument to `initializeTask`. Parameterless initializers receive
`{}`. Stateless tasks reject an `initialization` field.

Defaults and rules:

- `execution: 'auto'` selects a declared worker capability, otherwise a local
  processor. It does not retry locally after worker asset failure. A single
  streaming session or initialized handle never changes routes.
- Explicit execution requires support for that route and operation.
- `inputOwnership: 'copy'` and `outputOwnership: 'transfer'` are the defaults.
- Default cancellation is cooperative, with a 1000 ms worker escalation deadline.
  Explicit hard termination is invalid for main-thread execution.
- Priority defaults to zero; larger priorities run first, with starvation
  prevention supplied by the scheduler.
- Diagnostic callback errors (`onExecution`, runner `onMetrics`) are isolated.
  Preserve the existing `onProgress` contract: throwing aborts that operation.
- Progress for concurrent `runTasks` must include the input index in its callback
  event; raw `TaskProgress` reports originate within each processor.

Local execution applies the same clone/transfer boundary as worker execution.
Transfer detaches whole backing buffers, including aliases. SharedArrayBuffer
remains shared under every policy; input `share` is a restriction that rejects
transferable storage, not a conversion into shared memory. No output `share` mode
is introduced. Output transfer can detach state-owned buffers: use output copy
when returning cached state storage.

Reusable application options are copied per invocation; ownership controls apply
to the input payload. Initialization data has its own lifetime: explicit
`initializeTask` honors its `inputOwnership`, while automatic multi-instance
initialization clones a reusable initialization template for each instance.
It must not detach the template after the first slot. Transfer-only initialization
values cannot be replicated by `runTasks`; reject them before starting work.
These rules intentionally remove legacy ownership of arbitrary option buffers.

## Concrete execution examples

### One invocation: runTask

```ts
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
  },
  worker: {
    url: new URL('./scale-worker.js', import.meta.url),
    capabilities: {atomic: true, streaming: false}
  }
} satisfies Task<ScaleTypes>;

const {values} = await runner.runTask(
  scaleTask,
  {values: new Float64Array([1, 2, 3])},
  {options: {factor: 10}, execution: 'worker'}
);
// values: Float64Array [10, 20, 30]
```

### Independent invocations: runTasks

```ts
for await (const {values} of runner.runTasks(
  scaleTask,
  [
    {values: new Float64Array([1, 2])},
    {values: new Float64Array([3, 4])}
  ],
  {options: {factor: 10}, concurrency: 2}
)) {
  console.log(values); // [10, 20], then [30, 40]
}
```

`runTasks` accepts Iterable or AsyncIterable inputs and returns a single-use
AsyncIterable. It invokes `process` once per input, preserves input order, and
starts lazily on iteration. Concurrency defaults to one and cannot exceed runner
capacity. Its bound includes results waiting for ordered consumption, preventing
an early slow result from creating unbounded buffering. A failure stops input
consumption and cancels this call's outstanding operations; already-yielded
results remain delivered. The iterator rejects on the observed failure rather
than promising to finish all earlier inputs.

### One streaming session: runTaskInBatches

```ts
type BatchTypes = {
  input: {values: number[]};
  output: {values: number[]};
  options: {batchSize: number};
};

const batchTask = {
  id: 'batch',
  async *processInBatches(inputs, {batchSize}, context) {
    if (!Number.isSafeInteger(batchSize) || batchSize <= 0) {
      throw new RangeError('batchSize must be a positive safe integer');
    }
    let pending: number[] = [];
    for await (const {values} of inputs) {
      context.throwIfAborted();
      pending.push(...values);
      while (pending.length >= batchSize) {
        yield {values: pending.splice(0, batchSize)};
      }
    }
    if (pending.length) yield {values: pending};
  }
} satisfies Task<BatchTypes>;

for await (const output of runner.runTaskInBatches(
  batchTask,
  [{values: [1, 2, 3]}, {values: [4, 5]}],
  {options: {batchSize: 2}}
)) {
  console.log(output);
}
// {values: [1, 2]}, {values: [3, 4]}, {values: [5]}
```

This invokes `processInBatches` once, with an AsyncIterable even when the caller
supplies a synchronous Iterable. Inputs and outputs need not have matching counts.
Output order is processor emission order. One worker is leased for the session;
input demand and output acknowledgements provide backpressure. Closing iteration
requests both processor and producer cleanup. Iterator cancellation cannot force
an arbitrary uncooperative input producer to settle.

For finite byte budgets, `TaskStreamOptions` includes `inputBytes`, an explicit
session reservation covering retained batch inputs and reusable metadata. Reject
oversized batches before transfer. The reservation does not measure arbitrary
processor retention or output storage. The same underlying accounting exclusions
as the baseline apply: buffer bytes are not total application memory.

## Automatic and explicit lifecycle

### Automatic initialization

```ts
const result = await runner.runTask(
  lookupTask,
  {keys: ['a', 'missing']},
  {
    initialization: {entries: [['a', 10], ['b', 20]]},
    options: {missingValue: -1}
  }
);
// {values: [10, -1]}; graceful destruction finished before success resolves.
```

| Operation | State lifetime |
| --- | --- |
| `runner.runTask` | Initialize, process once, destroy |
| `runner.runTasks` | Initialize each used execution slot, process inputs on that slot, destroy all slots |
| `runner.runTaskInBatches` | Initialize, process the whole session, destroy |
| `runner.initializeTask` | Initialize once; retain until handle closes or is invalidated |

Empty `runTasks` creates no instances. Slot state is reused only within that
`runTasks` call. Parallel slots have independent state and input-to-slot assignment
is unspecified. State-dependent algorithms must use concurrency one or an
explicit initialized handle when results require one shared state history.
`processInBatches` can retain generator-local state without an initializer.

Automatic iterators acquire state lazily. Completion and `return()` await graceful
cleanup; consumers must close abandoned iterators, normally through `for await`
and `break`. Worker processes may be reused after destruction, but application
state must not survive into a subsequent automatic call. Module-level mutable
variables are outside this guarantee; stateful tasks must store state through the
lifecycle hooks.

### Explicit initialization

```ts
const lookup = await runner.initializeTask(
  lookupTask,
  {entries: [['a', 10], ['b', 20]]},
  {execution: 'worker', inputOwnership: 'copy'}
);

try {
  await lookup.runTask(
    {keys: ['a', 'missing']},
    {options: {missingValue: -1}}
  );
  for await (const result of lookup.runTasks(
    [{keys: ['a']}, {keys: ['b']}],
    {options: {missingValue: -1}}
  )) {
    console.log(result);
  }
  for await (const result of lookup.runTaskInBatches(
    [{keys: ['a', 'b']}],
    {options: {missingValue: -1}}
  )) {
    console.log(result);
  }
} finally {
  await lookup.close({timeoutMs: 1000});
}
```

The return type is `InitializedTask<LookupTypes>`, inferred from the descriptor.
Its methods omit the task and initialization arguments. They also omit execution
routing and concurrency controls: all operations share one state and are serial.
A multi-input call or streaming session occupies the handle until its iterator
finishes; other calls queue. Hard cancellation invalidates the handle.

A worker-backed handle pins one worker incarnation, consuming worker capacity even
while idle. Creation queues if capacity is exhausted; applications must close
unused handles. Expose live handles and pinned workers in runner statistics.
This avoids pretending that unlimited persistent resources fit in a bounded pool.
Initialization signals apply only to initialization, not later calls.

### Shutdown, errors, and cancellation

```ts
await lookup.close({timeoutMs: 1000});
await runner.close({timeoutMs: 5000});
await lookup.terminate(reason);
await runner.terminate(reason);
```

`close` rejects new submissions, drains accepted work, destroys live state, and
releases workers. Runner close also closes its initialized handles. Calls are
idempotent and share a completion promise. No deadline means wait indefinitely.
A deadline forces worker termination and rejects close with a timeout error.
An unconsumed streaming iterator can prevent draining: finish/close it or supply
a shutdown deadline.

`terminate` rejects queued/active work and stops workers immediately. It does not
guarantee task `destroy`. Main-thread code cannot be forcibly stopped; cancellation
rejects callers but state must not be destroyed concurrently with still-running
local code. Cleanup waits for local settlement, and timeout reports failure
without claiming the code has stopped. This limitation also applies to automatic
cleanup after abort.

| Event | State and caller outcome |
| --- | --- |
| Initialization succeeds | State available to processors |
| Initialization fails | Reject; initializer cleans partial allocations; no `destroy` without returned state |
| Atomic/stream processor fails | Automatic instance cleaned; explicit handle remains usable after settlement |
| Cooperative cancellation settles | Reject operation; explicit handle can remain usable; mutations are not rolled back |
| Worker crashes or is force-terminated | Reject; initialized handle permanently invalid |
| `destroy` fails | Release worker, reject close or automatic completion; do not rerun destroy |
| Processing and cleanup both fail | Preserve both through AggregateError, processing error first |

Cancellation can reject callers before physical execution settles. Hold leases
until settlement or termination; never reuse or destroy live state concurrently.
If initialization returns state after cancellation, destroy it once execution is
safe to clean up. No automatic retry is provided, especially after transferred
input or state mutation. Error details must preserve name/message/cause where
serializable without promising identical cross-realm prototypes.

## Comparison with other JavaScript worker libraries

Reviewed official project documentation on November 1, 2026. This is a comparison
of public programming models, not a benchmark or a popularity ranking.

| Library | Caller model | Worker-side setup | Implication for this RFC |
| --- | --- | --- | --- |
| Piscina | `pool.run(payload, options)` executes an exported worker function | Export a function from a module | Keep scheduler controls outside task data; distinguish graceful close from forced shutdown |
| workerpool | `pool.exec('method', args)` or a method proxy | `workerpool.worker({methods})` | A real method registry warrants registration language; our single-descriptor worker does not need it |
| Comlink | `wrap(worker)` returns an asynchronous proxy | `expose(object)` | Good remote-object ergonomics, but math.gl is defining execution and lifetime contracts rather than arbitrary RPC |
| threads.js | `spawn(new Worker(...))`, callable proxies, optional `Pool.queue` | `expose(functionOrObject)` | Demonstrates separate worker construction and exposing handlers; streaming uses Observables |

Piscina's run API separates payload from execution controls. Its `close` waits
for work while `destroy` stops workers and rejects pending work. That supports our
separate `close`/`terminate` semantics; we retain `destroy` specifically for the
application-state hook. Sources: [Piscina methods](https://piscinajs.dev/api-reference/Methods/)
and [current implementation](https://github.com/piscinajs/piscina/blob/current/src/index.ts).

workerpool supports a named method table, positional argument arrays, proxies,
transfer lists, cancellation, and worker termination hooks. Our named payload
objects are a stricter convention, and task-state destruction is scoped more
narrowly than worker shutdown. Source: [workerpool README](https://github.com/josdejong/workerpool).

Comlink exposes functions or objects through asynchronous proxies. Values are
cloned by default, with explicit transfer/proxy helpers; release and finalizer
hooks manage endpoint cleanup. This supports copy-by-default as a familiar choice,
but does not establish our proposed per-call initialization contract. Source:
[Comlink README](https://github.com/GoogleChromeLabs/comlink/blob/main/README.md).

threads.js exposes functions/objects and offers pooled queue callbacks. Its
Observable results support multiple emissions; this RFC instead specifies async
iterables with demand-driven input and acknowledged output. Stateful objects in
its examples belong to a worker; our lifecycle deliberately separates worker reuse
from state reuse. Sources: [basic usage](https://threads.js.org/usage),
[pools](https://threads.js.org/usage-pool), and
[Observables](https://threads.js.org/usage-observables).

Conclusion: keep TaskRunner focused on typed compute operations. Do not add method
proxies or a global registry to imitate RPC libraries. Document automatic state
lifetimes as a deliberate math.gl design choice, not an established convention
shared by these libraries. `initializeTaskWorker` is intentionally explicit about
installing the protocol in an existing worker.

## Migration from the baseline

| Current API | Proposed API | Migration detail |
| --- | --- | --- |
| `TaskDescriptor`, `WorkerObject` | `Task<Types>` | Named type map; separate worker target from task identity |
| `runTask(task, input, options, context, jobContext)` | `runner.runTask(task, {namedInput}, request)` | Move app options under `request.options`; metadata into input |
| `runTaskInBatches` | `runner.runTasks` | Preserve independent atomic behavior |
| `processOnWorker` | `runner.runTask(..., {execution: 'worker'})` | Explicit worker route |
| `processOnWorkerInBatches` | `runner.runTaskInBatches` | One stateful stream processor |
| `createWorker(process, processInBatches)` | `initializeTaskWorker(task)` | Install one descriptor's implemented capabilities |
| `createResourceWorker({initialize, run, dispose})` | Task hooks `initialize`, `process`, `destroy` | State supplied through context |
| `createWorkerResource` | `runner.initializeTask` | Explicit persistent lifetime, optional for ordinary calls |
| `resource.run` | `initialized.runTask` | Same naming as runner |
| `resource.destroy({timeout})` | `initialized.close({timeoutMs})` | Graceful cleanup |
| `WorkerPool`, shared `WorkerFarm` | Explicit `TaskRunner` | Configuration is runner-owned |
| `pool.destroy(reason)` | `runner.terminate(reason)` | Forced shutdown |
| `cancellationMode`, `cancellationTimeout` | `cancellation: {mode, timeoutMs}` | Explicit units and grouped controls |
| `workerUrl`, `loadWorker`, package/CDN overrides | `task.worker` | Resolve assets before dispatch |
| Reservations, protocol helpers, shared-state internals | Capability migration decision | Port required controls to the new model or explicitly retire them before removing the old entry |

Before:

```ts
const result = await runTask(legacyTask, values, {
  factor: 10,
  execution: 'worker',
  inputOwnership: 'copy'
});
```

After:

```ts
const {values: result} = await runner.runTask(
  scaleTask,
  {values},
  {options: {factor: 10}, execution: 'worker', inputOwnership: 'copy'}
);
```

Migration must call out behavior changes, not just renames:

- Input copying replaces legacy transfer-by-default. Explicitly request transfer
  where detachment is intentional. Output transfer remains the default.
- Main-thread operations retain clone/transfer boundaries.
- Application option buffers are copied rather than implicitly transferred.
- New cancellation defaults are cooperative rather than legacy hard termination.
- Old adaptive `mainThread.maxSize/getSize` policy is not silently reproduced.
  Initially use explicit execution selection; a future typed routing policy can
  restore adaptive cost-based selection.
- State is automatically destroyed per top-level runner call unless explicitly
  initialized. Worker module globals are not a substitute for lifecycle state.
- New batch dispatch calls the streaming processor; old `runTaskInBatches` does not.
- Tasks requiring initialization now declare and supply named initialization data.

## Breaking cleanup plan

Status: implemented public-surface cleanup in this PR. Legacy package entries and
exports are removed, repository consumers use the new API, and packed-package
checks enforce the boundary. The [migration guide](../../docs/modules/core/tasks/developer-guide/migration.md)
records intentional capability removals; future features below remain proposals. The goal is one public task
execution API, with import/type failures forcing applications to migrate when they
upgrade to the breaking release. Applications pinned to an older release are
unaffected.

### Inventory and target

The prototype currently exposes three overlapping execution layers, plus module
wrappers. The wildcard in the tasks entry makes almost the entire worker layer
available through two import paths.

| Surface today | Breaking-release action | Replacement |
| --- | --- | --- |
| Top-level `runTask`, `runTaskInBatches` | Remove exports and wrapper implementation | `runner.runTask`, `runner.runTasks` |
| `TaskDescriptor`, `TaskOptions`, `TaskExecution`, `MainThreadPolicy` | Remove old type family | `Task<Types>` and runner request types; explicit execution selection |
| `export * from '@math.gl/core/worker-utils'` in tasks | Delete wildcard | Explicit curated task exports only |
| `processOnWorker`, `processOnWorkerInBatches` | Remove public access | Runner methods with `execution: 'worker'` |
| `createWorker`, `createResourceWorker` | Remove public access | `initializeTaskWorker` and lifecycle hooks |
| `createWorkerResource`, `WorkerResource` | Remove public access | `runner.initializeTask` and its inferred handle |
| `WorkerFarm`, `WorkerPool`, `WorkerThread`, `WorkerJob`, `WorkerBody`, protocol types | Make implementation details private | Runner ownership, controls, and task context |
| `@math.gl/core/worker-utils` package subpath | Remove from package exports | `@math.gl/core/tasks` |
| `MapSetupWorker`, `setupMapInWorker` | Remove | `PrepareMapTask`; result becomes `{map}` |
| `BulkProjectionWorker`, `projectBulkInWorker` | Remove | `ProjectCoordinatesTask`; result becomes `{coordinates}` |
| `@math.gl/geospatial/workers`, `/workers/operations` | Remove public subpaths | `@math.gl/geospatial/tasks` |

Keep the transport implementation used by `TaskRunner`; removing a public API
is not a reason to rewrite a working transport. Move shared geospatial operations
to an internal location and migrate cross-package imports to curated public task
contracts. Classify utility exports such as library loading, environment helpers,
and queues separately: internalize unused ones, or give independently useful
utilities an appropriate entry point. Do not retain the entire worker API merely
because one utility still has a consumer.

### Capability gates before deletion

The current prototype is not a drop-in replacement for every worker facility.
Inventory repository callers and documented consumer requirements, then record
one disposition for each capability: implemented in the new API, explicitly
replaced by application code, or deliberately removed in the breaking release.
No silent fallback and no indefinitely deferred compatibility entry.

- Byte budgets, admission/reservations, and queue backpressure: retain required
  resource bounds in the new runner model before removing their old controls.
- Worker reuse and preloading: implemented through explicit `preloadTasks`,
  temporary worker bootstrap and nested imports, with no retained worker pool.
  The benchmark separates preload, cold automatic, and preloaded automatic calls.
- Cooperative cancellation, shared-memory progress, and shutdown deadlines:
  provide required semantics or explicitly document hard termination and its
  cleanup limitations as a breaking change.
- Metrics, diagnostics, worker capability checks, and custom transport use:
  expose only the observability and extension points applications actually need.
- Adaptive main-thread routing: applications can select execution explicitly;
  do not silently reinterpret the old cost policy.
- Worker-only typing, processor capabilities, and protocol/version validation:
  close the relevant prototype gaps before declaring the replacement stable.

These gates do not require implementing every speculative feature in this RFC.
They prevent deleting existing capabilities without a conscious migration decision.

### Delivery sequence

1. **Curate the task entry.** Replace the wildcard with an explicit export list.
   Keep only the new task definitions, runner, inferred handle, worker bootstrap,
   and their relevant public types in the final surface.
2. **Migrate this repository.** Convert all application-facing callers, examples,
   workers, tests, and documentation. Keep transport-unit tests against internal
   modules. Preserve the distinction between independent calls and streaming;
   never rename old `runTaskInBatches` to the new streaming method mechanically.
3. **Resolve capability gates.** Add required new controls with consistent names,
   or document intentional removals and concrete application migrations.
4. **Delete public compatibility.** Remove legacy functions, descriptor types,
   resource wrappers, module wrappers, and package export paths together. No
   permanent `/legacy` entry, forwarding aliases, or warning-only shims.
5. **Enforce the boundary.** Test the packed ESM and CommonJS packages and public
   TypeScript declarations. Assert that removed imports fail, including previous
   deep-import paths; whitelist the intended exports. Run provided-task examples
   in Node and a browser, and retain ownership/lifecycle/cancellation regressions.
6. **Release with migration instructions.** Use the next major release, or an
   explicitly announced breaking beta before that major becomes stable. The
   repository currently identifies packages as `5.0.0-beta.2`; verify published
   release state when scheduling this change. Release notes must include import,
   payload, batch-semantics, ownership, cancellation, and lifecycle changes.

A codemod can update imports and obvious method calls, but must flag ownership,
resource lifetime, old adaptive routing, and batch-versus-stream decisions for
manual review. Migration tooling does not ship a runtime compatibility layer.

### Completion criteria

- One documented application task entry per relevant package.
- No old public execution functions, worker descriptors, resource APIs, aliases,
  or exported transport internals remain accessible from the packed package.
- Repository applications and examples use the new API exclusively.
- Every removed capability has a documented replacement or intentional removal.
- Old imports fail clearly; new examples, types, and runtime tests pass.

## Implementation gates and remaining design work

Before implementation approval:

- Prototype `satisfies Task<Types>` contextual typing, inference through runner
  methods, worker-only descriptors, required options/initialization, and distinct
  batch types. Include negative type cases for unwrapped payloads and unsupported
  capabilities. Avoid a runtime factory solely to repair avoidable typing issues.
- Specify protocol lifecycle IDs, ready/capability handshake, and shutdown races.
- Verify automatic state isolation under worker reuse, state replication per slot,
  ordered backpressure, empty input, iterator return, and partial initialization.
- Test cancellation during initialization/processing/destruction, cleanup errors,
  cached output buffers, aliasing, and state invalidation after worker loss.
- Validate browser and Node module-worker examples, local parity, runner capacity
  with pinned handles, and bounded stream reservations.
- Specify exact metrics/statistics fields, fair queueing, and limits before exposing
  them as stable public types. No benchmark claims are made by this RFC.

Advanced byte reservations, reusable prepared initialization data, adaptive routing,
and heterogeneous multi-task workers are deferred. They should not become loosely
typed fields on the first version of TaskRunOptions.
