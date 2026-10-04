<!-- SPDX-License-Identifier: MIT -->
<!-- SPDX-FileCopyrightText: Copyright (c) vis.gl contributors -->

# Rebuild Kepler globe support on shared vis.gl primitives

Status: proposed migration roadmap, October 4, 2026. This document records the
architecture and sequencing; the listed destination work is not yet implemented.
The cross-repository tracker is [deck.gl-community #688](https://github.com/visgl/deck.gl-community/issues/688).

## Goal and end state

Kepler's globe support should be rebuilt on general primitives from math.gl,
luma.gl, loaders.gl, deck.gl and deck.gl-community. Kepler should compose those
public APIs and retain application state, controls and presentation. A second
application should be able to build the same globe without importing Kepler
packages, copying shader patches or subclassing private controller state.

Move reusable behavior with its fixes and regression cases, rather than freezing
the first globe implementation into another repository. Replace Kepler workarounds
incrementally as supported library releases become available. Keep compatibility
adapters temporary, with an explicit removal condition and supported version.

## Responsibilities

| Owner | General primitives | Integration boundary |
| --- | --- | --- |
| math.gl | Ray/intersection and horizon geometry, geodetic conversion/local frames, wrapped geographic extents, bounded subdivision, astronomy and lighting inputs | Pure numerical inputs and outputs; no deck viewport, GPU device, tile request or Kepler config dependency |
| luma.gl | Scattering and depth shader building blocks, GPU buffers/textures, render-state and shadow-pass contracts | Coordinate conventions and numerical fixtures shared with CPU calculations; no application UI |
| loaders.gl | Raster/vector decoding, typed values, masks/statistics, format detection, transport cancellation and source metadata | Data contracts usable by several renderers; no application-selected tile server or tooltip UI |
| deck.gl | Globe viewport/controller, projection, tile selection, generic layers/effects, picking and collision | Public APIs that consume shared math, shaders and decoded data |
| deck.gl-community | Basemap composition, MVT/GeoArrow adapters and independently useful atmosphere/sky prototypes | Incubate layers and upstream mature generic behavior; preserve existing style/source-group architecture |
| kepler.gl | Redux/configuration, schemas, controls, localization, themes, attribution presentation and export UX | Compose released library capabilities; avoid ownership of general globe algorithms |

## Existing foundations and gaps

Reuse math.gl's spheroid conversion kernels, Ellipsoid/EllipsoidTangentPlane,
Ray/SphereShape intersection and bounding-volume APIs. A transformed sphere can
represent an ellipsoid; establish semantics and precision before adding another
intersection implementation. Extend existing polygon cuts and polyline/triangle
subdivision rather than introduce duplicate tessellators.

The sun/sky and optional star APIs already supply celestial directions, lighting,
globe adapters, catalog motion and layer data. [Cloud lighting #191](https://github.com/visgl/math.gl/pull/191)
is merged. Its atmospheric/cloud calculations have documented approximations;
they do not implement a volumetric GPU atmosphere. Shared star visibility and
observational qualification remain on the [sun roadmap](../docs/modules/sun/roadmap.md).

The most useful math.gl gaps to investigate are altitude-aware horizon/segment
occlusion and wrapped extent operations that support conservative visible bounds.
Screen sampling and viewport-to-geographic bounds remain deck.gl responsibilities.
Require a demonstrated second consumer and a precise contract before exporting a
new helper. Proposed names and signatures are intentionally deferred to that review.

## Migration tranches

### 1. Shared geometry contracts and upstream interaction

- Specify coordinate frames, units, sphere/ellipsoid choice and true ray-miss
  behavior. Distinguish ray, infinite line and finite segment intersections.
- Qualify existing intersections and identify missing horizon/extent operations.
  Cover elevated points as well as surface anchors; a normal-facing test alone
  does not establish elevated-point occlusion.
- Adopt [deck.gl #10385](https://github.com/visgl/deck.gl/pull/10385), merged August 31,
  when available in the supported release. Assess remaining pan/pole/off-globe
  gaps against upstream behavior before removing Kepler's controller workaround.

### 2. Atmosphere, sky and globe depth

- Compose math.gl sun/stars inputs with luma.gl shader primitives and reusable
  deck/community layers for atmosphere, terminator, sky and depth occlusion.
- Define CPU/GPU frame conversion explicitly. Keep deck's common-space globe
  radius convention in deck.gl rather than embed its value in math.gl.
- Include configurable zoom fading and isolated blend/depth state. Separate the
  decorative broad halo from physical scattering. Render sky in the canvas so
  live views and captures use the same scene.

### 3. Labels, basemap and imagery

- Align glyph/background depth state, billboard culling, collision and picking,
  including Arrow-backed data and merged caller sublayer props.
- Address native-source overzoom, latitude-dependent tile LOD and high-zoom
  precision; Kepler's zoom thresholds are not universal math constants.
- Correct WMS coverage near poles/limb and mesh invalidation on projection changes.
  Reuse cached imagery only at adequate extent/resolution. Replace padded sampling
  heuristics only with a qualified conservative bound.
- Follow [deck.gl #10350](https://github.com/visgl/deck.gl/pull/10350), still open,
  for globe Mercator tile/terrain warping rather than build a competing fix.

### 4. Aggregation and curved geometry

- Scope globe heatmap projection separately from flat-map antimeridian/world-copy
  fixes. Keep aggregation adapters in deck/community and decoding in loaders.gl.
- Generalize grid/hex cell projection through supported layer extension points.
- Compose math.gl cuts/subdivision into curvature/error-controlled meshes with a
  global output/work budget, preserved holes/seams/attributes and independent
  outlines. [Kepler #3548](https://github.com/keplergl/kepler.gl/pull/3548) is closed
  without merging: research evidence, not a delivered algorithm.
- Specify polygon base elevation independently of extrusion height. Qualify
  altitude-aware projection and picking rather than infer globe parity from a
  flat-map feature. Define centroid semantics before standardizing shared math.

### 5. Raster/3D interoperability and capture parity

- Share typed band/mask/statistics contracts, cancellation, format detection and
  pixel/band picking across loaders and layers.
- Preserve altitude anchors and surface picking. Keep annotation schemas and
  ground-fallback UX in Kepler.
- Qualify shadow-pass sizing/depth/state, palette rebinding after model rebuild,
  and animated view-state updates. Export scheduling and dialogs remain Kepler.

These are cross-repository migration tranches, separate from the existing six
sun/sky tranches. Destination decisions remain proposals except where an upstream
merge is explicitly recorded.

## Additional merged improvements since the July audit

| Improvement | Merged Kepler evidence | Destination and implications |
|---|---|---|
| Tile LOD, high-zoom precision and pan stability | [#3551](https://github.com/keplergl/kepler.gl/pull/3551) (July 26) | deck.gl viewport/tile selection first; community basemap composition second. Kepler compensates latitude-dependent LOD, uses native source max zoom for overzooming, removes a zoom-12 viewport switch and avoids erroneous float32 back-face culling. Treat zoom 16 as a Kepler workaround, not a universal guarantee. Test precision and pole transitions before copying thresholds. |
| WMS globe coverage and view-mode changes | [#3557](https://github.com/keplergl/kepler.gl/pull/3557) (July 27) | deck.gl WMS/BitmapLayer integration. Correct visible bounds at poles/limb, rebuild the globe mesh when projection changes, and reuse an image only while extent and resolution still suffice. math.gl can supply wrapped geographic extent and horizon primitives; viewport sampling, requests and cache policy stay in deck.gl. The 81-sample padded bound is a heuristic, not an exact conservative bound. |
| Off-globe interaction | [#3593](https://github.com/keplergl/kepler.gl/pull/3593) (August 1) | deck.gl controller: detect true ray misses rather than treating limb-clamped unprojection as a hit; freeze/reanchor dragging and handle off-globe wheel bursts. Reuse math.gl ray intersection with explicit miss semantics. Kepler currently duplicates ray math and hard-codes common-space radius 256; keep that coordinate convention in deck.gl. |
| Blending and depth-state isolation | [#3594](https://github.com/keplergl/kepler.gl/pull/3594) (August 1) | deck.gl/community layer composition using luma.gl parameters. Apply user-layer blending without overriding atmosphere, background or depth-disk state. Do not put GPU draw parameters into math.gl. |
| Atmosphere zoom fade and optional broad halo | [#3595](https://github.com/keplergl/kepler.gl/pull/3595) (August 1), [#3621](https://github.com/keplergl/kepler.gl/pull/3621) (August 9) | Community atmosphere layers backed by luma.gl shader modules. Fade halo and terminator smoothly as map detail becomes dominant; expose configurable transitions instead of assuming Kepler zoom units. Keep the decorative sun-independent broad halo distinct from physical scattering. Kepler now defaults broad halo and stars on; preserve explicit consumer controls. |
| Complete label visibility, collision and backgrounds | [#3730](https://github.com/keplergl/kepler.gl/pull/3730), [#3731](https://github.com/keplergl/kepler.gl/pull/3731) (September 15), [#3707](https://github.com/keplergl/kepler.gl/pull/3707) (September 16), [#3761](https://github.com/keplergl/kepler.gl/pull/3761) (September 29) | deck.gl TextLayer/CollisionFilterExtension and community MVT/GeoArrow integration. Glyphs and backgrounds need matching globe depth tests, no depth writes and no billboard face culling; flat-map overlay behavior remains. Merge caller sublayer props for Arrow data. Test collision and picking near limb and on far side; collision filtering already exists upstream. |
| Rendering lifecycle regressions | [#3605](https://github.com/keplergl/kepler.gl/pull/3605), [#3622](https://github.com/keplergl/kepler.gl/pull/3622), [#3677](https://github.com/keplergl/kepler.gl/pull/3677) | Carry regression cases for device debug setup, bound super calls and palette-texture rebinding after model rebuild. Fix source lifecycle contracts in deck.gl/luma.gl where applicable; do not reproduce application patches indiscriminately. |
| Shadow pass consistency (adjacent rendering work) | [#3680](https://github.com/keplergl/kepler.gl/pull/3680), [#3681](https://github.com/keplergl/kepler.gl/pull/3681), [#3683](https://github.com/keplergl/kepler.gl/pull/3683) | deck.gl/luma.gl: drawing-buffer sizing in exports, stable depth writes/layer ordering, and hover-independent shadow encoding. math.gl supplies sun direction/color/intensity; shadow buffers, state restoration and highlights remain GPU/layer responsibilities. |
| Elevated geometry and 3D annotation anchors (adjacent) | [#3719](https://github.com/keplergl/kepler.gl/pull/3719) (September 14), [#3757](https://github.com/keplergl/kepler.gl/pull/3757) (September 29) | deck.gl supports surface picking and altitude-aware geometry; community can prototype independent polygon base elevation. Preserve base offset versus extrusion height and units. math.gl supplies geodetic conversion/local frames and altitude-aware horizon math. Kepler retains controls, saved annotation schemas and fallback UX; verify globe behavior independently. |
| Mixed-geometry density input (adjacent) | [#3642](https://github.com/keplergl/kepler.gl/pull/3642) (August 17) | loaders.gl owns WKB/WKT/GeoArrow decoding, deck.gl/community own aggregation adapters, math.gl only pure geometry calculations if shared and well defined. Specify centroid meaning (planar/geodesic/length-weighted) before standardizing; Kepler merged support for points and lines as well as polygons. |
| Raster values, cancellation and identify (adjacent) | [#3704](https://github.com/keplergl/kepler.gl/pull/3704), [#3715](https://github.com/keplergl/kepler.gl/pull/3715), [#3723](https://github.com/keplergl/kepler.gl/pull/3723), [#3767](https://github.com/keplergl/kepler.gl/pull/3767) | loaders.gl: typed data, masks/statistics, format sniffing and AbortSignal propagation. deck.gl/community: texture normalization and pixel/band picking. Kepler: tooltip/extract UI and TiTiler orchestration. #3704 does not fix float32 multiband composites; #3767 nonrectangular extraction uses a bounding rectangle. Do not claim full raster parity. |
| Capture parity | [#3636](https://github.com/keplergl/kepler.gl/pull/3636), [#3637](https://github.com/keplergl/kepler.gl/pull/3637) (August 15) | Keep sky in the rendered scene and rebuild/render against each animated view state so point size and atmosphere match live rendering. GPU layer APIs belong in deck.gl/community; export dialogs and scheduling remain Kepler. |


## Qualification and completion gates

Each implementation tranche should land as independently reviewable library PRs,
followed by a Kepler adoption PR. Record dependency versions and remove the replaced
workaround only after parity passes. A prototype is not upstream completion.

- Numerical fixtures: poles, antimeridian, tangency, near misses, inside/behind
  intersections, elevated anchors, extreme camera distances and high-zoom precision.
  State radians/degrees, meters/common units, ECEF/ENU/J2000 and sphere/WGS84 contracts.
- Geometry fixtures: mixed geometries, holes, seam attributes and bounded output
  under adversarial input; error tolerance and work budget must both be explicit.
- Rendering fixtures: standard/Arrow labels and backgrounds, collision/picking,
  far-side occlusion, flat/globe transitions, vector/raster sources, atmosphere
  disabled, configurable fades and live/captured parity.
- Data/lifecycle fixtures: request abortion, source max zoom, WMS coverage/cache
  resolution, float raster masks/ranges, model rebuild and shadow state restoration.
  Float32 multiband support is not implied by Kepler #3704; nonrectangular raster
  extraction in #3767 currently uses a bounding rectangle.
- Public API and migration docs, appropriate builds/lint/tests, supported-version
  qualification and a non-Kepler composition example for each reusable layer family.
- Audit exact file/dependency licenses before porting. Kepler's repository is MIT,
  but retain each source's copyright and provenance with SPDX comments and linked
  documentation. Existing Cesium-derived math.gl code is MIT AND Apache-2.0 and
  must keep its notices. New implementation is JavaScript/TypeScript; no C/native
  source ports. This documentation PR copies no external implementation code.

Completion means Kepler uses supported vis.gl APIs for globe geometry, astronomy,
atmosphere, imagery, aggregation and occlusion, with no general algorithm stranded
in its application packages. Remaining Kepler code owns configuration and user
experience. Track remaining exceptions and their removal conditions in #688.
