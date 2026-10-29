# What's New

## v5.0

**Build richer maps, globes, and geospatial applications with one toolbox.** math.gl 5 brings coordinate systems, global grids, geometry formats, and sky and time calculations together alongside the vector and matrix math you already use.

Version 5.0 is in prerelease development. See the [upgrade guide](./upgrade-guide.md) for breaking changes and TypeScript requirements.

**Highlights:** a new projection engine; six grid systems behind one decoder API; WKB and GeoArrow geometry processing; and new tools for timezones and sky.

### Work across coordinate systems

[Projection](./modules/geospatial/projection/README.md) has grown from a proj4 wrapper into a pluggable math.gl engine. Transform coordinates using a broad [projection catalogue](./modules/geospatial/projection/developer-guide/projections.md), with support for datum grids, coordinate operations, and in-place buffers. The new [CRS module](./modules/geospatial/crs/README.md) gives applications a shared vocabulary for coordinate reference systems, WKT, PROJ definitions, and PROJJSON.

### Put the world on a grid

The new [DGGS module](./modules/dggs/README.md) brings A5, GeoHash, H3, Plus Codes, Quadkey, and S2 under a common decoder API. Switch between grid systems, find cell boundaries, and handle cells crossing the antimeridian without assembling a different toolkit for each grid.

### Move geometry from data to visualization

Read and write WKB, EWKB, and WKT with [WKB](./modules/geospatial/wkb/README.md), or process columnar geometry with [GeoArrow](./modules/geospatial/geoarrow/README.md). [Geometry](./modules/geometry/README.md) and [geometry-utils](./modules/geometry/README.md) tools provide renderer-independent building blocks, including prisms, solid rings, and optional parametric shapes. [Polygon](./modules/geometry/polygon/README.md) can adaptively subdivide meshes and lines, including meshes for globes, while preserving attributes through refinement.

### Bring globes to life

Look up a location's timezone with [timezone](./modules/earth/timezone/README.md). Explore sunlight, Moon lighting, stars, and optional planetary positions with [sun](./modules/earth/sun/README.md). New [geospatial](./modules/geospatial/README.md) and [culling](./modules/geometry/culling/README.md) tools help calculate globe horizons, occlusion, intersections, and bounds.

### Keep the math close and the bundle lean

[Core](./modules/core/README.md) adds clearer matrix and rotation conversions, stronger array types, and tree-shakeable low-level namespaces. New [expressions](./modules/core/expressions/README.md) tools make it possible to parse and evaluate configurable expressions; expression evaluation is experimental.

### Module structure

Version 5 groups related tools into six packages. Install the package root and use its focused entry points where available. See the [migration table](./upgrade-guide.md#removed-standalone-packages) for the former package names.

| Package | Purpose |
| --- | --- |
| [core](./modules/core/README.md) | Vectors, matrices, rotations, types, and expressions |
| [geometry](./modules/geometry/README.md) | Primitives, polygons, geometry utilities, and culling |
| [geospatial](./modules/geospatial/README.md) | Ellipsoids, coordinate systems, projections, geometry formats, and tile matrices |
| [earth](./modules/earth/README.md) | Geoid models, sky calculations, and timezones |
| [dggs](./modules/dggs/README.md) | Six grid systems behind a common decoder API |
| [web-mercator](./modules/web-mercator/README.md) | Map viewport and Web Mercator calculations |

For detailed changes, see the [changelog](https://github.com/visgl/math.gl/blob/master/CHANGELOG.md).

## v4.1

Release Date: Sep 7, 2024.

This minor release brings:

- type improvements to support more rigorous typing of array lengths.
- [SPDX](https://spdx.org/licenses/)-compliant license headers.

**`@math.gl/core`**

- `Vector2Like` - `Matrix4Like` - New types to specify numeric inputs of a specific length.

**`@math.gl/core`**

- `Bounds`, `Bounds2D` and `Bounds3D` - New types for expressing [bounds](./modules/core/types/api-reference/bounds) (extents).
- `NumberArray2` - `NumberArray16` - New types to specify numeric arrays of a specific length.
- `NumericArray2` - `NumericArray16` - New types to specify numeric arrays of a specific length.
- `isTypedArray()`, `isNumericArray()` - These utilities now perform TypeScript type narrowing.

## v4.0

Release Date: Oct 14, 2023.

This release brings:

- ESM (ECMAScript module) compliant.
- Node.js v16, v18, v20.
- TypeScript v5
- `gl-matrix` dependency removed.
- New modules for working with DGGS (Discrete Global Grid System) math.

**`@math.gl/dggs-geohash`** (NEW MODULE)

- New module with lightweight math for the GeoHash DGGS (Discrete Global Grid System).

**`@math.gl/dggs-quadkey`** (NEW MODULE)

- New module with lightweight math for the quadkey DGGS (Discrete Global Grid System).

**`@math.gl/dggs-s2`** (NEW MODULE)

- New module that contains a lightweight implementation of the S2 DGGS (Discrete Global Grid System).

**`@math.gl/core`**

- `config` is now truly global (stored on `globalThis`).
- `gl-matrix` dependency removed.

**`@math.gl/core`**

- New `isTypedArray()` and `isNumericArray()` utilities that check values and return properly restricted types to help write clean TypeScript code (e.g. avoids the `DataView` case when using `ArrayBuffer.isView()`).

## v3.6

Release Date: June 10, 2022

Codebase has been fully converted to TypeScript. In general this means that users can expect
the types exported from math.gl to be considerably improved, however in some function signatures
are no longer supported. For details, consult the [upgrade guide](./upgrade-guide).

**`@math.gl/core` (NEW)**

- New module that exports a few TypeScript types that e.g. generalize handling of numeric arrays.

**`@math.gl/geometry` (NEW)**

- Includes earcut 2.2 (various bug fixes for edge cases)
- The `earcut` utility supports a new argument `plane` to calculate tesselation on alternative projection planes.

## v3.5

Release Date: July 14, 2021

**`@math.gl/web-mercator`**

- `getBounds()` now supports an optional `fovy` parameter on the `WebMercatorViewport` object
- `getProjectionMatrix()` and `getProjectionParameters()` now accept a `fovy` parameter

**`@math.gl/geometry`**

- Improve performance of `getPolygonSignedArea()` by 3x
- Addition of `earcut()` method for triangulating polygons

**`math.gl/culling`**

- New TypeScript interface `BoundingVolume` with common operations for bounding volumes (`BoundingSphere`, `AxisAlignedBoundingBox`, `OrientedBoundingBox`).
- `BoundingVolume.transform()` supported on all bounding volumes.

## v3.4

Release Date: Jan 7, 2021

**`@math.gl/earth`** - New module

- Support for [geoid](https://en.wikipedia.org/wiki/Geoid)-based [earth gravity models](https://en.wikipedia.org/wiki/Earth_Gravitational_Model).
- New `Geoid` class calculates the height offset (aka "undulation") from the pure ellipsoid for a given lng/lat (using spherical harmonics).
- `Geoid` instances can be initialized with PGM-encoded earth gravity model coefficient files from standard sources.

**`@math.gl/geometry`**

- Support for flat arrays (e.g. polygons stored in typed arrays)
- Support for calling polygon utilities directly on arrays, without a `Polygon` instance.
- New function `modifyPolygonWindingDirection()` to modify polygon array winding direction in-place.

## v3.3

Release Date: Oct 9, 2020

**`@math.gl/proj4`** - New module

- A new module supporting conversion between a wide range of geospatial coordinate reference systems specified e.g. using the OGC WKT-CRS specification.

## v3.2

Release Date: July 18, 2020

**TypeScript**

- TypeScript type definitions (`.d.ts` files) are now exported for all math.gl modules.

**`@math.gl/geometry`** - New module

- A new module offering geospatial polygon clipping functions.

## v3.1

Release date: Dec 16, 2019

### `@math.gl/web-mercator`

- WebMercator projection support is now available through the new `@math.gl/web-mercator` npm sub-module.
- The `@math.gl/web-mercator` module is an evolution of the now archived [`viewport-mercator-project`](https://github.com/uber-archive/viewport-mercator-project) repository.

## v3.0

Release date: Aug 8, 2019

The 3.0 release brings support for geospatial math, culling, performance improvements, and some API consolidation.

### `@math.gl/geospatial`

A new module (developed in collaboration with the Cesium engineering team) providing WebGL-framework-independent geospatial math classes and algorithms:

- New class `Ellipsoid` and constant `Ellipsoid.WGS84` for working with WSG84 coordinates

### `@math.gl/geometry/culling`

A new module (developed in collaboration with the Cesium engineering team) providing WebGL-framework-independent classesthat support geometric intersection calculations (primarily intended to support frustum culling operations):

- New class `AxisAlignedBoundingBox`
- New class `OrientedBoundingBox`
- New class `BoundingSphere`
- New class `CullingVolume`

### `@math.gl/core`

**Transform API Consolidation**

The API for transformations (i.e. multiplying vectors with matrices or quaternions) has been extended and made more orthogonal:

- The `transform*` methods are now available on all `Vector` classes, in addition to on the `Matrix` classes. Among other things, this enables transformations without using `Matrix` classes.
- Naming consistency of transform methods across classes (`transform`, `transformAsPoint`, `transformAsVector`).
- Alternative transform methods added to the `Vector` classes (`transformByMatrix3`, `transformByMatrix2`, `transformByMatrix2x3` and `transformByQuaternion`). Simplifies using the most efficient transformation for the job.

**Matrix classes**

- New methods `Matrix*.setColumn()` and `Matrix*.getColumn()`
- New method `Matrix*.toString()`
- Improved method: `Matrix4.frustum()` now supports infinite `far` plane (parity with `Matrix4.perspective`, which already supported this).

**Utility Functions**

- New: global functions `toRadians` and `toDegrees`
- New: global function `exactEqual`

**Performance Improvements** (and Website Benchmarks)

A [benchmarking example](https://math.gl/examples/benchmarks) has been added to the website that makes it easy to assess the performance of the math.gl library on your own browser. The math.gl library has been carefully tuned based on these benchmarks and performance of the library has been significantly improved over version 2.x.

## v2.3

Release date: Jan 29, 2019

- New class: `Matrix3`
- New: Add `scale` factor support to `Matrix3` and `Matrix4`
- Support quaternion to euler conversion
- Now uses the official `gl-matrix@3.0.0` package as dependency instead of forked gl-matrix packages.

## v2.2

Release date: Sep 20, 2018

- Use `@babel/runtime` to reduce bundle size
- `equals` function fix on arrays

## v2.0

Release date: June 25, 2018

### New Naming Convention for Experimental Exports

Experimental exports are now exported with a leading underscore (\_), instead of as members of the `experimental` namespace.

The change was made to make it possible for tree-shaking bundlers to remove unused experimental exports from applications.

## v1.2

Release date: May 4, 2018

- New `lerp` utility
- Experimental `Pose` class

## v1.1

Release date: April 16, 2018

### Matrix4 Improvements

**`Matrix4.orthographic()`** - To simplify switching between perspective and orthographic views, math.gl now offers an additional method for creating orthographic projection matrix, that takes the same parameters as `Matrix4.perspective()`, with the addition of one additional parameter, `focalDistance`. See [`Matrix4.orthographic`](/docs/modules/core/api-reference/matrix4)`({fovy, aspect, focalDistance, near, far})`

### Bundle Size Reduction

math.gl has been tuned to have approximately 20% smaller footprint when bundled in applications.

### THREE.js Compatibility

math.gl classes now pass large parts of the THREE.js test suite, which should make it easier to reuse code written for the THREE.js math library.

## v1.0

Release date: Jan 9, 2018

Initial release.
