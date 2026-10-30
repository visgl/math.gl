# Understanding myriahedral projections

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Experimental" />
</p>

A myriahedral map replaces one continuous world map with many small, connected
panels. Approximate the globe with a fine polyhedron, decide which edges remain
hinged, cut the others, and unfold the panels into a plane. The gaps are part of
the projection rather than rendering errors.

Try the [interactive example](../../myriahedral-maps.md), or use the
[reusable API](../../discontinuous/myriahedral.md) to project your own geographic
data without an animation or WebGL renderer.

## Origins and credits

Jarke J. van Wijk introduced this approach in **Unfolding the Earth: Myriahedral
Projections**, *The Cartographic Journal* 45(1), 32–42 (2008).
The paper studies graticule meshes, recursively subdivided polyhedra, and meshes
derived from geography. See the [publication record and abstract](https://research.tue.nl/en/publications/unfolding-the-earth-myriahedral-projections/)
and [paper DOI](cite:vanwijk2008).

**Nicolas “Nico” Belmonte's interactive work is the inspiration for this example.**
His February 2018 vis.gl article,
[Unfolding the Earth: Myriahedral Projections In WebGL](https://medium.com/vis-gl/unfolding-the-earth-myriahedral-projections-in-webgl-6b2bcfd00a30),
celebrates the research's tenth anniversary. His
[WebGL demonstration](https://philogb.github.io/page/myriahedral/)
makes the relationship between a globe, cuts, and a planar map tangible.

The article also describes geography-aligned meshes built from distance fields
and streamlines. That is a different construction from assigning geography-based
weights to a fixed graticule. Our `sealine` and `coastline` presets use the latter;
they do not reproduce his coastline-derived mesh topology.

math.gl's mesh generation, edge weights, panel charts, and unfolding are
independently implemented. We have not copied Nico's source code, mesh tables,
textures, animation frames, or optimized solid orientations. Credit identifies
the conceptual and visual inspiration; it does not imply a license to his assets.

## What the cuts buy you

A rigid flat panel can rotate without stretching. A curved patch of Earth cannot
be flattened with all distances, areas, and angles preserved. Those are different
steps: our radial projection onto a finite panel has local distortion; unfolding
that panel adds none. Smaller panels improve the approximation, at the cost of
more boundaries and gaps. The implementation makes no exact conformal or
equal-area guarantee.

This is useful for explaining projection tradeoffs, exploring alternative world
layouts, and displaying geography on articulated surfaces. A conventional map
may be easier to read when following a route across many interruptions. The right
layout depends on what needs to remain visually connected.

## A mesh and a tree

Imagine one graph node for each panel and an edge for each neighboring pair.
Assign a high weight to a join worth keeping. A maximum spanning tree retains
connections that reach every panel without forming cycles. The remaining mesh
edges become cuts. This gives a mechanically consistent net, but says nothing
about whether separate branches overlap after unfolding.

For a fixed mesh and weights, the spanning-tree step maximizes the total retained
weight. It does not optimize the sphere's orientation, redesign the mesh, search
all possible world layouts, or guarantee that a continent remains whole.
The example reports overlaps so a visually plausible arrangement is not mistaken
for a globally valid, single-valued flat map.

## Choosing a family

| Family | What changes | math.gl support |
| --- | --- | --- |
| Graticule | Direction and location of joins on a longitude/latitude mesh | Polyconic, cylindric, azimuthal, hemispheres, sealine, coastline |
| Polyhedral | Base solid and refinement level | All five Platonic solids, including recursive triangle refinement |
| Geography weighted | Which fixed-mesh joins survive | Application-supplied land mask and custom edge weights |
| Geography aligned | The mesh itself follows geographic structure | Custom mesh input; no built-in distance-field/streamline generator |

The names describe the appearance and join strategy. A myriahedral `polyconic`
net is not the analytic polyconic CRS projection. Likewise, a land-weighted
icosahedron is not automatically the Dymaxion or Gray–Fuller projection.

At refinement level zero, polyhedral presets keep the solid's original polygonal
faces. For higher levels, polygon faces are triangulated around their spherical
centers, then triangles are repeatedly split using shared, normalized edge
midpoints. This is our construction; exact facet counts and arrangements need
not match another implementation.

## Using cuts correctly in an application

A longitude/latitude can occur on several panel boundaries. A flat coordinate
can also lie inside multiple overlapping panels. Keep the panel ID with projected
geometry and with picks. Render clipped line and polygon pieces separately;
connecting pieces across a cut creates false bridges.

The static API returns all valid inverse candidates rather than choosing a
potentially wrong continent. The animated example picks the visible face and
uses its original spherical coordinates. Both views use the same panel order,
so applications can transition between flat geometry and rigid unfolding.

The example's land colors use public-domain Natural Earth data. NASA Blue Marble
is an optional attributed texture. Those sources are independent of the
projection algorithm and of Nico's demonstration; see the example's
[imagery and data provenance](../../myriahedral-maps.md#limits-and-sources).
