# @math.gl/geospatial

[math.gl](https://math.gl/docs) is a suite of math modules for 3D and geospatial applications.

This module contains geospatial math, primarly ellipsoid math for dealing with the WGS84 (World Geodetic System) coordinate system.

For documentation please visit the [website](https://math.gl).

The grouped subpaths include `@math.gl/geospatial/ellipsoid`, `/globe`, `/tiles`, `/crs`, `/projection`, `/web-mercator`,
`/wkb`, `/geoarrow`, and `/expressions`. DGGS remains a separate module at `@math.gl/dggs`.
`@math.gl/web-mercator` remains available for existing applications.

Use `@math.gl/geospatial/ellipsoid` for ellipsoid coordinate math and local tangent frames,
`@math.gl/geospatial/globe` for geographic regions, bounding boxes, horizon bounds, occlusion, and globe mesh subdivision,
and `@math.gl/geospatial/tiles` for geographic tile queries and tile-matrix utilities.
The package root continues to export these APIs for compatibility. The existing `/tile-matrix`
subpath remains available for applications that only need tile-matrix utilities.

[`subdivideGlobeMesh`](https://math.gl/docs/modules/geospatial/api-reference/subdivide-globe-mesh) refines geographic meshes onto a sphere or oblate ellipsoid while preserving shared edges and attribute provenance. Import it from `@math.gl/geospatial/globe`.
