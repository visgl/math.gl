# Quincuncial and star maps

Run `yarn workspace math.gl-quincuncial-star start`.

Hover over the map to inspect geographic coordinates in a tooltip. Color and
source descriptions appear in the info panel beside the controls.

- `src/map.js`: construct `MapEngine`, split coastlines/graticules and a polygon, project city points.
- The shared deck.gl scene fits, draws and picks the resulting map.
- `src/main.js`: controls and mount/unmount lifecycle.

Peirce uses a central hemisphere and four corner pieces. Berghaus keeps an
azimuthal-equidistant front hemisphere and cuts the back into star lobes.
Both use an equatorial aspect centered on the selected meridian, not D3's default
Peirce rotation. Blue is map coverage, not an ocean/land classification.
Coastlines reuse the Natural Earth public-domain data in `../../geometry/unfolding-polyhedron/data`.
The orange polygon demonstrates seam-aware splitting; input polygons must fit
an open hemisphere. These static presets do not have hinge motion.

Run `yarn start-local` inside the math.gl repository to use workspace source.
Run `yarn start` to use package exports or `yarn build` for a production bundle.
