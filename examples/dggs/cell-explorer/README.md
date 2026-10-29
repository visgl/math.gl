# DGGS cell explorer

Run `yarn workspace math.gl-dggs-cell-explorer start` from the repository root.

Exercises all six `@math.gl/dggs` decoders with editable IDs, centers, bounds,
antimeridian unwrapping, comparison cells, and S2 parent/child navigation.
The default fixtures are local; no basemap token or external data is required.
Use Fit cell after changing an ID to move the globe to its decoded bounds.

Inspired by the MIT-licensed [deck.gl-community global grid example](https://github.com/visgl/deck.gl-community/tree/master/examples/geo-layers/global-grid-layer).
This implementation uses math.gl decoders and deck.gl primitive layers directly;
it does not require the community GlobalGridLayer or its grid encoders.
