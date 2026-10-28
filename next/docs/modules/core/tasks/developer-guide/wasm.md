# WebAssembly in workers

Use a persistent worker resource when compiling or initializing a WebAssembly module is expensive. Its `initialize` function runs in the worker; the instance and its imports stay in that worker and can be reused by `run` calls. Dispose of application-owned allocations in `dispose`. Hard cancellation or a crash destroys the worker and invalidates the resource; create a new resource before retrying.

For a browser module worker, resolve the asset relative to the worker module:

```
import {createResourceWorker} from '@math.gl/core/tasks';



const wasmURL = new URL('./kernel.wasm', import.meta.url);

await createResourceWorker({

  async initialize() {

    const response = await fetch(wasmURL);

    if (!response.ok) throw new Error(`WASM download failed: ${response.status}`);

    // Streaming requires an application/wasm response. Otherwise use bytes.

    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();

    const result = contentType === 'application/wasm'

      ? await WebAssembly.instantiateStreaming(response, {})

      : await WebAssembly.instantiate(await response.arrayBuffer(), {});

    return result.instance;

  },

  run(instance, input: number) {

    return (instance.exports.process as (value: number) => number)(input);

  },

  dispose(instance) {

    // Release any allocations or handles owned by the application here.

  }

});
```

Replace `kernel.wasm`, its imports and `process` export with your own. Configure the bundler to emit the WASM asset and serve it with `application/wasm` for streaming. Worker and WASM execution are also subject to the site's CSP, origin and CORS rules. For Node, read a file URL with `node:fs/promises` and instantiate the resulting bytes; do not assume browser `fetch` supports `file:` URLs.

A compiled `WebAssembly.Module` can be structured-cloned as resource initialization input and instantiated once per worker. An instance and its mutable state are worker-local. Alternatively send bytes with `inputOwnership: 'copy'` when the caller must retain them; transfer detaches ordinary input buffers. Shared memory requires platform support and browser cross-origin isolation.

Cooperative cancellation requires the operation to check the worker context and, without shared control state, yield to the event loop. A synchronous WASM export cannot process a cancellation message until it returns. Split work into bounded calls or poll shared state when your WASM integration supports it; otherwise use hard termination and recreate the resource. See [persistent resources](https://visgl.github.io/math.gl/next/docs/modules/core/tasks/developer-guide/persistent-resources.md).
