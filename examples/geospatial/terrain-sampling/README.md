# Terrain sampling playground

Run `yarn workspace math.gl-terrain-sampling start` from the repository root.

A local synthetic 9×9 height field demonstrates `HeightField` and
`HeightFieldGeometry` from `@math.gl/geospatial/terrain`. Move the probe with the
X/Y sliders or the plan view. Compare nearest, bilinear, and triangle heights;
change the diagonal, remove the center vertex, and display mesh normals.
The sliders extend beyond the domain to demonstrate explicit sample status.
The isometric SVG draws the actual mesh triangles; no remote data is needed.
The analysis view shows elevation, triangle contours, and slope from a selectable
gradient-pyramid level. Faded blocks indicate incomplete gradient coverage.
In the contour view, toggle tiles to inspect boundary endpoints and junctions;
the markers do not distinguish dataset edges, missing tiles, and nodata.
The mesh lab compares regular, MARTINI, and Delatin wireframes on analytical
mountain, coast and nodata stress surfaces and a pinned real DTED crop. It includes
a nodal error heatmap, adaptive tolerance slider, build time and output byte count.
Adaptive builders require complete data; select Regular to inspect nodata holes.
Errors are measured at source nodes and are not continuous-surface bounds.
The DTED data and attribution come from the pinned qualification fixture in
`modules/geospatial/test/terrain/fixtures`; analytical surfaces are labeled.

Coordinates are local Cartesian meters, Z up. The mesh uses triangle interpolation;
bilinear sampling need not lie on it. Missing and outside samples are displayed as
statuses, never zero elevations. Derivatives are displayed only when valid.

Run `yarn start-local` inside the math.gl repository to use workspace source.
Run `yarn start` to use package exports or `yarn build` for a production bundle.

The mixed-resolution seam explorer shows a fine tile's resampled halo and derivative
vectors. Switch between 2:1 and 4:1 neighbors, Horn and Zevenbergen–Thorne methods,
plane/curved surfaces, nodata and residency. Missing stencils stay unavailable;
curved surfaces expose the limits of derivative agreement across resolution changes.

The mesh lab includes pinned Sierra Nevada and Pacific coast/bathymetry inputs from
Mapzen / AWS Terrain Tiles, with provider attribution shown beside the dataset.
The elevation-band/edit explorer clips the regular triangle surface into footprint
polygons, preserves nodata holes and shows conservative bounds, derivative hierarchy
levels and distant mesh reuse after patch edits. These are patch-granular updates;
changing a band threshold reuses the underlying field.

The brush example now reports sub-patch mesh rebuilds and bounds/gradient ancestor
counts. The contour topology explorer includes path-local rejection, letting an
unsafe component remain unchanged while a separated safe component simplifies.
