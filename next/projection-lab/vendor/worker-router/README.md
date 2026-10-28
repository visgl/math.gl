# worker-router

worker-router gets you throughput from single-threaded JavaScript, in the
spirit of parallel, multithreaded use of a thread-safe native library: load
N instances of a module (say a WASM build) across N workers, then route each
request to whichever worker is least busy at the moment of the call.

worker-router keeps a pool of background workers that each load the same
handler modules, so you can move work off the main thread and call into it
as if it were a local async function. The same code runs in the browser
(Web Workers) and in Node (`worker_threads`) with no build-time branching.

[Comlink](https://github.com/GoogleChromeLabs/comlink) carries the calls
and hides the difference between Web Workers and Node's `worker_threads`,
so `pool.any().math.add(1, 2)` reads like a normal function call but runs
in a worker and returns a promise.

## Why

JavaScript runs on one thread. A long computation on that thread freezes
everything else (the UI in a browser, the event loop in Node). Moving the
work to a worker frees the main thread, and a pool of workers runs several
jobs at once.

Talking to a raw worker means posting messages and matching up replies by
hand. worker-router removes that bookkeeping and adds three things:

- Each worker can host more than one handler module, addressed by a key.
- You can send a call to a specific worker, or let the pool pick the
  least-busy one.
- The browser and Node paths share one API.

## Install

```sh
npm install @wcohen/worker-router
```

## Usage

A handler is an ES module. Its exported methods become callable through
the pool:

```js
// my-math.mjs
export const handler = {
  add(a, b) { return a + b; },
};
```

```js
// app.mjs
import { WorkerPool } from '@wcohen/worker-router';

const pool = await WorkerPool.create({
  size: 4,
  bootstrap: import.meta.resolve('@wcohen/worker-router/worker-bootstrap'),
  handlers: { math: { module: import.meta.resolve('./my-math.mjs') } },
});

const sum = await pool.any().math.add(1, 2);  // → 3
await pool.terminate();
```

`size` is the number of workers to spawn. Use `size: 'auto'` to match
`navigator.hardwareConcurrency` (falling back to 4 when it isn't
available).

If a handler module fails to load in a worker, `WorkerPool.create`
rejects with the underlying error and tears down any workers it had
already spawned.

Two optional timeouts: `bootstrapTimeoutMs` (default 300000) bounds the
wait for each worker's ready handshake, for the case where a worker
hangs without erroring; `shutdownTimeoutMs` (default 5000) bounds how
long `terminate()` waits on each worker's `destroy` before proceeding.

### In the browser

`dist/index.mjs` keeps its two runtime imports external: `comlink` and
`squint-cljs/core.js` (the small runtime for the squint-compiled pool;
kept external rather than bundled so this package ships no code from
either dependency). A bundler resolves both automatically. Without a
bundler, map them in an import map:

```html
<script type="importmap">
{
  "imports": {
    "comlink": "/node_modules/comlink/dist/esm/comlink.mjs",
    "squint-cljs/core.js": "/node_modules/squint-cljs/src/squint/core.js"
  }
}
</script>
```

The bootstrap and handler modules load inside workers by URL, so they
need no mapping; serve them same-origin or CORS-readable and pass
absolute URLs. A cross-origin bootstrap (for example, a CDN copy)
works: the pool wraps it in a same-origin blob module before it
reaches the Worker constructor.

Workers import Comlink from a URL the pool resolves page-side via
`import.meta.resolve("comlink")`. If your bundler mangles or drops
`import.meta.resolve`, pass `comlinkUrl` in the pool options with
Comlink's absolute URL and the pool sends it to workers verbatim.

### From Squint (ClojureScript)

```clojure
(ns app
  (:require ["@wcohen/worker-router" :as wr]))

(defn ^:async main []
  (let [opts #js {:size 4
                  :bootstrap (.resolve js/import.meta "@wcohen/worker-router/worker-bootstrap")
                  :handlers  #js {:math #js {:module (.resolve js/import.meta "./my-math.mjs")}}}
        pool (await (.create wr/WorkerPool opts))
        sum  (await (.. pool (any) -math (add 1 2)))]
    (js/console.log sum)
    (await (.terminate pool))))
```

## Multiple handlers per worker

Every worker loads every registered handler. Give a handler an `init`
payload when it needs setup arguments:

```js
handlers: {
  math:  { module: mathHandlerUrl },
  image: { module: imageHandlerUrl, init: { maxSize: 4096 } },
}
```

If a handler has async setup to do before its methods are ready (say, a
dynamic `import` of a WASM module), export a `create` function instead of a
`handler` object. Whatever it returns becomes the handler:

```js
export async function create(init) {
  const mod = await import(init.wasmUrl);
  await mod.ready;              // finish the module's own async init
  return mod.api;              // this object is exposed under the key
}
```

## Picking a worker

There are three ways to address a worker:

- `pool.worker(i).handler.method(…)` sends the call to worker `i`. Use
  this when a series of calls has to hit the same worker, for example a
  native handle created on worker 2 that stays valid only on worker 2.
- `pool.any().handler.method(…)` sends the call to the worker with the
  fewest calls in flight. It never blocks; ties go to the lowest index.
  Use this for calls that any worker can serve.
- `pool.claim()` reserves the least-busy worker for a run of `worker(i)`
  calls and counts it as loaded until you let it go:

  ```js
  const claim = pool.claim();
  // ... make calls with pool.worker(claim.index) ...
  claim.release();   // idempotent: calling it twice is a no-op
  ```

Pinned calls, in-flight `any()` calls, and open claims all count toward one
per-worker load number, so `pool.any()` steers away from workers that are
already busy with claims or pinned work.

## Shutting down

`pool.terminate()` runs each handler module's optional top-level `destroy`
export (over the still-open Comlink channel, so a handler can release its
resources) and then tears the workers down. It's safe to call more than
once; later calls return the same in-flight promise.

The destroy phase is bounded by `shutdownTimeoutMs` per worker and skips
workers that have already died, so one wedged or crashed worker can't
stall the teardown. It's safe to call `terminate()` more than once.

Calls never hang on a dead or torn-down worker. Whether a call is started
after `terminate()`, still in flight when it lands, or aimed at a worker
that crashed, the pool rejects it instead of leaving it wedged, and
`any()` routes around dead workers. A worker that dies on its own (an
uncaught throw or an unexpected non-zero exit) is logged with
`console.error`, so you see it went away rather than only meeting a later
rejection.

## License

Apache-2.0 WITH LLVM-exception. See [`LICENSE`](./LICENSE).
