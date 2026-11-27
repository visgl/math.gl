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

## Sound speed

Click the ocean on the globe, or on the flat map, to open the **Sound speed** panel.
The example finds where the view ray meets sea level, samples the ETOPO1 grid there
for the seafloor depth, and reads a temperature and salinity profile. At each
standard depth down to the seafloor it calls these `@math.gl/earth/ocean` functions:

1. `getSeaPressureFromHeight(-depth, latitude)`
2. `getAbsoluteSalinity(practicalSalinity)`
3. `getConservativeTemperature(absoluteSalinity, temperature, seaPressure)`
4. `getSeawaterSoundSpeed(absoluteSalinity, conservativeTemperature, seaPressure)`
5. `getSoundAbsorptionFrancoisGarrison({frequency, temperature, salinity, depth})`

The chart marks the depth of minimum sound speed. At low and middle latitudes this
is the deep sound channel axis. Near the poles the minimum is at the surface. The
panel also gives the absorption at 12, 100 or 400 kHz, and the one-way vertical
absorption loss from the surface to the seafloor. The Francois–Garrison equation
accepts salinity 0 to 40 and temperature -2 to 30 °C. A level outside this range,
for example in the Red Sea or the Persian Gulf, keeps its sound speed but has no
absorption, and the vertical loss omits the intervals next to it. Clicks between the globe and the
map (a partial morph) do not select a point.

**Profile data.** The profiles come from the NOAA NCEI World Ocean Atlas 2023
(WOA23) annual 1° climatology, all decades 1955–2022: objectively analyzed in-situ
temperature (`t_an`) and Practical Salinity (`s_an`). Cite Locarnini et al. (2023),
World Ocean Atlas 2023, Volume 1: Temperature, NOAA Atlas NESDIS 89,
https://doi.org/10.25923/54bh-1613, and Reagan et al. (2023), World Ocean Atlas
2023, Volume 2: Salinity, NOAA Atlas NESDIS 90, https://doi.org/10.25923/70qt-9574.
NCEI states that the data are openly available to the public.

The example loads the 598 KB display preview of the
[deck.gl-data Earth catalog](https://github.com/visgl/deck.gl-data/tree/master/earth/stac)
(`earth/oceanography/v1/woa23`) from its pinned dataset commit, as the geoid example
does for EGM96. The preview keeps every second WOA23 node (2°) at 33 standard depths,
quantized to 0.01 °C and 0.01 salinity units. The panel uses the nearest preview
cell; the WOA23 profile can end above the ETOPO1 seafloor. A climatology is a
long-term mean, not a measured cast, and the result is not for navigation or sonar
performance prediction.

`mountBathymetry(root, {profileSource})` replaces the preview with another source:
an object with a `name` and `getProfile(longitude, latitude)` that returns in-situ
temperature (°C) and Practical Salinity at depths in meters, or `null` on land. The
tests use `syntheticProfileSource`, an idealized latitude-only profile.

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
network access to `s3.amazonaws.com/elevation-tiles-prod`. The sound-speed panel requires network access to
`media.githubusercontent.com` and `raw.githubusercontent.com` for the WOA23 preview. Terrarium pixels are
decoded as signed meters, then bilinearly sampled into a geographic display grid.
The [Tilezen sources](https://github.com/tilezen/joerd/blob/master/docs/data-sources.md)
use ETOPO1 for oceans and multiple sources on land; finer pixels do not imply
finer measured bathymetry than the original 1′ ETOPO1 model. See the
[required attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).

This is an example-only renderer: no shaders, dependencies or public APIs are added
to published math.gl packages. Future work can replace the coarse global grid with
multiresolution ETOPO 2022 tiles and terrain residency/LOD, keeping the same controls.

Run focused diagnostics with `node --test modules/geospatial/test/examples/bathymetry/mesh.test.js modules/geospatial/test/examples/bathymetry/sound-profile.test.js`
from the repository root. Build with `yarn build` in this example directory.
