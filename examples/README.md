# Examples

Sources live in `examples/<module>/<example-name>`, grouped by the published math.gl package. Shared helpers stay in `common` and `shared`.

- **@math.gl/core**: [benchmarks](core/benchmarks), [core-transforms](core/core-transforms), [expressions](core/expressions)
- **@math.gl/geometry**: [culling-playground](geometry/culling-playground), [culling-queries](geometry/culling-queries), [curves](geometry/curves), [geometry-processing](geometry/geometry-processing), [geometry-viewer](geometry/geometry-viewer), [parametric-geometry](geometry/parametric-geometry), [polygon-playground](geometry/polygon-playground), [spatial-index](geometry/spatial-index), [unfolding-polyhedron](geometry/unfolding-polyhedron)
- **@math.gl/geospatial**: [albers-usa](geospatial/albers-usa), [alpine-ice-age](geospatial/alpine-ice-age), [elastic-maps](geospatial/elastic-maps), [geographic-tiles](geospatial/geographic-tiles), [globe-primitives](geospatial/globe-primitives), [myriahedral-maps](geospatial/myriahedral-maps), [proj-wasm-crs](geospatial/proj-wasm-crs), [quincuncial-star](geospatial/quincuncial-star), [tectonic-time-machine](geospatial/tectonic-time-machine), [terrain-sampling](geospatial/terrain-sampling)
- **@math.gl/earth**: [geoid-globe](earth/geoid-globe), [sun-terminator](earth/sun-terminator), [timezone-globe](earth/timezone-globe)
- **@math.gl/web-mercator**: [zoom-driven-map-morphing](web-mercator/zoom-driven-map-morphing)

Run `yarn start` from an example directory, or use its workspace name from the repository root, for example `yarn workspace math.gl-core-transforms start`. Globe primitives and myriahedral maps have no workspace manifest; launch them with `yarn exec vite examples/<module>/<example-name>`.

The website imports these sources using `website-examples`. Public website URLs stay independent of source locations.

To refresh gallery thumbnails and existing documentation copies, start the website with `yarn start` in `website`, then run `yarn screenshots` there. Set `EXAMPLES_URL` for a different preview URL, or pass example IDs to refresh a subset: `yarn screenshots sun-terminator`. Install Chromium first with `yarn playwright:install` from the repository root.

Simple demos use the shared collapsible panels InfoBox shell: React controls use `common/example-panel.jsx`, and DOM controls use `common/info-box.js`. Both keep controls live when collapsed and release their panel managers on unmount. Tectonics and ice age keep their specialized application layouts; the expression editor and benchmark result interfaces also retain their dedicated workspaces.
