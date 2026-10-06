# Geometry expansion candidates

The stack.gl package catalog suggests capability-based subpaths rather than
vendor-specific namespaces. The first implementation is `geometry/parametric`:
torus, lathe and generic sampled surfaces, with original math.gl implementations.

| Capability | Candidates from the stack.gl catalog | Proposed home |
| --- | --- | --- |
| Shapes | geo-arc, geo-star, geo-piecering, geo-chevron, geo-asterisk, primitive-ellipsoid | geometry/shapes |
| Scalar fields | surface-nets, isosurface, heightmap-contours, mesh-heightmap-contours | geometry/isosurface and geometry/contours |
| Mesh processing | refine-mesh, mesh-simplify, remove-degenerate-cells, remove-orphan-vertices, mesh-laplacian, mesh-mean-curvature | geometry-utils subpaths |
| Triangulation | cdt2d, delaunay-triangulate, voronoi-diagram, convex-hull, triangulate-polyline | polygon or focused triangulation subpath |
| Sweeps | extrude, frenet-serret-frames, path-tangents | geometry/sweep, with curve frames in curves |
| Already represented | primitives, normals, merge-meshes, merge-vertices, unindex-mesh | existing geometry and geometry-utils APIs |

These are candidates, not claims of API compatibility or implementation parity.
Review numerical contracts, licenses and attribution before adapting upstream code.
The catalog also includes rendering utilities (skyboxes, ambient occlusion), which
need a separate assessment rather than inclusion in CPU geometry generators.
