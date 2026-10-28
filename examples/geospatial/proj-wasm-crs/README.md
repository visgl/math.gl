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

See the [external projection engines guide](../../../docs/modules/geospatial/projection/developer-guide/external-projection-engines.md).

## Packed-buffer preprocessing

The example also runs `batch-example.mjs` in Node and Chromium. `batch.mjs` is a reusable
**application recipe**, not a registered projection backend or a synchronous CRS converter:

```js
const processor = await createProjWasmBatchProcessor(proj, {
  sourceCRS: 'EPSG:4326', targetCRS: 'EPSG:8857', chunkSize: 1024
});
const latest = createLatestBatchRunner(processor);
try {
  const result = await latest.run({
    positions: new Float64Array([12, 55, 123, 170, -20, 0]),
    sourceRowIndices: new Uint32Array([7, 11])
  });
  if (result) {
    // Use the result immediately, or transfer its buffers to a downstream task.
    // A newer view request causes the older runner promise to resolve to null.
  }
} finally {
  latest.cancel();
  await processor.dispose();
}
```

The application initializes/shuts down proj-wasm's pool once. Each processor prepares one
network-disabled context and one visualization-normalized operation and reuses them across
serialized requests. Recreate the processor for changed source/target CRS, grids or operation
policy. Source coordinates are packed **XYZ**, with longitude/latitude in degrees for EPSG:4326;
height is ellipsoidal metres in this fixture. Source row IDs are uint32, one per coordinate.
There is no fourth-component/coordinate-epoch contract in this recipe; PROJ's time input is zero.
Use a separate explicit design for time-dependent transformations rather than interpreting M as time.

Input is copied before queueing and is not mutated. The default maximum is one million points
per request, with native calls split into chunks of 1024 (configurable up to 65536). Applications
must also bound queued requests and debounce view updates. Upstream proj-wasm marshals/copies
coordinates internally; this example does not claim a zero-copy WASM path. Nonzero PROJ status,
nonfinite results or cancellation reject the entire batch; partial buffers are never returned.
Empty input returns empty output. Inverse mode uses the same normalized operation.

The latest-view runner cancels superseded requests cooperatively and discards both stale results
and stale errors. Current errors still propagate. A caller `options.signal` is combined with supersession cancellation; its abort reason propagates for the current request and listeners are removed when the request settles. Cancellation is checked around async native calls;
it cannot interrupt an already-running native operation. Disposal rejects new work immediately,
waits for accepted work to settle, then destroys normalized/original operations and the context.
It is idempotent and does not shut down an application-owned PROJ pool.

The completed buffers are transferred with math.gl `runTask(..., {execution: 'worker',
inputOwnership: 'transfer'})` to `consume-worker.mjs`, which computes bounds and returns the same
packed geometry. Tests assert sender detachment, source-row preservation, exact downstream parity
and forward/inverse accuracy. This separates async projection preprocessing from rendering; the
consumer can replace bounds computation with triangulation or other geometry work. The demo owns
and destroys its math.gl worker farm; an embedding application should manage its shared farm itself.

CI runs lifecycle/failure mocks plus the **real** pinned proj-wasm batch pipeline in Node and Chromium.
Browser checks also ensure all worker, WASM and database assets load locally.
