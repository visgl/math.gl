# What's New

## v5.1 (in development)[​](#v51-in-development "Direct link to v5.1 (in development)")

* **Line networks.** [`@math.gl/geospatial/line-network`](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/line-network.md) builds a graph from longitude, latitude lines in typed-array columns. It snaps endpoints, joins dangling ends to nearby lines (T-junctions), and can split lines at shared vertices and at crossings. Helpers build a CSR adjacency and turn a predecessor array into route edges and route geometry. Uses include road, river, rail, utility and track-line networks.

* **CTD casts.** [`@math.gl/earth/ocean`](https://visgl.github.io/math.gl/next/docs/modules/earth/ocean/api-reference/ctd.md) converts conductivity to Practical Salinity (PSS-78 with the Hill low-salinity extension) and back. It computes potential temperature, potential density and the buoyancy frequency squared N² of a cast. Each function matches GSW-C within the gates on the CTD page.

## v5.0[​](#v50 "Direct link to v5.0")

math.gl 5 expands the library from vectors and matrices to coordinate transformations, global grids, geometry processing, and Earth science. Related APIs are grouped into seven packages with focused imports. See the [Upgrade Guide](https://visgl.github.io/math.gl/next/docs/upgrade-guide.md) when moving an application from v4.

### Highlights[​](#highlights "Direct link to Highlights")

* **Coordinate transformations.** The [projection engine](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection.md) supports a broad set of projections, datum grids, and coordinate operations. [CRS tools](https://visgl.github.io/math.gl/next/docs/modules/geospatial/crs.md) handle authority codes, WKT, PROJ, and PROJJSON.
* **Global grids and terrain.** [DGGS](https://visgl.github.io/math.gl/next/docs/modules/dggs.md) gives A5, GeoHash, H3, Plus Codes, Quadkey, and S2 a common decoder API. [Terrain](https://visgl.github.io/math.gl/next/docs/modules/geospatial/terrain.md) adds tools for meshing elevation data and analyzing slopes, drainage, and visibility.
* **Geometry and Arrow.** Read and write WKB and WKT, work with [GeoArrow buffers](https://visgl.github.io/math.gl/next/docs/modules/core/arrow.md), and use [polygon tools](https://visgl.github.io/math.gl/next/docs/modules/geometry/polygon.md) to tessellate, clip, and refine meshes.
* **SQL and visualization.** [SQL](https://visgl.github.io/math.gl/next/docs/modules/sql.md) queries Apache Arrow tables, computes spatial columns, and resolves visualization scales. [Core color tools](https://visgl.github.io/math.gl/next/docs/modules/core/color.md) provide reusable palettes, color conversions, scales, and lookup tables.
* **Earth and sky.** [Earth](https://visgl.github.io/math.gl/next/docs/modules/earth.md) adds Moon and star calculations, timezone lookup, and seawater properties.
* **Worker threads.** [Tasks](https://visgl.github.io/math.gl/next/docs/modules/tasks.md) runs heavy computations on worker threads.

## v4.1[​](#v41 "Direct link to v4.1")

Added more precise array and bounds types, and made the array guards narrow types in TypeScript.

## v4.0[​](#v40 "Direct link to v4.0")

Added ES module support alongside CommonJS. Adapted numerical kernels replaced the `gl-matrix` dependency.

## v3.6[​](#v36 "Direct link to v3.6")

Converted the library to TypeScript and added shared numeric array types.

## v3.5[​](#v35 "Direct link to v3.5")

Added field-of-view options for Web Mercator, polygon triangulation, and a common transform API for bounding volumes.

## v3.4[​](#v34 "Direct link to v3.4")

Added geoid height models and support for polygon operations on flat arrays.

## v3.3[​](#v33 "Direct link to v3.3")

Added proj4-backed coordinate transformations.

## v3.2[​](#v32 "Direct link to v3.2")

Published TypeScript declarations for all packages and added polygon clipping.

## v3.1[​](#v31 "Direct link to v3.1")

Brought Web Mercator viewport utilities into math.gl.

## v3.0[​](#v30 "Direct link to v3.0")

Introduced ellipsoid math and bounding volumes for culling, and standardized vector and matrix transforms.

## v2.3[​](#v23 "Direct link to v2.3")

Added `Matrix3`, matrix scaling, and quaternion-to-Euler conversion.

## v2.2[​](#v22 "Direct link to v2.2")

Reduced bundle size and fixed typed-array detection.

## v2.1[​](#v21 "Direct link to v2.1")

Added support for reconstructing a serialized `Pose` and fixed column-major matrix element writes.

## v2.0[​](#v20 "Direct link to v2.0")

Made experimental classes individually importable under underscore-prefixed names.

## v1.2[​](#v12 "Direct link to v1.2")

Added `lerp` and the experimental `Pose` class.

## v1.1[​](#v11 "Direct link to v1.1")

Added `Matrix4.orthographic()`, improved THREE.js compatibility, and reduced bundle size.

## v1.0[​](#v10 "Direct link to v1.0")

Initial release of the vector and matrix library.

For release-by-release details, see the [changelog](https://github.com/visgl/math.gl/blob/master/CHANGELOG.md).
