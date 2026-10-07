# Geoid globe

Run `yarn workspace math.gl-geoid-globe start` from the repository root.
The standalone Vite example and website share `mountGeoidGlobe` and scoped styles.

Colors encode EGM96 geoid height N above WGS84, with a fixed −110 to +110 m scale.
The package exports PGM grids; the example loads them only when needed, evaluates
`parsePGM` / `getHeight`, and paints an equirectangular texture on deck.gl GlobeView.
Hover values use the selected grid and interpolation directly. Cleanup cancels
requests and finalizes the Deck instance when navigating away.

The standalone and website examples fetch pinned EGM96 PGM assets from
`deck.gl-data/earth/geoid/v1` through `sources.js`. The geoid package retains its
published asset exports for library consumers. These grids measure geoid
undulation above WGS84, not terrain elevation.
