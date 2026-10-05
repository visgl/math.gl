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

| Source | Historical range | Geometry | Reference frame |
| --- | --- | --- | --- |
| Cao et al. (2024), `CAO2024` (default) | 0–1800 Ma | Continental blocks | Paleomagnetic |
| Müller et al. (2022), `MULLER2022` | 0–1000 Ma | Coastline templates | Mantle |

CAO2024 reaches Nuna (also called Columbia) and Rodinia. Its
[Zenodo v2.4 dataset](https://zenodo.org/records/13628813) is **CC-BY-4.0**.
The GPlates geometry matches that licensed geometry byte-for-byte and is pinned by
checksum. Authors, license and display changes are credited in the example and
[ATTRIBUTION.md](./ATTRIBUTION.md). CAO2024 is a continental-block reconstruction,
not a paleogeographic shoreline model.

Each source uses its matching GPML geometry and explicitly selected GPlates rotation
model. The original parser reads feature identity, plate ID, rings and validity
intervals; positions in GPML are latitude/longitude. Rotation samples are requested
at 10 Ma intervals and reused during the session. The service
may update rotations; the example is not a revision-certified reconstruction.
Switching sources cancels pending requests and clamps time to the new source's range.
Different models have different reference frames and are never mixed.

Sources: [Cao et al. 2024](https://doi.org/10.1016/j.gsf.2024.101922),
[Müller et al. 2022](https://doi.org/10.5194/se-13-1127-2022),
[Merdith et al. 2021](https://doi.org/10.1016/j.earscirev.2020.103477),
[GPlates API documentation](https://gwsdoc.gplates.org/rotation/quaternions/),
and [Müller model data record](https://zenodo.org/records/13636799).
External data retains its source terms; MIT headers refer to this original code.
No GPL GPlates code is imported or copied.

Historical poses interpolate normalized finite rotations on the sphere, using
shortest-path quaternion interpolation. Feature validity intervals are respected.
Because GWS returns identity for absent plate IDs, non-anchor identity fallback
samples in the past are conservatively omitted rather than interpreted as measured
stationary blocks. This can omit genuinely stationary blocks; omitted-template
counts remain visible. Present-day geometry and future poses use the present-day
valid set. Rendering simplifies coastline vertices, so this is not a measurement
or paleogeographic shoreline product.

Future paths are original illustrative continent-region rotations, continuous at
present day, assembling by +250 Ma and held until +300 Ma. They are not published
Amasia/Aurica/Pangaea Proxima reconstructions or physical forecasts. Geological Ma
is the animation time axis, not a CRS coordinate epoch or a trajectory integrator.

`@math.gl/polygon` cuts geographic rings at the dateline, respecting holes and polar
closure, before `ProjectionEngine.projectFlatSync` transforms numeric XY buffers.
Mercator is displayed with its ±85.05112878° latitude cap. Globe and map rendering
use deck.gl; no basemap, service credentials or map API key is required.

Geometry loads when a source is selected, with cancellation on unmount or source change.
The initial pose loads first so playback can start without waiting for the complete history.
Desktop clients then stream the entire historical range in the background. Mobile clients
and clients requesting reduced data use keep a smaller buffer and prefetch the current and next 200 Ma windows. Playback pauses only when it reaches
a missing pose and resumes as soon as the two required samples are available. Seeking takes
priority over further background windows; source changes cancel streaming.

The GPlates keyed JSON response is adapted incrementally to rows and read by loaders.gl's
JSON-to-Arrow loader in 4,096-row batches. An explicit schema retains only `age`, `plateId`,
`w`, `x`, `y`, and `z`; `onExtraField: 'drop'` discards unselected columns during Arrow
conversion, while missing required fields remain errors. This bounds temporary row storage;
it does not claim to avoid every parser allocation. Validated rotations are retained in
one packed Float64Array per time sample, rather than a small array per plate rotation.
Only complete time samples containing every requested plate become available to playback.
HTTP requests remain bounded to 256 plate IDs and 21 ages, and the render loop can run
between Arrow batches. The loader's published v5 prerelease is isolated in a private
workspace so deck.gl can retain its v4 loader integration.

Network errors are explicit and retryable when a needed pose fails to load. Background
failures keep previously validated samples playable. Service and browser failures never
fall back to fabricated historical motion.

A visible Play / Stop button works directly in the inline documentation example.
The compact expandable info box includes sources and scientific limits.

Ocean ripples and specular lighting use the public luma.gl `waterMaterial` API. Modern
NASA terrain stays attached to each moving rigid block through projection transitions.
It is visual context, not a reconstruction of ancient mountains, vegetation or ice;
no elevation is inferred from the image. If imagery fails to load, neutral shaded land
is shown. Region colors remain available as an alternative.

Playback uses deck.gl's [`TimelineWidget`](https://deck.gl/docs/api-reference/widgets/timeline-widget)
(experimental in deck.gl 9.4). Changing projections smoothly interpolates a shared
triangulated surface over 1.2 seconds while geological playback continues. A new
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
