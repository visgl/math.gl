# GeoArrow stream task worker

From the repository root, run `yarn && yarn build`. Then run `yarn start` in this directory.
Run `yarn test` here for actual Node worker parity, transfer ownership and error recovery;
`yarn build` bundles the browser app and worker.

The orange polygon crosses the antimeridian; the blue polygon has a hole. Orthographic hides
the far-side orange polygon. The output displays original source row IDs after splitting.
D3 is an optional private-example dependency. Library code imports no external engine.

See [geometry streams](../../../docs/modules/geospatial/geoarrow/geometry-streams.md) for the
XY-only contract, winding, output limits and task lifecycle. The canvas displays triangles;
consumers can pass the same binary geometry to a renderer without reconstructing GeoJSON.
