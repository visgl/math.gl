# Raster mesh preparation

From the repository root run `yarn && yarn build`, then
`yarn workspace math.gl-raster-mesh-preparation start`.
`node --test test/examples/geospatial/raster-mesh-preparation/*.test.mjs` checks all six fixture families;
`yarn workspace math.gl-raster-mesh-preparation build` produces the browser example.

See the [composition recipe](../../../docs/modules/geospatial/crs/developer-guide/raster-mesh-preparation.md)
for source topology prerequisites, provenance, sampling units and limitations.

Run `yarn start-local` inside the math.gl repository to use workspace source.
Run `yarn start` to use package exports or `yarn build` for a production bundle.
