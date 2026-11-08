# WebAssembly in tasks

Compile or instantiate a WebAssembly module in a task's `initialize` hook, retain
it as `context.state`, and release application-owned allocations in `destroy`.
Use an explicit handle when several calls should reuse the instance.

```ts
import {type Task} from '@math.gl/tasks';
const kernelTask = {
  id: 'kernel',
  async initialize({module}) {
    return WebAssembly.instantiate(module, {});
  },
  destroy(instance) {
    // Release application-owned allocations if the kernel exposes a cleanup API.
  },
  process({value}, _options, {state}) {
    return {value: (state.exports.process as (value: number) => number)(value)};
  }
} satisfies Task<{
  initialization: {module: WebAssembly.Module};
  state: WebAssembly.Instance;
  input: {value: number};
  output: {value: number};
}>;
```

Install the task with `initializeTaskWorker` in a worker module and attach the
worker target to the application task, as in the [worker guide](./custom-workers.md).
A compiled module can be cloned to the worker; an instance remains worker-local.
Alternatively load the WASM bytes inside initialization with `fetch` in browsers
or `node:fs/promises` for a Node file URL. Serve streaming WASM with
`application/wasm` and configure bundler asset handling.

Worker cancellation forcibly terminates the worker and cannot guarantee
`destroy` runs. Reinitialize before retrying. Synchronous local WASM cannot be
interrupted; use bounded calls and check cancellation between them.
