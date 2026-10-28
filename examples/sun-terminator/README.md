# Solar terminator

Run `yarn workspace math.gl-sun-terminator start` from the repository root.
Build with `yarn workspace math.gl-sun-terminator build`.
The website lazy-loads the same renderer.

The collapsible infobox uses `@deck.gl-community/panels`, with labels and controls
on the same row. Choose globe, Web Mercator, or any of the 35 cartographic projection presets plus interrupted sinusoidal, interrupted Mollweide, Albers USA, and H3 icosahedron unfolding layouts, edit UTC date/time, animate at one, three (default), or six
simulated hours per second, or select sunset/civil/nautical/astronomical darkness.
Feather controls the transition width (3°, 6° by default, or 12°). The fade lies
entirely on the dark side of the selected solar-altitude boundary. There is no
colored outline in the example; `getSunTerminator` still provides outline geometry
for applications that need it.

A bundled 2048 × 1024 NASA day/night overview (~386 KiB combined) covers the whole
Earth immediately, including the poles. No external imagery requests are needed
at the initial zoom. When zooming in, one TileLayer fetches paired day/night WMTS
tiles, keeps the overview beneath them, and retains cached parents while detail
loads. Each opaque bitmap blends day and night in a single shader pass; layering
detail cannot double the twilight opacity or introduce holes between textures.

Detail uses NASA GIBS `BlueMarble_ShadedRelief_Bathymetry` JPEGs and
`VIIRS_Black_Marble` PNGs (2016-01-01), `GoogleMapsCompatible_Level8`, zooms 3–8,
and 256-pixel tiles with z/y/x ordering. Six tile pairs may load concurrently.
Requests are debounced while navigating, and changing time or feather does not
refetch imagery. Tile failures keep the complete overview visible. WMTS detail
ends at ±85.05113°, with the bundled geographic overview covering the poles.

The public endpoint needs no key and supports CORS. Night lights are a historical
composite, not observations at the selected time. See [overview provenance](./assets/README.md),
[NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/), and the
[kepler.gl masking reference](https://github.com/keplergl/kepler.gl/blob/c28fc49b5415e5315b0bbc359923de583f9e37f0/src/deckgl-layers/src/globe/atmosphere-layer.ts).

## Regression checks

Run `yarn workspace math.gl-sun-terminator test` for paired-image loading and cleanup.
With the standalone server running on port 5187, run
`yarn workspace math.gl-sun-terminator test:browser` (or set `SUN_TERMINATOR_URL`).
The browser suite blocks external imagery to verify offline overview coverage and
failure fallback, checks the community-panel rows, and samples GPU output across
rotations, poles, map/globe projections, and the interior of the feather.

## Projections and navigation

The selector covers all cartographic kernels in @math.gl/geospatial/projection. Geocentric
coordinates are represented by the interactive globe; oblique transformation uses
an oblique cylindrical preset. Regional and perspective projections have explicit
geographic bounds to avoid displaying singularities or folded surfaces outside
their useful domains. QSC shows the front cube face.

Flat views pan and zoom with rotation disabled, including modified drag and touch
rotation. Projection changes retain the geographic center and match its local
apparent scale. Regional projections adjust unsupported centers and show a status
message. Switching uses a 1.5-second geometric surface morph with a smooth
acceleration curve. The vertex shader animates progress over a mesh uploaded once.

Visible curvature is tessellated to a 0.6-pixel midpoint error target, with a
maximum seven refinement levels. Continuous vertices are shared; both banks of
each cut stay separate. Each piece rotates and translates before its remaining
deformation, and back-facing folds are culled. Patches missing from one projection
keep their shape and retire/appear locally instead of stretching into boundary
points. Rapid selections queue the latest destination. Reduced motion switches
immediately.

Cut layouts include four-lobed interrupted sinusoidal and Mollweide maps, plus
D3's Albers USA composite: contiguous states, Alaska at 0.35 scale, and Hawaii.
The USA imagery is clipped to Census state outlines using a geographic mask atlas. Alaska's texture wraps across the
antimeridian without a gap. Centers within each USA component are preserved;
switching from outside its coverage fits the complete composite.

Additional projections use a geographic image mesh and the same per-fragment
solar shading as the globe. Cut maps expose geographic sampling viewports through `getCutViewports`. The community shared Tile2D layer combines these viewports into one cache, selecting detail independently for Hawaii, Alaska, interrupted lobes, and H3 faces. Continuous cartographic views retain the overview. H3 uses the actual H3 icosahedron orientation with a resolution-zero cell grid.

Run `yarn workspace math.gl-sun-terminator test:projections:browser` to check every
projection for visible map coverage, disabled rotation, ordinary panning,
queued morphs with cuts, and reduced-motion behaviour.

The +0–24 h slider scrubs relative to the time at load, or the last manually entered
UTC date/time. Playback loops over this 24-hour interval. Editing date/time resets
the slider anchor. Playback and morph animation frames are cancelled on unmount.

Overview GPU textures remain owned by the renderer and are reused across projection and morph layers, avoiding a blank frame while a new layer uploads imagery. They are destroyed after deck finalization.

Run `yarn workspace math.gl-sun-terminator test:cuts:browser` to check high-zoom GPU morphs, constant buffers, inset layouts, and cleanup.
