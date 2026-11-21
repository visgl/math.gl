# What's New

## v5.0

math.gl 5 expands the library from vectors and matrices to coordinate transformations,
global grids, geometry processing, and Earth science. Related APIs are grouped into
seven packages with focused imports. See the [Upgrade Guide](./upgrade-guide.md) when
moving an application from v4.

### Highlights

- **Coordinate transformations.** The [projection engine](./modules/geospatial/projection/README.md)
  supports a broad set of projections, datum grids, and coordinate operations.
  [CRS tools](./modules/geospatial/crs/README.md) handle authority codes, WKT, PROJ, and PROJJSON.
- **Global grids and terrain.** [DGGS](./modules/dggs/README.md) gives A5, GeoHash, H3,
  Plus Codes, Quadkey, and S2 a common decoder API. [Terrain](./modules/geospatial/terrain/README.md)
  adds tools for meshing elevation data and analyzing slopes, drainage, and visibility.
- **Geometry and Arrow.** Read and write WKB and WKT, work with [GeoArrow buffers](./modules/core/arrow/README.md),
  and use [polygon tools](./modules/geometry/polygon/README.md) to tessellate, clip, and refine meshes.
- **SQL and visualization.** [SQL](./modules/sql/README.md) queries Apache Arrow tables,
  computes spatial columns, and resolves visualization scales. [Core color tools](./modules/core/color.md)
  provide reusable palettes, color conversions, scales, and lookup tables.
- **Earth and sky.** [Earth](./modules/earth/README.md) adds Moon and star calculations,
  timezone lookup, and seawater properties.
- **Worker threads.** [Tasks](./modules/tasks/README.md) runs heavy computations on worker threads.

## v4.1

Added more precise array and bounds types, and made the array guards narrow types in TypeScript.

## v4.0

Added ES module support alongside CommonJS. Adapted numerical kernels replaced the
`gl-matrix` dependency.

## v3.6

Converted the library to TypeScript and added shared numeric array types.

## v3.5

Added field-of-view options for Web Mercator, polygon triangulation, and a common transform API for bounding volumes.

## v3.4

Added geoid height models and support for polygon operations on flat arrays.

## v3.3

Added proj4-backed coordinate transformations.

## v3.2

Published TypeScript declarations for all packages and added polygon clipping.

## v3.1

Brought Web Mercator viewport utilities into math.gl.

## v3.0

Introduced ellipsoid math and bounding volumes for culling, and standardized vector and matrix transforms.

## v2.3

Added `Matrix3`, matrix scaling, and quaternion-to-Euler conversion.

## v2.2

Reduced bundle size and fixed typed-array detection.

## v2.1

Added support for reconstructing a serialized `Pose` and fixed column-major matrix element writes.

## v2.0

Made experimental classes individually importable under underscore-prefixed names.

## v1.2

Added `lerp` and the experimental `Pose` class.

## v1.1

Added `Matrix4.orthographic()`, improved THREE.js compatibility, and reduced bundle size.

## v1.0

Initial release of the vector and matrix library.

For release-by-release details, see the [changelog](https://github.com/visgl/math.gl/blob/master/CHANGELOG.md).
