# Example checks

Run these commands from the repository root after installing dependencies and building packages:

```sh
yarn test-examples:node
yarn test-examples:browser
```

Node checks cover local Vite source resolution, expression previews, elastic maps, raster preparation, GeoArrow workers, solar geometry, glacial data and tectonic history.
Browser checks cover the DGGS cell explorer, terrain sampling, WKB workbench and solar rendering, using the root Playwright installation.
Browser checks load each example's project configuration. The solar harness builds the app alongside its root-level test fixtures.
