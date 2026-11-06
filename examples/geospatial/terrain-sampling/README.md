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
The mesh lab compares regular, MARTINI, and Delatin wireframes on a complete
synthetic surface. Its error slider controls adaptive mesh generation; reported
errors are measured at source nodes and are not continuous-surface bounds.

Coordinates are local Cartesian meters, Z up. The mesh uses triangle interpolation;
bilinear sampling need not lie on it. Missing and outside samples are displayed as
statuses, never zero elevations. Derivatives are displayed only when valid.
