# Example checks

Run these commands from the repository root after installing dependencies and building packages:

```sh
yarn test-examples:node
yarn test-examples:browser
```

Node checks cover local Vite source resolution, expression previews, elastic maps, raster preparation, GeoArrow workers, solar geometry, glacial data and tectonic history.
Browser checks cover the DGGS cell explorer, terrain sampling, WKB workbench and solar rendering, using the root Playwright installation.
Browser checks load each example's project configuration. The solar harness builds the app alongside its root-level test fixtures.

For the CRS and projection-domain examples, run the dedicated checks from the repository root:

```sh
yarn test-proj-wasm-crs
yarn test-projection-domains
yarn workspace math.gl-proj-wasm-crs build
yarn workspace math.gl-projection-domains build
yarn test-proj-wasm-crs:browser
yarn test-projection-domains:browser
```

These browser checks use Vite preview. Prefix either command with
`EXAMPLE_SERVER_MODE=development` to exercise Vite's development server instead.
