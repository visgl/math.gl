# Tectonic time machine

Interactive browser example: −500 Ma to present to +300 Ma, globe and Equal Earth,
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
credit in [ATTRIBUTION.md](./ATTRIBUTION.md). A pinned coastline GPMLZ file is fetched from the GPlates web-service
repository at runtime. The original parser reads feature identity, plate ID, rings
and validity intervals; positions in GPML are latitude/longitude. The rotation API
uses the explicit `MULLER2022` model, sampled at 10 Ma intervals from 0 to 500 Ma.
The service may update its model; the example is not a revision-certified dataset.

Sources: [Müller et al. 2022](https://doi.org/10.5194/se-13-1127-2022),
[Merdith et al. 2021](https://doi.org/10.1016/j.earscirev.2020.103477),
[GPlates API documentation](https://gwsdoc.gplates.org/rotation/quaternions/),
and [model data record](https://zenodo.org/records/13636799).
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

Data loads once per mounted example, with cancellation on unmount and sequential
bounded rotation batches. Network errors are explicit and retryable. Service and
browser failures never fall back to fabricated historical motion.

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
