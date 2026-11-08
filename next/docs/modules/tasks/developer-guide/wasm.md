# WebAssembly in tasks

A worker task can run a WebAssembly calculation while the application stays responsive. Create the WASM instance in `initialize`, use it through `context.state` in the processor, and release any application-owned allocations in `destroy`. An [initialized handle](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/persistent-resources.md) lets several calls reuse it.

The following task assumes a compiled module with an exported `process` function:

```
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

Install the task with `initializeTaskWorker` in a worker module and attach the worker target to the application task, as in the [worker guide](https://visgl.github.io/math.gl/next/docs/modules/tasks/developer-guide/custom-workers.md). A compiled module can be cloned to the worker; an instance remains worker-local. Alternatively load the WASM bytes inside initialization with `fetch` in browsers or `node:fs/promises` for a Node file URL. Serve streaming WASM with `application/wasm` and configure bundler asset handling.

Worker cancellation forcibly terminates the worker and cannot guarantee `destroy` runs. Reinitialize before retrying. Synchronous local WASM cannot be interrupted; use bounded calls and check cancellation between them.
