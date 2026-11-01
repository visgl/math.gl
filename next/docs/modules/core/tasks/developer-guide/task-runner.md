# Get started with Tasks

Tasks keep your application responsive while processing large datasets. `TaskRunner` runs computations in background workers, processes incoming data incrementally, and reuses expensive state across repeated operations.

Start with tasks provided by math.gl modules. This guide uses geospatial tasks to reproject coordinates and prepare maps, then explains how to create your own tasks.

## Running a Task[​](#running-a-task "Direct link to Running a Task")

As our first example, the `ProjectCoordinatesTask` (provided by `@math.gl/geospatial/tasks`) converts coordinates between coordinate reference systems. Our goal here is to convert longitude and latitude in degrees into Web Mercator coordinates in meters.

```
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

The task supplies its worker implementation. `TaskRunner` starts the worker, initializes the projection, runs the operation, and releases the temporary state. You receive a Promise of a result object. No worker message handling is required.

Inputs and outputs have named fields: `{coordinates}`, not a bare typed array. The input specifies the coordinates and their projection. Input buffers are copied by default, so the caller can keep using them.

The examples below use a runner owned by your application. Close it after its last operation, or in your component's teardown. Each complete runnable example uses `try`/`finally` to make that lifetime explicit.

## Prepare a map[​](#prepare-a-map "Direct link to Prepare a map")

`PrepareMapTask` builds a portable map snapshot in a worker. Restore it as a `MapEngine` when you need to use the map on the main thread:

```
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

The task returns data that can cross the worker boundary. The restored engine is an ordinary local object. Prepared snapshots are for same-version transport, not a permanent storage format.

## Process multiple inputs[​](#process-multiple-inputs "Direct link to Process multiple inputs")

Use `runTasks` to apply a task to several independent input objects. Results arrive in input order, even when computation overlaps:

```
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

Inputs can be an `Iterable` or `AsyncIterable`. The runner pulls them lazily and bounds outstanding work and buffered results. `concurrency` is an upper bound; other calls on the same runner may leave fewer slots available.

Each used slot initializes its own projection and reuses it within this operation. Separate `runTasks` calls do not share application state.

## Process a stream[​](#process-a-stream "Direct link to Process a stream")

Use `runTaskInBatches` when inputs arrive incrementally and should pass through one processing session. `ProjectCoordinatesTask` retains one projection for the stream:

```
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

`runTasks` calls the atomic processor separately for each input. In contrast, `runTaskInBatches` invokes the streaming processor once for the entire sequence. A streaming task may regroup input, retain intermediate state, or emit a different number of output batches. Each emitted batch still has named fields.

Consumer demand applies backpressure: a slow consumer slows processing. Use `for await` so `break` closes the output iterator and requests input cleanup.

## Reuse initialized state[​](#reuse-initialized-state "Direct link to Reuse initialized state")

If you will project several datasets using the same CRS pair, initialize the task explicitly. This optional initialization supplies a default projection, so subsequent inputs only need coordinates. The returned handle retains the projection across calls:

```
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

An input can override the default with its own `projection`. The task caches the most recently used projection within its lifetime.

The handle's methods omit the task argument because it is already bound. All calls are serial and share state; the execution location stays fixed. An initialized handle occupies runner capacity even while idle. With capacity one, reuse or close that handle before awaiting another operation through the runner.

![Automatic calls initialize, process, and destroy state; explicit handles retain state across calls until close.](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDQwIDM1MCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsbGVkYnk9InRpdGxlIGRlc2MiPgogIDx0aXRsZSBpZD0idGl0bGUiPk9uZSB0YXNrIGRlZmluaXRpb24sIHR3byBzdGF0ZSBsaWZldGltZXM8L3RpdGxlPgogIDxkZXNjIGlkPSJkZXNjIj5BdXRvbWF0aWMgZXhlY3V0aW9uIGluaXRpYWxpemVzIHN0YXRlLCBwcm9jZXNzZXMgb25lIG9wZXJhdGlvbiwgYW5kIGRlc3Ryb3lzIHN0YXRlLiBBbiBleHBsaWNpdCBpbml0aWFsaXplZCBoYW5kbGUgcmV0YWlucyBzdGF0ZSBhY3Jvc3MgbXVsdGlwbGUgY2FsbHMgYW5kIGEgc3RyZWFtIHVudGlsIGNsb3NlIGludm9rZXMgZGVzdHJ1Y3Rpb24uPC9kZXNjPgogIDxkZWZzPgogICAgPG1hcmtlciBpZD0iYXJyb3ciIG1hcmtlcldpZHRoPSI4IiBtYXJrZXJIZWlnaHQ9IjgiIHJlZlg9IjYiIHJlZlk9IjQiIG9yaWVudD0iYXV0byI+PHBhdGggZD0iTTAgMEw4IDRMMCA4IiBmaWxsPSJub25lIiBzdHJva2U9IiM3MTg3OWQiIHN0cm9rZS13aWR0aD0iMS41Ii8+PC9tYXJrZXI+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDQwIiBoZWlnaHQ9IjM1MCIgcng9IjIwIiBmaWxsPSIjMGIxNzI2Ii8+CiAgPGcgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiI+CiAgICA8dGV4dCB4PSIzMCIgeT0iNDIiIGZpbGw9IiNmM2Y3ZmMiIGZvbnQtc2l6ZT0iMjMiIGZvbnQtd2VpZ2h0PSI3MDAiPk9uZSBkZWZpbml0aW9uLiBZb3UgY2hvb3NlIHRoZSBsaWZldGltZS48L3RleHQ+CiAgICA8dGV4dCB4PSIzMCIgeT0iNzAiIGZpbGw9IiNhOWJiY2UiIGZvbnQtc2l6ZT0iMTUiPldvcmtlciBsb2NhdGlvbiBhbmQgYXBwbGljYXRpb24gc3RhdGUgYXJlIHNlcGFyYXRlIGRlY2lzaW9ucy48L3RleHQ+CiAgICA8dGV4dCB4PSIzMCIgeT0iMTI5IiBmaWxsPSIjZjNmN2ZjIiBmb250LXNpemU9IjE3IiBmb250LXdlaWdodD0iNjUwIj5BdXRvbWF0aWM8L3RleHQ+CiAgICA8dGV4dCB4PSIzMCIgeT0iMTUzIiBmaWxsPSIjYTliYmNlIiBmb250LXNpemU9IjE0Ij5PbmUgcnVubmVyIG9wZXJhdGlvbjwvdGV4dD4KICAgIDx0ZXh0IHg9IjMwIiB5PSIyMzkiIGZpbGw9IiNmM2Y3ZmMiIGZvbnQtc2l6ZT0iMTciIGZvbnQtd2VpZ2h0PSI2NTAiPkV4cGxpY2l0PC90ZXh0PgogICAgPHRleHQgeD0iMzAiIHk9IjI2MyIgZmlsbD0iI2E5YmJjZSIgZm9udC1zaXplPSIxNCI+T25lIGluaXRpYWxpemVkIGhhbmRsZTwvdGV4dD4KICAgIDxnIHN0cm9rZT0iIzcxODc5ZCIgc3Ryb2tlLXdpZHRoPSIyIiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93KSI+CiAgICAgIDxwYXRoIGQ9Ik0zNjIgMTM1SDQzMCIvPjxwYXRoIGQ9Ik02MjAgMTM1SDg3MiIvPgogICAgICA8cGF0aCBkPSJNMzYyIDI0NUg0MDIiLz48cGF0aCBkPSJNNDk4IDI0NUg1MzgiLz48cGF0aCBkPSJNNjM0IDI0NUg2NzQiLz48cGF0aCBkPSJNNzg2IDI0NUg4NzIiLz4KICAgIDwvZz4KICAgIDxnIGZpbGw9IiMxMjJmNDAiIHN0cm9rZT0iIzQzY2NkZiIgc3Ryb2tlLXdpZHRoPSIxLjUiPgogICAgICA8cmVjdCB4PSIyMjAiIHk9IjEwOCIgd2lkdGg9IjE0MiIgaGVpZ2h0PSI1NCIgcng9IjEwIi8+CiAgICAgIDxyZWN0IHg9IjIyMCIgeT0iMjE4IiB3aWR0aD0iMTQyIiBoZWlnaHQ9IjU0IiByeD0iMTAiLz4KICAgIDwvZz4KICAgIDxnIGZpbGw9IiMxNzM4MmYiIHN0cm9rZT0iIzcxZDZhYyIgc3Ryb2tlLXdpZHRoPSIxLjUiPgogICAgICA8cmVjdCB4PSI0MzgiIHk9IjEwOCIgd2lkdGg9IjE4MiIgaGVpZ2h0PSI1NCIgcng9IjEwIi8+CiAgICAgIDxyZWN0IHg9IjQxMCIgeT0iMjE4IiB3aWR0aD0iODgiIGhlaWdodD0iNTQiIHJ4PSIxMCIvPgogICAgICA8cmVjdCB4PSI1NDYiIHk9IjIxOCIgd2lkdGg9Ijg4IiBoZWlnaHQ9IjU0IiByeD0iMTAiLz4KICAgICAgPHJlY3QgeD0iNjgyIiB5PSIyMTgiIHdpZHRoPSIxMDQiIGhlaWdodD0iNTQiIHJ4PSIxMCIvPgogICAgPC9nPgogICAgPGcgZmlsbD0iIzNjMjkzMSIgc3Ryb2tlPSIjZThhM2IxIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgICAgIDxyZWN0IHg9Ijg4MCIgeT0iMTA4IiB3aWR0aD0iMTMwIiBoZWlnaHQ9IjU0IiByeD0iMTAiLz4KICAgICAgPHJlY3QgeD0iODgwIiB5PSIyMTgiIHdpZHRoPSIxMzAiIGhlaWdodD0iNTQiIHJ4PSIxMCIvPgogICAgPC9nPgogICAgPGcgZmlsbD0iI2YzZjdmYyIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+CiAgICAgIDx0ZXh0IHg9IjI5MSIgeT0iMTM2Ij5pbml0aWFsaXplPC90ZXh0Pjx0ZXh0IHg9IjUyOSIgeT0iMTM2Ij5wcm9jZXNzIC8gc3RyZWFtPC90ZXh0Pjx0ZXh0IHg9Ijk0NSIgeT0iMTM2Ij5kZXN0cm95PC90ZXh0PgogICAgICA8dGV4dCB4PSIyOTEiIHk9IjI0NiI+aW5pdGlhbGl6ZTwvdGV4dD48dGV4dCB4PSI0NTQiIHk9IjI0NiI+Y2FsbDwvdGV4dD48dGV4dCB4PSI1OTAiIHk9IjI0NiI+Y2FsbDwvdGV4dD48dGV4dCB4PSI3MzQiIHk9IjI0NiI+c3RyZWFtPC90ZXh0Pjx0ZXh0IHg9Ijk0NSIgeT0iMjQ2Ij5kZXN0cm95PC90ZXh0PgogICAgPC9nPgogICAgPHRleHQgeD0iODI4IiB5PSIyMDciIGZpbGw9IiNlOGEzYjEiIGZvbnQtc2l6ZT0iMTMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPmNsb3NlKCk8L3RleHQ+CiAgICA8cGF0aCBkPSJNMjIwIDI5MVYzMDFINzg2VjI5MSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDRiNTc2IiBzdHJva2Utd2lkdGg9IjEuNSIvPgogICAgPHRleHQgeD0iNTAzIiB5PSIzMjYiIGZpbGw9IiNkNGI1NzYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRoZSBzYW1lIHByaXZhdGUgc3RhdGUgc3RheXMgYXZhaWxhYmxlIGFjcm9zcyBvcGVyYXRpb25zPC90ZXh0PgogIDwvZz4KPC9zdmc+Cg==)

Automatic initialization belongs to the top-level runner operation. Explicit initialization lasts until `close()`. A task that does not need persistent state, such as `PrepareMapTask`, simply supplies a processor.

## Controlling Task Execution[​](#controlling-task-execution "Direct link to Controlling Task Execution")

You control concurrency, cancellation, and whether buffers are copied, transferred, or shared. These controls belong to the runner or request, separate from the task's application parameters.

### Choose an execution location[​](#choose-an-execution-location "Direct link to Choose an execution location")

```
await runner.runTask(ProjectCoordinatesTask, {coordinates, projection}, {

  execution: 'worker'

});
```

`auto`, the default, uses a declared worker target when present and local execution otherwise. Choose `main-thread` to run locally or `worker` to require a worker. Worker load errors are reported; there is no hidden local retry. Synchronous main-thread computation does not become CPU-parallel by raising concurrency.

### Set concurrency[​](#set-concurrency "Direct link to Set concurrency")

`new TaskRunner({maxConcurrency: 4})` gives the runner four execution slots. `runTasks(..., {concurrency: 2})` uses at most two of those slots. Explicitly initialized handles each retain one slot. A stream occupies its slot until it ends.

### Choose buffer ownership[​](#choose-buffer-ownership "Direct link to Choose buffer ownership")

| Control                                 | Meaning                                                          |
| --------------------------------------- | ---------------------------------------------------------------- |
| `inputOwnership: 'copy'` (default)      | Preserve the caller's buffers                                    |
| `inputOwnership: 'transfer'`            | Move buffers; all caller views of those buffers detach           |
| `inputOwnership: 'share'`               | Require shared storage rather than ordinary transferable buffers |
| `outputOwnership: 'transfer'` (default) | Move returned buffers to the caller                              |
| `outputOwnership: 'copy'`               | Keep returned buffers usable inside task state                   |

These boundaries also apply locally. `SharedArrayBuffer` stays shared under every policy; copy does not isolate shared memory. Individual tasks may impose tighter input requirements: `ProjectCoordinatesTask` currently accepts ordinary `Float32Array` or `Float64Array` storage, not shared buffers.

Application options are copied separately. Transfer rejects input that aliases reusable option buffers; use copy mode for those inputs. Automatic calls copy initialization data for each slot. Explicit initialization can transfer ownership once. If a task returns cached storage, choose output copying to avoid detaching that storage inside its state.

### Cancel work and observe progress[​](#cancel-work-and-observe-progress "Direct link to Cancel work and observe progress")

```
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

Worker cancellation terminates the worker and invalidates any retained state. There is no automatic retry. Main-thread work must observe its signal and yield during long computation so abort events can run; it cannot be forcibly stopped. The supplied projection task checks cancellation between chunks.

### Close the runner[​](#close-the-runner "Direct link to Close the runner")

`close()` drains accepted work and destroys task state. Finish or close output iterators before awaiting graceful shutdown. `terminate(reason)` cancels work, stops workers, and unwinds paused output iterators. Forced termination cannot guarantee task cleanup. Local execution must settle before state is destroyed.

## Create your own task[​](#create-your-own-task "Direct link to Create your own task")

Once the provided tasks are familiar, use the same API for your own computation. A `Task` is a plain object checked with `satisfies`; no factory or registry is needed:

```
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

`process` may return an object or a Promise. Input and output fields remain typed at the call site. Required application options remain required; they live under `options`, separate from runtime controls. Omit the `options` type for a task without application parameters.

### Add streaming and lifecycle hooks[​](#add-streaming-and-lifecycle-hooks "Direct link to Add streaming and lifecycle hooks")

One task can implement atomic and streaming processors. Add `initialize` when it needs private state and `destroy` when that state needs explicit cleanup:

```
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

State stays private to its execution location. The runner supplies it as `context.state` to both processors. Use `batchInput` and `batchOutput` type fields if streaming representations differ from atomic payloads; otherwise they default to `input` and `output`. A streaming processor can keep generator-local variables without defining an initializer.

### Install your task in a worker[​](#install-your-task-in-a-worker "Direct link to Install your task in a worker")

Export the definition from `lookup-task.ts` and add a worker target to it:

```
worker: {

  url: new URL('./lookup-worker.js', import.meta.url),

  capabilities: {atomic: true, streaming: true}

}
```

Then create the worker entry point:

```
// lookup-worker.ts — compiled to lookup-worker.js

import {initializeTaskWorker} from '@math.gl/core/tasks';

import {lookupTask} from './lookup-task.js';



await initializeTaskWorker(lookupTask);
```

`initializeTaskWorker` installs the protocol inside an existing worker. The runner creates the worker; task initialization happens later. Functions load from the worker module and are never serialized from the caller.

For a browser bundler, use a fresh worker factory instead of a URL:

```
worker: {

  create: () => new Worker(new URL('./lookup-worker.ts', import.meta.url), {

    type: 'module'

  }),

  capabilities: {atomic: true, streaming: true}

}
```

Use exactly one target form. Node needs a compiled module URL. Capabilities must match the worker's implemented processors. An explicitly annotated worker-only `Task<Types>` retains its input, output, option, and initialization types; `satisfies` alone cannot infer absent processor types from a URL.

## Further reading[​](#further-reading "Direct link to Further reading")

* [TaskRunner API reference](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/api-reference/task-runner.md): implemented options, errors, ownership, and current prototype boundaries.
* [Runnable examples](https://github.com/visgl/math.gl/tree/master/examples/core/task-runner): provided geospatial tasks and a custom transform task, with asserted results.
* [Design RFC](https://github.com/visgl/math.gl/blob/master/dev-docs/RFCs/task-runner-rfc.md): full proposal, migration, library comparisons, and deferred features.

The old top-level task functions and worker APIs have been removed. See the [migration guide](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/migration.md) for replacements, including the difference between independent atomic calls and streaming.
