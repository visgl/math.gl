# Examples

Sources live in `examples/<module>/<example-name>`, grouped by the published math.gl package. Projects declare their dependencies and keep application code local. Reusable UI components and helpers may be imported from [`examples/common`](common/); this is the exception to the example-local source rule.

- **@math.gl/core**: [core-transforms](core/core-transforms), [expressions](core/expressions), [task-runner](core/task-runner)
- **@math.gl/geometry**: [culling-playground](geometry/culling-playground), [culling-queries](geometry/culling-queries), [curves](geometry/curves), [geometry-processing](geometry/geometry-processing), [geometry-viewer](geometry/geometry-viewer), [parametric-geometry](geometry/parametric-geometry), [polygon-playground](geometry/polygon-playground), [spatial-index](geometry/spatial-index), [unfolding-polyhedron](geometry/unfolding-polyhedron)
- **@math.gl/geospatial**: [albers-usa](geospatial/albers-usa), [alpine-ice-age](geospatial/alpine-ice-age), [elastic-maps](geospatial/elastic-maps), [geoarrow-stream-worker](geospatial/geoarrow-stream-worker), [geographic-tiles](geospatial/geographic-tiles), [globe-primitives](geospatial/globe-primitives), [myriahedral-maps](geospatial/myriahedral-maps), [proj-wasm-crs](geospatial/proj-wasm-crs), [projection-domains](geospatial/projection-domains), [raster-mesh-preparation](geospatial/raster-mesh-preparation), [wkb-workbench](geospatial/wkb-workbench), [quincuncial-star](geospatial/quincuncial-star), [tectonic-time-machine](geospatial/tectonic-time-machine), [terrain-sampling](geospatial/terrain-sampling), [zoom-driven-map-morphing](geospatial/zoom-driven-map-morphing)
- **@math.gl/earth**: [geoid-globe](earth/geoid-globe), [sun-terminator](earth/sun-terminator), [timezone-globe](earth/timezone-globe)

After installing dependencies and building packages from the repository root, run `yarn start` from an example directory, or use its workspace name from the repository root, for example `yarn workspace math.gl-core-transforms start`.

`yarn start` and `yarn build` use package exports. Within the repository, `yarn start-local` uses the shared [local Vite config](vite.config.local.mjs) to alias math.gl imports to workspace source while preserving the example's own Vite options. For a copy outside this repository, preserve the relative layout of any imported `examples/common` sources, replace `workspace:*` dependency versions with published versions, and run `yarn start`.

Run all example checks from the repository root with `yarn test-examples`. Use `yarn test-examples:node` or `yarn test-examples:browser` for one environment, and append an example name to filter the checks. Run the library benchmark suite in the dev-tools browser harness with `yarn benchmark:browser`.

The website imports these sources using `website-examples`. Public website URLs stay independent of source locations.

To refresh gallery thumbnails and existing documentation copies, start the website with `yarn start` in `website`, then run `yarn screenshots` there. Set `EXAMPLES_URL` for a different preview URL, or pass example IDs to refresh a subset: `yarn screenshots sun-terminator`. Install Chromium first with `yarn playwright:install` from the repository root.

Simple demos include the collapsible panels InfoBox shell within their own source directories. Controls stay live when collapsed and release their panel managers on unmount. Tectonics and ice age keep their specialized application layouts; the expression editor retains its dedicated workspace.

- **@math.gl/dggs**: [DGGS cell explorer](dggs/cell-explorer)
