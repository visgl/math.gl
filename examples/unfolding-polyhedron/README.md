# Unfolding polyhedra

An independent demonstration of `HingeTree` with all five Platonic solids:
tetrahedron, cube, octahedron, dodecahedron, and icosahedron. The icosahedron supports
0–3 spherical subdivision levels (20, 80, 320, or 1,280 triangular panels).

From the repository root:

```sh
yarn install
yarn workspace math.gl-unfolding-polyhedron start
```

Choose a solid, use **Unfold** or **Play**, and drag to orbit. **New cut layout**
changes the deterministic seed used to score edges. Gold edges remain connected
as hinges; dark edges are cut. **Flat view** unfolds the net and looks straight at it.
Subdivision is available only for the icosahedron.

## Cut strategies

The **Cuts** selector preserves the unfolding amount, camera, subdivision and seed
when comparing the original and ocean-preferred strategies:

- **Original · geometric** retains the existing short-edge/seeded maximum spanning tree.
- **Ocean-preferred** (default) samples Natural Earth land polygons along every
  shared edge's minor great-circle arc, at most 0.25 degrees apart. The tree
  maximizes retained land-crossing length (rounded to metre bins), leaving cuts
  preferentially in oceans. The old score is a bounded tie-breaker. The comparison
  reports estimated land crossed by cut edges, against the original strategy on
  the same mesh and seed. It is not an exact coastline intersection measurement.
- **Dymaxion · AirOcean (24 panels)** uses a fixed, geographically oriented
  icosahedron with three split faces and 23 prescribed hinges. Solid, subdivision
  and seed controls are disabled for this preset; switching back restores the
  selected subdivision. Its net has no face overlaps. This reproduces the
  AirOcean cut topology, **not** the Gray-Fuller projection: our texture still
  uses radial spherical sampling on planar facets. Subdividing this preset is
  not implemented.

The land mask is bundled and works offline; it does not depend on image colors or
NASA availability. Coastlines are coarse (1:110m); small islands and narrow
isthmuses can be missed. A spanning tree must break cycles, so even land-weighted
cuts cannot guarantee connected continents on an arbitrary triangulation. Neither
automatic strategy optimizes flat-net overlap or checks motion collisions.
See [data provenance and licenses](data/README.md).

## Construction

- `polyhedra.ts` generates symmetric coordinates and finds convex polygon faces.
  The dodecahedron is constructed as the dual of the icosahedron. Spherical
  subdivision caches edge midpoints by vertex ID and normalizes them to unit radius.
- `layout.ts` builds the dual adjacency graph from shared indexed edges. Kruskal's
  algorithm finds a maximum spanning tree using scores that favor short edges
  with deterministic seeded variation. Every non-tree edge is cut. This heuristic
  is the original strategy; `cut-layout.ts` adds land weights or fixed AirOcean joins.
- Each child hinge uses the original shared edge as its axis. A signed angle
  between face normals determines the flattening rotation. Panel coordinates
  remain in the original solid frame with identity rest transforms. `HingeTree`
  composes their motion; the root placement aligns the root face with XY.
- The status reports positive-area face overlaps in the final flat net using a
  bounding-box sweep and separating-axis tests. A spanning tree ensures connected
  panels, **not** a non-overlapping net. Motion collisions are not checked.

Mesh generation and layout selection remain example-local experiments; the public
`@math.gl/geometry` API is still `HingeTree`. The original hand-built cube in
`cube.ts` remains a regression fixture for its known cross-shaped net.

The example uses WebGL 2 with orthographic projection and a depth buffer.
Back-facing panels are shaded at 28% brightness so front/back surfaces are easy
to distinguish while folding; panels remain opaque for correct depth ordering.
Earth texture is enabled by default on the 320-panel icosahedron. Toggle **Show
edges** to inspect hinges and cuts, or turn off **Earth texture** for panel colors.
Each vertex carries its original sphere position separately from its moving
position. The fragment shader normalizes the interpolated original position,
then computes longitude/latitude (Z north, X Greenwich, Y east). This keeps
geography attached to rigid panels and avoids interpolating UVs across the date
line or pole. Longitude wraps, latitude clamps, and wrapped texture gradients
prevent incorrect mip selection at the date line.

Imagery is fetched from NASA GIBS at runtime; an internet connection is needed.
Loading or failed requests fall back to panel colors with a status message.
See [imagery provenance and reuse terms](IMAGERY.md).

Vite aliases local math.gl sources. Build with
`yarn workspace math.gl-unfolding-polyhedron build`.

No code, shaders, presets, or mesh assets from Nico Belmonte's demo are used.
Coastline-aligned meshes and vector clipping remain future work.

The docs and standalone page share `mountUnfolding` and the same markup and styles.
The docs lazy-load the browser-only renderer; unmounting cancels animation, removes
listeners and frees WebGL resources. Find **Unfolding Earth** in the Geometry docs
and Examples sidebars.
