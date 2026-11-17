# resource-tracker

This is a [squint](https://github.com/squint-cljs/squint) port of
[tech.resource](https://github.com/techascent/tech.resource), to
provide parallel functionality in an ES module.

Cross-platform RAII (stack-scoped) and GC-based cleanup for opaque
JavaScript resources. Distributed as a single squint-compiled ES
module for managing resources that have no implicit JS
garbage-collection story of their own (native pointers held by WASM
modules, worker-scoped handles, etc.).

## Installation

```sh
npm install resource-tracker
```

Requires Node 18.18+, the floor for `Symbol.dispose` /
`Symbol.asyncDispose`.

## Usage from JavaScript

Deterministic cleanup at scope exit:

```js
import * as resource from 'resource-tracker';

resource.releasing_fn(() => {
  const ptr = allocateNativePointer();
  resource.track(ptr, { tracktype: 'stack', disposefn: () => freePointer(ptr) });
  // ...use ptr...
});  // dispose fires LIFO here
```

GC-backed cleanup for resources that escape their creating scope:

```js
resource.track(ptr, { tracktype: 'gc', disposefn: () => freePointer(ptr) });
// dispose fires after the runtime collects ptr
```

Combined first-wins (release no later than scope exit, GC-cleanup as a
safety net):

```js
resource.track(ptr, {
  tracktype: ['gc', 'stack'],
  disposefn: () => freePointer(ptr),
});
```

`auto` (the default) picks stack if a context is bound and gc
otherwise.

ES2023 Explicit Resource Management integration. The native `using`
keyword needs Node 24+ or a transpiler; the `make_closeable_context`,
`.close()`, and `[Symbol.dispose]` APIs it builds on work on any
supported Node:

```js
using ctx = resource.make_closeable_context(() => {
  resource.stack_track(someFileHandle);  // anything with .close() works
  return computeValue();
});
console.log(ctx.value);
// ctx[Symbol.dispose]() fires at scope exit; releases entries LIFO
```

```js
using ctx = resource.make_closeable_context(() => {
  resource.stack_track({ [Symbol.dispose]() { shutdownNetworkSync(); } });
});
// closes synchronously; async-dispose flushing is a consumer concern
// (see clj-native's pool/flush-pending-disposes! for that path).
```

## Usage from Squint or ClojureScript

Require it by package name. Squint and ClojureScript both munge
hyphenated names to the compiled exports, so you write idiomatic
Clojure (`releasing-fn`, `in-stack-resource-context?`) rather than the
`releasing_fn` / `in_stack_resource_context_QMARK_` JS spellings:

```clojure
(ns my.app
  (:require ["resource-tracker" :as resource]))

(resource/releasing-fn
  (fn []
    (resource/track ptr #js {:tracktype "stack"
                             :disposefn #(free-pointer! ptr)})))
;; dispose fires LIFO when releasing-fn returns
```

Options are JS objects with string values, the same shape as the
JavaScript API above, not tech.resource's `{:track-type :stack}`
keyword maps:

```clojure
(resource/track ptr #js {:tracktype "gc" :disposefn f})
(resource/track ptr #js {:tracktype #js ["gc" "stack"] :disposefn f})
```

The interop form with the literal export name,
`(.releasing_fn resource (fn [] ...))`, works identically and is what
the test suite uses.

## License

Distributed under the Eclipse Public License 1.0 (`EPL-1.0`), the same
license as [tech.resource](https://github.com/techascent/tech.resource).
See [LICENSE](LICENSE).
