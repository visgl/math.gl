# Projection domains and external engines

A math.gl adaptation of the MIT-licensed [deck.gl #10966](https://github.com/visgl/deck.gl/pull/10966)
example, preserving its three projections and three inverse-mapped synthetic raster fixtures.
Original and adapted code copyright vis.gl contributors. The deck.gl renderer remains a private
example dependency; no external engine is added to published math.gl packages.

Run from the repository root:

```sh
yarn && yarn build
yarn workspace math.gl-projection-domains start
yarn workspace math.gl-projection-domains test
yarn workspace math.gl-projection-domains build
yarn workspace math.gl-projection-domains test:browser
```

The website has a separate **Projection domains and external engines** example page.

## math.gl owns preparation

- `GeoArrowBuilder` constructs native XY physical buffers. Fixtures already use D3 spherical winding;
  the stream API does not silently rewind arbitrary input or infer CRS/edge semantics.
- `runTask` transfers a fresh column into an example-owned `WorkerPool`. Changing controls aborts the
  previous request, and a generation guard prevents stale results from updating the renderer.
- `tessellateGeoArrowStream` traverses those buffers through D3's clipping/resampling stream and
  triangulates the planar output with preserved source row IDs, holes and disconnected pieces.
- D3's sphere stream supplies the explicit target-domain outline. Only this small outline is
  materialized into rings for tessellation; feature data streams directly from physical buffers.
- `d3-geo-polygon` provides interrupted Mollweide stream clipping. A point projection alone cannot
  provide the interrupted polygon topology.
- deck.gl renders binary polygon geometry, domain paths and the textured raster. Unmounting destroys
  only this example's worker pool, finalizes the renderer, and removes listeners. Other website
  examples' workers are unaffected. Standalone Back/Forward-cache restoration retains live resources.

## Bounded raster recipe

The raster starts from triangulated target-domain geometry. Target triangles are refined by edge
length, inverse-projected into a synthetic source grid, and clipped in UV space with interpolated
positions. Full-world UVs are locally unwrapped and clipped into periodic copies. Rotated and
south-polar fixtures have explicit source-footprint rules. This is the target-grid counterpart to
[the source-grid recipe](../raster-mesh-preparation/README.md).

This is not a generic adaptive warp mesher. Target-edge length does not certify texture-space error;
curved domains are sampled, inverse branch choice is heuristic near boundaries, and unresolved
inverse/singularity triangles are omitted and counted in the UI. Work/output budgets throw instead
of allowing unbounded refinement. The rotated fixture's far-side cut is explicitly excluded because
it lies outside its small source footprint. Raster generation currently runs on the main thread after
vector preprocessing, so it is suitable for these bounded fixtures rather than large production rasters.

Tests retain the original geometry regressions, add native buffer-transfer checks, and exercise all
nine projection/raster combinations in Chromium against the production bundle. The renderer is not
a new deck.gl projection engine integration or a replacement for generic layer clipping.

## Antarctica and Fiji lab

The standalone `lab.html` and website **Antarctica and Fiji projection lab** page use the qualified
`warp/` preparation recipe. Build with `yarn workspace math.gl-projection-domains build`, then serve
`dist/` over HTTP (the website build does this automatically). The production build copies pinned
proj-wasm assets locally and injects their import map; the original Vite development entry remains
the smaller streaming demo. No CDN or access token is needed.

The lab compares inverse meshes (source-texel error) and continuous source-grid meshes (declared
display-space error), with explicit unsupported cases. Native/proj4js/D3 work runs in an owned task
pool. proj-wasm owns separate WASM workers; its main-document orchestration uses bounded async
frontiers. Parameter changes abort previous jobs and reject stale results. The website uses the same mount function and shared infobox as other examples. Optional WASM
assets are local; mounted labs reference-count their shared WASM pool, while every lab owns its
task pool and operation contexts. Unmount waits for accepted work before releasing resources.

Run `yarn workspace math.gl-projection-domains benchmark` for reproducible sequential CPU rebuild
measurements. The browser's moving-center button additionally includes worker transport and exports
its measurements. Neither is a throughput or frame-rate promise. Changing projection parameters
rebuilds domains and meshes; camera zoom only inspects existing geometry and does not requalify the
forward display-space error bound.
