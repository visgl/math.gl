# Get started with Tasks

Tasks keep your application responsive while processing large datasets.
`TaskRunner` runs computations in background workers, processes incoming data
incrementally, and reuses expensive state across repeated operations.

Start with tasks provided by math.gl modules. This guide uses geospatial tasks to
reproject coordinates and prepare maps, then explains how to create your own tasks.

## Running a Task

As our first example, the `ProjectCoordinatesTask` (provided by
`@math.gl/geospatial/tasks`) converts coordinates between coordinate reference
systems. Our goal here is to convert longitude and latitude in degrees into
Web Mercator coordinates in meters.

```ts
import {TaskRunner} from '@math.gl/core/tasks';
import {ProjectCoordinatesTask} from '@math.gl/geospatial/tasks';

const runner = new TaskRunner();
try {
  const {coordinates} = await runner.runTask(ProjectCoordinatesTask, {
    coordinates: new Float64Array([0, 0, 10, 20]),
    projection: {from: 'EPSG:4326', to: 'EPSG:3857'}
  });

  console.log([...coordinates]);
  // Approximately [0, 0, 1113194.91, 2273030.93]
} finally {
  await runner.close();
}
```

The task supplies its worker implementation. `TaskRunner` starts the worker,
initializes the projection, runs the operation, and releases the temporary state.
You receive a Promise of a result object. No worker message handling is required.

Inputs and outputs have named fields: `{coordinates}`, not a bare typed array.
The input specifies the coordinates and their projection. Input buffers are copied
by default, so the caller can keep using them.

The examples below use a runner owned by your application. Close it after its last
operation, or in your component's teardown. Each complete runnable example uses
`try`/`finally` to make that lifetime explicit.

## Prepare a map

`PrepareMapTask` builds a portable map snapshot in a worker. Restore it as a
`MapEngine` when you need to use the map on the main thread:

```ts
import {TaskRunner} from '@math.gl/core/tasks';
import {PrepareMapTask} from '@math.gl/geospatial/tasks';
import {MapEngine} from '@math.gl/geospatial/discontinuous';

const runner = new TaskRunner();
try {
  const {map} = await runner.runTask(PrepareMapTask, {
    description: {
      version: 1,
      id: 'world',
      definition: {type: 'mercator'}
    }
  });

  const engine = MapEngine.fromPrepared(map);
  console.log(engine.getLayout());
} finally {
  await runner.close();
}
```

The task returns data that can cross the worker boundary. The restored engine is
an ordinary local object. Prepared snapshots are for same-version transport,
not a permanent storage format.

## Process multiple inputs

Use `runTasks` to apply a task to several independent input objects. Results arrive
in input order, even when computation overlaps:

```ts
const runner = new TaskRunner({maxConcurrency: 2});
const projection = {from: 'EPSG:4326', to: 'EPSG:3857'};

try {
  const inputs = [
    {coordinates: new Float64Array([0, 0, 10, 20]), projection},
    {coordinates: new Float64Array([-74, 40.7, 139.7, 35.7]), projection}
  ];

  for await (const {coordinates} of runner.runTasks(
    ProjectCoordinatesTask,
    inputs,
    {concurrency: 2}
  )) {
    console.log(coordinates);
  }
} finally {
  await runner.close();
}
```

Inputs can be an `Iterable` or `AsyncIterable`. The runner pulls them lazily and
bounds outstanding work and buffered results. `concurrency` is an upper bound;
other calls on the same runner may leave fewer slots available.

Each used slot initializes its own projection and reuses it within this operation.
Separate `runTasks` calls do not share application state.

## Process a stream

Use `runTaskInBatches` when inputs arrive incrementally and should pass through one
processing session. `ProjectCoordinatesTask` retains one projection for the stream:

```ts
async function* coordinateBatches() {
  yield {coordinates: new Float64Array([0, 0, 10, 20]), projection};
  yield {coordinates: new Float64Array([-74, 40.7]), projection};
}

for await (const {coordinates} of runner.runTaskInBatches(
  ProjectCoordinatesTask,
  coordinateBatches()
)) {
  // Upload or consume each result without collecting the entire dataset.
  console.log(coordinates);
}
```

`runTasks` calls the atomic processor separately for each input. In contrast,
`runTaskInBatches` invokes the streaming processor once for the entire sequence.
A streaming task may regroup input, retain intermediate state, or emit a different
number of output batches. Each emitted batch still has named fields.

Consumer demand applies backpressure: a slow consumer slows processing. Use
`for await` so `break` closes the output iterator and requests input cleanup.

## Reuse initialized state

If you will project several datasets using the same CRS pair, initialize the task
explicitly. This optional initialization supplies a default projection, so subsequent
inputs only need coordinates. The returned handle retains the projection across calls:

```ts
const projectionTask = await runner.initializeTask(ProjectCoordinatesTask, {
  projection: {from: 'EPSG:4326', to: 'EPSG:3857'}
});

try {
  const first = await projectionTask.runTask({
    coordinates: new Float64Array([0, 0, 10, 20])
  });

  const second = await projectionTask.runTask({
    coordinates: new Float64Array([-74, 40.7])
  });

  // The same handle also supports runTasks and runTaskInBatches.
  console.log(first.coordinates, second.coordinates);
} finally {
  await projectionTask.close();
}
```

An input can override the default with its own `projection`. The task caches the
most recently used projection within its lifetime.

The handle's methods omit the task argument because it is already bound. All calls
are serial and share state; the execution location stays fixed. An initialized
handle occupies runner capacity even while idle. With capacity one, reuse or close
that handle before awaiting another operation through the runner.

![Automatic calls initialize, process, and destroy state; explicit handles retain state across calls until close.](/images/task-runner-lifetimes.svg)

Automatic initialization belongs to the top-level runner operation. Explicit
initialization lasts until `close()`. A task that does not need persistent state,
such as `PrepareMapTask`, simply supplies a processor.

## Controlling Task Execution

You control concurrency, cancellation, and whether buffers are copied, transferred,
or shared. These controls belong to the runner or request, separate from the task's
application parameters.

### Choose an execution location

```ts
await runner.runTask(ProjectCoordinatesTask, {coordinates, projection}, {
  execution: 'worker'
});
```

`auto`, the default, uses a declared worker target when present and local execution
otherwise. Choose `main-thread` to run locally or `worker` to require a worker.
Worker load errors are reported; there is no hidden local retry. Synchronous
main-thread computation does not become CPU-parallel by raising concurrency.

### Set concurrency

`new TaskRunner({maxConcurrency: 4})` gives the runner four execution slots.
`runTasks(..., {concurrency: 2})` uses at most two of those slots. Explicitly
initialized handles each retain one slot. A stream occupies its slot until it ends.

### Choose buffer ownership

| Control | Meaning |
| --- | --- |
| `inputOwnership: 'copy'` (default) | Preserve the caller's buffers |
| `inputOwnership: 'transfer'` | Move buffers; all caller views of those buffers detach |
| `inputOwnership: 'share'` | Require shared storage rather than ordinary transferable buffers |
| `outputOwnership: 'transfer'` (default) | Move returned buffers to the caller |
| `outputOwnership: 'copy'` | Keep returned buffers usable inside task state |

These boundaries also apply locally. `SharedArrayBuffer` stays shared under every
policy; copy does not isolate shared memory. Individual tasks may impose tighter
input requirements: `ProjectCoordinatesTask` currently accepts ordinary
`Float32Array` or `Float64Array` storage, not shared buffers.

Application options are copied separately. Transfer rejects input that aliases
reusable option buffers; use copy mode for those inputs. Automatic calls
copy initialization data for each slot. Explicit initialization can transfer
ownership once. If a task returns cached storage, choose output copying to avoid
detaching that storage inside its state.

### Cancel work and observe progress

```ts
const controller = new AbortController();
const result = runner.runTask(ProjectCoordinatesTask, {coordinates, projection}, {
  signal: controller.signal,
  onProgress({phase, completed, total}) {
    console.log(phase, completed, total);
  }
});

// A UI event can call controller.abort().
await result;
```

Worker cancellation terminates the worker and invalidates any retained state.
There is no automatic retry. Main-thread work must observe its signal and yield
during long computation so abort events can run; it cannot be forcibly stopped.
The supplied projection task checks cancellation between chunks.

### Close the runner

`close()` drains accepted work and destroys task state. Finish or close output
iterators before awaiting graceful shutdown. `terminate(reason)` cancels work,
stops workers, and unwinds paused output iterators. Forced termination cannot
guarantee task cleanup. Local execution must settle before state is destroyed.

## Create your own task

Once the provided tasks are familiar, use the same API for your own computation.
A `Task` is a plain object checked with `satisfies`; no factory or registry is needed:

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

const {values} = await runner.runTask(
  scaleTask,
  {values: new Float64Array([1, 2, 3])},
  {options: {factor: 10}}
);
// values: Float64Array [10, 20, 30]
```

`process` may return an object or a Promise. Input and output fields remain typed
at the call site. Required application options remain required; they live under
`options`, separate from runtime controls. Omit the `options` type for a task
without application parameters.

### Add streaming and lifecycle hooks

One task can implement atomic and streaming processors. Add `initialize` when it
needs private state and `destroy` when that state needs explicit cleanup:

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

State stays private to its execution location. The runner supplies it as
`context.state` to both processors. Use `batchInput` and `batchOutput` type fields
if streaming representations differ from atomic payloads; otherwise they default
to `input` and `output`. A streaming processor can keep generator-local variables
without defining an initializer.

### Install your task in a worker

Export the definition from `lookup-task.ts` and add a worker target to it:

```ts
worker: {
  url: new URL('./lookup-worker.js', import.meta.url),
  capabilities: {atomic: true, streaming: true}
}
```

Then create the worker entry point:

```ts
// lookup-worker.ts — compiled to lookup-worker.js
import {initializeTaskWorker} from '@math.gl/core/tasks';
import {lookupTask} from './lookup-task.js';

await initializeTaskWorker(lookupTask);
```

`initializeTaskWorker` installs the protocol inside an existing worker. The runner
creates the worker; task initialization happens later. Functions load from the
worker module and are never serialized from the caller.

For a browser bundler, use a fresh worker factory instead of a URL:

```ts
worker: {
  create: () => new Worker(new URL('./lookup-worker.ts', import.meta.url), {
    type: 'module'
  }),
  capabilities: {atomic: true, streaming: true}
}
```

Use exactly one target form. Node needs a compiled module URL. Capabilities must
match the worker's implemented processors. An explicitly annotated worker-only
`Task<Types>` retains its input, output, option, and initialization types; `satisfies`
alone cannot infer absent processor types from a URL.

## Further reading

- [TaskRunner API reference](../api-reference/task-runner.md): implemented options,
  errors, ownership, and current prototype boundaries.
- [Runnable examples](https://github.com/visgl/math.gl/tree/master/examples/core/task-runner):
  provided geospatial tasks and a custom transform task, with asserted results.
- [Design RFC](https://github.com/visgl/math.gl/blob/master/dev-docs/RFCs/task-runner-rfc.md):
  full proposal, migration, library comparisons, and deferred features.

The old top-level task functions and worker APIs have been removed. See the
[migration guide](./migration.md) for replacements, including the difference
between independent atomic calls and streaming.
