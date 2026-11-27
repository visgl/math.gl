# DGGS cell explorer

Run `yarn workspace math.gl-dggs-cell-explorer start` from the repository root.

Select a grid, then pan and zoom to explore its cells across the viewport. Zooming
chooses the grid resolution automatically. The panel shows the current cell level
and the unique cell count in loaded viewport tiles. Hover over a cell
to mark its center and see its ID and center longitude/latitude. The center marker
clears when the cell level or grid type changes, or when the pointer leaves the cells.

Cell geometry comes from the [DGGS decoders](../../../docs/modules/dggs/README.md).
A [deck.gl TileLayer](https://deck.gl/docs/api-reference/geo-layers/tile-layer)
requests IDs for each tile's geographic bounds. Its polygon sublayers decode those
IDs with math.gl. Boundary cells can appear in several tiles; their opaque fills
keep the grid uniform across tile edges.

Generation uses [a5-js](https://github.com/felixpalmer/a5),
[h3-js](https://github.com/uber/h3-js),
[open-location-code](https://github.com/google/open-location-code), and local
GeoHash, Quadkey, and S2 covering logic. The S2 point lookup uses
[s2-geometry](https://github.com/coolaj86/s2-geometry.js). All cells are generated locally.

To generate a conservative cell covering, pass TileLayer bounds directly in
`[[west, south], [east, north]]` order and degrees:

```js
import {generateCells, getGridLevel} from './src/generator.js';

const bounds = [[-122.7, 37.5], [-122.0, 38.1]];
const level = getGridLevel('h3', 9); // Tile zoom -> native grid level
const cellIds = generateCells('h3', bounds, level); // string[]
```

Coverings include boundary cells so bounds smaller than a cell still render.
The generator uses the ordered geographic bounds supplied by TileLayer.
Spherical queries subdivide large tiles into smaller patches.

Tile zoom 0 selects level 0 for A5, H3, and S2; level 1 for GeoHash; and level 2
for Plus Codes and Quadkey. Quadkey starts one level finer for clearer globe
rendering. Each grid refines at its own rate as tile zoom increases.

Levels use each grid's native resolution; GeoHash and Plus Code levels count
significant characters. A5 uses levels 0–29 for uniform resolution worldwide.
Quadkey tiles cover [Web Mercator](https://en.wikipedia.org/wiki/Web_Mercator_projection)'s
latitude range. Grid levels remain fixed within each tile zoom so panning retains
the same resolution.

Inspired by the MIT-licensed [deck.gl-community global grid example](https://github.com/visgl/deck.gl-community/tree/master/examples/geo-layers/global-grid-layer).

Run `yarn start-local` inside the example directory to use workspace source.
Run `yarn start` to use package exports or `yarn build` for a production bundle.
