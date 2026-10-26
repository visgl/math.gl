# Tectonic time machine

Interactive browser example: −4567 Ma to present to +300 Ma, globe and Equal Earth,
Mollweide, Robinson, sinusoidal, Miller cylindrical, equirectangular and Mercator maps. Includes Play / Stop, speed,
timeline landmarks, central meridian, hover coordinate tooltips, graticule and continent-region coloring.

```sh
yarn workspace math.gl-tectonic-time-machine start
yarn workspace math.gl-tectonic-time-machine build
yarn workspace math.gl-tectonic-time-machine test
```

## Data and scope

Original MIT example code; no upstream implementation or geological model dataset is
committed. NASA Blue Marble terrain imagery is included with separate source terms and
credit in [ATTRIBUTION.md](./ATTRIBUTION.md).

Select a published data source in the controls:

| Source                                       | Historical range | Geometry            | Reference frame |
| -------------------------------------------- | ---------------- | ------------------- | --------------- |
| Cao et al. (2024), `CAO2024`                 | 0–1800 Ma        | Continental blocks  | Paleomagnetic   |
| Müller et al. (2022), `MULLER2022` (default) | 0–1000 Ma        | Coastline templates | Mantle          |

CAO2024 reaches Nuna (also called Columbia) and Rodinia. Its
[Zenodo v2.4 dataset](https://zenodo.org/records/13628813) is **CC-BY-4.0**.
The snapshots retain authors, licenses, source versions, frame conventions and checksums
in both their Parquet metadata and accompanying manifests. Authors and display changes
are credited in [ATTRIBUTION.md](./ATTRIBUTION.md). Cao is a continental-block
reconstruction, not a paleogeographic shoreline model. Müller v1.2.4 is also CC-BY-4.0
and uses its complete optimised mantle rotation model with matching Merdith coastline
templates. Alternative reference frames are not combined.

Each source loads immutable, commit-pinned snapshots from
[deck.gl-data](https://github.com/visgl/deck.gl-data/tree/master/earth/tectonic-movements/v1).
Cao has one tagged Parquet file; Müller has separate geometry and rotations. Geometry
contains WKB polygons in longitude/latitude degrees. Switching sources cancels waiters
and keeps plate rotations within the selected source's range. Earlier dates use a labeled procedural surface on the same timeline. Different reconstruction models are never mixed.

Sources: [Cao et al. 2024](https://doi.org/10.1016/j.gsf.2024.101922),
[Müller et al. 2022](https://doi.org/10.5194/se-13-1127-2022),
[Merdith et al. 2021](https://doi.org/10.1016/j.earscirev.2020.103477),
and [Müller model data record](https://zenodo.org/records/13636799).
External data retains its source terms; MIT headers refer to this original code.
No GPL GPlates code is imported or copied.

Historical poses interpolate normalized finite rotations on the sphere, using
shortest-path quaternion interpolation. Feature validity intervals are respected.
Missing source rotations carry an explicit unavailable flag and are omitted. Genuine
identity rotations remain valid; no historical motion is fabricated. Omitted-template
counts remain visible. Present-day geometry and future poses use the present-day
valid set. Rendering simplifies coastline vertices, so this is not a measurement
or paleogeographic shoreline product.

Future paths are original illustrative continent-region rotations, continuous at
present day, assembling by +250 Ma and held until +300 Ma. They are not published
Amasia/Aurica/Pangaea Proxima reconstructions or physical forecasts. Geological Ma
is the animation time axis, not a CRS coordinate epoch or a trajectory integrator.

`@math.gl/geometry/polygon` cuts geographic rings at the dateline, respecting holes and polar
closure, before `CRSProjection.projectFlatSync` transforms numeric XY buffers.
Mercator is displayed with its ±85.05112878° latitude cap. Globe and map rendering
use deck.gl; no basemap, service credentials or map API key is required.

All devices use the same streaming path. Geometry loads first, then loaders.gl's
TypeScript Parquet source reads selected columns into 4,096-row Arrow batches. HTTP
byte-range requests retrieve the footer and selected column chunks as needed; Cao's geometry
and rotation reads share cached ranges. Decoding streams while playback continues. Rotation row
groups cover 100 Ma windows; the current pose's window is requested first, followed
by younger windows in playback order and the rest of the history. Playback starts
automatically as soon as its initial samples are complete, while history continues
loading. A missing pose temporarily pauses playback; it resumes when both interpolation
samples arrive. Seeking waits on the same stream instead of opening a second request lane.

Only complete plate sets become playable. Samples share a plate-index map and one
packed Float64Array plus availability flags per age. Rendering yields between batches.
The published loaders.gl v5 parser is isolated in a private workspace so deck.gl can
keep its v4 integration. Decoding and ZSTD decompression require no WebAssembly. The
selective source uses `core.worker: true` and its packaged TypeScript worker, moving
decompression and Arrow conversion off the rendering thread. Two row groups load
concurrently while batches retain the requested playback order. Commit-pinned GitHub media URLs support range requests; their
Content-Range header is hidden by CORS, so each response's status and byte count are
checked against the requested range and manifest size. If a host returns a full-file
HTTP 200 response, the small compressed file is buffered once and batches still decode incrementally.

Every manifest and byte-range request has a 45-second deadline covering response headers
and body consumption. A stalled request aborts only itself, leaving the model lifetime
usable for retries. Pose waits report progress until their samples arrive.

Background failures preserve validated samples and retry after 30 seconds, including
while playback is stopped. Needed-pose failures show the existing retry control. Source
changes and unmounts cancel waiters and retries; batches from cancelled sources never
publish. There are no device-specific download limits or live-service fallbacks.

### Reproducing the snapshots

The data repository’s [conversion script](https://github.com/visgl/deck.gl-data/blob/6b82e2df927725dc54ba729267204498d4ac6c74/earth/tectonic-movements/v1/scripts/create-parquet.py) converts pinned Cao v2.4 and Müller v1.2.4 archives to
ZSTD level-6 Parquet. It preserves source vertices and holes and samples anchor-plate-0
rotations every 10 Ma. Cao stores geometry once in its first row group, then rotations
in 18 windows. Müller has ten geometry groups and ten rotation windows. Full provenance,
counts and row-group inventories live in the footer; the sidecar adds output sizes and
SHA-256 checksums. Scientific data retains CC-BY-4.0; conversion code is original MIT.
pyGPlates and PyArrow are offline tools, not browser dependencies.

See the data repository's
[reproduction and validation instructions](https://github.com/visgl/deck.gl-data/tree/master/earth/tectonic-movements/v1#reproducing-and-validating)
for pinned archives, tool versions and independent source-frame validation.

A visible Play / Stop button works directly in the inline documentation example.
The compact expandable info box includes sources and scientific limits.

Ocean ripples and specular lighting use the public luma.gl `waterMaterial` API. Modern
In the modern-imagery appearance mode, NASA terrain stays attached to each moving rigid block through projection transitions.
It is visual context, not a reconstruction of ancient mountains, vegetation or ice;
no elevation is inferred from the image. If imagery fails to load, neutral shaded land
is shown. Region colors remain available as an alternative.

Playback uses deck.gl's [`TimelineWidget`](https://deck.gl/docs/api-reference/widgets/timeline-widget)
(experimental in deck.gl 9.4). Changing projections smoothly interpolates a shared
triangulated surface over 1.2 seconds while geological playback continues. Views cycle
every eight seconds during playback by default; the cycle toggle pauses automatic
changes, and choosing a view manually restarts the countdown. A new
selection during a transition begins from the current interpolated shape. Globe
and map endpoints use the same current reconstruction, rather than frozen snapshots.
The intermediate shapes are visual transitions, not additional cartographic projections.

Hover labels report longitude and latitude at stable globe/map endpoints. They are hidden
during projection morphs because intermediate visual shapes have no unique inverse CRS.

Named chapters on the timeline include Nuna (Columbia), Rodinia, Gondwana, Laurussia, Pangaea and the
Laurasia / Gondwana breakup. Centered titles fade according to geological time,
so pausing holds the title and seeking updates it immediately. These chapter dates
are approximate educational cues, not exact assembly boundaries. Future titles
follow the selected illustrative scenario. Chapters outside the selected source range
are hidden. Older reconstructions carry greater uncertainty, especially in longitude.
Proposed Pannotia is not labeled because its existence and configuration are debated.

Background: [BGS on Laurussia and Pangaea](https://earthwise.bgs.ac.uk/index.php/Geotectonic_setting_of_Wales),
[Veevers (2004) on Gondwana](https://doi.org/10.1016/j.earscirev.2004.05.002).


## Snowball Earth

The timeline includes Sturtian (approximately 717–660 Ma) and Marinoan
(approximately 650–635 Ma) chapters. Their illustrative ice material advances
from the poles, covers the ocean and reconstructed land, and retreats at the end
of each interval. It follows geological time when playing or seeking, works on
the globe and projected maps, and is absent during the nonglacial interval.

Full coverage uses opaque ice: smooth blue-white sea ice and brighter land ice
with shaded ridges and valleys. Continent silhouettes remain visible through
surface texture and color rather than underlying vegetation or plate colors.
The relief is procedural visual context, not reconstructed elevation or ice thickness.
Detail fades near the pixel scale to limit shimmer during zooms and projection changes.
Sea-ice texture rotates with the globe, while land relief travels with its plate.
The ice edge uses a shared geographic frame across land and ocean.

The **Glaciations** checkbox turns the ice material and event captions on or off.
Timeline markers remain available for seeking to the events. During playback,
ice-edge transitions automatically slow to at most 0.75 million years per second,
then resume the selected speed. This changes presentation timing, not event dates.

These chapters are educational cues, not an ice-extent dataset or climate
simulation. Global versus partly open ocean conditions remain debated. Dates
follow [Hoffman et al. (2017)](https://doi.org/10.1126/sciadv.1600983); see also
[NASA's discussion](https://www.giss.nasa.gov/research/features/201508_slushball/).

## Earth history events (4,567 Ma to present)

The **Earth history** panel contains a curated, source-linked chronology of
planetary formation, the Moon-forming giant impact hypothesis (Theia),
the debated Late Heavy Bombardment, early zircons, oxygenation, Cryogenian
glaciations and the Big Five mass extinction intervals. Entries support text
search, category filtering and source links.

**Scientific boundaries:** the single playback timeline now spans 4,567 Ma to
+300 Ma, while measured/modelled plate rotations still stop at 1,000 or 1,800 Ma.
Every event seeks that same timeline. There is no separate exploratory mode,
blocking overlay or Return action. Play/Stop, scrubbing, rotation and projection
morphs work continuously across the source boundary.

### Early Earth surface

Before the selected plate model's oldest age, a global procedural material
replaces the continent layer. The Hadean appearance is dark, rough basalt-like
crust with bright lava lakes and fissures, rather than an entirely orange globe.
Around the illustrative late-heavy-bombardment interval (4,100–3,700 Ma), localized
strikes flash, leave glowing molten pools and rings, then cool. Impact sites and
visual cadence are original art parameters, not observed coordinates, rates or
physical asteroid simulations. The existence of a discrete bombardment spike
remains debated. No modern imagery or reconstructed continents are used for
these early surfaces. Gradual cooling/water colors are also illustrative.

Material noise and impact sites live in geographic sphere space, so they follow
rotation and every projection once. Effects are driven by geological playback
age: Stop freezes their evolution and revisiting an age reproduces the same terrain
and impact state. A subtle cosmetic thermal pulse continues while paused.
The source-linked event browser and overview rail remain navigation shortcuts
to the same geological time, with clearly marked illustrative older dates.

`planetary-history.js` also defines a provenance-gated contract for
future impact-flux and biodiversity time series. Each series must identify
source, license, model, units and method, and provide strictly ordered,
finite, nonnegative observations. No numerical series has been published
or embedded in this PR, so the UI explicitly reports their unavailability
rather than drawing invented extinction rates or impact frequencies.

## Ancient geographic feature index

The expandable **Ancient geographic features** panel offers a small curated, searchable
index of mountain belts, oceans, seas and paleocontinents. Entries are filtered by
the current geological age; a checkbox shows all entries regardless of time.
The index lives in `paleo-features.js` and has focused tests.

**Scientific scope:** these are approximate educational intervals, not precise
formation/extinction dates. Features may change shape and identity over time.
No geometry, paleolocation, height, or historical shoreline is implied or rendered.
The index is independent of the selected plate reconstruction source and does not
claim that the listed feature geometries are included in its model.

Future work could incorporate a provenance-backed gazetteer with citations per
feature, age-specific geometries and model-compatible plate assignments, with
uncertainty metadata and explicit distinctions between present-day evidence and
reconstructed historical footprints. This requires separate data licensing and
geological validation before drawing features on the globe.

### Sourced geometry contract (follow-up)

`paleo-geometry.js` validates prospective epoch-specific GeoJSON feature records.
A record requires a feature identifier and name, category, older/younger age bounds,
a specific reconstruction epoch (`epochMa`), source citation, data license and
reconstruction model ID. A nonnegative plate ID is optional. Coordinates are
longitude/latitude in the specified **reconstructed** epoch, not present-day
coordinates to be moved blindly by plate rotations.

`featuresForEpoch(records, epochMa, modelId)` selects only validated records with
an **exact** epoch and matching reconstruction model. It deliberately does not
interpolate ancient outlines or mix reference frames. No external geological
geometry is bundled, and the current map renderer is unchanged. A future data
integration should add provenance-backed epoch snapshots, geometry topology
checks and projection-aware rendering before exposing any map overlay.

Land-plant emergence is marked at approximately 470 Ma, with an illustrative
80 Myr transition from bare earth tones to modern texture colors. This is not
an ancient vegetation reconstruction; region colors remain a categorical view.

## Historical PaleoDEM terrain

Playback starts at 500 Ma so historical terrain is visible immediately.
The default **Historical terrain · PaleoDEM** appearance uses Scotese and Wright's
CC-BY-4.0 PALEOMAP PaleoDEMs v2 from 540 Ma through the present. The 3.1 MB
[immutable Parquet snapshot](https://media.githubusercontent.com/media/visgl/deck.gl-data/eaa2649826c795492ee89a2632d863788545f2a2/earth/paleogeography/v1/paleodem/paleodem.parquet)
is registered in the [deck.gl-data STAC catalog](https://github.com/visgl/deck.gl-data/pull/51).
See the in-example Sources section and [ATTRIBUTION.md](ATTRIBUTION.md).

The loaders.gl TypeScript Parquet decoder streams only `elevation_m` in a worker.
Grid dimensions and age indexes come from the pinned manifest. Decode starts at
the requested age, prioritizes seeks, then fills younger history in playback order;
older snapshots complete in the background. Completed float32 elevation grids
occupy about 28 MB; only the two displayed grids have GPU textures. Pending,
failed, or out-of-range terrain uses explicitly labeled illustrative plate imagery.
The display never labels a stale grid as the requested age.

Land/sea masks and terrain colors are derived from elevation, with bilinear spatial
sampling, linear interpolation between the bracketing 5 Ma grids, and exaggerated
8× hill shading. This is a shaded surface, not an extruded elevation mesh. Source
edge omissions remain uncovered; no missing polar/dateline nodes are extrapolated.
Colors, vegetation greening and glaciations are illustrative, not reconstructed
biomes or climate. Plant emergence still controls greening around 470 Ma.

PaleoDEM grids are **already reconstructed in the PALEOMAP frame**. Their global
surface replaces the plate-template land layer in this appearance mode; it is not
rotated, clipped to, or presented as compatible with Cao/Müller coastlines. The
selected plate model still supplies region colors and the earlier/future fallback.
Choose **Modern NASA imagery on plates** or **Region colors** to see those plate
models throughout their time ranges. Globe rotation, meridian shifts and projection
morphing transform the global surface once, without applying plate rotations.

Deep time plays at 5× the selected speed before the chosen plate model begins.
The final accelerated step lands exactly on that boundary, then normal speed
and the existing glaciation slowdowns resume. The Theia marker at approximately
4,500 Ma triggers a brief whole-Earth white-hot emissive pulse and halo, which
fades back to Hadean rock/lava over subsequent timeline ages. The shader uses
above-white linear radiance and a display tone map; it does not require an HDR
monitor. Pulse duration and appearance are illustrative, not an impact simulation.

Event windows temporarily slow Theia/cooling, emerging oceans and late-heavy-
bombardment playback, while quieter deep time stays accelerated. Sea coverage
expands gradually through synthetic basins rather than switching materials in a
single frame. A 120 Myr visual crossfade hands the early surface over to the first
plate-model frames; it is a display blend, not a merged geological reconstruction.

Evidence supports liquid water by about 4.4 Ga, but the onset and global extent of
oceans are uncertain. See [older-Earth data candidates and evidence](early-earth-sources.md)
for verified open releases, limitations and references. **Euramerica (Laurussia)**
labels the earlier landmass; **Laurasia** labels the later northern Pangaea breakup.

The Theia peak is white-hot, cooling through yellow on its way back to the
Hadean material. A separate, subtle 4.5-second thermal breathing effect varies
Hadean intensity by ±8%; it remains alive while paused. Geological age, impact
positions and impact cooling still freeze with Stop. All of these effects are
illustrative art rather than physical radiometry or simulated impact histories.
