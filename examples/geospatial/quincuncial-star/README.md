# Quincuncial and star maps

Run `yarn workspace math.gl-quincuncial-star start`.

- `src/map.js`: construct `MapEngine`, split coastlines/graticules and a polygon, project city points.
- `src/scene.js`: fit, draw and pick the resulting map; no control selectors.
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
