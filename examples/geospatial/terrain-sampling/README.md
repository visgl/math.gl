# Terrain sampling playground

Run `yarn workspace math.gl-terrain-sampling start` from the repository root.

Choose one of five collapsible panels on the left: Sampling & analysis, Mesh
generation, Contour tolerance, Tiles & LOD, or Streaming replay. Opening a panel
closes the others and shows its controls and visualizations. The active panel
stays open. Only the active demo is mounted; reopening a demo starts its controls
at their defaults. The workspace fills its parent, capped at 100vh; the expanded
panel fills the sidebar and scrolls its controls.

A local synthetic 9×9 height field demonstrates `HeightField` and
`HeightFieldGeometry` from `@math.gl/geospatial/terrain`. Move the probe with the
plan view, including its red out-of-range border. Compare nearest, bilinear, and triangle heights;
change the diagonal, remove the center vertex, and display mesh normals.
The buffered border extends beyond the domain to demonstrate explicit sample status.
The isometric SVG draws the actual mesh triangles; no remote data is needed.
Elevation, triangle contours, and slope appear beside the plan view. Slope always
uses the 9×9 gradient grid; gray cells indicate unavailable derivatives.
The contour view joins four tiles and marks open endpoints and junctions along
their boundaries. Removing the center vertex also affects these contours.
The mesh lab compares regular, MARTINI, and Delatin wireframes on analytical
mountain, coast and nodata stress surfaces and a pinned real DTED crop. It includes
a nodal error heatmap, adaptive tolerance slider, build time and output byte count.
All three algorithms appear side by side with statistics below each result.
Adaptive builders show a red square for incomplete grids; Regular displays nodata holes.
Errors are measured at source nodes and are not continuous-surface bounds.
The DTED data and attribution come from the pinned qualification fixture in
`modules/geospatial/test/terrain/fixtures`; analytical surfaces are labeled.

Coordinates are local Cartesian meters, Z up. The mesh uses triangle interpolation;
bilinear sampling need not lie on it. Missing and outside samples are displayed as
statuses, never zero elevations. Derivatives are displayed only when valid.

Run `yarn start-local` inside the math.gl repository to use workspace source.
Run `yarn start` to use package exports or `yarn build` for a production bundle.

Tiles & LOD uses one coarse/fine tile pair for morphing, shared-boundary
coordination, seam derivatives, and a cross section. Choose a plane or curved
surface, 2:1 or 4:1 native resolution, and a shared morph factor or independent
factors for the two tiles. Toggle coordination to compare shared heights, and
inspect Horn or Zevenbergen–Thorne gradients at the tiles' native stencil sizes.
The surface and profile show the same displayed heights; coordination closes
height gaps while derivative differences can remain. The white line marks the
selected cross-section row. Missing coarse support and eviction keep unavailable
samples and derivative stencils visible as missing.

The mesh lab includes pinned Sierra Nevada and Pacific coast/bathymetry inputs from
Mapzen / AWS Terrain Tiles, with provider attribution shown beside the dataset.
The elevation-band/edit explorer clips the regular triangle surface into footprint
polygons, preserves nodata holes and reports bounds, derivative hierarchy
levels after patch edits. These are patch-granular updates;
changing a band threshold reuses the underlying field.

The edit view shows its height map and elevation bands at matching spatial scales.
The peak slider edits the center sample; its zero endpoint marks that sample missing.
The height map, elevation bands, and center-row cross section appear side by side
at the same spatial scale, with plot statistics beneath each figure. The profile
includes a z=0 baseline. Gray shows sampled heights;
green shows topology-preserving simplification at the selected contour tolerance.
Missing samples split the profile into disconnected paths. Rejection can apply to
each path or the whole batch. Simplification changes the displayed profile while
preserving the underlying heights.

Streaming replay has its own panel. Its slider loads real Sierra DEM patches,
edits a tile, evicts it, and restores it. Gold marks rebuilt halos, cyan marks
reused tiles, and gray marks absent tiles. The browser replay uses unit sample
spacing; the qualification report uses the declared projected frame.
