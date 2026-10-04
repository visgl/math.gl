# Polygon playground

Run `yarn workspace math.gl-polygon-playground start` from the repository root.
The website and standalone example share the React/SVG renderer.

Drag vertices, or focus a vertex and use arrow keys, to recompute `earcut`
triangulation, winding, and signed area. Toggle a fixed hole, reverse the outline,
and hide triangle edges. Crossing edges, collapsed edges, and outlines that touch
or exclude the hole are rejected. Coordinates use an upward Y axis.
