# Resolve CRS definitions with proj-wasm

This example pins `proj-wasm` **0.1.0** and uses its bundled authority database as
an opt-in `@math.gl/geospatial/crs` provider. The runnable workflow:

1. Disables PROJ network access and resolves `EPSG:8857` to PROJJSON.
2. Prepares a native math.gl Equal Earth transform asynchronously, then executes it synchronously.
3. Independently transforms the same longitude/latitude/ellipsoidal-height point
   through the asynchronous proj-wasm API, with visualization axis normalization.
4. Resolves compound `EPSG:7405` successfully and verifies native strict execution rejects it.
5. Destroys owned PROJ objects/contexts and shuts down the example's worker pool.

From the repository root, after installing dependencies:

```sh
yarn build
yarn workspace math.gl-proj-wasm-crs test
yarn workspace math.gl-proj-wasm-crs example
yarn workspace math.gl-proj-wasm-crs build
yarn workspace math.gl-proj-wasm-crs start
# Open http://127.0.0.1:8080
```

The browser build copies installed packages and their adjacent worker, WASM,
database and notice files into `dist/vendor`. It uses an import map and requires
no CDN or runtime network service. Serve it over HTTP; opening a file URL does not
provide the worker/module environment. Keep these asset paths together when deploying.

Run the real browser smoke test after building:

```sh
yarn playwright install chromium
yarn workspace math.gl-proj-wasm-crs test:browser
```

Both Node and Chromium compare native math.gl results with real proj-wasm results,
check the inverse and unsupported compound case. Provider unit tests cover resource
cleanup, pending requests and error propagation. The browser test rejects external requests.

`provider.mjs` is application example code, not an automatically registered math.gl
backend. An embedding application owns `proj.init`/`proj.shutdown`; the provider
owns a context and waits for pending lookups on disposal. Use a fresh resolver for
a changed database/configuration. Provenance records the pinned package and EPSG
database revision. Database failures propagate; unsupported identifier syntax returns null.

Definition lookup does not perform datum transformations or load grids. Native
math.gl still decides whether the definition and operation are supported. A
resolved CRS with vertical, dynamic or otherwise unsupported semantics must not
be treated as an accurate executable operation automatically. This example makes
no claims about grid or epoch transformations. The fourth PROJ ordinate is fixed
to zero for this static comparison; it is not a convention for mapping XYZM to XYZT.

The public proj-wasm API remains asynchronous after initialization. Direct PROJ
execution in `example.mjs` is therefore a separate asynchronous workflow, not an
implementation of math.gl's synchronous `PreparedProjection` interface. Use it
to preprocess buffers before passing them to a synchronous rendering consumer.

See the [external projection engines guide](../../docs/modules/geospatial/projection/developer-guide/external-projection-engines.md).
