# Creating tasks

A task is an ordinary object describing a calculation. Start with its input, result, and `process` function. The runner can execute that function locally; adding a worker target lets it run off the main thread.

This example scales a set of values. TypeScript's `satisfies` checks the definition while preserving the input and result types:

```
import {TaskRunner, type Task} from '@math.gl/tasks';



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

  const {values} = await runner.runTask(

    scaleTask,

    {values: new Float64Array([1, 2, 3])},

    {options: {factor: 10}}

  );

  console.log(values); // Float64Array [10, 20, 30]

} finally {

  await runner.close();

}
```

This first version runs locally: it has no worker target yet. Making `process` async would let it await other work, but would not move its calculations to a worker.

`process` may return an object or a Promise. Input and output fields remain typed at the call site. Required application options remain required; they live under `options`, separate from runtime controls. Omit the `options` type for a task without application parameters.

## Run it in a worker[​](#run-it-in-a-worker "Direct link to Run it in a worker")

Move the `scaleTask` definition into `scale-task.ts` and export it. For a Node application, add this property to the task object (compile the worker to JavaScript before running it):

```
worker: {

  url: new URL('./scale-worker.js', import.meta.url),

  capabilities: {atomic: true, streaming: false}

}
```

Then create the worker entry point:

```
// scale-worker.ts — compiled to scale-worker.js

import {initializeTaskWorker} from '@math.gl/tasks';

import {scaleTask} from './scale-task.js';



await initializeTaskWorker(scaleTask);
```

`initializeTaskWorker` installs the protocol inside an existing worker. The runner creates the worker; task initialization happens later. Functions load from the worker module and are never serialized from the caller.

For a browser bundler, use this worker factory **instead of** the `url` property:

```
worker: {

  create: () => new Worker(new URL('./scale-worker.ts', import.meta.url), {

    type: 'module'

  }),

  capabilities: {atomic: true, streaming: false}

}
```

Import `scaleTask` into your application and call `runner.runTask` as before. The default execution mode now uses its worker. You can also pass `execution: 'worker'` to require worker execution.

Use exactly one target form. Node needs a compiled module URL. Capabilities must match the worker's implemented processors. An explicitly annotated worker-only `Task<Types>` retains its input, output, option, and initialization types; `satisfies` alone cannot infer absent processor types from a URL.

## Load code before it is needed[​](#load-code-before-it-is-needed "Direct link to Load code before it is needed")

A task can move dynamic imports ahead of processing with an optional hook:

```
const task = {

  id: 'transform',

  async preload() {

    const module = await import('./transform-implementation.js');

    await module.preloadDependencies?.();

  },

  async process({values}) {

    const {transform} = await import('./transform-implementation.js');

    return {values: transform(values)};

  }

};
```

`preload` loads code only; it takes no input and returns no task state. The runtime waits for it before initializing a task, and deduplicates concurrent/repeated loads for the same definition in that environment. A failed load can be retried. Include imports that would otherwise wait until processing. Keep per-instance allocation in `initialize` and its cleanup in `destroy`.

## Return a small result synchronously[​](#return-a-small-result-synchronously "Direct link to Return a small result synchronously")

The `scaleTask` above has a synchronous processor, so it can also return directly:

```
const runner = new TaskRunner();

try {

  const {values} = runner.runTaskSync(

    scaleTask,

    {values: new Float64Array([1, 2, 3])},

    {options: {factor: 10}}

  );

  console.log(values);

} finally {

  await runner.close();

}
```

`runTaskSync` always runs on the calling thread, with the same named payload and ownership rules. Initialization and destruction must also be synchronous. If your task has a `preload` hook, await `preloadTasks([task], {execution: 'main-thread'})` first. It throws when the runner has no free execution slot and blocks the UI until completion. Use it for small computations; use `runTask` with a worker for expensive work. The provided geospatial tasks load code asynchronously and therefore use `runTask` even when executing on the main thread.

## Add streaming and lifecycle hooks[​](#add-streaming-and-lifecycle-hooks "Direct link to Add streaming and lifecycle hooks")

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

## CommonJS Node workers[​](#commonjs-node-workers "Direct link to CommonJS Node workers")

A Node worker may use `require('@math.gl/tasks')` and install its task with `initializeTaskWorker`. Both ESM and CommonJS callers can execute this worker through `TaskRunner`; use a `.cjs` worker entry point when the containing package uses ESM. The CommonJS bundle resolves the native Node parent port at runtime, while browser bundles keep Node built-ins optional. This requires Node's `process.getBuiltinModule` (Node 22.3 or newer).

## Cross-origin module workers[​](#cross-origin-module-workers "Direct link to Cross-origin module workers")

`worker.url` may reference an HTTP(S) module on another origin. The runtime creates a same-origin blob entrypoint that statically imports that URL; relative imports inside the remote module continue to resolve against its original URL. The remote server must allow CORS, and your CSP must permit `blob:` worker entrypoints and the remote module import. Same-origin, relative, data, and caller-owned blob URLs keep their original entrypoint. Runtime-created shims are revoked when their worker is terminated or its constructor fails; caller-owned blob URLs remain yours to revoke. A `worker.create` factory still controls its own worker construction and cleanup.
