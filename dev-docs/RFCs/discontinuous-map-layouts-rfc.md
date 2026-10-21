# Discontinuous map layouts

- Status: Draft investigation; no implementation proposed for immediate release
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
reports positive-area overlaps in the final flat net. These layout experiments
remain example-local; only hinge kinematics is a public library API. The example
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

Add an experimental, renderer-independent map-layout abstraction alongside CRS
coordinate transforms. Start with a textured polyhedral mesh that unfolds, using
Nicolas Belmonte's myriahedral demo as the target experience. Add spherical vector
clipping as a separate milestone. A new scalar projection alone cannot provide
correct lines, polygons, or meshes across cuts.

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

| Area | Available | Missing |
| --- | --- | --- |
| `@math.gl/projection` | Scalar forward/inverse kernels, CRS pipeline, sinusoidal, Mollweide, gnomonic, QSC | Face/lobe identity, cuts, layout placement, multiple inverse candidates |
| `@math.gl/polygon` | Planar rectangle clipping, Mercator bounds cuts, triangulation, adaptive subdivision | Arbitrary spherical face clipping and polygon reconstruction across cuts |
| `@math.gl/geometry` | `IcoSphereGeometry`, typed geometry | Indexed topological mesh, face adjacency, fold tree |
| `@math.gl/core` | Matrices, vectors, quaternions | Layout-specific hinge traversal |

`ProjectionImplementation` returns one XY pair and requires an inverse. Flat
operations preserve buffer cardinality. Geometry splitting produces additional
vertices and parts, so it needs a separate result contract.

`IcoSphereGeometry` emits a non-indexed triangle list. Reuse its construction
ideas, but retain canonical vertex/edge IDs during subdivision rather than
recovering adjacency by welding Float32 render positions. Existing subdivision
utilities explicitly require seams to be split first.

## Proposed contracts

Keep the initial layout API in an optional experimental projection entry point;
put reusable topology helpers in geometry and spherical clipping in polygon.
Avoid adding renderer dependencies or layout objects to CRS strings.

A layout needs stable region IDs, spherical boundaries, a local mapping per
region, placement transforms, and edge relations identifying cuts versus joins.
Interrupted lobes and polyhedral faces can share this contract; only polyhedral
layouts need hinges and a fold tree.

Point projection should return position plus region ID. Permit an explicit
region for boundary points; define deterministic default ownership. Inverse
lookup must reject gaps, validate containment, and report ambiguous candidates
for overlapping layouts. An ordinary scalar adapter can be added only for a
fixed layout with a documented unique-inverse policy.

Geometry output should carry typed positions/indices, region and source-feature
IDs, part offsets, and interpolation provenance. Duplicate cut vertices for each
side. Preserve holes, winding, and feature ownership when rebuilding polygons.
Declare whether input edges mean great-circle arcs, rhumb lines, or linear
longitude/latitude interpolation; these are different clipping problems.

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

1. **Source investigation completed:** main and worker source maps inspected;
   procedural and precomputed paths identified. Application licensing remains
   unverified, so proceed with independent code and independently sourced data.
2. **Mesh prototype:** fixed octahedron net, then subdivided icosahedron; textured
   globe-to-flat animation with visible cuts and folds. Verify face edge lengths,
   coincident hinge endpoints at intermediate times, coplanarity at the end,
   deterministic topology, and overlap diagnostics.
3. **Layout coordinates:** face-aware forward/inverse, gap rejection, boundary
   ownership, spatial indexing. Test interior round trips and seam duplicates.
4. **Vector geometry:** spherical line and polygon clipping, then per-region
   tessellation. Test seam crossings, exact-edge paths, poles, antimeridian,
   holes, multiple components, and attribute interpolation. Assert that no
   output triangle or path segment bridges a cut.
5. **Broader layouts:** interrupted sinusoidal/Mollweide, followed by additional
   polyhedral presets and geography-weighted cuts. Shared abstractions should
   be justified by these implementations before stabilizing the public API.

Benchmark construction, geometry expansion, inverse lookup, and animation
separately. Cache topology; the proposed exact unfolding path should update
transforms without reclipping geographic geometry. Nico's sampled-frame playback
is a separate optional approximation, with a memory/accuracy tradeoff. For
thousands of faces, use iterative tree
traversal and indexed spatial searches rather than recursion or all-face scans.

The first demonstration can therefore be substantially smaller than full
discontinuous vector-map support. It proves the experience Nico demonstrates;
it does not yet imply that existing deck.gl geographic layers can render any
layout without integration work.
