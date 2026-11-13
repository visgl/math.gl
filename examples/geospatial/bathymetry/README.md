# Bathymetry globe

Uses the tree-shakable `HeightField` and `createTerrainMesh` root exports from
`@math.gl/geospatial`; only the example converts the grid mesh into a sphere.

A real 3D global elevation mesh with the ocean surface removed. Rotate the globe,
visit ocean presets, and inspect depth colors and relief. Maximum vertical
exaggeration defaults to 100×, decreasing smoothly to 1× over zoom levels 0–4.
Colors encode original elevations independently of exaggeration. Community panels
provide controls and collapse on small screens. The morph slider continuously
unrolls the sphere into either an equirectangular or Mercator relief map.

Run `yarn start` in this directory after installing repository dependencies, or
`yarn workspace math.gl-bathymetry start` from the repository root.

## Data and interpretation

NOAA NGDC ETOPO1 Ice Surface, Amante and Eakins (2009), NOAA Technical Memorandum
NESDIS NGDC-24. The [NOAA metadata](https://coastwatch.pfeg.noaa.gov/erddap/info/etopo180/index.html)
permits free use and redistribution and includes the provider's warranty disclaimer.
Heights are meters relative to mean sea level; coordinates are WGS84.
The ice-surface variant shows ice-sheet tops, not the seabed beneath ice sheets.

The bundled 520 KB grid contains every 30th source node: 721 × 361 samples at 0.5°,
south to north and west to east. This coarse global overview misses narrow trenches
and is not suitable for navigation or quantitative local analysis. At zoom 1.5, 2.5 and 3.5, a view-centered region refines to 10′, 5′ and 2.5′
mesh spacing using AWS Terrain Tiles (Tilezen/Mapzen). A four-request concurrency
limit and a 64-tile cache bound loading. Previous terrain remains until a replacement
is ready; stale requests are aborted. A coarse mesh cutout and matching fine boundary
vertices avoid overlapping surfaces. Polar caps keep the overview. The display uses a sphere, not an ellipsoidal vertical-datum transform.
There is no water surface hiding the negative-elevation geometry. Duplicated seam
and polar vertices are reconciled for rendering only; the source binary is unchanged.

`assets/provenance.json` pins the source query, preprocessing and SHA-256 hashes.
To reproduce, download its CSV source URL, skip the two header rows, and pack the
altitude column as signed little-endian int16 values in row order. No resampling,
filling or smoothing is performed on the bundled grid. Zoom refinement requires
network access to `s3.amazonaws.com/elevation-tiles-prod`. Terrarium pixels are
decoded as signed meters, then bilinearly sampled into a geographic display grid.
The [Tilezen sources](https://github.com/tilezen/joerd/blob/master/docs/data-sources.md)
use ETOPO1 for oceans and multiple sources on land; finer pixels do not imply
finer measured bathymetry than the original 1′ ETOPO1 model. See the
[required attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).

This is an example-only renderer: no shaders, dependencies or public APIs are added
to published math.gl packages. Future work can replace the coarse global grid with
multiresolution ETOPO 2022 tiles and terrain residency/LOD, keeping the same controls.

Run focused diagnostics with `node --test modules/geospatial/test/examples/bathymetry/mesh.test.js`
from the repository root. Build with `yarn build` in this example directory.
