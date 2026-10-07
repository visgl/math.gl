# Tectonic time machine

Interactive browser example: −1800 Ma to present to +300 Ma, globe and Equal Earth,
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
and clamps time to the selected source's range. Different models are never mixed.

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

`@math.gl/polygon` cuts geographic rings at the dateline, respecting holes and polar
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
NASA terrain stays attached to each moving rigid block through projection transitions.
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
from the poles, glazes the ocean and reconstructed land while keeping continents and plate colors
visible beneath it, and retreats at the end
of each interval. It follows geological time when playing or seeking, works on
the globe and projected maps, and is absent during the nonglacial interval.

The **Glaciations** checkbox turns the ice glaze and event captions on or off.
Timeline markers remain available for seeking to the events. During playback,
ice-edge transitions automatically slow to at most 0.75 million years per second,
then resume the selected speed. This changes presentation timing, not event dates.

These chapters are educational cues, not an ice-extent dataset or climate
simulation. Global versus partly open ocean conditions remain debated. Dates
follow [Hoffman et al. (2017)](https://doi.org/10.1126/sciadv.1600983); see also
[NASA's discussion](https://www.giss.nasa.gov/research/features/201508_slushball/).
