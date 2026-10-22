# Discontinuous map layouts

- Status: Experimental static API implemented; broader topology and rendering integration remain proposed
- Date: 2026-10-21

## Implementation progress

The independent experimental `HingeTree` utility now lives in `@math.gl/geometry`.
It snapshots parent/pivot/axis/rest-transform descriptors, validates rigid transforms
and acyclic connectivity, and evaluates a forest into reusable Float64 matrix buffers.
The `examples/unfolding-polyhedron` example constructs six unit squares directly
and folds them into a cube. Tests cover rigid motion, shared hinge endpoints,
descendants, root placement, deep trees, and the flat/closed cube endpoints.
No reference application code, shaders, or mesh assets were copied. The example
now generates all five Platonic solids and subdivided icosahedra (up to 1,280
faces), builds shared-edge adjacency, and selects joins with a deterministic
maximum spanning tree. It derives signed hinge angles from face normals and
reports positive-area overlaps in the final flat net. Dynamic cut selection and animation remain example-local. The static region-based
API described below now provides a separate public experimental entry point. The example
now maps NASA Blue Marble imagery onto the subdivided icosahedron with an
independently written WebGL 2 renderer. Original sphere coordinates travel with
each rigid panel; per-fragment spherical sampling handles longitude wrapping and
poles without interpolating discontinuous UVs. Imagery attribution and NASA reuse
terms are documented in the example. The cut selector now compares the original
geometric strategy with land-exposure weights from public-domain Natural Earth
polygons. A separate 24-panel AirOcean preset uses the ISC-licensed topology and
orientation from d3-geo-polygon, with independently implemented hinge evaluation.
It reproduces the cut arrangement, not the Gray-Fuller projection. The example
reports sampled cut-on-land length and final overlaps; connected continents are
not guaranteed on arbitrary triangulations. Coastline-aligned meshes, vector
clipping, and motion collision handling remain future work.

## Recommendation

Provide an experimental, renderer-independent `DiscontinuousMap` in the optional
`@math.gl/geospatial/discontinuous` entry point. Its pipeline is:

**geographic geometry → spherical region clipping → local projection → placement → region-tagged parts**.

Regions, local mappings, placements, and seam topology are the shared abstraction.
A polyhedral layout may derive placements from a hinge tree, but interrupted
projections do not need hinges. Static geographic projection must work independently
of unfolding, textures, WebGL, CRS registries, and renderer-specific tessellation.
The next high-level milestone is reliable vector geometry across cuts, rather than
additional unfolding controls.

## Evidence and limits

[Nico's demo](https://philogb.github.io/page/myriahedral/) exposes graticule,
subdivision, solid, and geography-aligned examples with an unfolding control.
His [article](https://medium.com/vis-gl/unfolding-the-earth-myriahedral-projections-in-webgl-6b2bcfd00a30)
describes weighted cuts and folds. These motivate a topology-and-animation API.
Finite spherical faces still incur distortion when mapped to planar triangles;
rigid unfolding preserves the planar faces, not the original spherical metric.

Source discovery found the public website repository
[philogb/philogb.github.com](https://github.com/philogb/philogb.github.com).
Code search found a demo link in `_posts/1941-01-03-myriahedral.mdown`, but did
not locate the implementation. The live page loads
[`bundle.js?2`](https://philogb.github.io/page/myriahedral/bundle.js?2).
The published bundle and its source map have now been inspected; findings are
below. The original application license remains unverified. Per the project
decision, implement independently: do not port the recovered application code,
shaders, mesh tables, or precomputed assets. Use the observations to establish
requirements, then derive algorithms from mathematical definitions and documented
research. Publicly readable source and dependency licenses do not establish a
license for the application or its data.

D3's [polyhedral implementation](https://github.com/d3/d3-geo-projection/blob/main/src/polyhedral/index.js)
uses a tree of faces, per-face projections, composed planar transforms, face
selection, and inverse candidate testing. Its
[interrupted implementation](https://github.com/d3/d3-geo-projection/blob/main/src/interrupted/index.js)
selects lobes and applies offsets. These are useful coordinate/layout references;
neither source should be assumed to supply a general arbitrary-seam clipping API.

## Findings from Nico's published implementation

### Reproducible source evidence

Inspected on 2026-10-21 without executing the downloaded code:

- [Main bundle](https://philogb.github.io/page/myriahedral/bundle.js?2):
  SHA-256 `d17e48d85975853c4ba4c5ec4573f739c9240b5dc3619eeff5d5443d709da9d6`.
- [Main source map](https://philogb.github.io/page/myriahedral/bundle.js.map):
  8,888,729 bytes, 345 sources, all with embedded `sourcesContent`;
  SHA-256 `7c129e54a2f36daa5d3cb00adc63f868f6a928f15f5659e4f4d496f5aab67e92`.
  The map is explicitly referenced at the end of the bundle. Application source
  names include `myriahedral.js`, `quad-edge.js`, `obj.js`, `projections.js`,
  `models.js`, `app.js`, and `polyhedra.js`.
- [Project worker](https://philogb.github.io/page/myriahedral/2cb15c178f66a76f8db3.worker.js)
  and its referenced
  [source map](https://philogb.github.io/page/myriahedral/2cb15c178f66a76f8db3.worker.js.map):
  220 source entries. This supplies the actual `project.js`; the main map's
  `project.js` entry is only a worker-loader wrapper.
- [Polyconic asset](https://philogb.github.io/page/myriahedral/static_small/polyconic.json):
  parsed as JSON to verify the precomputed format.

The source locations below are one-based lines in the embedded original files,
not bundle lines. Sources were extracted into temporary inspection files, not
added to this repository. These deployment URLs are mutable; hashes identify the
main bundle/map inspected here. No published source-map URL needs to be guessed.

### Rendering and animation

The renderer is **luma.gl 4.0.6**, confirmed by embedded `luma.gl/package.json`.
`app.js` imports `AnimationLoop`, `Model`, `Geometry`, and `Matrix4`; `models.js`
defines custom GLSL. The inspected rendering path uses luma.gl directly despite
the website's deck.gl category label.

There are two distinct animation stages:

1. `myriahedral.js:567` (`unfold`) constructs triangular face positions by
   traversing connected faces from a fixed root and applying a Rodrigues rotation
   around the shared edge. Its angle depends on the original face normals and
   the unfolding parameter. `projections.js:89` samples this into mesh frames.
2. `app.js:76` (`UnfoldableView`) selects adjacent frames. `models.js:24` names
   its interpolation helper `slerp`, but the active body is GLSL `mix`. Positions
   and normals are linearly blended; this is not exact rigid hinge motion between
   frames. It is a playback approximation, not a reason to model unfolding as
   arbitrary vertex interpolation in math.gl.

The unfolding routine also contains an explicit cube rotation-axis workaround
that restores a vertex's original position based on radius. Treat it as prototype
behavior, not a numerically qualified general hinge implementation.

### Topology, cuts, and weights

`quad-edge.js` provides explicit vertex/edge/face connectivity. In
`myriahedral.js:237`, `spanningTrees` uses Prim's algorithm to choose a **maximum
spanning tree of the dual graph**. Selected edges are joins. It builds a new
unfoldable mesh, reusing vertices along the parent join and creating additional
vertices elsewhere, then derives cut and fold visualization geometry. Nontriangle
faces are triangulated before the triangular unfolding routine runs.

`projections.js:392` composes subdivision-level, graticule, image-sampled, and
stored-edge weights. Image weights sample the land-mask red channel at an edge
midpoint and can reverse sign. They are a heuristic preference, not a guarantee
that a full edge or continent avoids cuts. Some internal joins receive very
large weights; an independent API should distinguish mandatory joins from scores
and reject inconsistent constraints rather than rely on magic constants.

`getMaxEdge` scans edges of the visited faces repeatedly. For bounded-degree
meshes this suggests quadratic tree-building work; no benchmark was run. A
priority queue and stable edge-ID tie-breaking are appropriate independent
implementation choices. The inspected construction does not establish an
overlap-free net or collision-free animation.

### Procedural generation versus precomputed data

The active `project.js:3` worker branches on `descriptor.type`:

- Static descriptors fetch `static_small/<name>.json`. The app marks graticule,
  recursively subdivided, and coastline/sealine examples static.
- Dynamic descriptors call `getGraticule` and return sampled geometry and cut,
  fold, and dual-edge frames. The app's `rot_*` solid presets use this path.
  Their inputs include stored solid geometry and edge weights in `polyhedra.js`.

`app.js:1371` creates a two-worker pool. Thus source availability does not mean
every visible example is generated procedurally at runtime. `polyhedra.js` also
contains a large geography-aligned mesh table; recreating such meshes requires
an independent generation process and suitable input data.

The downloaded polyconic asset is 4,660,002 bytes and has three frames. Each frame
contains 45,360 position scalars (15,120 vertices / 5,040 triangles), an equally
sized normal array, 15,120 scalar distance attributes, and 30,240 UV scalars.
It also includes cut/fold/dual frames and camera/root information. This validates
the sampled-frame data model, but is not a performance measurement.

### Texture mapping and vector scope

`obj.js:491` expands faces into render triangles with normals and UVs and adjusts
longitude seams. `models.js:110` computes spherical texture coordinates from the
interpolated original-surface position, independently of the unfolded position.
The app loads `img/landmask.jpg` for rendering and `img/landmaskout.jpg` for
weighting. This is a textured surface, not a general clipped vector map.

The inspected application path does not provide the face-aware geographic
forward/inverse API or arbitrary line/polygon seam splitting proposed here.
Bundled D3 clipping modules do not by themselves demonstrate that capability.

### Independent implementation boundary

No application-wide license notice was found in the inspected application
sources. `obj.js` credits Paul Heckbert's 1999 code; that credit is not a reuse
grant. luma.gl's package declares MIT, which covers that dependency rather than
Nico's complete demo. Do not assume that the public repository, source map, or
bundled third-party notices authorize copying the application.

Build new TypeScript topology, hinge transforms, shaders, and tests from the
mathematical requirements below. Generate our own primitive meshes and fixtures;
use separately licensed geographic inputs when adding land-aware weighting.
Do not copy Nico's data tables, presets, special-case fixes, or frame assets.
This is an independent implementation plan, not a claim of a clean-room process:
the reference source has been inspected.

## General-purpose hinge geometry

The reusable mathematical primitive is a tree of rigid panels connected by
revolute joints along shared edges. It does not require geographic coordinates.
It can support polyhedron nets, foldable packaging, and articulated panel models.

Propose a small optional utility in `@math.gl/geometry`, using core matrices or
quaternions. Each joint needs parent/child IDs, a hinge axis and pivot expressed
in a declared local frame, a rest attachment transform, and an angle. With column
vectors, a possible convention is:

`worldChild = worldParent * T(pivot) * R(axis, angle) * T(-pivot) * restChild`

Here the pivot/axis are in the parent's rest frame and `restChild` maps child
coordinates into that frame at zero joint angle. Define that convention explicitly
and test it; do not mix world-space and local-space axes. The utility evaluates
poses, while a map-layout builder derives joints and target angles from mesh
adjacency and face normals. Root placement is an independent transform.

Keep topology construction, cut selection, spherical texture coordinates, and
geographic clipping outside this primitive. Support trees (or multiple independent
trees) first. Closed linkage loops need constraint solving; collision detection,
paper thickness, bending, and material physics are separate capabilities.
Triangulation edges inside a rigid panel must not become independently moving
hinges. Validate connectivity, nondegenerate axes, and shared-edge compatibility.

Evaluate transforms in parent-before-child order with reusable output buffers.
Test zero-angle rest poses, fixed hinge endpoints, preservation of distances
within a panel, descendant motion, root-transform equivariance, and known flat
nets. For large trees, quantify accumulated floating-point error. A renderer may
choose sampled-frame playback, but that should have an explicit approximation
contract distinct from exact rigid-pose evaluation.

## Existing building blocks and gaps

| Area | Available | Remaining work |
| --- | --- | --- |
| `@math.gl/geospatial/projection` | Scalar forward/inverse kernels and CRS pipelines | Optional adapters with explicit inverse policy |
| `@math.gl/geospatial/discontinuous` | Convex spherical regions, point/inverse lookup, seam-aware lines and polygons, AirOcean and interrupted sinusoidal | Global/complement polygons, curved seams, spatial acceleration, packed attribute provenance |
| `@math.gl/geometry/polygon` | Planar clipping, triangulation, adaptive subdivision | Integration with region-tagged projected geometry |
| `@math.gl/geometry` | `HingeTree`, generated geometry | Reusable mesh topology and constrained cut selection |
| Examples | Geographic cut weights, unfolding, original-surface texture sampling, coordinate hover picking | Renderer integration for projected vector data |

`ProjectionImplementation` returns one XY pair and requires an inverse. Flat
operations preserve buffer cardinality. Geometry splitting produces additional
vertices and parts, so it needs a separate result contract.

`IcoSphereGeometry` emits a non-indexed triangle list. Reuse its construction
ideas, but retain canonical vertex/edge IDs during subdivision rather than
recovering adjacency by welding Float32 render positions. Existing subdivision
utilities explicitly require seams to be split first.

## Static architecture and first API

`DiscontinuousMap` snapshots an ordered list of `MapRegion` definitions. A region has:

- A stable string ID and a convex spherical boundary of minor great-circle arcs.
- A strictly interior spherical reference point that selects the half-spaces.
- A local forward mapping and an inverse returning a coordinate or `null`.
- An optional invertible six-coefficient affine XY placement.

Callbacks must describe a continuous, one-to-one local map over the region and
must remain stable after construction. Region domains need not cover the sphere;
gaps and overlaps are valid. Shared edges must have matching subdivision on both
sides. Geographic coordinates are longitude/latitude in degrees on a sphere;
height, datum transformation, and ellipsoidal surface metrics are outside this API.

The separate entry point avoids changing scalar projection cardinality or adding
layout state to CRS strings. The first implementation keeps its spherical clipping
helpers private, rather than prematurely exporting a second geometry framework.
There are no imports from examples or Nico's application.

### Point ownership and inverse lookup

`findRegions(lonLat)` returns all containing region IDs, including boundary matches.
`projectPoint(lonLat, regionId?)` returns `{regionId, position}` or `null`; the first
containing region owns an unspecified boundary point. Supplying a region chooses
one side of a cut. Longitude wraps; antipodal edges are rejected as ambiguous.

`unprojectPoint(xy, regionId?)` returns all validated candidates. It reverses the
placement, applies the local inverse, checks spherical containment, and checks
forward residual. Map gaps return `[]`; overlaps or continuous joins can return
multiple candidates. Picking code must select the visible region when occlusion
matters; a static inverse cannot resolve a renderer's depth order.

`seams` pairs complete spherical boundary edges and identifies unpaired boundaries.
The initial `join`/`cut` classification compares placed endpoints and midpoint.
This is sampled continuity metadata, not a proof for arbitrary user callbacks.
Clipping always splits at every region boundary, so correctness does not depend
on that classification. Cuts have independently placed copies of boundary vertices.

### Lines and polygons

`projectLine` returns a list of `{regionId, coordinates, sourceCoordinates}` parts.
Input edges are minor great-circle arcs, not rhumb lines or straight longitude/
latitude interpolation. Clip an arc against oriented spherical half-spaces using
3D chord intersections, then normalize onto the sphere. Preserve separate exits
and reentries. Boundary-coincident arcs appear on both incident regions, while
isolated tangencies do not emit a zero-length line.

`projectPolygon` accepts one exterior followed by holes and returns region-tagged
polygons, each with matching source rings. Winding is independent on input; output
exteriors are counterclockwise and holes clockwise. Open or closed input rings
are accepted; output rings close explicitly. Holes intersecting cuts become part
of exterior boundaries, and one source polygon can yield several disconnected
polygons within the same region. One call retains feature ownership; callers attach
their feature ID to its results. Packed arrays and per-attribute interpolation
provenance are deferred; source coordinates are retained for every generated vertex.

The first implementation requires each input polygon to fit in one **open
hemisphere**. Its gnomonic chart turns great-circle edges and region half-spaces
into straight lines. Convex half-space clipping constructs a region mask in that
chart; the MIT-licensed `polygon-clipping` kernel reconstructs intersections,
holes, and disconnected components. The inverse chart restores spherical source
coordinates before the region mapping and placement are applied. This avoids
coordinate jitter at coincident seams. An optional `chartCenter` selects the chart;
otherwise the outer-vertex mean direction is used. If that chart cannot contain
all vertices with a positive margin, reject the polygon explicitly. This does not
yet support whole-globe polygons, spherical complements, or polygons that require
multiple hemisphere charts. Callers must split those into supported polygons.

After clipping, great-circle arcs are sampled with a maximum angular step (default
2 degrees) and an adaptive midpoint chord-error target (default `1e-4` output
units). This is an approximation criterion, not a certified error bound for
arbitrary callbacks. Exceeding recursion/output limits throws. Use larger distance
tolerances when choosing meter-scale output. No resampled segment crosses a region
boundary; downstream triangulation must consume each polygon independently.

### Validation against three families

| Case | Region domains and local map | Placement and seam requirements | Executable validation |
| --- | --- | --- | --- |
| AirOcean | 24 spherical triangles with radial/gnomonic mapping into their original facets | Independent rigid XY placements from the licensed fixed join tree; 23 joins, 13 cuts | Global point coverage and inverse round trips, exact topology, line-length and polygon-area conservation, holes and seam-side output |
| Interrupted sinusoidal | Six convex hemisphere lobes; `x = center + (longitude-center) cos(latitude)`, `y = latitude` | Lobe offsets and equatorial joins; the poles have multiple placed copies | Analytic coordinate oracle, global point coverage/inverse, interrupted lines, polygons and holes across the date line |
| Antimeridian-cut cylindrical | Two regional spherical domains on opposite sides of 180 degrees, with equirectangular local mapping | Separate +180/-180 output sides despite one geographic seam | Equivalent +/-180 point ownership, line and polygon splitting without a long bridge |

The cylindrical test intentionally excludes the poles: a full rectangular cylindrical
map represents each pole as an edge, so its singular point behavior needs a separate
contract. This third case tests the ordinary wrap seam without claiming to solve
that singularity. The six-lobe sinusoidal preset is an independent arrangement,
not a claim to reproduce a named historical interruption pattern.

AirOcean reproduces the **cut arrangement**, using gnomonic/radial face mappings.
It is not the Gray-Fuller projection and is not equal-area. Its topology and rotation
are adapted from the ISC-licensed d3-geo-polygon AirOcean preset, pinned upstream at
`93f12a456e169d9b1b40fcaa42cbeeeee1251d36`. The license is shipped beside the source.
The spherical clipping, placements, and sinusoidal implementation are independent
of Nico's application. `polygon-clipping` is a separately licensed MIT dependency.

Regression tests additionally cover polygon holes contained within a region,
holes opened by a cut, disconnected components, reversed winding, coincident
seams without jitter, inverse ambiguity, finite/invertible placement validation,
antipodal edge rejection, and unsupported hemisphere rejection.

## Myriahedral construction proposal

1. Generate an indexed spherical triangular mesh with consistently oriented faces.
2. Build adjacency and validate manifold edges and connectivity.
3. Give each dual edge a retention score. A maximum spanning tree then retains
   preferred joins; non-tree edges become cuts. Name the score explicitly to
   avoid confusing minimum cut cost with minimum retention weight.
4. Root the tree and unfold child faces about shared edges using rigid transforms.
   Interpolate hinge angles for animation, rather than linearly interpolating
   vertex positions (which stretches faces).
5. Emit face-local render vertices, UVs, face IDs, and transforms. Handle texture
   longitude seams independently from geometric cuts.
6. Measure flat-layout overlap. A spanning tree guarantees connected, acyclic
   joins, not a non-overlapping net. Report overlap rather than claiming success.

Use a sphere first, explicit radius/units, and no implicit datum conversion.
An animated mesh produces XYZ positions, while a fully unfolded map uses XY.
Keep height/extrusions out of the first contract. Any later ellipsoidal mapping
must state its sphere conversion and resulting distortion.

## Delivery sequence and acceptance

1. **Completed: reference investigation and independent hinge primitive.** Keep
   the existing source evidence and licensing boundary above.
2. **Completed: unfolding prototype.** All Platonic solids, subdivided icosahedra,
   Earth texture, geography-aware cuts, AirOcean arrangement, and overlap diagnostics.
3. **Implemented experimentally: static discontinuous maps.** Region-aware points,
   explicit inverse candidates, clipped line parts, and hemisphere-bounded polygon
   reconstruction. Validate the shared contract against the three cases above.
4. **Next: vector rendering integration.** Render projected coastlines, graticules,
   filled polygons and holes in both presets; triangulate per region, preserve
   feature/attribute provenance, and connect picking to visible region IDs.
5. **Broaden spherical topology.** Support hemisphere-spanning/global polygons,
   complementary interiors and curved seams; define exact cylindrical pole policy.
6. **Scale and stabilize.** Spatial indexing, cached compiled layouts, packed batch
   buffers, expansion/performance benchmarks and additional interrupted projections.
   Only then consider stable CRS adapters and downstream deck.gl integration.

Static output already separates topology from local coordinates and placement.
Animation can later update placements without changing feature identity, but moving
geometry must retain original spherical coordinates and region membership. A
spanning tree still does not guarantee a non-overlapping net or collision-free
motion. Neither static support nor the textured example implies existing deck.gl
geographic layers can consume arbitrary layouts without integration work.
