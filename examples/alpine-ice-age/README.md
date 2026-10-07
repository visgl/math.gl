# Glaciation Explorer

Explore global ice masks from **799 ka to the present**, the last **80 ka** of
global ice-sheet thickness, or the Alpine glacial cycle from **119 ka to the
present**. Switch map projections, scrub the ice-area chart and adjust playback.
The **Ice Age Explorer** uses licensed Krapp masks for the older interval;
the younger thickness reconstructions remain separate modes. Playback repeats
by default; disable Repeat animation to stop at the present.

## Run

From the repository root, run `yarn workspace math.gl-alpine-ice-age start`.
Use `yarn workspace math.gl-alpine-ice-age build` for a standalone build and
`yarn workspace math.gl-alpine-ice-age test` for dataset/interpolation checks.

## Data and attribution

Julien Seguinot, Susan Ivy-Ochs, Guillaume Jouvet, Matthias Huss, Martin Funk and
Frank Preusser (2018), [Modelling last glacial cycle ice dynamics in the Alps](https://doi.org/10.5194/tc-12-3265-2018),
The Cryosphere 12, 3265–3285.

[Alpine ice sheet glacial cycle simulations continuous variables, version 3](https://doi.org/10.5281/zenodo.7802275),
Julien Seguinot (2023). Source file: `alpcyc.2km.epic.pp.ex.1ka.nc`.
The dataset and the derived display assets hosted in deck.gl-data retain their
[Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)
license. The example code is MIT. No glacier solver is bundled.

The selected simulation uses EPICA temperature forcing and palaeo-precipitation
reduction. The 2 km source is sampled at alternate grid nodes (4 km) for display;
all 120 published 1 ka snapshots are retained. Bed elevations and ice
thickness are rounded to integer metres. Bedrock uses the present model snapshot
and is held fixed; the isostatic bed changes in the source are not animated.
Coordinates retain the model's UTM zone 32 frame. Place names provide modern
orientation and do not imply ancient settlement.

Ice thickness is linearly interpolated between 1 ka samples. Intermediate margins
are visualization, not additional model output. The terrain-reveal option blends
terrain colors into the ice surface; it does not simulate optical transmission.
Relief exaggeration applies to both bedrock and ice. The timeline's LGM chapter
at 24 ka is an approximate reference, not a claim that all lobes peaked together.
Günz, Mindel and Riss are outside this Alpine dataset; use the earlier global
ice-mask mode to explore those approximate correlations.

Area and volume use the original 2 km source grid, not the display mesh. Ice area
counts cells with thickness above 10 m; volume sums thickness times 4 km². Values
between snapshots interpolate these totals and are model estimates, not field
measurements. Grid-cell areas use the nominal model spacing.

## Reproduce the browser asset

Download the source file linked above, then use a temporary Python environment:

```sh
python -m pip install -r examples/alpine-ice-age/scripts/requirements.txt
python examples/alpine-ice-age/scripts/prepare-data.py /path/to/alpcyc.2km.epic.pp.ex.1ka.nc
```

The converter verifies the published MD5 before reading data and records the
source SHA-256 and compressed-asset SHA-256 in `data/manifest.json`. The asset
contains little-endian Int16 bedrock followed by time-major Uint16 thickness,
gzip-compressed with a deterministic timestamp. Its browser decoder validates
length before constructing typed-array views. The source NetCDF is not committed.

The terrain mesh uses math.gl `Vector3` operations for surface normals and deck.gl
for the Cartesian orbit view, mesh shading, place labels and picking-free display.

## Global ice sheets and map projections

The **Global ice sheets** mode animates the last **80 ka**, alongside the
Alpine glaciers mode above. Choose Globe, Equal Earth, Mollweide, Robinson,
Sinusoidal, Miller cylindrical, Equirectangular or Mercator. Drag the globe to
rotate it; drag maps to pan. The projection transformations use math.gl's
`ProjectionTransform` with only the selected projection implementations registered.
Mercator clips the display at ±85°; Antarctica remains available in other views.

Global data: Evan J. Gowan (2019), [Global ice sheet reconstruction for the past
80000 years](https://doi.pangaea.de/10.1594/PANGAEA.905800), supplementary data to
Gowan and colleagues (2021), [A new global ice sheet reconstruction for the past
80,000 years](https://doi.org/10.1038/s41467-021-21469-w), Nature Communications 12,
1199. The derived `global.bin.gz` and `global-manifest.json` assets retain **CC-BY-4.0**.
We use PaleoMIST 1.0's corrected April 2021 1° geographical grid and the minimal
North American MIS 3 scenario. This is a reconstruction of **grounded ice sheets**;
sea ice and small mountain glaciers are not included. It is a separate dataset,
not the Alpine simulation extrapolated worldwide.

All 33 snapshots at 2,500-year intervals are retained, including changing base
topography. Shorelines follow the reconstructed base elevation relative to sea
level. Ice and base elevations are rounded to integer metres. Source interpolation
artifacts between −0.1 and 0 m ice thickness become zero. The repeated +180° longitude
column is removed from storage and restored in the mesh, preventing double counting.
Ice colors encode thickness; the terrain-reveal blend is illustrative. Smooth
motion between snapshots does not add reconstructed time steps. Global statistics
use latitude-weighted spherical grid-cell areas, with polar caps clipped at ±90°,
and a 10 m ice-area threshold. They interpolate snapshot totals.

Extract `ice_reconstruction/global_grid/reconstruction_1_degree.nc` from the
[PANGAEA archive](https://hs.pangaea.de/Maps/Global_Ice_Sheets/Gowan_ice_reconstruction.zip),
then run:

```sh
python examples/alpine-ice-age/scripts/prepare-global.py /path/to/reconstruction_1_degree.nc
```

The converter verifies the extracted source SHA-256 before processing, and records
it and the compressed-asset checksum in the global manifest. The global binary
contains time-major little-endian Int16 base elevations, then Uint16 grounded-ice
thickness. The compressed display asset is about 4.2 MB. Both modes repeat by default, or stop at present with Repeat animation disabled;
changing modes resets playback to the selected dataset's beginning.

## Ice-age names

The optional map labels identify regional names for the last glacial period:
Wisconsinan (North America), Weichselian (northern Europe), and Würm (the Alps).
They are broad regional context, not separate synchronous global ice ages or
measured ice-margin boundaries. Labels change to Holocene at approximately
11.7 ka; the Alpine view identifies the last interglacial before approximately
115 ka. Those approximate divisions do not imply that every glacier disappeared
at the same date. See the [USGS Wisconsinan chronology](https://www.usgs.gov/publications/chronology-late-wisconsinan-glaciation-middle-north-america-0),
[BGS regional terminology](https://webapps.bgs.ac.uk/memoirs/docs/B07313.html),
the Alpine study above, and the [ICS Holocene definition](https://stratigraphy.org/gssps/holocene).

Projection changes smoothly morph the surface, graticules and label positions over
1.2 seconds. Retargeting an unfinished transition starts from the current blend.
Reduced-motion preferences switch immediately. Global readouts use millions of
km² for area and millions of km³ for volume, each with one decimal; Alpine
readouts retain km² and km³ to preserve detail at that smaller scale.

A large centered overlay shows changing descriptive phases:
last glacial period, last glacial maximum (approximately
26.5–19 ka), retreat, and Holocene. These broad chapters make progression visible
within the same regional glaciation names; they are not separately reconstructed
ice ages or exact dates of local advances and retreats.
The approximate maximum chapter follows [Clark et al. (2009), The Last Glacial Maximum](https://pubs.usgs.gov/publication/70036965).

Global map projections cycle automatically every eight seconds, with smooth transitions.
Disable **Cycle projections** to keep the selected view. The **Ice age names** toggle
controls the centered phase title and regional-name subtitle.

### Climate context

The global view includes independent model-derived temperature and land-ice albedo
forcing from Köhler, de Boer, von der Heydt, Stap and van de Wal (2015),
[dataset DOI](https://doi.pangaea.de/10.1594/PANGAEA.855449),
[study](https://doi.org/10.5194/cp-11-1801-2015).
The upstream derived `koehler2015/climate.json` is **CC-BY-3.0**, separately from the MIT code;
[license](https://creativecommons.org/licenses/by/3.0/). Its metadata records the
original archive checksum and attribution. Values are subsetted to 0–120 ka,
with all three temperature variants and their source uncertainties retained.
The UI shows variant 1 rebased to its 0 ka sample, not a modern instrumental
average or a claimed 1850–1900 baseline. Land-ice radiative forcing retains its
source reference and is not total planetary albedo. Both series interpolate
linearly; albedo has no 0 ka sample and is unavailable below 2 ka.
These climate series are independent of PaleoMIST, not calculated from its ice mesh.

### Upstream hosting

The example fetches all ice-grid previews, preview manifests and climate JSON from
[deck.gl-data/earth/glaciations/v1](https://github.com/visgl/deck.gl-data/tree/2a69f8a6e01e22c7c6649244a1577c20c74a02ae/earth/glaciations/v1).
`sources.js` pins the merged repository commit; LFS gzip data uses GitHub media URLs,
and ordinary JSON uses raw URLs. No scientific data is bundled into this example.
Preparation scripts remain available for reproducing display assets locally.
`yarn workspace math.gl-alpine-ice-age test` verifies the pinned public downloads,
checksums, source provenance, dimensions and scientific reference locations.

### Attribution widget

The shared `examples/shared/attribution-widget.jsx` component keeps source credits
visible in both views. Expand **Data attribution** for the original dataset, paper,
license, pinned hosted copy and display modifications. Scientific limits are
listed separately. The tectonic example uses the same component and updates the
credits when the selected reconstruction changes.

### Earlier global ice ages

After PaleoMIST loads, the explorer loads licensed Krapp et al. (2021)
[global masks](https://osf.io/8n43x/) from the immutable deck.gl-data Parquet asset.
The bundled loaders.gl decoder reads only the mask column for 161 snapshots
(799 ka plus 795–0 ka in 5 ka steps), with loading progress shown.
Failures preserve PaleoMIST. Successful loading selects **Earlier ice ages · Krapp**;
the global thickness reconstruction and Alpine simulation remain available.

Native 0.5° cells are aggregated to 1° coverage. Area is integrated
on the native spherical grid; intermediate coverage and area interpolate
linearly for animation. No ice thickness or volume is supplied; illustrative
relief is not elevation data. Climate values are unavailable in this mode.
Günz, Mindel and Riss labels use approximate Alpine correlations to MIS 16, 12
and 6; these are regional terminology, not globally synchronous measured dates.
The data are CC BY 4.0; attribution links the original project, article, license
and hosted copy. ICE-6G supplies 0–122 ka masks; older masks use Ganopolski & Calov.

The large last-glacial-period title is **Würm**; the maximum and retreat phase
descriptions appear underneath.

The center title is empty between named ice-age windows.
Chapter titles appear for four seconds after the model loads or a phase changes,
then fade out over 800 ms. Re-enabling Ice age names introduces the current chapter
again. Reduced-motion preferences remove the fade.
