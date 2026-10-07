# Timezone globe

A deck.gl 9.4 `GlobeView` example using the optional `@math.gl/timezone` geometry exports.
It includes oceans, low/high geometry selection, a UTC date slider, offset colors,
and hover details showing the IANA identifier, date-specific label, offset, and local clock.
Labels reflect daylight saving where the runtime supplies them. Political offset changes
are not classified as DST. Unsupported runtime identifiers are gray.

From the repository root:

```sh
yarn install
yarn workspace math.gl-timezone-globe start
# Production bundle:
yarn workspace math.gl-timezone-globe build
```

The example loads JSON via Vite asset URLs; geometry is fetched separately from JavaScript.
High geometry loads only when selected. Both datasets are emitted by the production build.
`GlobeView` is experimental in deck.gl. Approximate boundaries are for visualization,
not authoritative timezone lookup. Attribution is displayed on the globe.

The website reuses `mountTimezoneGlobe` from `app.js` in a browser-only React
wrapper. `main.js` supplies Vite asset URLs for this standalone version. The
mount function accepts an isolated container and returns cleanup that finalizes
Deck, removes event listeners, and aborts outstanding geometry fetches.

Basemap imagery uses NASA Blue Marble via the public GIBS EPSG:4326 WMS service,
configured in `examples/common/blue-marble.js`. No access token is required.
