# Unfolding Earth

<!-- -->

Explore rigid-panel unfolding with all five Platonic solids, subdivided icosahedra, and an Earth texture that stays attached as each panel moves.

Loading <!-- -->Unfolding Earth<!-- -->…

⛶

Use **Cuts** to compare the original geometric tree with **Ocean-preferred** cuts on the same mesh and seed, or choose the **Dymaxion · AirOcean** 24-panel preset. Drag to orbit, use **Play** to animate, or choose **Flat view** to inspect the net. Back faces are darkened; **Show edges** distinguishes hinges from cuts.

Ocean preference minimizes sampled land crossings using Natural Earth land polygons. It cannot guarantee unbroken continents or an overlap-free net. The fixed AirOcean net has no panel overlaps; it reproduces the cut arrangement, not the Gray-Fuller projection. Its subdivision controls are disabled.

The example uses the experimental [HingeTree](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/hinge-tree.md) API. Topology selection and rendering remain example-local. NASA Blue Marble imagery requires internet access; the bundled land mask and geometry work offline.

[Source and instructions](https://github.com/visgl/math.gl/tree/master/examples/geometry/unfolding-polyhedron) · [Imagery terms](https://github.com/visgl/math.gl/blob/master/examples/geometry/unfolding-polyhedron/IMAGERY.md) · [Geography and AirOcean licenses](https://github.com/visgl/math.gl/blob/master/examples/geometry/unfolding-polyhedron/data/README.md)

Hover over a panel to see its original longitude and latitude, including after unfolding. Picking follows the visible surface on either side of a cut and hides the tooltip over gaps. The coordinates use the same spherical mapping as the Earth texture; overlapping panels are resolved by depth.
